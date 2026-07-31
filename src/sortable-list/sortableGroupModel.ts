/**
 * Pure geometry and bookkeeping for dragging an item **between** sortable
 * lists, kept free of React and React Native so it can be unit-tested directly.
 * This generalises {@link ./sortableListModel} from one flow to N independent
 * flows: each group owns its ordered keys and its own axis, so a target is a
 * `{ groupId, index }` pair and the group's own orientation picks which rect
 * coordinate the drop scan reads.
 *
 * Indices keep the single-list **removed-item semantics**: a target's `index`
 * is the insertion position in the destination group's list *with the dragged
 * item taken out*. While a pointer drag is in flight the item is lifted out of
 * its source group, so the items that remain in flow already exclude it.
 *
 * Unlike the Kanban model — whose geometry assumes columns laid out across the
 * x-axis — a group is hit-tested by full-rect containment with a nearest-rect
 * fallback, so the same code serves a vertical stack of sections, a horizontal
 * row of lists, or a grid of them.
 */
import {
  liftedDropTarget,
  type MeasuredSortableItem,
  type SortableOrientation,
} from "./sortableListModel";

/** A group's ordered item keys and the axis it flows along. */
export type SortableGroupLayout = {
  groupId: string;
  keys: string[];
  orientation: SortableOrientation;
};

/** A group container measured for pointer hit-testing (web only). */
export type MeasuredSortableGroup = {
  bottom: number;
  groupId: string;
  left: number;
  right: number;
  top: number;
};

/**
 * The committed cross-list move handed to the coordinator's `onMove`. Both
 * group ids are always present — a move within one group simply reports the
 * same id twice, so a consumer has a single shape to apply.
 */
export type SortableGroupMove = {
  key: string;
  fromGroupId: string;
  fromIndex: number;
  toGroupId: string;
  toIndex: number;
};

/** A rendered item measured for pointer hit-testing, tagged with its group. */
export type MeasuredGroupItem = MeasuredSortableItem & { groupId: string };

/** An insertion point: before the `index`-th item of `groupId`, dragged item removed. */
export type SortableGroupTarget = { groupId: string; index: number };

/** An item's origin position in the layout. */
export type SortableGroupOrigin = { groupId: string; index: number };

/** How far `(x, y)` sits outside a rect — zero on both axes when inside it. */
function edgeDistance(
  group: MeasuredSortableGroup,
  x: number,
  y: number,
): number {
  const dx = Math.max(group.left - x, 0, x - group.right);
  const dy = Math.max(group.top - y, 0, y - group.bottom);
  return Math.hypot(dx, dy);
}

/**
 * The group whose rect contains `(x, y)`, else the nearest one by edge
 * distance — so a pointer in the gutter between two groups, or dragged past
 * the ends of the whole set, still targets one. Measuring the full rect rather
 * than a single axis is what lets one coordinator serve a vertical stack of
 * lists, a horizontal row of them, or a grid.
 */
export function groupAt(
  groups: MeasuredSortableGroup[],
  x: number,
  y: number,
): string | null {
  let best: MeasuredSortableGroup | null = null;
  let bestDistance = Infinity;
  for (const group of groups) {
    const distance = edgeDistance(group, x, y);
    if (distance === 0) {
      return group.groupId;
    }
    if (distance < bestDistance) {
      bestDistance = distance;
      best = group;
    }
  }
  return best?.groupId ?? null;
}

/**
 * The drop target for a pointer at `(x, y)`: the group it is over (or nearest
 * to), then the insertion slot within that group. `items` are the ones
 * **currently in flow** — the dragged item is lifted out, so they already
 * exclude it and the scan yields a removed-item index directly. Each group is
 * scanned on its own `orientation`, so a horizontal list and a vertical one can
 * share a coordinator.
 */
export function liftedGroupDropTarget(
  layout: SortableGroupLayout[],
  groups: MeasuredSortableGroup[],
  items: MeasuredGroupItem[],
  x: number,
  y: number,
): SortableGroupTarget | null {
  const groupId = groupAt(groups, x, y);
  if (groupId === null) {
    return null;
  }
  const group = layout.find((entry) => entry.groupId === groupId);
  if (!group) {
    return null;
  }
  const inGroup = items.filter((item) => item.groupId === groupId);
  const pos = group.orientation === "horizontal" ? x : y;
  const { index } = liftedDropTarget(inGroup, group.orientation, pos);
  return { groupId, index };
}

/** Insertion slots in a group once the dragged item is removed from it. */
function slotCount(
  layout: SortableGroupLayout[],
  groupId: string,
  draggedKey: string,
): number {
  const group = layout.find((entry) => entry.groupId === groupId);
  if (!group) {
    return 0;
  }
  return group.keys.filter((key) => key !== draggedKey).length;
}

/**
 * A spoken description of the target slot: the item, then its destination
 * group, then the slot — each part dropped when it has no name. So a lone
 * unnamed list still reads `Position 2 of 4`, a named group reads
 * `Workspace, position 2 of 4`, and both together read
 * `Todo, Workspace, position 2 of 4`. Only the leading part is capitalised, so
 * a group's own name is never case-mangled.
 */
export function describeGroupTarget(
  layout: SortableGroupLayout[],
  draggedKey: string,
  target: SortableGroupTarget,
  groupLabel: (groupId: string) => string | undefined,
  itemName?: string,
): string {
  const total = slotCount(layout, target.groupId, draggedKey) + 1;
  const parts = [itemName, groupLabel(target.groupId)].filter(
    (part): part is string => Boolean(part),
  );
  const position = `position ${target.index + 1} of ${total}`;
  if (parts.length === 0) {
    return `${position[0].toUpperCase()}${position.slice(1)}`;
  }
  return [...parts, position].join(", ");
}

/**
 * The flow slot at which to render the preview during a **keyboard** drag,
 * where the grabbed item stays in place (dimmed, still focusable). Counting
 * that item, a removed-semantics `target` at or past its origin sits one slot
 * later — but only in the group the item actually occupies.
 */
export function groupIndicatorIndex(
  origin: SortableGroupOrigin,
  target: SortableGroupTarget,
): number {
  if (target.groupId === origin.groupId && target.index >= origin.index) {
    return target.index + 1;
  }
  return target.index;
}

/** The starting target when a drag begins: the item's own slot in its own group. */
export function initialGroupTarget(
  layout: SortableGroupLayout[],
  draggedKey: string,
): SortableGroupTarget | null {
  return findGroupOrigin(layout, draggedKey);
}

/**
 * Convert a target to a committed move, or `null` when it lands the item back
 * on its own slot. Only the origin group's own index is a no-op: the same index
 * in a *different* group is a real move.
 */
export function groupTargetToMove(
  layout: SortableGroupLayout[],
  draggedKey: string,
  target: SortableGroupTarget,
): SortableGroupMove | null {
  const from = findGroupOrigin(layout, draggedKey);
  if (!from) {
    return null;
  }
  if (target.groupId === from.groupId && target.index === from.index) {
    return null;
  }
  return {
    fromGroupId: from.groupId,
    fromIndex: from.index,
    key: draggedKey,
    toGroupId: target.groupId,
    toIndex: target.index,
  };
}

/** Locate an item across every group, returning its group and index, or `null`. */
export function findGroupOrigin(
  layout: SortableGroupLayout[],
  key: string,
): SortableGroupOrigin | null {
  for (const group of layout) {
    const index = group.keys.indexOf(key);
    if (index >= 0) {
      return { groupId: group.groupId, index };
    }
  }
  return null;
}
