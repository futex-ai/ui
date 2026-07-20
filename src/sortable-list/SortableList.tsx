/**
 * A drag-and-drop sortable list for React Native and React Native Web. Like
 * {@link List} it is generic over its data (`items` / `itemKey` / `renderItem`),
 * so a row can hold anything; unlike List it makes those rows reorderable. Pass
 * `onReorder` to enable dragging — by pointer (mouse / pen) or keyboard on web —
 * and the list stays controlled: it reports each move for the consumer to apply
 * to its own data (see {@link applySortableMove}); the drag never mutates items.
 *
 * An optional grab `handle` ("start" / "end") becomes the sole drag / keyboard
 * target so the rest of a row stays interactive (its own buttons keep working);
 * with no handle the whole row is the drag surface. The list flows `vertical`
 * (default) or `horizontal`. On native the drag is an inert no-op today (a
 * documented follow-up); the list still renders, and order can be driven from a
 * consumer's own controls.
 */
import { Fragment, type ReactNode, useCallback, useMemo } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { SortableClone, SortableRow } from "./SortableRow";
import type { SortableHandleState } from "./SortableRow";
import {
  indicatorIndex,
  type SortableHandleSide,
  type SortableMove,
  type SortableOrientation,
} from "./sortableListModel";
import {
  createSortableListStyles,
  sortableGap,
  sortableHandleIconSize,
} from "./sortableListStyles";
import { useSortableListDrag } from "./useSortableListDrag";

export { applySortableMove } from "./sortableListModel";
export type {
  SortableMove,
  SortableOrientation,
  SortableHandleSide,
} from "./sortableListModel";
export type { SortableHandleState } from "./SortableRow";

// `position: fixed` is not in React Native's style union, but RNW honours it for
// the floating clone so it tracks the cursor across the whole viewport.
const GHOST_FIXED = { position: "fixed" } as unknown as ViewStyle;

