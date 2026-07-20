/**
 * Web drag-and-drop for a {@link SortableList}. Rows reorder within one list on a
 * chosen axis by pointer (mouse / pen) or keyboard (Space to grab, arrow keys to
 * move, Home / End to jump to the ends, Space / Enter to drop, Escape to cancel)
 * — the resulting move is handed to `onReorder`, which the consumer applies to
 * its own data (the list is controlled; the drag never mutates the items).
 *
 * The dragged row is lifted out of the flow: a translucent clone follows the
 * pointer (positioned by mutating the clone node directly, so a move does not
 * re-render the list) and a translucent preview marks the target slot. Because
 * the row is out of the flow, the remaining rows are measured **live** on each
 * move to read the drop position.
 *
 * Like the kanban board's card drag, the pointer drag starts from a
 * **capture-phase** `pointerdown` on the document (RNW's `Pressable` calls
 * `stopPropagation()` in its press responder). A small move threshold separates a
 * drag from a click, and a committed drag swallows the click it produces. In
 * handle mode the drag only starts when the pointer goes down on a row's grab
 * handle; otherwise the whole row is the drag surface. Horizontal reordering
 * assumes left-to-right reading order. All DOM work is guarded by
 * `typeof document`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { announce } from "../announcer";

import {
  itemKeyAt,
  measureHandles,
  measureItems,
  type ListNode,
} from "./sortableListDom";
import {
  arrowDelta,
  describeTarget,
  initialDropTarget,
  keyboardDropTarget,
  liftedDropTarget,
  targetToMove,
  type SortableDragState,
  type SortableDropTarget,
} from "./sortableListModel";
import {
  HANDLE_TESTID_PREFIX,
  ITEM_TESTID_PREFIX,
  type SortableDragOptions,
  type SortableItemBinding,
  type SortableKeyEvent,
  type UseSortableListDrag,
} from "./sortableListTypes";

/** Pixels the pointer must travel before a press becomes a drag (vs. a click). */
const DRAG_THRESHOLD = 5;

const IDLE: SortableDragState = {
  active: false,
  draggedKey: null,
  ghostHeight: null,
  ghostWidth: null,
  mode: null,
  target: null,
};

/** An in-flight pointer drag. */
type PointerSession = {
  draggedKey: string;
  grabOffsetX: number;
  grabOffsetY: number;
  lastTarget: SortableDropTarget | null;
  moved: boolean;
  startX: number;
  startY: number;
  /** Whether the grabbed row/handle held focus when picked up, so focus can be restored. */
  wasFocused: boolean;
  x: number;
  y: number;
};

/** The minimal DOM surface of the floating clone node we position. */
type GhostNode = { style?: { transform: string } } | null;

