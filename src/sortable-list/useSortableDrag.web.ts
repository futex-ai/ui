/**
 * The web drag engine behind every sortable list. It reasons about **N groups**
 * — one per participating list — so the same code drives a lone
 * {@link SortableList} (a single implicit group) and a set of lists exchanging
 * items through a coordinator. Items reorder by pointer (mouse / pen) or
 * keyboard (Space to grab, arrow keys to move, Home / End to jump to the ends,
 * Space / Enter to drop, Escape to cancel), and each committed move is handed
 * to `onMove` for the consumer to apply — the lists stay controlled and the
 * drag never mutates their items.
 *
 * The dragged row is lifted out of the flow: a translucent clone follows the
 * pointer (positioned by mutating the clone node directly, so a move does not
 * re-render anything) and a translucent preview marks the target slot. Because
 * the row is out of the flow, the remaining rows are measured **live** on each
 * move to read the drop position.
 *
 * Like the kanban board's card drag, the pointer drag starts from a
 * **capture-phase** `pointerdown` on the document (RNW's `Pressable` calls
 * `stopPropagation()` in its press responder). A small move threshold separates
 * a drag from a click, and a committed drag swallows the click it produces. In
 * handle mode — which is per group, so lists in one coordinator can differ — the
 * drag only starts when the pointer goes down on a row's grab handle; otherwise
 * the whole row is the drag surface. Horizontal lists assume left-to-right
 * reading order. All DOM work is guarded by `typeof document`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { announce } from "../announcer";

import { suppressNextClick, useSortableFocusNodes } from "./sortableDragFocus";
import {
  acceptableGroupTarget,
  describeGroupTarget,
  findGroupOrigin,
  groupTargetToMove,
  initialGroupTarget,
  liftedGroupDropTarget,
  type SortableGroupFlow,
  type SortableGroupLayout,
  type SortableGroupMove,
  type SortableGroupTarget,
} from "./sortableGroupModel";
import {
  itemKeyAt,
  measureGroupItems,
  measureGroupRects,
  measureHandles,
  measureItems,
  type GroupNode,
  type ListNode,
} from "./sortableListDom";
import type {
  SortableDragMode,
  SortableOrientation,
} from "./sortableListModel";
import {
  HANDLE_TESTID_PREFIX,
  ITEM_TESTID_PREFIX,
  type SortableItemBinding,
  type SortableKeyEvent,
} from "./sortableListTypes";
import type {
  SortableDragEngineOptions,
  SortableDragGroup,
  SortableGroupDragState,
  UseSortableDrag,
} from "./sortableDragTypes";

/** Pixels the pointer must travel before a press becomes a drag (vs. a click). */
const DRAG_THRESHOLD = 5;

