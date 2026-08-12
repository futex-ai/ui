/**
 * The asset browser.
 *
 * Controlled like everything else in the family: the query, the view mode, and
 * the selection are the consumer's, and the bin reports intent. Filtering and
 * grouping run through the pure `mediaBinModel`, so what the bin shows can be
 * predicted — and tested — without rendering it.
 *
 * `onAssetActivate` is the "put this in the sequence" hook, reached by a second
 * press, a long press, or Enter on a focused item. Dragging an asset onto a
 * timeline is left to the consumer: the drop target is theirs, not the bin's.
 */
import { Grid2x2, List as ListIcon, Search } from "lucide-react-native";
import type { ComponentType } from "react";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useFocusRing } from "../focusRing";
import { Input } from "../input";
import { useSharedUiTheme } from "../theme";

import { MediaBinItem } from "./MediaBinItem";
import { filterAssets, groupAssets, type MediaAsset } from "./mediaBinModel";
import { createMediaBinStyles } from "./mediaBinStyles";
import { videoEditorSizing } from "./videoEditorSizing";

/** Card grid or compact rows. */
export type MediaBinView = "grid" | "list";

export type MediaBinProps = {
  assets: readonly MediaAsset[];
  /** Card grid or compact rows. Default `"grid"`. */
  view?: MediaBinView;
  /** Supplying this shows the view toggle. */
  onViewChange?: (view: MediaBinView) => void;
  /** Current search text. Supplying `onQueryChange` shows the search field. */
  query?: string;
  onQueryChange?: (query: string) => void;
  selectedAssetIds?: readonly string[];
  onSelectionChange?: (assetIds: string[]) => void;
  /** "Put this in the sequence" — a long press, or Enter on a focused item. */
  onAssetActivate?: (asset: MediaAsset) => void;
  /** Group items under their `group` headings. Default `true`. */
  grouped?: boolean;
  /** Panel heading. Omit for no heading row. */
  title?: string;
  /** Shown when nothing matches. */
  emptyLabel?: string;
  /** Caps the scrollable body's height. */
  maxHeight?: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  disableFocusRing?: boolean;
  /** Names the bin as a region for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

export function MediaBin({
  accessibilityLabel,
  assets,
  disableFocusRing = false,
  emptyLabel = "Nothing matches",
  grouped = true,
  maxHeight,
  onAssetActivate,
  onQueryChange,
  onSelectionChange,
  onViewChange,
  query = "",
  selectedAssetIds = [],
  size = "md",
  style,
  testID,
  title,
  view = "grid",
}: MediaBinProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createMediaBinStyles(theme), [theme]);

  const visible = useMemo(() => filterAssets(assets, query), [assets, query]);
  const groups = useMemo(
    () => (grouped ? groupAssets(visible) : [{ assets: visible, title: "" }]),
    [grouped, visible],
  );
  const selected = useMemo(() => new Set(selectedAssetIds), [selectedAssetIds]);

  const body = (
    <View style={styles.body}>
      {visible.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        groups.map((group) => (
          <View key={group.title || "all"} style={{ gap: 6 }}>
            {group.title ? (
              <Text style={styles.groupTitle}>{group.title}</Text>
            ) : null}
            <View style={view === "grid" ? styles.grid : styles.list}>
              {group.assets.map((asset) => (
                <MediaBinItem
                  asset={asset}
                  disableFocusRing={disableFocusRing}
                  key={asset.id}
                  onActivate={onAssetActivate}
                  onPress={() => onSelectionChange?.([asset.id])}
                  selected={selected.has(asset.id)}
                  size={size}
                  testID={`media-asset-${asset.id}`}
                  view={view}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </View>
  );

  return (
    <View
      aria-label={accessibilityLabel}
      role={accessibilityLabel ? "group" : undefined}
      style={[styles.root, style]}
      testID={testID}
    >
      {title || onViewChange || onQueryChange ? (
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {onViewChange ? (
              <>
                <ViewToggle
                  Icon={Grid2x2}
                  active={view === "grid"}
                  disableFocusRing={disableFocusRing}
                  label="Show media as a grid"
                  onPress={() => onViewChange("grid")}
                  size={size}
                  testID={testID ? `${testID}-view-grid` : undefined}
                />
                <ViewToggle
                  Icon={ListIcon}
                  active={view === "list"}
                  disableFocusRing={disableFocusRing}
                  label="Show media as a list"
                  onPress={() => onViewChange("list")}
                  size={size}
                  testID={testID ? `${testID}-view-list` : undefined}
                />
              </>
            ) : null}
          </View>
          {onQueryChange ? (
            <Input
              accessibilityLabel="Search media"
              prefixIcon={Search}
              onChangeText={onQueryChange}
              placeholder="Search media"
              size={size}
              testID={testID ? `${testID}-search` : undefined}
              value={query}
            />
          ) : null}
        </View>
      ) : null}
      {maxHeight ? <ScrollView style={{ maxHeight }}>{body}</ScrollView> : body}
    </View>
  );
}

function ViewToggle({
  Icon,
  active,
  disableFocusRing,
  label,
  onPress,
  size,
  testID,
}: {
  Icon: ComponentType<{ color?: string; size?: number }>;
  active: boolean;
  disableFocusRing: boolean;
  label: string;
  onPress: () => void;
  size: ControlSize;
  testID?: string;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createMediaBinStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const focus = useFocusRing({ disabled: disableFocusRing });

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      onPress={onPress}
      style={[
        styles.viewToggle,
        active ? styles.viewToggleOn : null,
        focus.webOutlineReset,
        focus.focused && focus.ringEnabled ? styles.viewToggleFocused : null,
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
