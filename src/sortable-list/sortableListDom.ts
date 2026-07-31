/**
 * DOM measuring for the web {@link SortableList} drag (`useSortableListDrag.web.ts`).
 * Rows and their grab handles carry their item key in a `data-testid`, so a drag
 * can find the grabbed item and the live drop target by hit-testing their rects.
 * Only the web hook imports this; on native the drag hook is an inert no-op, so
 * this code never runs there.
 */
import type {
  MeasuredGroupItem,
  MeasuredSortableGroup,
} from "./sortableGroupModel";
import type { MeasuredSortableItem } from "./sortableListModel";
import { HANDLE_TESTID_PREFIX, ITEM_TESTID_PREFIX } from "./sortableListTypes";

/** The minimal DOM surface of the list container we touch. */
export type ListNode = {
  contains?: (other: unknown) => boolean;
  getBoundingClientRect?: () => DOMRect;
  querySelectorAll?: (selector: string) => ArrayLike<ElementNode>;
} | null;

/** One participating list: the group it stands for, and its container node. */
export type GroupNode = { groupId: string; node: ListNode };

/** The minimal DOM surface of a measured row / handle node. */
type ElementNode = {
  getAttribute: (name: string) => string | null;
  getBoundingClientRect: () => DOMRect;
};

function queryAll(container: ListNode, prefix: string): ElementNode[] {
  const nodes = container?.querySelectorAll?.(`[data-testid^="${prefix}"]`);
  const out: ElementNode[] = [];
  for (let i = 0; nodes && i < nodes.length; i += 1) {
    out.push(nodes[i]);
  }
  return out;
}

/** Measure every node with `prefix`, keyed by the `data-testid` remainder. */
function measureByPrefix(
  container: ListNode,
  prefix: string,
): MeasuredSortableItem[] {
  return queryAll(container, prefix).map((node) => {
    const rect = node.getBoundingClientRect();
    return {
      bottom: rect.bottom,
      key: (node.getAttribute("data-testid") ?? "").slice(prefix.length),
      left: rect.left,
      right: rect.right,
      top: rect.top,
    };
  });
}

/** Measure every row's rect, keyed by item key. */
export function measureItems(container: ListNode): MeasuredSortableItem[] {
  return measureByPrefix(container, ITEM_TESTID_PREFIX);
}

/** Measure every grab handle's rect, keyed by item key (handle-mode drag start). */
export function measureHandles(container: ListNode): MeasuredSortableItem[] {
  return measureByPrefix(container, HANDLE_TESTID_PREFIX);
}

/**
 * Measure each group container's own rect, for the pointer hit test that picks
 * which list a drag is over. A group whose node has not been laid out (never
 * mounted, or unmounted mid-drag) is skipped rather than measured as a zero
 * rect at the origin, which would sit nearer the pointer than the real lists.
 */
export function measureGroupRects(
  groups: GroupNode[],
): MeasuredSortableGroup[] {
  const out: MeasuredSortableGroup[] = [];
  for (const group of groups) {
    const rect = group.node?.getBoundingClientRect?.();
    if (!rect) {
      continue;
    }
    out.push({
      bottom: rect.bottom,
      groupId: group.groupId,
      left: rect.left,
      right: rect.right,
      top: rect.top,
    });
  }
  return out;
}

/**
 * Measure every row across every group, tagged with the group it belongs to.
 * Measuring per container is what keeps the tagging correct, so a row is always
 * attributed to the list that actually renders it.
 */
export function measureGroupItems(groups: GroupNode[]): MeasuredGroupItem[] {
  return groups.flatMap((group) =>
    measureItems(group.node).map((item) => ({
      ...item,
      groupId: group.groupId,
    })),
  );
}

/** The key of the node whose rect contains `(x, y)`, or `null` — the drag-start hit test. */
export function itemKeyAt(
  measured: MeasuredSortableItem[],
  x: number,
  y: number,
): string | null {
  for (const item of measured) {
    if (
      x >= item.left &&
      x <= item.right &&
      y >= item.top &&
      y <= item.bottom
    ) {
      return item.key;
    }
  }
  return null;
}
