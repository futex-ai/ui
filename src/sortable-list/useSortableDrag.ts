/**
 * Native-safe fallback for the shared sortable drag engine. Dragging is a
 * pointer/DOM and physical-keyboard gesture, so on native this is an inert
 * no-op with the exact same signature as `useSortableDrag.web.ts`: lists still
 * render their rows (and any grab handle, as a static affordance), but nothing
 * is draggable and no move is reported. Platform resolution picks the `.web`
 * file on web and this on native. Native reordering is a documented follow-up;
 * a consumer can drive order changes from their own controls meanwhile.
 */
import type {
  SortableDragEngineOptions,
  SortableGroupDragState,
  UseSortableDrag,
} from "./sortableDragTypes";

const IDLE_STATE: SortableGroupDragState = {
  active: false,
  draggedKey: null,
  ghostHeight: null,
  ghostWidth: null,
  mode: null,
  target: null,
};

const NO_BIND = { ref: () => {} };

/** Inert native engine: no drag state, binds nothing, makes no item draggable. */
export function useSortableDrag(
  _options: SortableDragEngineOptions,
): UseSortableDrag {
  return {
    bindGhost: NO_BIND,
    bindList: () => NO_BIND,
    dragState: IDLE_STATE,
    itemBinding: () => null,
  };
}