const IDLE: SortableGroupDragState = {
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
  lastTarget: SortableGroupTarget | null;
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

export function useSortableDrag(
  options: SortableDragEngineOptions,
): UseSortableDrag {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const nodesRef = useRef(new Map<string, ListNode>());
  const bindsRef = useRef(new Map<string, { ref: (node: unknown) => void }>());
  const ghostRef = useRef<GhostNode>(null);
  const ghostWidthRef = useRef<number | null>(null);
  const ghostHeightRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerSession | null>(null);
  const keyboardRef = useRef<{
    draggedKey: string;
    /** The visual group order snapshotted when this grab began. */
    layout: SortableGroupLayout[];
    target: SortableGroupTarget;
  } | null>(null);
  const removeMoveRef = useRef<(() => void) | null>(null);
  const [dragState, setDragState] = useState<SortableGroupDragState>(IDLE);

  /** The group an item belongs to, or `undefined` when it is not in any. */
  const groupOf = useCallback((key: string) => {
    const origin = findGroupOrigin(optionsRef.current.groups(), key);
    return optionsRef.current
      .groups()
      .find((group) => group.groupId === origin?.groupId);
  }, []);

  // The focusable node per item is its row, or its grab handle in handle mode —
  // and handle mode is a per-group choice.
  const focusNodes = useSortableFocusNodes(
    useCallback(
      (key: string) =>
        `${groupOf(key)?.handle ? HANDLE_TESTID_PREFIX : ITEM_TESTID_PREFIX}${key}`,
      [groupOf],
    ),
  );
  const restoreFocus = focusNodes.restore;

  /** Every registered list paired with its live container node. */
  const groupNodes = useCallback(
    (): GroupNode[] =>
      optionsRef.current.groups().map((group) => ({
        groupId: group.groupId,
        node: nodesRef.current.get(group.groupId) ?? null,
      })),
    [],
  );

  /** A group's accessible name, for the announcements. */
  const groupLabel = useCallback(
    (groupId: string) =>
      optionsRef.current.groups().find((group) => group.groupId === groupId)
        ?.label,
    [],
  );

  /**
   * Whether the consumer will take this destination. A target that would not
   * move the item at all — its own slot — is always allowed, so a drag can
   * always return home even when everything else is barred.
   */
  const accepts = useCallback(
    (draggedKey: string, target: SortableGroupTarget) => {
      const move = groupTargetToMove(
        optionsRef.current.groups(),
        draggedKey,
        target,
      );
      return move === null || (optionsRef.current.canDrop?.(move) ?? true);
    },
    [],
  );

  const describe = useCallback(
    (key: string, target: SortableGroupTarget, withItemName: boolean) =>
      describeGroupTarget(
        optionsRef.current.groups(),
        key,
        target,
        groupLabel,
        withItemName ? optionsRef.current.label?.(key) : undefined,
      ),
    [groupLabel],
  );

  // Position the floating clone under the cursor by mutating its transform
  // directly — nothing re-renders as the pointer moves.
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
      const move = groupTargetToMove(
        optionsRef.current.groups(),
        session.draggedKey,
        session.lastTarget,
      );
      if (move) {
        optionsRef.current.onMove?.(move);
        announce(
          `Dropped. ${describe(session.draggedKey, session.lastTarget, true)}.`,
        );
      }
    },
    [describe, restoreFocus],
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
      const groups = optionsRef.current.groups();
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
          target: initialGroupTarget(groups, session.draggedKey),
        });
      }
      event.preventDefault();
      positionGhost();
      // Measure the rows in flow, excluding the dragged row — which may still be
      // in the DOM on the activation frame before React lifts it out — so the
      // count is a removed-row index directly.
      const nodes = groupNodes();
      const inFlow = measureGroupItems(nodes).filter(
        (item) => item.key !== session.draggedKey,
      );
      const target = liftedGroupDropTarget(
        groups,
        measureGroupRects(nodes),
        inFlow,
        event.clientX,
        event.clientY,
      );
      if (!target) {
        return;
      }
      if (!accepts(session.draggedKey, target)) {
        return; // hold the preview at the last slot the consumer accepted.
      }
      const previous = session.lastTarget;
      session.lastTarget = target;
      if (
        previous?.groupId !== target.groupId ||
        previous?.index !== target.index
      ) {
        setDragState((state) => ({ ...state, target }));
        // Announce on a group change only: the live preview is the feedback for
        // slot-to-slot movement, and narrating every slot as the pointer sweeps
        // would flood the region.
        if (previous?.groupId !== target.groupId && previous) {
          announce(describe(session.draggedKey, target, false));
        }
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
  }, [accepts, describe, finishPointer, groupNodes, positionGhost]);

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
      // The drag starts inside whichever list the pointer went down on.
      const nodes = groupNodes();
      const hit = nodes.find((entry) => entry.node?.contains?.(event.target));
      const group = optionsRef.current
        .groups()
        .find((entry) => entry.groupId === hit?.groupId);
      if (!hit?.node || !group) {
        return;
      }
      // The drag starts on a handle (handle mode) or anywhere on the row; both
      // hit tests only see draggable rows (disabled rows register no focusable
      // node), so a disabled row is never a drag start.
      const grabbable = group.handle
        ? measureHandles(hit.node)
        : measureItems(hit.node);
      const draggedKey = itemKeyAt(grabbable, event.clientX, event.clientY);
      if (!draggedKey || !focusNodes.has(draggedKey)) {
        return;
      }
      const row = measureItems(hit.node).find(
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
        wasFocused: focusNodes.isActive(draggedKey),
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
  }, [attachMove, cancelKeyboard, focusNodes, groupNodes]);

  /**
   * The groups in visual order along `groupFlow`, which is what makes "the next
   * group" mean the one actually below (or to the right of) this one. Taken
   * once per keyboard grab: the arrangement cannot change mid-grab, and it
   * keeps arrow keys off the measuring path. Groups that are not laid out keep
   * their registration order, since `sort` is stable.
   */
  const orderedGroups = useCallback((): SortableDragGroup[] => {
    const flow = optionsRef.current.groupFlow ?? "vertical";
    const rects = new Map(
      measureGroupRects(groupNodes()).map((rect) => [rect.groupId, rect]),
    );
    return [...optionsRef.current.groups()].sort((a, b) => {
      const first = rects.get(a.groupId);
      const second = rects.get(b.groupId);
      if (!first || !second) {
        return 0;
      }
      return flow === "horizontal"
        ? first.left - second.left
        : first.top - second.top;
    });
  }, [groupNodes]);

  const handleKeyDown = useCallback(
    (key: string, event: SortableKeyEvent) => {
      const eventKey = event.nativeEvent?.key ?? event.key;
      if (!eventKey) {
        return;
      }
      const { label, onMove } = optionsRef.current;
      const groups = optionsRef.current.groups();
      const grabbed = keyboardRef.current;
      const stop = () => {
        event.preventDefault?.();
        event.stopPropagation?.();
      };

      if (!grabbed) {
        if (eventKey !== " " && eventKey !== "Spacebar") {
          return; // only Space grabs; Enter is free for row content.
        }
        const start = initialGroupTarget(groups, key);
        if (!start) {
          return;
        }
        stop();
        keyboardRef.current = {
          draggedKey: key,
          layout: orderedGroups(),
          target: start,
        };
        setDragState({
          active: true,
          draggedKey: key,
          ghostHeight: null,
          ghostWidth: null,
          mode: "keyboard",
          target: start,
        });
        announce(
          `Grabbed ${label?.(key) ?? "item"}. ${describe(key, start, false)}. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.`,
        );
        return;
      }
      if (grabbed.draggedKey !== key) {
        return;
      }
      if (
        eventKey.startsWith("Arrow") ||
        eventKey === "Home" ||
        eventKey === "End"
      ) {
        stop(); // hold every arrow while grabbed so the page never scrolls.
        const next = acceptableGroupTarget(
          grabbed.layout,
          optionsRef.current.groupFlow ?? "vertical",
          grabbed.target,
          key,
          eventKey,
          (target) => accepts(key, target),
        );
        if (!next) {
          return;
        }
        keyboardRef.current = { ...grabbed, target: next };
        setDragState((state) => ({ ...state, target: next }));
        announce(describe(key, next, true));
        return;
      }
      if (eventKey === " " || eventKey === "Spacebar" || eventKey === "Enter") {
        stop();
        const move = groupTargetToMove(groups, key, grabbed.target);
        keyboardRef.current = null;
        setDragState(IDLE);
        if (move) {
          onMove?.(move);
          announce(`Dropped. ${describe(key, grabbed.target, true)}.`);
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
    [accepts, describe, orderedGroups, restoreFocus],
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
        registerRef: (node) => focusNodes.register(key, node),
      };
    },
    [focusNodes, handleKeyDown],
  );

  // One stable ref callback per group, so React does not detach and re-attach
  // the container on every render.
  const bindList = useCallback((groupId: string) => {
    const existing = bindsRef.current.get(groupId);
    if (existing) {
      return existing;
    }
    const bind = {
      ref: (node: unknown) => {
        nodesRef.current.set(groupId, (node as ListNode) ?? null);
      },
    };
    bindsRef.current.set(groupId, bind);
    return bind;
  }, []);

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
