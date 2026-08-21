/**
 * The playhead: a head on the ruler and a hairline dropped through every lane.
 *
 * Purely decorative — it is `aria-hidden` and takes no pointer events, because
 * the position it shows is already published by the ruler's slider and dragging
 * it is the ruler's job. Drawing it as a sibling overlay keeps it above the
 * clips without any of them having to know it exists.
 */
import { useMemo } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import { createTimelineStyles } from "./timelineStyles";
import { timeToX } from "./timelineTime";

export type TimelinePlayheadProps = {
  /** Position in seconds. */
  time: number;
  /** Current zoom. */
  pixelsPerSecond: number;
  /** Height of the lane stack the hairline drops through, in px. */
  height: number;
  /** Height of the ruler the head sits in, in px. */
  rulerHeight: number;
  /** Overrides the rose default — used to tint an in/out preview head. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Half the head's width, so it centres on the line rather than hanging off it. */
const HEAD_OFFSET = 6;

export function TimelinePlayhead({
  color,
  height,
  pixelsPerSecond,
  rulerHeight,
  style,
  testID,
  time,
}: TimelinePlayheadProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const left = timeToX(time, pixelsPerSecond);
  const tint = color ?? theme.colors.rose;

  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[
        {
          height: rulerHeight + height,
          left: 0,
          position: "absolute",
          top: 0,
          width: 0,
        },
        style,
      ]}
      testID={testID}
    >
      <View
        style={[
          styles.playheadHead,
          { backgroundColor: tint, left: left - HEAD_OFFSET },
        ]}
      />
      <View
        style={[
          styles.playheadLine,
          { backgroundColor: tint, left: left - 1, top: rulerHeight },
        ]}
      />
    </View>
  );
}
