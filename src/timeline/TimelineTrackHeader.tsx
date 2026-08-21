/**
 * One row of the pinned gutter: a track's name, its kind icon, and the toggles
 * that belong to that kind — mute and solo for audio, visibility for the picture
 * tracks, and a lock on every track.
 *
 * Each toggle is a plain button whose accessible name states the action it will
 * perform ("Mute Dialogue" / "Unmute Dialogue"), so its state reaches assistive
 * tech through the name rather than through an ARIA state react-native-web does
 * not reliably emit (WCAG 2.1 — 4.1.2 Name, Role, Value, A).
 */
import {
  Eye,
  EyeOff,
  Headphones,
  Lock,
  LockOpen,
  Music,
  Sparkles,
  Type,
  Video,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { useMemo } from "react";
import {
  Pressable,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { createTimelineStyles, timelineSizing } from "./timelineStyles";
import type { TimelineTrack, TimelineTrackKind } from "./timelineTypes";

/** The boolean flags a header can toggle. */
export type TimelineTrackFlag = "hidden" | "locked" | "muted" | "soloed";

export type TimelineTrackHeaderProps = {
  track: TimelineTrack;
  /** Lane height in px, so the header lines up with its lane. */
  height: number;
  /** Gutter width in px. */
  width: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  /** Called when a toggle is pressed; the consumer applies the change. */
  onToggle?: (trackId: string, flag: TimelineTrackFlag) => void;
  /** Suppress the shared focus glow on the toggles. */
  disableFocusRing?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

const KIND_ICON: Record<TimelineTrackKind, ComponentType<IconProps>> = {
  audio: Music,
  effect: Sparkles,
  title: Type,
  video: Video,
};

type IconProps = { color?: string; size?: number };

export function TimelineTrackHeader({
  disableFocusRing = false,
  height,
  onToggle,
  size = "md",
  style,
  testID,
  track,
  width,
}: TimelineTrackHeaderProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const metrics = timelineSizing[size];
  const KindIcon = KIND_ICON[track.kind];
  const isAudio = track.kind === "audio";

  return (
    <View style={[styles.header, { height, width }, style]} testID={testID}>
      <View style={styles.headerTopRow}>
        <KindIcon color={theme.colors.muted} size={metrics.iconSize} />
        <Text
          numberOfLines={1}
          style={[styles.headerName, { fontSize: metrics.fontSize }]}
        >
          {track.name}
        </Text>
      </View>
      <View style={styles.headerToggles}>
        {isAudio ? (
          <>
            <HeaderToggle
              Icon={track.muted ? VolumeX : Volume2}
              active={Boolean(track.muted)}
              disableFocusRing={disableFocusRing}
              label={`${track.muted ? "Unmute" : "Mute"} ${track.name}`}
              onPress={() => onToggle?.(track.id, "muted")}
              size={size}
              testID={`timeline-track-muted-${track.id}`}
            />
            <HeaderToggle
              Icon={Headphones}
              active={Boolean(track.soloed)}
              disableFocusRing={disableFocusRing}
              label={`${track.soloed ? "Unsolo" : "Solo"} ${track.name}`}
              onPress={() => onToggle?.(track.id, "soloed")}
              size={size}
              testID={`timeline-track-soloed-${track.id}`}
            />
          </>
        ) : (
          <HeaderToggle
            Icon={track.hidden ? EyeOff : Eye}
            active={Boolean(track.hidden)}
            disableFocusRing={disableFocusRing}
            label={`${track.hidden ? "Show" : "Hide"} ${track.name}`}
            onPress={() => onToggle?.(track.id, "hidden")}
            size={size}
            testID={`timeline-track-hidden-${track.id}`}
          />
        )}
        <HeaderToggle
          Icon={track.locked ? Lock : LockOpen}
          active={Boolean(track.locked)}
          disableFocusRing={disableFocusRing}
          label={`${track.locked ? "Unlock" : "Lock"} ${track.name}`}
          onPress={() => onToggle?.(track.id, "locked")}
          size={size}
          testID={`timeline-track-locked-${track.id}`}
        />
      </View>
    </View>
  );
}

function HeaderToggle({
  Icon,
  active,
  disableFocusRing,
  label,
  onPress,
  size,
  testID,
}: {
  Icon: ComponentType<IconProps>;
  /** Drives the tinted fill and the accent icon color. */
  active: boolean;
  disableFocusRing: boolean;
  label: string;
  onPress: () => void;
  size: ControlSize;
  testID: string;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTimelineStyles(theme), [theme]);
  const metrics = timelineSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });
  const box = metrics.iconSize + 8;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={[
        styles.headerToggle,
        { height: box, width: box },
        active ? styles.headerToggleOn : null,
        focus.webOutlineReset,
        focus.focusVisible && focus.ringEnabled
          ? styles.headerToggleFocused
          : null,
      ]}
      testID={testID}
    >
      <Icon
        color={active ? theme.colors.primaryDeep : theme.colors.muted}
        size={metrics.iconSize}
      />
    </Pressable>
  );
}
