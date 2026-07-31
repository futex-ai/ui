/**
 * The post-drag DOM housekeeping shared by every sortable drag: the registry of
 * each item's focusable node, restoring focus to that node once the item has
 * re-rendered in its new slot, and swallowing the click a committed pointer
 * drag produces.
 *
 * It lives apart from the drag engine because none of it reasons about drop
 * targets or geometry — it is bookkeeping the engine needs but does not own.
 * Only the web engine imports this; on native the drag hook is an inert no-op,
 * so this code never runs there. All DOM work is guarded by `typeof document`.
 */
import { useCallback, useMemo, useRef } from "react";

/** The minimal DOM surface of a registered focusable node. */
type FocusableNode = { focus?: () => void };

/** The registry the drag engine drives. */
export type SortableFocusNodes = {
  /** Whether an item has a registered node — i.e. whether it is draggable at all. */
  has: (key: string) => boolean;
  /** Whether the item's registered node currently holds focus. */
  isActive: (key: string) => boolean;
  /** Register the item's focusable node, or clear it when the node unmounts. */
  register: (key: string, node: unknown) => void;
  /** Return focus to the item's node once it has re-rendered in its new slot. */
  restore: (key: string) => void;
};

/**
 * Track each item's focusable node (the row, or its grab handle in handle
 * mode). `testID` is read lazily because the drag engine's handle mode can
 * change between renders, and the DOM fallback needs the prefix in force at the
 * moment focus is restored.
 */
export function useSortableFocusNodes(
  testID: (key: string) => string,
): SortableFocusNodes {
  const nodesRef = useRef(new Map<string, FocusableNode>());
  const testIDRef = useRef(testID);
  testIDRef.current = testID;

  const has = useCallback((key: string) => nodesRef.current.has(key), []);

  const isActive = useCallback((key: string) => {
    if (typeof document === "undefined") {
      return false;
    }
    return (nodesRef.current.get(key) as unknown) === document.activeElement;
  }, []);

  const register = useCallback((key: string, node: unknown) => {
    if (node) {
      nodesRef.current.set(key, node as FocusableNode);
    } else {
      nodesRef.current.delete(key);
    }
  }, []);

  // After a keyboard move the focused row/handle re-renders in place (same key,
  // new node), so focus is restored once that node has registered. The DOM
  // fallback keeps focus even when the consumer applies the move asynchronously
  // and the node has not re-registered by the next frame.
  const restore = useCallback((key: string) => {
    if (typeof requestAnimationFrame !== "function") {
      return;
    }
    requestAnimationFrame(() => {
      const registered = nodesRef.current.get(key);
      if (registered?.focus) {
        registered.focus();
        return;
      }
      if (typeof document !== "undefined") {
        const node = document.querySelector(
          `[data-testid="${testIDRef.current(key)}"]`,
        ) as FocusableNode | null;
        node?.focus?.();
      }
    });
  }, []);

  // Stable across renders, so an effect that hit-tests through the registry can
  // depend on it honestly without re-attaching its document listeners.
  return useMemo(
    () => ({ has, isActive, register, restore }),
    [has, isActive, register, restore],
  );
}

/**
 * Swallow the click a committed drag produces, so a drag-release does not
 * activate whatever sits under the pointer. The click fires synchronously after
 * pointerup, before the next frame, so a one-shot capture listener eats exactly
 * it and is removed on the next frame.
 */
export function suppressNextClick(): void {
  if (typeof document === "undefined") {
    return;
  }
  const eat = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  document.addEventListener("click", eat, true);
  const remove = () => document.removeEventListener("click", eat, true);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(remove);
  } else {
    setTimeout(remove, 0);
  }
}
