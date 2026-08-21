/**
 * The playback transport.
 *
 * Every control is optional and appears only when its handler is supplied, the
 * way `Kanban` gates dragging on `onCardMove` — so the same component is a bare
 * play/pause pair in a compact panel and a full deck with in/out marks, loop,
 * speed, and metering in an editor.
 *
 * It plays nothing. `playing` is state the consumer owns and every button just
 * reports intent, so the transport works over a `<video>`, `expo-video`, an
 * audio graph, or a simulated playhead.
 */
import {
  ChevronFirst,
  ChevronLast,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
} from "lucide-react-native";
import type { ComponentType, ReactNode } from "react";
import { useMemo } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { DropdownMenu, type DropdownListEntry } from "../dropdown";
import { useSharedUiTheme } from "../theme";
import { DEFAULT_FPS, formatTimecode } from "../timeline";

import { LevelMeter } from "./LevelMeter";
import { Scrubber, type ScrubberMarker } from "./Scrubber";
import { TransportButton } from "./TransportButton";
import { videoEditorSizing } from "./videoEditorSizing";
import { createVideoEditorStyles } from "./videoEditorStyles";

export type TransportBarProps = {
  /** Whether playback is running. The transport owns no playback itself. */
  playing: boolean;
  /** Playhead position in seconds. */
  currentTime: number;
  /** Total length in seconds. */
  duration: number;
  fps?: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;

  /** Seconds loaded, drawn behind the played fill. */
  buffered?: number;
  inPoint?: number;
  outPoint?: number;
  markers?: readonly ScrubberMarker[];
  /** Whether looping is on; omit `onToggleLoop` to hide the control. */
  loop?: boolean;
  /** Current playback rate, e.g. `1`. */
  rate?: number;
  /** Offered rates. Defaults to a standard 0.25×–2× ladder. */
  rates?: readonly number[];
  /** Per-channel dBFS levels; supplying them adds a meter. */
  levels?: readonly number[];
  peakHolds?: readonly number[];

  onPlayPause?: () => void;
  /** Called with `-1` or `1` to step a single frame. */
  onStepFrame?: (direction: -1 | 1) => void;
  onSeek?: (time: number) => void;
  onMarkIn?: () => void;
  onMarkOut?: () => void;
  onToggleLoop?: () => void;
  onRateChange?: (rate: number) => void;

  /** Hide the seek bar, for a transport under its own timeline. */
  showScrubber?: boolean;
  /** Extra controls before the play cluster. */
  leading?: ReactNode;
  /** Extra controls after everything else. */
  trailing?: ReactNode;

  disableFocusRing?: boolean;
  /** Names the transport as a group for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

const DEFAULT_RATES = [0.25, 0.5, 1, 1.5, 2] as const;

type IconProps = { color?: string; size?: number };

export function TransportBar({
  accessibilityLabel = "Transport",
  buffered,
  currentTime,
  disableFocusRing = false,
  duration,
  fps = DEFAULT_FPS,
  inPoint,
  leading,
  levels,
  loop = false,
  markers,
  onMarkIn,
  onMarkOut,
  onPlayPause,
  onRateChange,
  onSeek,
  onStepFrame,
  onToggleLoop,
  outPoint,
  peakHolds,
  playing,
  rate = 1,
  rates = DEFAULT_RATES,
  showScrubber = true,
  size = "md",
  style,
  testID,
  trailing,
}: TransportBarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createVideoEditorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];

  const rateEntries: DropdownListEntry[] = useMemo(
    () =>
      rates.map((value) => ({
        id: String(value),
        label: `${value}×`,
        onPress: () => onRateChange?.(value),
        type: "item",
      })),
    [onRateChange, rates],
  );

  const button = (
    Icon: ComponentType<IconProps>,
    label: string,
    onPress: (() => void) | undefined,
    options: { active?: boolean; primary?: boolean; id?: string } = {},
  ) =>
    onPress ? (
      <TransportButton
        Icon={Icon}
        active={options.active}
        disableFocusRing={disableFocusRing}
        key={label}
        label={label}
        onPress={onPress}
        primary={options.primary}
        size={size}
        testID={testID && options.id ? `${testID}-${options.id}` : undefined}
      />
    ) : null;

  return (
    <View
      aria-label={accessibilityLabel}
      role="group"
      style={[styles.transport, { gap: metrics.gap }, style]}
      testID={testID}
    >
      {leading}
      {button(
        ChevronFirst,
        "Jump to start",
        onSeek ? () => onSeek(0) : undefined,
        {
          id: "start",
        },
      )}
      {button(
        SkipBack,
        "Step back one frame",
        onStepFrame ? () => onStepFrame(-1) : undefined,
        { id: "step-back" },
      )}
      {button(playing ? Pause : Play, playing ? "Pause" : "Play", onPlayPause, {
        id: "play",
        primary: true,
      })}
      {button(
        SkipForward,
        "Step forward one frame",
        onStepFrame ? () => onStepFrame(1) : undefined,
        { id: "step-forward" },
      )}
      {button(
        ChevronLast,
        "Jump to end",
        onSeek ? () => onSeek(duration) : undefined,
        { id: "end" },
      )}

      <Text
        style={[styles.mono, { fontSize: metrics.fontSize }]}
        testID={testID ? `${testID}-timecode` : undefined}
      >
        {formatTimecode(currentTime, fps)}
      </Text>

      {showScrubber ? (
        <View style={styles.grow}>
          <Scrubber
            buffered={buffered}
            currentTime={currentTime}
            disableFocusRing={disableFocusRing}
            duration={duration}
            fps={fps}
            inPoint={inPoint}
            markers={markers}
            onSeek={onSeek}
            outPoint={outPoint}
            size={size}
            testID={testID ? `${testID}-scrubber` : undefined}
          />
        </View>
      ) : null}

      <Text style={[styles.mutedText, { fontSize: metrics.fontSize }]}>
        {formatTimecode(duration, fps)}
      </Text>

      {button(MarkInIcon, "Mark in", onMarkIn, { id: "mark-in" })}
      {button(MarkOutIcon, "Mark out", onMarkOut, { id: "mark-out" })}
      {button(Repeat, loop ? "Turn looping off" : "Loop", onToggleLoop, {
        active: loop,
        id: "loop",
      })}

      {onRateChange ? (
        <DropdownMenu entries={rateEntries} minWidth={120}>
          <View
            accessibilityLabel={`Playback speed, ${rate}×`}
            accessibilityRole="button"
            style={[styles.rateTrigger, { height: metrics.buttonSize }]}
            testID={testID ? `${testID}-rate` : undefined}
          >
            <Text style={[styles.text, { fontSize: metrics.fontSize }]}>
              {rate}×
            </Text>
          </View>
        </DropdownMenu>
      ) : null}

      {levels ? (
        <LevelMeter
          length={72}
          peakHolds={peakHolds}
          size={size}
          testID={testID ? `${testID}-meter` : undefined}
          values={levels}
        />
      ) : null}
      {trailing}
    </View>
  );
}

/**
 * The in and out marks. Lucide has no in/out glyph, and the bracket shapes an
 * editor uses read better than a repurposed arrow, so they are drawn from the
 * same primitives every other component uses rather than pulled from the icon
 * set. Both are decorative — the buttons carry the accessible names.
 */
function MarkInIcon({ color, size = 16 }: IconProps) {
  return <MarkIcon color={color} flipped={false} size={size} />;
}

function MarkOutIcon({ color, size = 16 }: IconProps) {
  return <MarkIcon color={color} flipped size={size} />;
}

function MarkIcon({
  color,
  flipped,
  size,
}: {
  color?: string;
  flipped: boolean;
  size: number;
}) {
  const bar = { backgroundColor: color, borderRadius: 1 } as const;
  return (
    <View
      aria-hidden
      style={{
        alignItems: "center",
        flexDirection: flipped ? "row-reverse" : "row",
        gap: 2,
        height: size,
      }}
    >
      <View style={[bar, { height: size, width: 2 }]} />
      <View style={[bar, { height: 2, width: size / 2 }]} />
    </View>
  );
}
