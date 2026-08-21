/**
 * The two transient overlays a drag draws: the marquee rectangle while sweeping
 * a selection, and the vertical rule showing which edge a snap caught.
 *
 * Both are decorative and inert — the selection they preview is reported
 * through `onSelectionChange`, and the snapped time is already carried by the
 * clip positions themselves, so neither needs to reach assistive tech.
 */
import { useMemo } from "react";
import { View } from "react-native";

import { useSharedUiTheme } from "../theme";

import type { TimelineMarqueeRect } from "./timelineDragTypes";
import { createTimelineStyles } from "./timelineStyles";
import { timeToX } from "./timelineTime";

export type TimelineMarqueeProps = {
  rect: TimelineMarqueeRect;
  pixelsPerSecond: number;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function TimelineMarquee({
  pixelsPerSecond,
  rect,
  testID,
}: TimelineMarqueeProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const left = timeToX(Math.min(rect.fromTime, rect.toTime), pixelsPerSecond);
  const right = timeToX(Math.max(rect.fromTime, rect.toTime), pixelsPerSecond);

  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[
        styles.marquee,
        {
          height: Math.abs(rect.toY - rect.fromY),
          left,
          top: Math.min(rect.fromY, rect.toY),
          width: Math.max(1, right - left),
        },
      ]}
      testID={testID}
    />
  );
}

export type TimelineSnapLineProps = {
  /** The time the snap caught, in seconds. */
  time: number;
  pixelsPerSecond: number;
  /** Height to draw the rule across, in px. */
  height: number;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function TimelineSnapLine({
  height,
  pixelsPerSecond,
  testID,
  time,
}: TimelineSnapLineProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);

  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[
        styles.snapLine,
        { height, left: timeToX(time, pixelsPerSecond), top: 0 },
      ]}
      testID={testID}
    />
  );
}
