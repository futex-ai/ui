/**
 * The transport's seek bar.
 *
 * A real slider, not a decorated progress bar: it publishes its position on a
 * whole-frame range and is fully operable from the keyboard, so seeking never
 * requires a pointer (WCAG 2.1 — 2.1.1 Keyboard, A; 4.1.2 Name, Role, Value, A).
 *
 * Seeking runs off the responder rather than a press handler, because
 * react-native-web's press event carries no `locationX` — the same reason the
 * timeline's ruler does. That also gives continuous drag-scrubbing for free.
 */
import { useCallback, useMemo, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Platform,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import {
  DEFAULT_FPS,
  frameDuration,
  scrubAccessibility,
  sliderRoleProps,
  type TimelineClipTone,
} from "../timeline";

import { percent, videoEditorSizing } from "./videoEditorSizing";
import { createVideoEditorStyles } from "./videoEditorStyles";

/** A named point on the bar — a chapter, a comment, a flag. */
export type ScrubberMarker = {
  id: string;
  /** Position in seconds. */
  time: number;
  label?: string;
  tone?: TimelineClipTone;
};

export type ScrubberProps = {
  /** Playhead position in seconds. */
  currentTime: number;
  /** Total length in seconds. */
  duration: number;
  /** How much has loaded, in seconds from zero. */
  buffered?: number;
  /** Start of the marked range, in seconds. */
  inPoint?: number;
  /** End of the marked range, in seconds. */
  outPoint?: number;
  markers?: readonly ScrubberMarker[];
  /** Frame rate, for the published range and the arrow-key step. */
  fps?: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  /** Supplying this makes the bar interactive. */
  onSeek?: (time: number) => void;
  disableFocusRing?: boolean;
  /** Accessible name. Defaults to `"Seek"`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Web `keydown` event shape — enough of it to read the key and stop default. */
type ScrubberKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  shiftKey?: boolean;
  stopPropagation?: () => void;
};

export function Scrubber({
  accessibilityLabel = "Seek",
  buffered,
  currentTime,
  disableFocusRing = false,
  duration,
  fps = DEFAULT_FPS,
  inPoint,
  markers = [],
  onSeek,
  outPoint,
  size = "md",
  style,
  testID,
}: ScrubberProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createVideoEditorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });
  // The bar's own width, measured rather than assumed, so a pointer position
  // can be turned into a time without knowing the layout in advance.
  const [width, setWidth] = useState(0);

  const span = Math.max(duration, 0);
  const fraction = (time: number) =>
    span > 0 ? Math.min(1, Math.max(0, time / span)) : 0;

  const seekTo = useCallback(
    (time: number) => {
      if (!Number.isFinite(time)) {
        return;
      }
      onSeek?.(Math.min(Math.max(0, time), span));
    },
    [onSeek, span],
  );

  const seekAt = useCallback(
    (event: GestureResponderEvent) => {
      const x = event.nativeEvent.locationX;
      if (width > 0) {
        seekTo((x / width) * span);
      }
    },
    [seekTo, span, width],
  );

  const handleKeyDown = useCallback(
    (event: ScrubberKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key) {
        return;
      }
      const step = event.shiftKey ? 1 : frameDuration(fps);
      const next = (() => {
        switch (key) {
          case "ArrowRight":
          case "ArrowUp":
            return currentTime + step;
          case "ArrowLeft":
          case "ArrowDown":
            return currentTime - step;
          case "Home":
            return 0;
          case "End":
            return span;
          case "PageUp":
            return currentTime + 10;
          case "PageDown":
            return currentTime - 10;
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
    [currentTime, fps, seekTo, span],
  );

  const web = Platform.OS === "web";
  const scrub = scrubAccessibility(currentTime, span, fps);
  const played = fraction(currentTime);
  const rangeStart = inPoint !== undefined ? fraction(inPoint) : null;
  const rangeEnd = outPoint !== undefined ? fraction(outPoint) : null;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={web ? undefined : "adjustable"}
      accessibilityValue={scrub.accessibilityValue}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onLayout={(event: LayoutChangeEvent) =>
        setWidth(event.nativeEvent.layout.width)
      }
      onMoveShouldSetResponder={() => Boolean(onSeek)}
      onResponderGrant={seekAt}
      onResponderMove={seekAt}
      onStartShouldSetResponder={() => Boolean(onSeek)}
      style={[
        styles.scrubber,
        { height: Math.max(metrics.knobSize, metrics.trackHeight) },
        focus.webOutlineReset,
        focus.focusVisible && focus.ringEnabled ? styles.scrubberFocused : null,
        style,
      ]}
      tabIndex={onSeek ? 0 : undefined}
      testID={testID}
      {...(web ? { onKeyDown: handleKeyDown } : {})}
      {...sliderRoleProps(web)}
      {...(web ? scrub.webProps : {})}
    >
      <View
        aria-hidden
        style={[styles.scrubberTrack, { height: metrics.trackHeight }]}
      >
        {buffered !== undefined ? (
          <View
            style={[
              styles.scrubberBuffered,
              { width: percent(fraction(buffered)) },
            ]}
          />
        ) : null}
        {rangeStart !== null && rangeEnd !== null ? (
          <View
            style={[
              styles.scrubberRange,
              {
                left: percent(Math.min(rangeStart, rangeEnd)),
                width: percent(Math.abs(rangeEnd - rangeStart)),
              },
            ]}
          />
        ) : null}
        <View style={[styles.scrubberPlayed, { width: percent(played) }]} />
      </View>
      {markers.map((marker) => (
        <View
          aria-hidden
          key={marker.id}
          style={[
            styles.scrubberMarker,
            {
              backgroundColor:
                marker.tone === "amber"
                  ? theme.colors.amber
                  : marker.tone === "rose"
                    ? theme.colors.rose
                    : theme.colors.ink2,
              height: metrics.trackHeight + 6,
              left: percent(fraction(marker.time)),
            },
          ]}
        />
      ))}
      <View
        aria-hidden
        style={[
          styles.scrubberKnob,
          {
            borderRadius: metrics.knobSize / 2,
            height: metrics.knobSize,
            left: percent(played),
            marginLeft: -metrics.knobSize / 2,
            width: metrics.knobSize,
          },
        ]}
      />
    </View>
  );
}
