/**
 * Native-safe fallback for the card drag-and-drop hook. Dragging cards between
 * columns is a pointer/DOM and physical-keyboard gesture, so on native this is an
 * inert no-op with the exact same signature as `useKanbanCardDrag.web.ts`. Cards
 * keep their own `onPress` (this hook never binds or suppresses it), and a status
 * change can still be driven from the opened record. Platform resolution picks
 * the `.web` file on web and this on native.
 */
import type { KanbanDragOptions, UseKanbanCardDrag } from "./kanbanDragModel";

const IDLE_STATE = {
  active: false,
  draggedKey: null,
  ghostWidth: null,
  mode: null,
  target: null,
} as const;

/** Inert native hook: no drag state, binds nothing, suppresses nothing. */
export function useKanbanCardDrag(
  _options: KanbanDragOptions,
): UseKanbanCardDrag {
  return {
    bindBoard: { ref: () => {} },
    bindGhost: { ref: () => {} },
    cardBinding: () => null,
    consumePressSuppression: () => false,
    dragState: IDLE_STATE,
  };
}
