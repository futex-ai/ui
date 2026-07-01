/**
 * Web drag-and-drop for Kanban cards. Cards can be dragged between and within
 * columns with the pointer, or moved with the keyboard (Space to grab, arrows to
 * move, Space/Enter to drop, Escape to cancel) — and the resulting move is handed
 * to `onCardMove`, which the consumer applies to its own data (the board is
 * controlled; the drag itself never mutates the cards).
 *
 * The dragged card is lifted out of its column: a translucent clone follows the
 * pointer (positioned by mutating the clone node directly, so a move does not
 * re-render the board) and a translucent preview marks the target slot. Because
 * the card is out of the flow, the remaining cards are measured **live** on each
 * move to read the drop position.
 *
 * Like the calendar's drag-to-create, the pointer drag starts from a
 * **capture-phase** `pointerdown` on the document (RNW's `Pressable` calls
 * `stopPropagation()` in its press responder). A small move threshold separates a
 * drag from a click, and a committed drag (pointer or keyboard) sets a
 * suppression flag so the card's own `onPress` is swallowed once. All DOM work is
 * guarded by `typeof document`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { announce } from "../announcer";

import {
  cardKeyAt,
  measureCards,
  measureColumns,
  type BoardNode,
} from "./kanbanDragDom";
import {
  CARD_TESTID_PREFIX,
  describeTarget,
  findCardOrigin,
  initialDropTarget,
  keyboardDropTarget,
  liftedDropTarget,
  targetToMove,
  type KanbanCardDragBinding,
  type KanbanCardKeyEvent,
  type KanbanDragOptions,
  type KanbanDragState,
  type KanbanDropTarget,
  type UseKanbanCardDrag,
} from "./kanbanDragModel";

/** Pixels the pointer must travel before a press becomes a drag (vs. a click). */
const DRAG_THRESHOLD = 5;
/** The clone's tilt while it rides the cursor, à la Trello. */
const GHOST_TILT = "rotate(3deg)";

const IDLE: KanbanDragState = {
  active: false,
  draggedKey: null,
  ghostWidth: null,
  mode: null,
  target: null,
};

/** An in-flight pointer drag. */
type PointerSession = {
  draggedKey: string;
  grabOffsetX: number;
  grabOffsetY: number;
  lastTarget: KanbanDropTarget | null;
  moved: boolean;
  startX: number;
  startY: number;
  /** Whether the card held keyboard focus when grabbed, so focus can be restored. */
  wasFocused: boolean;
  x: number;
  y: number;
};

/** The minimal DOM surface of the floating clone node we position. */
type GhostNode = { style?: { transform: string } } | null;

