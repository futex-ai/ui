/** Keyboard and commit order for registered drag-select targets. */
import type { DragSelectableTargetRegistration } from "./dragSelectableTypes";

/**
 * Resolves registered, non-disabled target ids in keyboard-navigation order:
 * by DOM document order, with the explicit `order` as the tie-breaker, so
 * arrow keys move through the visible layout. Without a DOM the explicit
 * `order` decides alone.
 */
export function orderedTargetIds(
  targets: ReadonlyMap<string, DragSelectableTargetRegistration>,
): string[] {
  const entries = [...targets.values()].filter((target) => !target.disabled);
  if (typeof document === "undefined" || typeof Node === "undefined") {
    return [...entries]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((target) => target.id);
  }
  return dragSelectableDocumentOrder(entries).map((target) => target.id);
}

/**
 * Sorts registrations by the document position of their nodes, with the
 * explicit `order` as the tie-breaker. Returns a new array.
 */
export function dragSelectableDocumentOrder<
  Target extends Pick<DragSelectableTargetRegistration, "node" | "order">,
>(targets: readonly Target[]): Target[] {
  return [...targets].sort((a, b) => {
    const nodeA = a.node as unknown as Node;
    const nodeB = b.node as unknown as Node;
    const position = nodeA.compareDocumentPosition?.(nodeB);
    if (position && position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    }
    if (position && position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });
}
