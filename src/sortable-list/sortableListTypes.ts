/**
 * The platform-split contract for the {@link SortableList} drag hook: the option
 * bag the list passes in, the per-item binding it spreads onto a draggable row
 * (and its handle), and the shape the hook returns. Both the web hook
 * (`useSortableListDrag.web.ts`) and the inert native hook
 * (`useSortableListDrag.ts`) implement this, and the component renders from it —
 * so the types live here, apart from the pure geometry in
 * {@link ./sortableListModel}.
 */
import type {
  SortableDragState,
  SortableMove,
  SortableOrientation,
} from "./sortableListModel";

/** The item-node `data-testid` prefix; the item key is the remainder. */
export const ITEM_TESTID_PREFIX = "sortable-item-";
/** The grab-handle `data-testid` prefix; the item key is the remainder. */
export const HANDLE_TESTID_PREFIX = "sortable-handle-";

/** A keyboard event shape narrow enough for the web hook and the native no-op alike. */
export type SortableKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/**
 * The per-item wiring the list spreads onto a draggable row. In handle mode the
 * list puts `onKeyDown` / focus wiring and the `handleTestID` on the handle,
 * leaving the row content free; in handle-less mode the whole row carries them.
 * The row's own measurement `data-testid` is set by the list for every row (so
 * the drop math counts every slot); the binding is `null` for a disabled row, so
 * a disabled row is measured but never a drag start or a keyboard target. The
 * `registerRef` lets a keyboard move restore focus to the focusable node (row or
 * handle) after it re-renders.
 */
export type SortableItemBinding = {
  /** True while this item is the keyboard-grabbed one. */
  grabbed: boolean;
  /** Stable `data-testid` for the item's grab handle (handle-mode pointer hit-testing). */
  handleTestID: string;
  /** Keyboard grab / move / drop / cancel handler (web); inert on native. */
  onKeyDown: (event: SortableKeyEvent) => void;
  /** Registers the focusable node so a keyboard move can restore focus to it. */
  registerRef: (node: unknown) => void;
};

/** Options passed to the platform drag hook. */
export type SortableDragOptions = {
  /** Whether dragging is on at all (the list has an `onReorder`). */
  enabled: boolean;
  /** Whether a grab handle gates the pointer drag (handle mode) vs. the whole row. */
  handle: boolean;
  /** The ordered item keys — the logical list the drag reasons about. */
  keys: string[];
  /** An item's accessible name, woven into the grab / drop announcements. */
  label?: (key: string) => string | undefined;
  /** Called with the committed reorder for the consumer to apply to its data. */
  onReorder?: (move: SortableMove) => void;
  /** The flow axis; picks the arrow keys and the rect coordinate the drag reads. */
  orientation: SortableOrientation;
};

/** What the platform drag hook returns to the list. */
export type UseSortableListDrag = {
  /** Binds the list container so the web drag can hit-test rows within it. */
  bindList: { ref: (node: unknown) => void };
  /** Registers the floating-clone node so a pointer drag can position it. */
  bindGhost: { ref: (node: unknown) => void };
  /** The live drag state the list renders the lifted row + preview + clone from. */
  dragState: SortableDragState;
  /** Per-item drag wiring, or `null` when dragging is off / the item is disabled. */
  itemBinding: (key: string) => SortableItemBinding | null;
};
