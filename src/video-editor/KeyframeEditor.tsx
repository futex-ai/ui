/**
 * The keyframe editor, in two modes.
 *
 * `lanes` is the compact strip an editor shows under a property: one row per
 * animated property, keyframes as diamonds on a timeline that shares the
 * sequence's `pixelsPerSecond`, so the two read against each other.
 *
 * `curve` is the value graph, drawn by sampling the interpolation rather than
 * emitting bezier path segments — which means hold steps, linear ramps, and
 * eased curves all plot through one code path.
 *
 * Every keyframe is a focusable button announcing its time and value, and is
 * movable from the keyboard, so animating never requires a pointer (WCAG 2.1 —
 * 2.1.1 Keyboard, A).
 */
import { useCallback, useMemo } from "react";
import {
  Platform,
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import {
  DEFAULT_FPS,
  formatTimecode,
  frameDuration,
  timeToX,
} from "../timeline";

import {
  curveSamples,
  normaliseValue,
  trackRange,
  type Keyframe,
  type KeyframeTrack,
} from "./keyframeCurve";
import { createKeyframeStyles } from "./keyframeStyles";
import { videoEditorSizing } from "./videoEditorSizing";

/** Compact lanes, or the full value graph. */
export type KeyframeEditorMode = "curve" | "lanes";

export type KeyframeEditorProps = {
  tracks: readonly KeyframeTrack[];
  mode?: KeyframeEditorMode;
  /** Left edge of the plotted window, in seconds. Default `0`. */
  startTime?: number;
  /** Right edge of the plotted window, in seconds. */
  endTime: number;
  /** Shared with the timeline, so the two line up. */
  pixelsPerSecond: number;
  /** Drawn as a vertical rule across every lane. */
  playheadTime?: number;
  fps?: number;
  selectedKeyframeIds?: readonly string[];
  onSelectionChange?: (keyframeIds: string[]) => void;
  /** Supplying this makes keyframes movable. */
  onKeyframeMove?: (
    trackId: string,
    keyframeId: string,
    time: number,
    value: number,
  ) => void;
  onKeyframeRemove?: (trackId: string, keyframeId: string) => void;
  /** Row height in `lanes` mode, or graph height in `curve` mode. */
  laneHeight?: number;
  /** Width of the label gutter. */
  gutterWidth?: number;
  /** Shown when no property is animated. */
  emptyLabel?: string;
  size?: ControlSize;
  disableFocusRing?: boolean;
  /** Names the editor as a region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** How many points a plotted curve is sampled at. */
const CURVE_SAMPLES = 120;

/** Web `keydown` event shape — enough of it to read the key and stop default. */
type KeyframeKeyEvent = {
  key?: string;
  altKey?: boolean;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  shiftKey?: boolean;
  stopPropagation?: () => void;
};

export function KeyframeEditor({
  accessibilityLabel,
  disableFocusRing = false,
  emptyLabel = "No animated properties",
  endTime,
  fps = DEFAULT_FPS,
  gutterWidth = 92,
  laneHeight,
  mode = "lanes",
  onKeyframeMove,
  onKeyframeRemove,
  onSelectionChange,
  pixelsPerSecond,
  playheadTime,
  selectedKeyframeIds = [],
  size = "md",
  startTime = 0,
  style,
  testID,
  tracks,
}: KeyframeEditorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createKeyframeStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const rowHeight = laneHeight ?? (mode === "curve" ? 96 : 28);
  const width = Math.max(1, timeToX(endTime - startTime, pixelsPerSecond));
  const selected = useMemo(
    () => new Set(selectedKeyframeIds),
    [selectedKeyframeIds],
  );

  const handleKey = useCallback(
    (track: KeyframeTrack, keyframe: Keyframe, event: KeyframeKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key || !onKeyframeMove) {
        return;
      }
      const range = trackRange(track);
      const timeStep = event.shiftKey ? 1 : frameDuration(fps);
      const valueStep = (range.max - range.min) / (event.shiftKey ? 10 : 100);
      const stop = () => {
        event.preventDefault?.();
        event.stopPropagation?.();
      };
      switch (key) {
        case "ArrowLeft":
          stop();
          onKeyframeMove(
            track.id,
            keyframe.id,
            Math.max(startTime, keyframe.time - timeStep),
            keyframe.value,
          );
          return;
        case "ArrowRight":
          stop();
          onKeyframeMove(
            track.id,
            keyframe.id,
            Math.min(endTime, keyframe.time + timeStep),
            keyframe.value,
          );
          return;
        case "ArrowUp":
          stop();
          onKeyframeMove(
            track.id,
            keyframe.id,
            keyframe.time,
            Math.min(range.max, keyframe.value + valueStep),
          );
          return;
        case "ArrowDown":
          stop();
          onKeyframeMove(
            track.id,
            keyframe.id,
            keyframe.time,
            Math.max(range.min, keyframe.value - valueStep),
          );
          return;
        case "Delete":
        case "Backspace":
          if (onKeyframeRemove) {
            stop();
            onKeyframeRemove(track.id, keyframe.id);
          }
          return;
        default:
      }
    },
    [endTime, fps, onKeyframeMove, onKeyframeRemove, startTime],
  );

  if (tracks.length === 0) {
    return (
      <View style={[styles.root, style]} testID={testID}>
        <Text style={styles.empty}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View
      aria-label={accessibilityLabel}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.root, style]}
      testID={testID}
    >
      {tracks.map((track) => {
        const range = trackRange(track);
        return (
          <View key={track.id} style={styles.lane}>
            <View style={[styles.gutter, { width: gutterWidth }]}>
              <Text
                numberOfLines={1}
                style={[styles.laneLabel, { fontSize: metrics.fontSize }]}
              >
                {track.label}
              </Text>
            </View>
            <View style={[styles.plot, { height: rowHeight, width }]}>
              {mode === "curve" ? (
                <CurvePath
                  color={theme.colors.primary}
                  endTime={endTime}
                  height={rowHeight}
                  pixelsPerSecond={pixelsPerSecond}
                  range={range}
                  startTime={startTime}
                  track={track}
                  width={width}
                />
              ) : null}
              {playheadTime !== undefined ? (
                <View
                  aria-hidden
                  style={[
                    styles.playhead,
                    {
                      backgroundColor: theme.colors.rose,
                      left: timeToX(playheadTime - startTime, pixelsPerSecond),
                    },
                  ]}
                />
              ) : null}
              {track.keyframes.map((keyframe) => (
                <KeyframeDiamond
                  disableFocusRing={disableFocusRing}
                  fps={fps}
                  key={keyframe.id}
                  keyframe={keyframe}
                  left={timeToX(keyframe.time - startTime, pixelsPerSecond)}
                  onKeyDown={(event) => handleKey(track, keyframe, event)}
                  onPress={() => onSelectionChange?.([keyframe.id])}
                  selected={selected.has(keyframe.id)}
                  testID={`keyframe-${keyframe.id}`}
                  top={
                    mode === "curve"
                      ? (1 - normaliseValue(keyframe.value, range)) * rowHeight
                      : rowHeight / 2
                  }
                  track={track}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CurvePath({
  color,
  endTime,
  height,
  pixelsPerSecond,
  range,
  startTime,
  track,
  width,
}: {
  color: string;
  endTime: number;
  height: number;
  pixelsPerSecond: number;
  range: { max: number; min: number };
  startTime: number;
  track: KeyframeTrack;
  width: number;
}) {
  const path = useMemo(() => {
    const samples = curveSamples(
      track.keyframes,
      startTime,
      endTime,
      CURVE_SAMPLES,
    );
    return samples
      .map((sample, index) => {
        const x = timeToX(sample.time - startTime, pixelsPerSecond);
        const y = (1 - normaliseValue(sample.value, range)) * height;
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [endTime, height, pixelsPerSecond, range, startTime, track.keyframes]);

  if (path === "") {
    return null;
  }
  return (
    <Svg aria-hidden height={height} pointerEvents="none" width={width}>
      <Path d={path} fill="none" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function KeyframeDiamond({
  disableFocusRing,
  fps,
  keyframe,
  left,
  onKeyDown,
  onPress,
  selected,
  testID,
  top,
  track,
}: {
  disableFocusRing: boolean;
  fps: number;
  keyframe: Keyframe;
  left: number;
  onKeyDown: (event: KeyframeKeyEvent) => void;
  onPress: () => void;
  selected: boolean;
  testID: string;
  top: number;
  track: KeyframeTrack;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createKeyframeStyles(theme), [theme]);
  const focus = useFocusRing({ disabled: disableFocusRing });
  const label = [
    track.label,
    formatTimecode(keyframe.time, fps),
    `${keyframe.value}${track.unit ? ` ${track.unit}` : ""}`,
    keyframe.interpolation ?? "linear",
    selected ? "selected" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={[
        styles.keyframe,
        {
          backgroundColor: selected
            ? theme.colors.primaryDeep
            : theme.colors.surface,
          borderColor: theme.colors.primaryDeep,
          left: left - 6,
          top: top - 6,
        },
        focus.webOutlineReset,
        focus.focusVisible && focus.ringEnabled ? styles.keyframeFocused : null,
      ]}
      testID={testID}
      {...(Platform.OS === "web" ? { onKeyDown } : {})}
    />
  );
}
