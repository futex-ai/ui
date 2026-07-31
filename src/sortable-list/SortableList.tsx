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
import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { DragGhostPortal } from "../dragGhostPortal";
import { useSharedUiTheme } from "../theme";

import { useSortableGroupContext } from "./sortableGroupContext";
import { SortableClone, SortableHandle, SortableRow } from "./SortableRow";
import type { SortableHandleState } from "./SortableRow";
import {
  indicatorIndex,
  type SortableHandlePlacement,
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
  SortableHandlePlacement,
  SortableHandleSide,
  SortableMove,
  SortableOrientation,
} from "./sortableListModel";
export type { SortableHandleState } from "./SortableRow";

// `position: fixed` is not in React Native's style union, but RNW honours it for
// the floating clone so it tracks the cursor across the whole viewport.
const GHOST_FIXED = { position: "fixed" } as unknown as ViewStyle;

export type SortableListProps<Item> = {
  /** Accessible label for the whole list. */
  accessibilityLabel?: string;
  /**
   * Disable the shared focus glow on the drag rows / handles. They then fall back
   * to the browser's default focus outline so keyboard focus stays visible (WCAG
   * 2.1 — 2.4.7 Focus Visible, AA). Disable every ring at once via the theme's
   * `focusRing: false` flag instead.
   */
  disableFocusRing?: boolean;
  /** Gap in px between rows. Defaults to the `size` scale — a visible gap gives the drop preview a slot to open into. */
  gap?: number;
  /**
   * Join the enclosing {@link SortableGroups} coordinator under this id, so
   * items can be dragged between this list and its siblings. Every move — this
   * list's own included — is then reported through the coordinator's `onMove`
   * rather than `onReorder`, and item keys must be unique across the whole
   * coordinator. Without a coordinator, or without this prop, the list behaves
   * exactly as it does standalone.
   */
  groupId?: string;
  /**
   * Show a grab handle. `"start"` / `"end"` auto-place it in the row gutter
   * beside the content; `"custom"` hands the wired handle to `renderItem` (its
   * third argument) so you place it yourself — e.g. INSIDE your own card. In
   * every case the handle is the ONLY drag / keyboard / focus target, so the rest
   * of the row stays independently interactive. Omit for a whole-row drag surface
   * (best for simple, non-interactive rows).
   */
  handle?: SortableHandlePlacement;
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
  /**
   * Renders the content for a given item. In `handle="custom"` mode the third
   * argument is the wired grab handle to place inside your content (e.g. in your
   * card); it is `undefined` for the other handle modes (the handle is placed by
   * the list) and for the whole-row drag surface.
   */
  renderItem: (item: Item, index: number, handle?: ReactNode) => ReactNode;
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
  disableFocusRing = false,
  gap,
  groupId,
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

  // A coordinator takes over the drag entirely when this list joins one: it
  // owns the engine, so every move (including this list's own) is reported
  // through its `onMove`. Standalone, the list drives its own engine as before.
  const coordinator = useSortableGroupContext();
  const grouped = groupId !== undefined ? coordinator : null;

  const isGrouped = Boolean(grouped);
  useEffect(() => {
    if (isGrouped && onReorder) {
      devWarn(
        `SortableList: "${groupId}" is inside a SortableGroups coordinator, so its onReorder is ignored — the coordinator's onMove reports every move, including this list's own.`,
      );
    }
  }, [groupId, isGrouped, onReorder]);

  // Identifies this list instance to the coordinator, so a teardown cannot drop
  // a replacement list that already claimed the same id.
  const owner = useRef({});
  if (grouped && groupId !== undefined) {
    // A ref write, not state: the coordinator reads the registry live at event
    // time, so publishing here keeps it exact without a second render pass.
    grouped.register(
      groupId,
      {
        handle: Boolean(handle),
        itemLabel: label,
        keys,
        label: accessibilityLabel,
        orientation,
      },
      owner.current,
    );
  }
  // Depend on `unregister` (stable) rather than the context value, which is a
  // fresh object on every drag-state change — that would tear this list out of
  // the registry mid-drag, right after its render had put it back.
  const unregister = grouped?.unregister;
  useEffect(
    () => () => {
      if (groupId !== undefined) {
        unregister?.(groupId, owner.current);
      }
    },
    [groupId, unregister],
  );

  const solo = useSortableListDrag({
    enabled: Boolean(onReorder) && !grouped,
    handle: Boolean(handle),
    keys,
    label,
    onReorder,
    orientation,
  });

  const groupedBind = grouped?.bindList(groupId ?? "");
  const drag =
    grouped && groupId !== undefined
      ? {
          bindGhost: grouped.bindGhost,
          bindList: groupedBind ?? solo.bindList,
          itemBinding: grouped.itemBinding,
        }
      : solo;

  const shared = grouped?.dragState;
  const { active, draggedKey, ghostHeight, ghostWidth, mode } =
    shared ?? solo.dragState;
  // Standalone, every target belongs to this list. Grouped, only the target
  // that names this group opens a preview here.
  const target =
    shared && groupId !== undefined
      ? shared.target?.groupId === groupId
        ? { index: shared.target.index }
        : null
      : solo.dragState.target;

  // Locate the dragged item so the list can render its preview + floating clone,
  // and place the preview at the right flow slot per mode: the pointer lifts the
  // row out (removed-item index), the keyboard leaves it in place (visual index).
  const draggedIndex = active && draggedKey ? keys.indexOf(draggedKey) : -1;

  // In `handle="custom"` mode the wired grip is handed to `renderItem` to place
  // inside the content. A binding-less copy (no testID / focus) goes into the
  // decorative preview and ghost, so the inert clone never duplicates the real
  // handle's `data-testid`. Other modes pass `undefined` (no consumer handle).
  const customGrip = (
    binding: ReturnType<typeof drag.itemBinding>,
    grabbed: boolean,
    gripLabel: string,
  ) =>
    handle === "custom" ? (
      <SortableHandle
        binding={binding}
        disableFocusRing={disableFocusRing}
        dragging={grabbed}
        iconColor={theme.colors.muted}
        iconSize={iconSize}
        label={gripLabel}
        orientation={orientation}
        renderHandle={renderHandle}
        styles={styles}
      />
    ) : undefined;

  // The dragged row's content, rendered by whichever list actually holds it.
  const ownPreview =
    draggedIndex >= 0
      ? renderItem(
          items[draggedIndex],
          draggedIndex,
          customGrip(null, false, ""),
        )
      : null;
  if (grouped && ownPreview) {
    // Publish it so a sibling list can draw the preview for a row it does not
    // own. Safe as a render-time ref write: the first render of any drag always
    // targets the source group, so the value is in place before another list
    // needs it.
    grouped.preview.current = ownPreview;
  }
  const previewNode = grouped
    ? ((grouped.preview.current as typeof ownPreview) ?? null)
    : ownPreview;
  // A keyboard drag leaves the grabbed row in place, so a target at or past its
  // own slot sits one flow slot later — but only in the list that holds it. A
  // list drawing the preview for someone else's row uses the target directly.
  const previewIndex =
    active && target
      ? mode === "keyboard" && draggedIndex >= 0
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
        content={renderItem(
          item,
          index,
          customGrip(binding, grabbed, grabLabel),
        )}
        disableFocusRing={disableFocusRing}
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
      {active && mode === "pointer" && draggedIndex >= 0 && previewNode ? (
        // The clone that rides the cursor: a fixed, viewport-positioned copy of
        // the row, moved by the hook mutating its transform. Decorative, inert,
        // and click-through — the lifted row and the live region carry the
        // meaning. Web portals it to `body` so a transformed or scrolling
        // ancestor cannot redefine what its fixed coordinates mean.
        <DragGhostPortal>
          {clone(
            [
              styles.ghost,
              GHOST_FIXED,
              ghostWidth != null ? { width: ghostWidth } : null,
              ghostHeight != null ? { height: ghostHeight } : null,
            ],
            "sortable-drag-ghost",
            drag.bindGhost.ref,
          )}
        </DragGhostPortal>
      ) : null}
    </View>
  );
}
