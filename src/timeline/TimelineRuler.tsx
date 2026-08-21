/**
 * The time ruler above the lanes, and the timeline's scrub surface.
 *
 * Tick density is chosen for the zoom rather than fixed, so the ruler keeps a
 * readable 1 / 2 / 5 / 10 rhythm all the way from single frames out to hours,
 * and labels never collide. The strip doubles as the seek control: it is a
 * slider, so a keyboard user can move the playhead a frame at a time without a
 * pointer (WCAG 2.1 — 2.1.1 Keyboard, A).
 */
import { useCallback, useMemo } from "react";
import {
  type GestureResponderEvent,
  Platform,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { scrubAccessibility, sliderRoleProps } from "./timelineScrubValue";
import {
  createTimelineStyles,
  resolveClipColors,
  timelineSizing,
} from "./timelineStyles";
import {
  DEFAULT_FPS,
  formatRulerLabel,
  frameDuration,
  tickStep,
  tickTimes,
  timeToX,
  xToTime,
} from "./timelineTime";
import type { TimelineMarker } from "./timelineTypes";

export type TimelineRulerProps = {
  /** Total scrollable width in px — the ruler draws ticks across all of it. */
  width: number;
  /** Current zoom. */
  pixelsPerSecond: number;
  /** Frame rate, for frame-level ticks and timecode labels. */
  fps?: number;
  /** Project length in seconds, published as the slider's range. */
  duration: number;
  /** Current playhead position in seconds. */
  playheadTime: number;
  /** Named points drawn as pips on the strip. */
  markers?: readonly TimelineMarker[];
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  /** Called with a new time when the strip is clicked or arrowed. */
  onSeek?: (time: number) => void;
  /** Suppress the shared focus glow on the scrub surface. */
  disableFocusRing?: boolean;
  /** Accessible name for the scrub slider. Defaults to `"Playhead"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Web `keydown` event shape — enough of it to read the key and stop default. */
type RulerKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  shiftKey?: boolean;
  stopPropagation?: () => void;
};

export function TimelineRuler({
  accessibilityLabel = "Playhead",
  disableFocusRing = false,
  duration,
  fps = DEFAULT_FPS,
  markers = [],
  onSeek,
  pixelsPerSecond,
  playheadTime,
  size = "md",
  style,
  testID,
  width,
}: TimelineRulerProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const metrics = timelineSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });

  const step = useMemo(
    () => tickStep(pixelsPerSecond, fps),
    [pixelsPerSecond, fps],
  );
  const end = xToTime(width, pixelsPerSecond);
  const majors = useMemo(
    () => tickTimes(0, end, step.major),
    [end, step.major],
  );
  const minors = useMemo(
    () => (step.minor < step.major ? tickTimes(0, end, step.minor) : []),
    [end, step.minor, step.major],
  );

  const seekTo = useCallback(
    (time: number) => {
      // A non-finite reading must never reach the playhead: it would poison the
      // published `aria-valuenow` and every downstream timecode with NaN.
      if (!Number.isFinite(time)) {
        return;
      }
      onSeek?.(Math.min(Math.max(0, time), Math.max(0, duration)));
    },
    [duration, onSeek],
  );

  // Seeking runs off the responder rather than `Pressable`'s `onPress`, for two
  // reasons: react-native-web's press event carries no `locationX` (so a press
  // handler cannot tell *where* the ruler was clicked), and the responder gives
  // continuous drag-scrubbing for free on both platforms.
  const handleSeekAt = useCallback(
    (event: GestureResponderEvent) => {
      seekTo(xToTime(event.nativeEvent.locationX, pixelsPerSecond));
    },
    [pixelsPerSecond, seekTo],
  );

  const handleKeyDown = useCallback(
    (event: RulerKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key) {
        return;
      }
      // Shift jumps a second at a time; the bare arrows step one frame, which is
      // the finest edit the timeline supports.
      const nudge = event.shiftKey ? 1 : frameDuration(fps);
      const next = (() => {
        switch (key) {
          case "ArrowRight":
          case "ArrowUp":
            return playheadTime + nudge;
          case "ArrowLeft":
          case "ArrowDown":
            return playheadTime - nudge;
          case "Home":
            return 0;
          case "End":
            return duration;
          case "PageUp":
            return playheadTime + 10;
          case "PageDown":
            return playheadTime - 10;
          default:
            return null;
        }
      })();
      if (next === null) {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      seekTo(next);
    },
    [duration, fps, playheadTime, seekTo],
  );

  const web = Platform.OS === "web";
  const scrub = scrubAccessibility(playheadTime, duration, fps);
  const labelStyle = { fontSize: Math.max(9, metrics.fontSize - 1) };

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={web ? undefined : "adjustable"}
      accessibilityValue={scrub.accessibilityValue}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onMoveShouldSetResponder={() => Boolean(onSeek)}
      onResponderGrant={handleSeekAt}
      onResponderMove={handleSeekAt}
      onStartShouldSetResponder={() => Boolean(onSeek)}
      style={[
        styles.ruler,
        { height: metrics.rulerHeight, width },
        focus.webOutlineReset,
        focus.focusVisible && focus.ringEnabled ? styles.rulerFocused : null,
        style,
      ]}
      tabIndex={onSeek ? 0 : undefined}
      testID={testID}
      {...(web ? { onKeyDown: handleKeyDown } : {})}
      {...sliderRoleProps(web)}
      {...(web ? scrub.webProps : {})}
    >
      {minors.map((time) => (
        <View
          aria-hidden
          key={`minor-${time}`}
          style={[
            styles.rulerTickMinor,
            { height: 4, left: timeToX(time, pixelsPerSecond) },
          ]}
        />
      ))}
      {majors.map((time) => (
        <View
          aria-hidden
          key={`major-${time}`}
          style={[
            styles.rulerTickMajor,
            { height: 8, left: timeToX(time, pixelsPerSecond) },
          ]}
        />
      ))}
      {majors.map((time) => (
        <Text
          aria-hidden
          key={`label-${time}`}
          numberOfLines={1}
          style={[
            styles.rulerLabel,
            labelStyle,
            { left: timeToX(time, pixelsPerSecond) + 3 },
          ]}
        >
          {formatRulerLabel(time, fps, step.major)}
        </Text>
      ))}
      {markers.map((marker) => (
        <View
          aria-hidden
          key={marker.id}
          style={[
            styles.marker,
            {
              backgroundColor: resolveClipColors(theme, marker.tone ?? "rose")
                .accent,
              left: timeToX(marker.time, pixelsPerSecond),
            },
          ]}
        />
      ))}
    </View>
  );
}