export function useKanbanCardDrag(
  options: KanbanDragOptions,
): UseKanbanCardDrag {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const boardRef = useRef<BoardNode>(null);
  const ghostRef = useRef<GhostNode>(null);
  const ghostWidthRef = useRef<number | null>(null);
  const pointerRef = useRef<PointerSession | null>(null);
  const keyboardRef = useRef<{
    draggedKey: string;
    target: KanbanDropTarget;
  } | null>(null);
  const removeMoveRef = useRef<(() => void) | null>(null);
  const suppressRef = useRef(false);
  const cardNodesRef = useRef(new Map<string, { focus?: () => void }>());
  const [dragState, setDragState] = useState<KanbanDragState>(IDLE);

  const columnOf = useCallback(
    (cardKey: string) =>
      findCardOrigin(optionsRef.current.layout, cardKey)?.columnId ?? null,
    [],
  );

  // Position the floating clone under the cursor by mutating its transform
  // directly — the board never re-renders as the pointer moves.
  const positionGhost = useCallback(() => {
    const node = ghostRef.current;
    const session = pointerRef.current;
    if (!node?.style || !session) {
      return;
    }
    const tx = session.x - session.grabOffsetX;
    const ty = session.y - session.grabOffsetY;
    node.style.transform = `translate(${tx}px, ${ty}px) ${GHOST_TILT}`;
  }, []);

  // After a keyboard move the card re-renders in its new slot (same key, new
  // node), so focus is restored to it once that node has registered. The DOM
  // fallback keeps focus on the card even when the consumer applies the move
  // asynchronously and the node has not re-registered by the next frame.
  const restoreFocus = useCallback((cardKey: string) => {
    if (typeof requestAnimationFrame !== "function") {
      return;
    }
    requestAnimationFrame(() => {
      const registered = cardNodesRef.current.get(cardKey);
      if (registered?.focus) {
        registered.focus();
        return;
      }
      if (typeof document !== "undefined") {
        const node = document.querySelector(
          `[data-testid="${CARD_TESTID_PREFIX}${cardKey}"]`,
        ) as { focus?: () => void } | null;
        node?.focus?.();
      }
    });
  }, []);

  // Abandon any in-progress keyboard grab — when the window loses focus, or when
  // a pointer interaction supersedes it (which also frees a grab left stuck by a
  // card that became disabled mid-move).
  const cancelKeyboard = useCallback(() => {
    if (!keyboardRef.current) {
      return;
    }
    keyboardRef.current = null;
    setDragState(IDLE);
    announce("Move cancelled.");
  }, []);

  const finishPointer = useCallback(
    (commit: boolean) => {
      removeMoveRef.current?.();
      removeMoveRef.current = null;
      const session = pointerRef.current;
      pointerRef.current = null;
      if (!session || !session.moved) {
        return; // A plain click: leave the card's own press to fire.
      }
      setDragState(IDLE);
      // A real drag past the threshold happened: swallow the click it produces
      // (even when the card lands back where it started), and — only if the card
      // was keyboard-focused when grabbed — return focus to it after it re-renders
      // (never steal focus onto a card a mouse user merely dragged).
      suppressRef.current = true;
      if (session.wasFocused) {
        restoreFocus(session.draggedKey);
      }
      if (!commit || !session.lastTarget) {
        return;
      }
      const move = targetToMove(
        optionsRef.current.layout,
        session.draggedKey,
        session.lastTarget,
      );
      if (move) {
        optionsRef.current.onCardMove?.(move);
        announce(
          `Dropped. ${describeTarget(optionsRef.current.layout, session.draggedKey, session.lastTarget, optionsRef.current.columnTitle)}.`,
        );
      }
    },
    [restoreFocus],
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
          ghostWidth: ghostWidthRef.current,
          mode: "pointer",
          target: initialDropTarget(
            optionsRef.current.layout,
            session.draggedKey,
          ),
        });
      }
      event.preventDefault();
      positionGhost();
      // Measure the cards in flow, excluding the dragged card — which may still
      // be in the DOM on the activation frame before React lifts it out — so the
      // count is a removed-card index directly.
      const board = boardRef.current;
      const cardsInFlow = measureCards(board, columnOf).filter(
        (card) => card.cardKey !== session.draggedKey,
      );
      const target = liftedDropTarget(
        measureColumns(board),
        cardsInFlow,
        event.clientX,
        event.clientY,
      );
      if (!target) {
        return;
      }
      const prev = session.lastTarget;
      session.lastTarget = target;
      if (prev?.columnId !== target.columnId || prev?.index !== target.index) {
        setDragState((state) => ({ ...state, target }));
        // Announce on column change only — a slot-by-slot narration as the
        // pointer sweeps a column would flood the live region.
        if (prev?.columnId !== target.columnId) {
          announce(
            describeTarget(
              optionsRef.current.layout,
              session.draggedKey,
              target,
              optionsRef.current.columnTitle,
            ),
          );
        }
      }
    };
    const onUp = () => finishPointer(true);
    const onCancel = () => finishPointer(false);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onCancel, true);
    // Non-capture: only a real window blur (alt-tab) cancels, not the element
    // blur that fires as focus shifts between the focusable cards.
    window.addEventListener("blur", onCancel);
    removeMoveRef.current = () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("blur", onCancel);
    };
  }, [columnOf, finishPointer, positionGhost]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const onPointerDown = (event: PointerEvent) => {
      suppressRef.current = false;
      // A pointer interaction supersedes any keyboard grab (and recovers one
      // left stuck by a card disabled mid-move).
      cancelKeyboard();
      if (!optionsRef.current.enabled || event.button !== 0) {
        return;
      }
      if (event.pointerType === "touch") {
        return;
      }
      const board = boardRef.current;
      if (!board?.contains?.(event.target)) {
        return;
      }
      const cards = measureCards(board, columnOf);
      const draggedKey = cardKeyAt(cards, event.clientX, event.clientY);
      const dragged = cards.find((card) => card.cardKey === draggedKey);
      if (!draggedKey || !dragged) {
        return;
      }
      // Grab-relative offsets keep the clone pinned to the cursor at the exact
      // point it was picked up; the width sizes the clone to the real card.
      pointerRef.current = {
        draggedKey,
        grabOffsetX: event.clientX - dragged.left,
        grabOffsetY: event.clientY - dragged.top,
        lastTarget: null,
        moved: false,
        startX: event.clientX,
        startY: event.clientY,
        wasFocused:
          (cardNodesRef.current.get(draggedKey) as unknown) ===
          document.activeElement,
        x: event.clientX,
        y: event.clientY,
      };
      ghostWidthRef.current = dragged.right - dragged.left;
      attachMove();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    // A keyboard grab is cancelled on a real window blur (alt-tab), mirroring the
    // pointer drag; non-capture so element blur between cards does not trip it.
    window.addEventListener("blur", cancelKeyboard);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("blur", cancelKeyboard);
      removeMoveRef.current?.();
    };
  }, [attachMove, cancelKeyboard, columnOf]);

  const handleKeyDown = useCallback(
    (cardKey: string, event: KanbanCardKeyEvent) => {
      const key = event.nativeEvent?.key ?? event.key;
      if (!key) {
        return;
      }
      const { columnTitle, layout, onCardMove } = optionsRef.current;
      const grabbed = keyboardRef.current;
      const stop = () => {
        event.preventDefault?.();
        event.stopPropagation?.();
      };

      if (!grabbed) {
        // Space grabs; Enter falls through to the card's own press (open).
        if (key !== " " && key !== "Spacebar") {
          return;
        }
        const start = initialDropTarget(layout, cardKey);
        if (!start) {
          return;
        }
        stop();
        suppressRef.current = true; // swallow the press this Space would fire
        keyboardRef.current = { draggedKey: cardKey, target: start };
        setDragState({
          active: true,
          draggedKey: cardKey,
          ghostWidth: null,
          mode: "keyboard",
          target: start,
        });
        announce(
          `Grabbed card. ${describeTarget(layout, cardKey, start, columnTitle)}. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.`,
        );
        return;
      }
      if (grabbed.draggedKey !== cardKey) {
        return;
      }
      if (key.startsWith("Arrow")) {
        const next = keyboardDropTarget(layout, grabbed.target, cardKey, key);
        if (!next) {
          return;
        }
        stop();
        keyboardRef.current = { draggedKey: cardKey, target: next };
        setDragState((state) => ({ ...state, target: next }));
        announce(describeTarget(layout, cardKey, next, columnTitle));
        return;
      }
      if (key === " " || key === "Spacebar" || key === "Enter") {
        stop();
        suppressRef.current = true;
        const move = targetToMove(layout, cardKey, grabbed.target);
        keyboardRef.current = null;
        setDragState(IDLE);
        if (move) {
          onCardMove?.(move);
          announce(
            `Dropped. ${describeTarget(layout, cardKey, grabbed.target, columnTitle)}.`,
          );
        } else {
          announce("Card kept its position.");
        }
        restoreFocus(cardKey);
        return;
      }
      if (key === "Escape") {
        stop();
        keyboardRef.current = null;
        setDragState(IDLE);
        announce("Move cancelled.");
        restoreFocus(cardKey);
      }
    },
    [restoreFocus],
  );

  const cardBinding = useCallback(
    (cardKey: string): KanbanCardDragBinding | null => {
      if (!optionsRef.current.enabled) {
        return null;
      }
      return {
        grabbed: keyboardRef.current?.draggedKey === cardKey,
        onKeyDown: (event) => handleKeyDown(cardKey, event),
        registerRef: (node) => {
          if (node) {
            cardNodesRef.current.set(cardKey, node as { focus?: () => void });
          } else {
            cardNodesRef.current.delete(cardKey);
          }
        },
        testID: `${CARD_TESTID_PREFIX}${cardKey}`,
      };
    },
    [handleKeyDown],
  );

  const consumePressSuppression = useCallback(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return true;
    }
    return false;
  }, []);

  const bindBoard = useMemo(
    () => ({
      ref: (node: unknown) => {
        boardRef.current = (node as BoardNode) ?? null;
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

  return {
    bindBoard,
    bindGhost,
    cardBinding,
    consumePressSuppression,
    dragState,
  };
}
