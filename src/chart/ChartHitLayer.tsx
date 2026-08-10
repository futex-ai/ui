/**
 * The interaction surface that sits over the painted marks.
 *
 * Marks are SVG; hit targets are `Pressable`s in a sibling overlay. That split
 * is deliberate — it is what lets the family reuse this library's focus-ring,
 * roving-tabindex and `testID` conventions unchanged, and it satisfies the
 * "hit target bigger than the mark" rule for free, because the target is sized
 * to the band rather than to the painted pixels.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { useFocusRing } from "../focusRing";
import {
  type FocusableRef,
  focusItemAt,
  rovingTabIndex,
} from "../keyboardNavigation";

import type { Rect } from "./chartLayout";
import { nextHitIndex } from "./chartKeyboard";

/** One hit target: where it is, and what it means. */
export type HitTarget = {
  /** Category index this target selects. */
  index: number;
  /** Rect in plot coordinates. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Full accessible label — must carry every value the tooltip would show. */
  label: string;
};

export type ChartHitLayerProps = {
  plot: Rect;
  targets: readonly HitTarget[];
  activeIndex: number | null;
  onActivate: (index: number) => void;
  onHover: (index: number | null) => void;
  disableFocusRing?: boolean;
};

type KeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export function ChartHitLayer({
  plot,
  targets,
  activeIndex,
  onActivate,
  onHover,
  disableFocusRing = false,
}: ChartHitLayerProps) {
  // The single tab stop of the plot: only this target is reachable by Tab;
  // arrow keys move it. Without this a 60-category chart would add 60 tab
  // stops to the page.
  const [focusIndex, setFocusIndex] = useState(0);
  const refs = useRef<Array<{ current: FocusableRef }>>([]);
  refs.current = targets.map((_, i) => refs.current[i] ?? { current: null });

  const safeFocus =
    targets.length === 0 ? 0 : Math.min(focusIndex, targets.length - 1);

  const onKeyDown = useCallback(
    (event: KeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key || targets.length === 0) {
        return;
      }
      const next = nextHitIndex(key, safeFocus, targets.length);
      if (next === null || next === safeFocus) {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      setFocusIndex(next);
      focusItemAt(refs.current, next);
      onHover(targets[next].index);
    },
    [targets, safeFocus, onHover],
  );

  const keyProps = Platform.OS === "web" ? { onKeyDown } : {};

  const containerStyle = useMemo(
    () => ({
      height: plot.height,
      left: plot.x,
      position: "absolute" as const,
      top: plot.y,
      width: plot.width,
    }),
    [plot],
  );

  // No role or name on the container: the frame already names the chart
  // region, and a nested group repeating that name makes a screen reader
  // announce the chart twice. The individual targets carry the labels.
  return (
    <View style={containerStyle} {...keyProps}>
      {targets.map((target, i) => (
        <HitTargetView
          disableFocusRing={disableFocusRing}
          isActive={activeIndex === target.index}
          key={`${target.index}-${i}`}
          onActivate={() => onActivate(target.index)}
          onFocusTarget={() => {
            setFocusIndex(i);
            onHover(target.index);
          }}
          onHoverOut={() => onHover(null)}
          target={target}
          targetRef={refs.current[i]}
          tabIndex={rovingTabIndex(i, safeFocus)}
        />
      ))}
    </View>
  );
}

function HitTargetView({
  disableFocusRing,
  isActive,
  onActivate,
  onFocusTarget,
  onHoverOut,
  target,
  targetRef,
  tabIndex,
}: {
  disableFocusRing: boolean;
  isActive: boolean;
  onActivate: () => void;
  onFocusTarget: () => void;
  onHoverOut: () => void;
  target: HitTarget;
  targetRef: { current: FocusableRef };
  tabIndex: 0 | -1;
}) {
  const focus = useFocusRing({ disabled: disableFocusRing });
  return (
    <Pressable
      accessibilityLabel={target.label}
      accessibilityRole="button"
      onBlur={() => {
        focus.onBlur();
        onHoverOut();
      }}
      onFocus={() => {
        focus.onFocus();
        onFocusTarget();
      }}
      onHoverIn={onFocusTarget}
      onHoverOut={onHoverOut}
      onPress={onActivate}
      ref={(node) => {
        targetRef.current = node as unknown as FocusableRef;
      }}
      style={[
        {
          height: target.height,
          left: target.x,
          position: "absolute",
          top: target.y,
          width: target.width,
        },
        focus.webOutlineReset,
        // The hovered/focused mark lifts so the reader sees it respond. A wash
        // rather than an outline: an outline around a mark reads as data ink.
        isActive ? { backgroundColor: "rgba(127,127,127,0.10)" } : null,
        focus.focused && focus.ringEnabled
          ? { backgroundColor: "rgba(127,127,127,0.18)" }
          : null,
      ]}
      tabIndex={tabIndex}
    />
  );
}
