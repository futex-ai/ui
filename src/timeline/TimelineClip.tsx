/**
 * A clip block in a lane.
 *
 * The clip carries its tone through a tinted fill, a uniform border, and the
 * label color — never an edge strip. Its two content layers (filmstrip frames
 * for picture, a peak waveform for sound) are sampled from consumer-supplied
 * arrays that describe the *whole source*, so trimming reveals a different
 * window of the same data instead of needing fresh data.
 */
import { Lock } from "lucide-react-native";
import { useMemo } from "react";
import {
  Image,
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  cellsAcross,
  filmstripFrames,
  waveformBars,
} from "./timelineClipContent";
import {
  createTimelineStyles,
  type TimelineClipColors,
  timelineSizing,
} from "./timelineStyles";
import { DEFAULT_FPS, formatClock, formatTimecode } from "./timelineTime";
import { clipEnd, type TimelineClipData } from "./timelineTypes";

/** Which edge a trim handle drags. */
export type TimelineTrimEdge = "end" | "start";

/** Web `keydown` event shape passed through to the parent's key model. */
export type TimelineClipKeyEvent = {
  key?: string;
  altKey?: boolean;
  metaKey?: boolean;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  shiftKey?: boolean;
  stopPropagation?: () => void;
};

export type TimelineClipProps = {
  clip: TimelineClipData;
  /** Resolved tone colors, so every clip in a lane agrees without re-deriving. */
  colors: TimelineClipColors;
  /** Box in the lane stack's coordinate space. */
  rect: { height: number; left: number; top: number; width: number };
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  /** Frame rate, for the accessible timecode range. */
  fps?: number;
  /** Draw the selection border and ring. */
  selected?: boolean;
  /** Show grab affordances at both edges. */
  trimmable?: boolean;
  /** Name of the owning track, folded into the default accessible label. */
  trackName?: string;
  onPress?: (clip: TimelineClipData) => void;
  onKeyDown?: (event: TimelineClipKeyEvent) => void;
  onFocus?: () => void;
  /** Roving tab index: `0` for the active clip, `-1` otherwise. */
  tabIndex?: 0 | -1;
  /** Registers the host node so the parent can move focus here. */
  registerRef?: (node: unknown) => void;
  disableFocusRing?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Below this width a clip is a sliver: chrome would only obscure it. */
const MIN_LABEL_WIDTH = 44;
/** Extra width needed before the trailing duration is worth drawing. */
const MIN_DURATION_WIDTH = 104;
/** Waveform bar pitch (bar + gap) in px. */
const WAVE_PITCH = 3;

export function TimelineClip({
  accessibilityLabel,
  clip,
  colors,
  disableFocusRing = false,
  fps = DEFAULT_FPS,
  onFocus,
  onKeyDown,
  onPress,
  rect,
  registerRef,
  selected = false,
  size = "md",
  style,
  tabIndex,
  testID,
  trackName,
  trimmable = false,
}: TimelineClipProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const metrics = timelineSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });

  const inner = Math.max(0, rect.width - metrics.clipPadding * 2 - 2);
  const headerHeight = metrics.fontSize + 6;
  const contentHeight = Math.max(
    0,
    rect.height - headerHeight - metrics.clipPadding * 2,
  );

  const bars = useMemo(
    () =>
      clip.peaks && contentHeight > 6
        ? waveformBars(clip, cellsAcross(inner, WAVE_PITCH))
        : [],
    [clip, contentHeight, inner],
  );
  const frameWidth = Math.max(12, Math.round((contentHeight * 16) / 9));
  const frames = useMemo(
    () =>
      clip.thumbnails && contentHeight > 8
        ? filmstripFrames(clip, cellsAcross(inner, frameWidth))
        : [],
    [clip, contentHeight, frameWidth, inner],
  );

  const label =
    accessibilityLabel ??
    [
      clip.label,
      trackName,
      `${formatTimecode(clip.start, fps)} to ${formatTimecode(clipEnd(clip), fps)}`,
      clip.locked ? "locked" : null,
      selected ? "selected" : null,
    ]
      .filter(Boolean)
      .join(", ");

  const showLabel = rect.width >= MIN_LABEL_WIDTH;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={(event) => {
        focus.onFocus(event);
        onFocus?.();
      }}
      onPress={onPress ? () => onPress(clip) : undefined}
      ref={registerRef ? (node) => registerRef(node) : undefined}
      style={[
        styles.clip,
        {
          backgroundColor: colors.fill,
          borderColor: selected ? colors.accent : colors.border,
          borderRadius: metrics.clipRadius,
          height: rect.height,
          left: rect.left,
          padding: metrics.clipPadding,
          top: rect.top,
          width: rect.width,
        },
        selected ? styles.clipSelected : null,
        focus.webOutlineReset,
        focus.focusVisible && focus.ringEnabled ? styles.clipFocused : null,
        style,
      ]}
      tabIndex={tabIndex}
      testID={testID}
      {...(onKeyDown ? { onKeyDown } : {})}
    >
      {showLabel ? (
        <View style={[styles.clipHeader, { height: headerHeight }]}>
          {/* A lock is drawn rather than the clip being faded: dimming a clip
              to signal "locked" drops its label below the 4.5:1 floor on every
              tinted fill (WCAG 2.1 — 1.4.3, AA), and a glyph is a non-colour
              cue besides (1.4.1 Use of Colour, A). The state is also in the
              clip's accessible name. */}
          {clip.locked ? (
            <Lock color={colors.text} size={metrics.fontSize} />
          ) : null}
          <Text
            numberOfLines={1}
            style={[
              styles.clipLabel,
              { color: colors.text, fontSize: metrics.fontSize },
            ]}
          >
            {clip.label}
          </Text>
          {rect.width >= MIN_DURATION_WIDTH ? (
            <Text
              style={[
                styles.clipDuration,
                { color: colors.text, fontSize: metrics.fontSize - 1 },
              ]}
            >
              {formatClock(clip.duration)}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View aria-hidden style={styles.clipContent}>
        {frames.length > 0 ? (
          <View style={[styles.filmstrip, { height: contentHeight }]}>
            {frames.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={[styles.filmstripFrame, { width: frameWidth }]}
              />
            ))}
          </View>
        ) : null}
        {frames.length === 0 && bars.length > 0 ? (
          <View style={[styles.waveform, { height: contentHeight }]}>
            {bars.map((value, index) => (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    backgroundColor: colors.accent,
                    height: Math.max(1, value * contentHeight),
                    width: WAVE_PITCH - 1,
                  },
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
      {trimmable && !clip.locked ? (
        <>
          <TrimAffordance
            accent={colors.accent}
            edge="start"
            styles={styles}
            width={metrics.handleWidth}
          />
          <TrimAffordance
            accent={colors.accent}
            edge="end"
            styles={styles}
            width={metrics.handleWidth}
          />
        </>
      ) : null}
    </Pressable>
  );
}

/**
 * The visual grab target at a clip edge. It is `aria-hidden` and not focusable:
 * trimming by keyboard goes through the clip's own `[` / `]` keys, so a second
 * pair of tab stops per clip would only bloat the tab order.
 */
function TrimAffordance({
  accent,
  edge,
  styles,
  width,
}: {
  accent: string;
  edge: TimelineTrimEdge;
  styles: ReturnType<typeof createTimelineStyles>;
  width: number;
}) {
  return (
    <View
      aria-hidden
      pointerEvents="none"
      style={[
        styles.trimHandle,
        { width },
        edge === "start" ? { left: 0 } : { right: 0 },
      ]}
    >
      <View style={[styles.trimGrip, { backgroundColor: accent }]} />
    </View>
  );
}
