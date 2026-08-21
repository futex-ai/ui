/**
 * One asset in the bin, as a card (grid) or a row (list).
 *
 * Selection is carried by a uniform border plus an inset ring and repeated in
 * the accessible name, never by fill alone (WCAG 2.1 — 1.4.1 Use of Colour, A).
 * The thumbnail is decorative: everything it says is already in the item's
 * name, so it stays hidden from assistive tech rather than being announced
 * twice.
 */
import { Image as ImageIcon, Music, Type, Video } from "lucide-react-native";
import type { ComponentType } from "react";
import { useMemo } from "react";
import { Image, Pressable, Text, View } from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing, type PressableHoverState } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  assetDurationLabel,
  describeAsset,
  type MediaAsset,
  type MediaAssetKind,
} from "./mediaBinModel";
import { videoEditorSizing } from "./videoEditorSizing";
import { createMediaBinStyles } from "./mediaBinStyles";

type IconProps = { color?: string; size?: number };

const KIND_ICON: Record<MediaAssetKind, ComponentType<IconProps>> = {
  audio: Music,
  image: ImageIcon,
  title: Type,
  video: Video,
};

export type MediaBinItemProps = {
  asset: MediaAsset;
  /** Card or row. */
  view: "grid" | "list";
  selected?: boolean;
  size?: ControlSize;
  onPress?: (asset: MediaAsset) => void;
  /** Fired on a second press or on Enter — "put this in the sequence". */
  onActivate?: (asset: MediaAsset) => void;
  disableFocusRing?: boolean;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function MediaBinItem({
  asset,
  disableFocusRing = false,
  onActivate,
  onPress,
  selected = false,
  size = "md",
  testID,
  view,
}: MediaBinItemProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createMediaBinStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });
  const Icon = KIND_ICON[asset.kind];
  const duration = assetDurationLabel(asset);
  const label = selected
    ? `${describeAsset(asset)}, selected`
    : describeAsset(asset);

  const thumbnail = (
    <View
      aria-hidden
      style={[
        view === "grid" ? styles.thumbGrid : styles.thumbList,
        { backgroundColor: theme.colors.bg2 },
      ]}
    >
      {asset.thumbnail ? (
        <Image source={{ uri: asset.thumbnail }} style={styles.thumbImage} />
      ) : (
        <View style={styles.thumbFallback}>
          <Icon color={theme.colors.muted} size={metrics.iconSize} />
        </View>
      )}
      {duration && view === "grid" ? (
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onLongPress={onActivate ? () => onActivate(asset) : undefined}
      onPress={() => onPress?.(asset)}
      style={({ hovered }: PressableHoverState) => [
        view === "grid" ? styles.cardGrid : styles.cardList,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        },
        selected ? styles.cardSelected : null,
        hovered && !selected ? styles.cardHovered : null,
        focus.webOutlineReset,
        focus.focused && focus.ringEnabled ? styles.cardFocused : null,
      ]}
      testID={testID}
    >
      {thumbnail}
      <View style={styles.meta}>
        <View style={styles.metaRow}>
          {view === "list" ? (
            <Icon color={theme.colors.muted} size={metrics.iconSize - 2} />
          ) : null}
          <Text
            numberOfLines={1}
            style={[styles.name, { fontSize: metrics.fontSize }]}
          >
            {asset.name}
          </Text>
        </View>
        {view === "list" && (duration || asset.badge) ? (
          <Text style={styles.secondary}>
            {[duration, asset.badge].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
