/**
 * The platform-split contract for the shared sortable drag engine: what the
 * engine needs to know about each participating list, the options it takes, the
 * live state it publishes, and what it hands back. Both the web engine
 * (`useSortableDrag.web.ts`) and the inert native one (`useSortableDrag.ts`)
 * implement this, so the types live here — apart from the pure geometry in
 * {@link ./sortableGroupModel} and the per-item wiring in
 * {@link ./sortableListTypes}.
 */
import type {
  SortableGroupFlow,
  SortableGroupMove,
  SortableGroupTarget,
} from "./sortableGroupModel";
import type {
  SortableDragMode,
  SortableOrientation,
} from "./sortableListModel";
import type { SortableItemBinding } from "./sortableListTypes";

/** One participating list, as the engine sees it. */
export type SortableDragGroup = {
  /** Stable identity for the list; the implicit id when there is only one. */
  groupId: string;
  /** Whether a grab handle gates the drag for this list (handle mode). */
  handle: boolean;
  /** The ordered item keys — the logical list the drag reasons about. */
  keys: string[];
  /** The list's accessible name, woven into cross-group announcements. */
  label?: string;
  /** The flow axis; picks the arrow keys and the rect coordinate the drag reads. */
  orientation: SortableOrientation;
};

/** Options passed to the engine. */
export type SortableDragEngineOptions = {
  /**
   * Vet a candidate destination. A rejected target is never adopted, so no drop
   * preview ever opens where the item cannot land, and the keyboard steps over
   * it. The item's own slot is always allowed, so a drag can always be undone.
   */
  canDrop?: (move: SortableGroupMove) => boolean;
  /** Whether dragging is on at all. */
  enabled: boolean;
  /** How the groups sit relative to each other; picks the crossing arrow keys. */
  groupFlow?: SortableGroupFlow;
  /**
   * Every list taking part, read live. A function rather than an array because
   * member lists register during their own render — after the coordinator has
   * already rendered — so an array captured at render time would always be one
   * pass behind.
   */
  groups: () => SortableDragGroup[];
  /** An item's accessible name, woven into the grab / drop announcements. */
  label?: (key: string) => string | undefined;
  /** Called with each committed move for the consumer to apply to its data. */
  onMove?: (move: SortableGroupMove) => void;
};

/** The live drag state the lists render the lifted row + preview + clone from. */
export type SortableGroupDragState = {
  active: boolean;
  draggedKey: string | null;
  ghostHeight: number | null;
  ghostWidth: number | null;
  mode: SortableDragMode | null;
  target: SortableGroupTarget | null;
};

/** What the engine returns. */
export type UseSortableDrag = {
  /** Registers the floating-clone node so a pointer drag can position it. */
  bindGhost: { ref: (node: unknown) => void };
  /** Binds a list's container so the drag can measure and hit-test within it. */
  bindList: (groupId: string) => { ref: (node: unknown) => void };
  dragState: SortableGroupDragState;
  /** Per-item drag wiring, or `null` when dragging is off. */
  itemBinding: (key: string) => SortableItemBinding | null;
};