export type SortableListProps<Item> = {
  /** Accessible label for the whole list. */
  accessibilityLabel?: string;
  /** Gap in px between rows. Defaults to the `size` scale — a visible gap gives the drop preview a slot to open into. */
  gap?: number;
  /**
   * Show a grab handle at the `start` or `end` of every row. When set, the
   * handle is the ONLY drag / keyboard / focus target, so the rest of the row
   * stays independently interactive (its own buttons keep working). Omit for a
   * whole-row drag surface (best for simple, non-interactive rows).
   */
  handle?: SortableHandleSide;
  /** Accessible name for the grab handle button. Defaults to `Reorder <itemLabel>` (or `Reorder item`). */
  handleLabel?: (item: Item, index: number) => string;
  /** Mark a specific item as non-draggable — it stays frozen in place but still occupies its slot. */
  itemDisabled?: (item: Item, index: number) => boolean;
  /** Stable React key for an item; doubles as its drag identity. */
  itemKey: (item: Item, index: number) => string;
  /** The item's accessible name — the whole-row drag target's label (handle-less mode) and the name woven into the drag announcements. */
  itemLabel?: (item: Item, index: number) => string;
  /** The data items. */
  items: Item[];
  /**
   * Called when an item is dragged (pointer or keyboard) to a new index.
   * Providing it enables dragging. The list is controlled: apply the returned
   * `move` to your own `items` (synchronously — see {@link applySortableMove}) and
   * the list re-renders from the new props; the drag never mutates the items.
   * `toIndex` is the insertion index in the list **with the moved item removed**.
   */
  onReorder?: (move: SortableMove) => void;
  /** The flow + drag axis: `vertical` (default) or `horizontal` (left-to-right). */
  orientation?: SortableOrientation;
  /** Custom grab-handle content; defaults to a themed grip glyph. Receives `{ grabbed }`. */
  renderHandle?: (state: SortableHandleState) => ReactNode;
  /** Renders the content for a given item. */
  renderItem: (item: Item, index: number) => ReactNode;
  /** Control density: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Extra style for the list container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * The shared sortable list. Renders `items` through `renderItem` and, when given
 * `onReorder`, makes them draggable — from an optional grab `handle` or the whole
 * row — reporting each committed move for the consumer to apply. The dragged row
 * is lifted out (pointer) or dimmed in place (keyboard) and a dashed preview
 * marks where it will land.
 */
export function SortableList<Item>({
  accessibilityLabel,
  gap,
  handle,
  handleLabel,
  itemDisabled,
  itemKey,
  itemLabel,
  items,
  onReorder,
  orientation = "vertical",
  renderHandle,
  renderItem,
  size = "md",
  style,
  testID,
}: SortableListProps<Item>) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createSortableListStyles(theme, size),
    [theme, size],
  );
  const rowGap = gap ?? sortableGap(size);
  const iconSize = sortableHandleIconSize(size);

  const keys = useMemo(
    () => items.map((item, index) => itemKey(item, index)),
    [itemKey, items],
  );

  // An item's accessible name for the drag announcements (both modes).
  const label = useCallback(
    (key: string) => {
      const index = keys.indexOf(key);
      return index < 0 ? undefined : itemLabel?.(items[index], index);
    },
    [itemLabel, items, keys],
  );

  const drag = useSortableListDrag({
    enabled: Boolean(onReorder),
    handle: Boolean(handle),
    keys,
    label,
    onReorder,
    orientation,
  });

  const { active, draggedKey, ghostHeight, ghostWidth, mode, target } =
    drag.dragState;

  // Locate the dragged item so the list can render its preview + floating clone,
  // and place the preview at the right flow slot per mode: the pointer lifts the
  // row out (removed-item index), the keyboard leaves it in place (visual index).
  const draggedIndex = active && draggedKey ? keys.indexOf(draggedKey) : -1;
  const previewNode =
    draggedIndex >= 0 ? renderItem(items[draggedIndex], draggedIndex) : null;
  const previewIndex =
    active && target && draggedIndex >= 0
      ? mode === "keyboard"
        ? indicatorIndex(draggedIndex, target)
        : target.index
      : -1;

  // The pointer drag lifts the row out of the flow; the keyboard drag keeps it
  // in place (dimmed) so it can receive the arrow keys.
  const flow =
    active && mode === "pointer" && draggedKey
      ? items
          .map((item, index) => ({ index, item }))
          .filter((entry) => keys[entry.index] !== draggedKey)
      : items.map((item, index) => ({ index, item }));

  // The drop preview and the floating clone share one row-shaped, inert,
  // click-through copy of the dragged row (a static grip placeholder in handle
  // mode, so the footprint matches a real row).
  const clone = (
    extraStyle: StyleProp<ViewStyle>,
    testID: string,
    ref?: (n: unknown) => void,
  ) => (
    <SortableClone
      content={previewNode}
      extraStyle={extraStyle}
      forwardedRef={ref}
      handle={handle}
      handleGap={rowGap}
      iconColor={theme.colors.muted}
      iconSize={iconSize}
      orientation={orientation}
      renderHandle={renderHandle}
      styles={styles}
      testID={testID}
    />
  );
  const preview = clone(styles.preview, "sortable-drop-preview");

  const renderRow = (item: Item, index: number) => {
    const key = keys[index];
    const disabled = itemDisabled?.(item, index) ?? false;
    const binding = disabled ? null : drag.itemBinding(key);
    const grabbed = active && mode === "keyboard" && key === draggedKey;
    const rowLabel = itemLabel?.(item, index) ?? "item";
    const grabLabel =
      handleLabel?.(item, index) ??
      `Reorder ${itemLabel?.(item, index) ?? "item"}`;
    return (
      <SortableRow
        binding={binding}
        content={renderItem(item, index)}
        dragging={grabbed}
        handle={handle}
        handleGap={rowGap}
        handleLabel={grabLabel}
        iconColor={theme.colors.muted}
        iconSize={iconSize}
        itemLabel={rowLabel}
        itemTestID={`sortable-item-${key}`}
        orientation={orientation}
        renderHandle={renderHandle}
        styles={styles}
      />
    );
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      ref={drag.bindList.ref}
      role="list"
      style={[
        styles.list,
        {
          flexDirection: orientation === "horizontal" ? "row" : "column",
          gap: rowGap,
        },
        style,
      ]}
      testID={testID}
    >
      {flow.map((entry, position) => (
        <Fragment key={keys[entry.index]}>
          {position === previewIndex ? preview : null}
          {renderRow(entry.item, entry.index)}
        </Fragment>
      ))}
      {previewIndex === flow.length ? preview : null}
      {active && mode === "pointer" && previewNode
        ? // The clone that rides the cursor: a fixed, viewport-positioned copy of
          // the row, moved by the hook mutating its transform. Decorative,
          // inert, and click-through — the lifted row and the live region carry
          // the meaning.
          clone(
            [
              styles.ghost,
              GHOST_FIXED,
              ghostWidth != null ? { width: ghostWidth } : null,
              ghostHeight != null ? { height: ghostHeight } : null,
            ],
            "sortable-drag-ghost",
            drag.bindGhost.ref,
          )
        : null}
    </View>
  );
}
