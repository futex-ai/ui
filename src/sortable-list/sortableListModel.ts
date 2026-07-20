/**
 * Pure geometry and bookkeeping for the {@link SortableList} drag-and-drop, kept
 * free of React and React Native so it can be unit-tested directly. This is the
 * single-list, single-axis sibling of the Kanban drag model: there is one flow
 * (no columns) that runs along a chosen `orientation`, so a target is just an
 * insertion `index` and the axis picks which rect coordinates matter.
 *
 * Indices use **removed-item semantics**: a {@link SortableDropTarget}'s `index`
 * is the insertion position in the list *with the dragged item taken out* — the
 * natural shape for a consumer who splices the item out and back into an array.
 * While a pointer drag is in flight the item is lifted out (a floating clone
 * follows the cursor), so the items that remain in flow already exclude it and
 * {@link liftedDropTarget} reads the pointer straight into removed semantics.
 */

/** The axis the list flows along: `vertical` (default) or `horizontal`. */
export type SortableOrientation = "horizontal" | "vertical";

/** Which end of a row the auto-placed grab handle sits at. */
export type SortableHandleSide = "end" | "start";

/**
 * Where a grab handle lives: auto-placed in the gutter at the `start` / `end` of
 * the row, or `"custom"` — the list hands the wired handle to `renderItem` so the
 * consumer places it themselves (e.g. inside their own card).
 */
export type SortableHandlePlacement = SortableHandleSide | "custom";

/** Whether a live drag was started by a pointer or the keyboard. */
export type SortableDragMode = "keyboard" | "pointer";

/** An insertion point: before the `index`-th item, with the dragged item removed. */
export type SortableDropTarget = { index: number };

/**
 * The committed reorder handed to `onReorder`. `toIndex` is the insertion index
 * in the list **with the moved item removed** — e.g. `toIndex: 1` in a list of
 * `[A, B, C]` when moving `A` lands it as `[B, A, C]`. Equal `fromIndex` /
 * `toIndex` never fire (a no-op drop is swallowed).
 */
export type SortableMove = {
  key: string;
  fromIndex: number;
  toIndex: number;
};

/** A rendered item measured for pointer hit-testing (web only) — full rect so either axis works. */
export type MeasuredSortableItem = {
  bottom: number;
  key: string;
  left: number;
  right: number;
  top: number;
};

/**
 * The live drag state the list renders from: the lifted item (`draggedKey`,
 * hidden from the flow on a pointer drag, dimmed in place on a keyboard drag),
 * the `target` slot where a translucent preview is shown, how the drag was
 * started, and — for a pointer drag — the size of the floating clone that
 * follows the cursor.
 */
export type SortableDragState = {
  active: boolean;
  draggedKey: string | null;
  ghostHeight: number | null;
  ghostWidth: number | null;
  mode: SortableDragMode | null;
  target: SortableDropTarget | null;
};

/** The main-axis span of a measured item for the given orientation. */
export function axisRange(
  item: MeasuredSortableItem,
  orientation: SortableOrientation,
): { end: number; start: number } {
  return orientation === "horizontal"
    ? { end: item.right, start: item.left }
    : { end: item.bottom, start: item.top };
}

/** The item's position in the ordered keys, or `null` when it is not present. */
export function findItemIndex(keys: string[], key: string): number | null {
  const index = keys.indexOf(key);
  return index >= 0 ? index : null;
}

/** Number of insertion slots once the dragged item is removed (the max target index). */
function slotCount(keys: string[], draggedKey: string): number {
  return keys.filter((key) => key !== draggedKey).length;
}

/** The starting target when a drag begins: the item's own slot. */
export function initialDropTarget(
  keys: string[],
  draggedKey: string,
): SortableDropTarget | null {
  const index = findItemIndex(keys, draggedKey);
  return index === null ? null : { index };
}

/**
 * The drop target for a pointer at main-axis coordinate `pos`, given the items
 * **currently in flow** — the dragged item is lifted out, so `items` already
 * excludes it and the count of items whose midpoint sits before `pos` is the
 * removed-item index directly (no adjustment for the dragged item's own slot).
 */
export function liftedDropTarget(
  items: MeasuredSortableItem[],
  orientation: SortableOrientation,
  pos: number,
): SortableDropTarget {
  const ranges = items
    .map((item) => axisRange(item, orientation))
    .sort((a, b) => a.start - b.start);
  let index = ranges.length;
  for (let i = 0; i < ranges.length; i += 1) {
    const middle = (ranges[i].start + ranges[i].end) / 2;
    if (pos < middle) {
      index = i;
      break;
    }
  }
  return { index };
}

/**
 * Map an arrow key to a step direction for the orientation: `-1` toward the
 * start, `+1` toward the end, or `null` for a key off this axis / unhandled.
 * Vertical reads Up/Down; horizontal reads Left/Right.
 */
export function arrowDelta(
  key: string,
  orientation: SortableOrientation,
): -1 | 1 | null {
  if (orientation === "horizontal") {
    if (key === "ArrowLeft") return -1;
    if (key === "ArrowRight") return 1;
    return null;
  }
  if (key === "ArrowUp") return -1;
  if (key === "ArrowDown") return 1;
  return null;
}

/** Step the target by an arrow `delta` (removed-item semantics), clamped to the list. */
export function keyboardDropTarget(
  keys: string[],
  current: SortableDropTarget,
  draggedKey: string,
  delta: -1 | 1,
): SortableDropTarget {
  const max = slotCount(keys, draggedKey);
  const index = Math.min(max, Math.max(0, current.index + delta));
  return { index };
}

/** Convert a target to a committed move, or `null` when it lands the item where it started. */
export function targetToMove(
  keys: string[],
  draggedKey: string,
  target: SortableDropTarget,
): SortableMove | null {
  const fromIndex = findItemIndex(keys, draggedKey);
  if (fromIndex === null || target.index === fromIndex) {
    return null;
  }
  return { fromIndex, key: draggedKey, toIndex: target.index };
}

/**
 * The flow slot at which to render the preview during a **keyboard** drag, where
 * the grabbed item stays in place (dimmed, still focusable). Counting that item,
 * a removed-semantics `target` at or past its origin sits one slot later.
 */
export function indicatorIndex(
  fromIndex: number,
  target: SortableDropTarget,
): number {
  return target.index >= fromIndex ? target.index + 1 : target.index;
}

/** A spoken description of the target slot, e.g. `Position 2 of 4`. */
export function describeTarget(
  keys: string[],
  draggedKey: string,
  target: SortableDropTarget,
): string {
  const total = slotCount(keys, draggedKey) + 1;
  return `Position ${target.index + 1} of ${total}`;
}

/**
 * Apply a {@link SortableMove} to an array — the removed-item splice the
 * `onReorder` contract expects, exported so a consumer never has to re-derive it:
 * lift the moved item out, then insert it before the `toIndex`-th of the
 * remaining items. Returns the input unchanged if the key is not found.
 */
export function applySortableMove<Item>(
  items: Item[],
  move: SortableMove,
  itemKey: (item: Item, index: number) => string,
): Item[] {
  let moved: Item | undefined;
  const without: Item[] = [];
  items.forEach((item, index) => {
    if (moved === undefined && itemKey(item, index) === move.key) {
      moved = item;
    } else {
      without.push(item);
    }
  });
  if (moved === undefined) {
    return items;
  }
  without.splice(move.toIndex, 0, moved);
  return without;
}