export function useSortableListDrag(
  options: SortableDragOptions,
): UseSortableListDrag {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const listRef = useRef<ListNode>(null);
  const ghostRef = useRef<GhostNode>(null);
  const ghostWidthRef = useRef<number | null>(null);
  const ghostHeightRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerSession | null>(null);
  const keyboardRef = useRef<{
    draggedKey: string;
    target: SortableDropTarget;
  } | null>(null);
  const removeMoveRef = useRef<(() => void) | null>(null);
  const focusNodesRef = useRef(new Map<string, { focus?: () => void }>());
  const [dragState, setDragState] = useState<SortableDragState>(IDLE);

  /** The pointer coordinate along the flow axis. */
  const axisPos = useCallback((x: number, y: number) => {
    return optionsRef.current.orientation === "horizontal" ? x : y;
  }, []);

  /** An item's accessible name for announcements, if the list supplied one. */
  const nameOf = useCallback(
    (key: string) => optionsRef.current.label?.(key),
    [],
  );

  const describe = useCallback(
    (key: string, target: SortableDropTarget) => {
      const pos = describeTarget(optionsRef.current.keys, key, target);
      const name = nameOf(key);
      return name ? `${name}, ${pos.toLowerCase()}` : pos;
    },
    [nameOf],
  );

  // Position the floating clone under the cursor by mutating its transform
  // directly — the list never re-renders as the pointer moves.
  const positionGhost = useCallback(() => {
    const node = ghostRef.current;
    const session = pointerRef.current;
    if (!node?.style || !session) {
      return;
    }
    const tx = session.x - session.grabOffsetX;
    const ty = session.y - session.grabOffsetY;
    node.style.transform = `translate(${tx}px, ${ty}px)`;
  }, []);

  // After a keyboard move the focused row/handle re-renders in place (same key,
  // new node), so focus is restored once that node has registered. The DOM
  // fallback keeps focus even when the consumer applies the move asynchronously.
  const restoreFocus = useCallback((key: string) => {
    if (typeof requestAnimationFrame !== "function") {
      return;
    }
    requestAnimationFrame(() => {
      const registered = focusNodesRef.current.get(key);
      if (registered?.focus) {
        registered.focus();
        return;
      }
      if (typeof document !== "undefined") {
        const prefix = optionsRef.current.handle
          ? HANDLE_TESTID_PREFIX
          : ITEM_TESTID_PREFIX;
        const node = document.querySelector(
          `[data-testid="${prefix}${key}"]`,
        ) as { focus?: () => void } | null;
        node?.focus?.();
      }
    });
  }, []);

  // Swallow the click a committed drag produces, so a drag-release does not
  // activate whatever sits under the pointer. The click fires synchronously
  // after pointerup, before the next frame, so a one-shot capture listener eats
  // exactly it and is removed on the next frame.
  const suppressNextClick = useCallback(() => {
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
  }, []);

  // Abandon any in-progress keyboard grab — when the window loses focus, or when
  // a pointer interaction supersedes it.
  const cancelKeyboard = useCallback(() => {
    if (!keyboardRef.current) {
      return;
    }
    keyboardRef.current = null;
    setDragState(IDLE);
    announce("Reorder cancelled.");
  }, []);

  const finishPointer = useCallback(
    (commit: boolean) => {
      removeMoveRef.current?.();
      removeMoveRef.current = null;
      const session = pointerRef.current;
      pointerRef.current = null;
      if (!session || !session.moved) {
        return; // A plain click: leave whatever is under the pointer to fire.
      }
      setDragState(IDLE);
      suppressNextClick();
      if (session.wasFocused) {
        restoreFocus(session.draggedKey);
      }
      if (!commit || !session.lastTarget) {
        return;
      }
      const move = targetToMove(
        optionsRef.current.keys,
        session.draggedKey,
        session.lastTarget,
      );
      if (move) {
        optionsRef.current.onReorder?.(move);
        announce(
          `Dropped. ${describe(session.draggedKey, session.lastTarget)}.`,
        );
      }
    },
    [describe, restoreFocus, suppressNextClick],
  );

  const attachMove = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const onMove = (event: PointerEvent) => {
      const session = pointerRef.current;
      if (!session) {
        return;
      }
      session.x = event.clientX;
      session.y = event.clientY;
      const { keys, orientation } = optionsRef.current;
      if (!session.moved) {
        const travelled = Math.hypot(
          event.clientX - session.startX,
          event.clientY - session.startY,
        );
        if (travelled <= DRAG_THRESHOLD) {
          return;
        }
        session.moved = true;
        setDragState({
          active: true,
          draggedKey: session.draggedKey,
          ghostHeight: ghostHeightRef.current,
          ghostWidth: ghostWidthRef.current,
          mode: "pointer",
          target: initialDropTarget(keys, session.draggedKey) ?? { index: 0 },
        });
      }
      event.preventDefault();
      positionGhost();
      // Measure the rows in flow, excluding the dragged row — which may still be
      // in the DOM on the activation frame before React lifts it out — so the
      // count is a removed-row index directly.
      const inFlow = measureItems(listRef.current).filter(
        (item) => item.key !== session.draggedKey,
      );
      const target = liftedDropTarget(
        inFlow,
        orientation,
        axisPos(event.clientX, event.clientY),
      );
      if (session.lastTarget?.index !== target.index) {
        session.lastTarget = target;
        // No per-move announce: the live preview is the feedback, and a
        // slot-by-slot narration as the pointer sweeps would flood the region.
        setDragState((state) => ({ ...state, target }));
      } else {
        session.lastTarget = target;
      }
    };
    const onUp = () => finishPointer(true);
    const onCancel = () => finishPointer(false);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onCancel, true);
    // Non-capture: only a real window blur (alt-tab) cancels, not the element
    // blur that fires as focus shifts between rows.
    window.addEventListener("blur", onCancel);
    removeMoveRef.current = () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("blur", onCancel);
    };
  }, [axisPos, finishPointer, positionGhost]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const onPointerDown = (event: PointerEvent) => {
      // A pointer interaction supersedes any keyboard grab.
      cancelKeyboard();
      if (!optionsRef.current.enabled || event.button !== 0) {
        return;
      }
      if (event.pointerType === "touch") {
        return; // touch reordering would fight scroll; a documented follow-up.
      }
      const container = listRef.current;
      if (!container?.contains?.(event.target)) {
        return;
      }
      // The drag starts on a handle (handle mode) or anywhere on the row; both
      // hit tests only see draggable rows (disabled rows register no focusable
      // node), so a disabled row is never a drag start.
      const grabbable = optionsRef.current.handle
        ? measureHandles(container)
        : measureItems(container);
      const draggedKey = itemKeyAt(grabbable, event.clientX, event.clientY);
      if (!draggedKey || !focusNodesRef.current.has(draggedKey)) {
        return;
      }
      const row = measureItems(container).find(
        (item) => item.key === draggedKey,
      );
      if (!row) {
        return;
      }
      // Grab-relative offsets keep the clone pinned to the cursor at the exact
      // point it was picked up; the size matches the real row.
      pointerRef.current = {
        draggedKey,
        grabOffsetX: event.clientX - row.left,
        grabOffsetY: event.clientY - row.top,
        lastTarget: null,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        wasFocused:
          (focusNodesRef.current.get(draggedKey) as unknown) ===
          document.activeElement,
        x: event.clientX,
        y: event.clientY,
      };
      ghostWidthRef.current = row.right - row.left;
      ghostHeightRef.current = row.bottom - row.top;
      attachMove();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("blur", cancelKeyboard);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("blur", cancelKeyboard);
      removeMoveRef.current?.();
    };
  }, [attachMove, cancelKeyboard]);

  const handleKeyDown = useCallback(
    (key: string, event: SortableKeyEvent) => {
      const eventKey = event.nativeEvent?.key ?? event.key;
      if (!eventKey) {
        return;
      }
      const { keys, onReorder, orientation } = optionsRef.current;
      const grabbed = keyboardRef.current;
      const stop = () => {
        event.preventDefault?.();
        event.stopPropagation?.();
      };

      if (!grabbed) {
        if (eventKey !== " " && eventKey !== "Spacebar") {
          return; // only Space grabs; Enter is free for row content.
        }
        const start = initialDropTarget(keys, key);
        if (!start) {
          return;
        }
        stop();
        keyboardRef.current = { draggedKey: key, target: start };
        setDragState({
          active: true,
          draggedKey: key,
          ghostHeight: null,
          ghostWidth: null,
          mode: "keyboard",
          target: start,
        });
        announce(
          `Grabbed ${nameOf(key) ?? "item"}. ${describeTarget(keys, key, start)}. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.`,
        );
        return;
      }
      if (grabbed.draggedKey !== key) {
        return;
      }
      if (eventKey.startsWith("Arrow")) {
        stop(); // hold every arrow while grabbed so the page never scrolls.
        const delta = arrowDelta(eventKey, orientation);
        if (delta === null) {
          return;
        }
        const next = keyboardDropTarget(keys, grabbed.target, key, delta);
        keyboardRef.current = { draggedKey: key, target: next };
        setDragState((state) => ({ ...state, target: next }));
        announce(describe(key, next));
        return;
      }
      if (eventKey === "Home" || eventKey === "End") {
        stop();
        const max = keys.filter((k) => k !== key).length;
        const next = { index: eventKey === "Home" ? 0 : max };
        keyboardRef.current = { draggedKey: key, target: next };
        setDragState((state) => ({ ...state, target: next }));
        announce(describe(key, next));
        return;
      }
      if (eventKey === " " || eventKey === "Spacebar" || eventKey === "Enter") {
        stop();
        const move = targetToMove(keys, key, grabbed.target);
        keyboardRef.current = null;
        setDragState(IDLE);
        if (move) {
          onReorder?.(move);
          announce(`Dropped. ${describe(key, grabbed.target)}.`);
        } else {
          announce("Item kept its position.");
        }
        restoreFocus(key);
        return;
      }
      if (eventKey === "Escape") {
        stop();
        keyboardRef.current = null;
        setDragState(IDLE);
        announce("Reorder cancelled.");
        restoreFocus(key);
      }
    },
    [describe, nameOf, restoreFocus],
  );

  const itemBinding = useCallback(
    (key: string): SortableItemBinding | null => {
      if (!optionsRef.current.enabled) {
        return null;
      }
      return {
        grabbed: keyboardRef.current?.draggedKey === key,
        handleTestID: `${HANDLE_TESTID_PREFIX}${key}`,
        onKeyDown: (event) => handleKeyDown(key, event),
        registerRef: (node) => {
          if (node) {
            focusNodesRef.current.set(key, node as { focus?: () => void });
          } else {
            focusNodesRef.current.delete(key);
          }
        },
      };
    },
    [handleKeyDown],
  );

  const bindList = useMemo(
    () => ({
      ref: (node: unknown) => {
        listRef.current = (node as ListNode) ?? null;
      },
    }),
    [],
  );

  const bindGhost = useMemo(
    () => ({
      ref: (node: unknown) => {
        ghostRef.current = (node as GhostNode) ?? null;
        positionGhost();
      },
    }),
    [positionGhost],
  );

  return { bindGhost, bindList, dragState, itemBinding };
}
