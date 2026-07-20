/**
 * Native-safe fallback for the sortable-list drag hook. Reordering by dragging is
 * a pointer/DOM and physical-keyboard gesture, so on native this is an inert
 * no-op with the exact same signature as `useSortableListDrag.web.ts`: the list
 * still renders its rows (and any grab handle, as a static affordance), but
 * nothing is draggable and no reorder is reported. Platform resolution picks the
 * `.web` file on web and this on native. Native reordering (drag or move
 * buttons) is a documented follow-up; a consumer can drive order changes from
 * their own controls in the meantime.
 */
import type { SortableDragState } from "./sortableListModel";
import type {
  SortableDragOptions,
  UseSortableListDrag,
} from "./sortableListTypes";

const IDLE_STATE: SortableDragState = {
  active: false,
  draggedKey: null,
  ghostHeight: null,
  ghostWidth: null,
  mode: null,
  target: null,
};

/** Inert native hook: no drag state, binds nothing, makes no item draggable. */
export function useSortableListDrag(
  _options: SortableDragOptions,
): UseSortableListDrag {
  return {
    bindGhost: { ref: () => {} },
    bindList: { ref: () => {} },
    dragState: IDLE_STATE,
    itemBinding: () => null,
  };
}
