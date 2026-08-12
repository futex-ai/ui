/**
 * Native scrubbing: press-and-drag the crosshair along the plot.
 *
 * Hover has no native equivalent, so the crosshair is driven by a drag. The
 * gesture uses RN core's `PanResponder` rather than the optional
 * `react-native-gesture-handler` peer, so charts work in a bare install.
 *
 * The negotiation matters more than the gesture. Three things compete for the
 * responder on a chart inside a dashboard:
 *
 * - the per-mark `Pressable`s, which claim it on touch-start,
 * - this scrub,
 * - an enclosing vertical `ScrollView`.
 *
 * So the scrub only claims the responder from the **capture** phase, and only
 * after a horizontal-dominant move past a threshold. A tap therefore reaches
 * the marks, and a vertical drag still scrolls the page.
 */
import { useMemo, useRef } from "react";
import { PanResponder, type PanResponderInstance } from "react-native";

import { shouldClaimScrub } from "./chartScrubModel";

export { SCRUB_THRESHOLD, shouldClaimScrub } from "./chartScrubModel";

export type ChartScrubOptions = {
  /** Maps an x offset within the plot to a category index. */
  indexAt: (x: number) => number;
  onScrub: (index: number | null) => void;
  /** Plot origin, so page coordinates can be converted to plot-local ones. */
  plotX: number;
  enabled?: boolean;
};

export function useChartScrub({
  indexAt,
  onScrub,
  plotX,
  enabled = true,
}: ChartScrubOptions): PanResponderInstance | null {
  // Keep the latest callbacks in a ref so the responder is created once and
  // does not need re-registering on every render.
  const latest = useRef({ indexAt, onScrub, plotX });
  latest.current = { indexAt, onScrub, plotX };

  return useMemo(() => {
    if (!enabled) {
      return null;
    }
    const report = (pageX: number, locationX?: number) => {
      const { indexAt: at, onScrub: emit, plotX: origin } = latest.current;
      const x = locationX ?? pageX - origin;
      emit(at(x));
    };
    return PanResponder.create({
      // Never claim on touch-start: that would steal every tap from the marks.
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        shouldClaimScrub(gesture.dx, gesture.dy),
      onMoveShouldSetPanResponderCapture: (_event, gesture) =>
        shouldClaimScrub(gesture.dx, gesture.dy),
      onPanResponderMove: (event, gesture) => {
        report(gesture.moveX, event.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        latest.current.onScrub(null);
      },
      // A cancelled gesture (a call, a system sheet) must clear the crosshair
      // too, or it strands mid-plot.
      onPanResponderTerminate: () => {
        latest.current.onScrub(null);
      },
      onPanResponderTerminationRequest: () => true,
    });
  }, [enabled]);
}
