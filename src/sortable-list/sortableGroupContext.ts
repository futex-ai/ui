/**
 * The channel between a {@link SortableGroups} coordinator and the
 * {@link SortableList}s that join it. A member list publishes its live layout
 * (its keys, axis, handle mode and accessible name) and reads back the shared
 * drag state plus the per-item wiring, so an item can be dragged out of one
 * list and into another.
 *
 * Registration is deliberately a ref write rather than state: a member list
 * registers during its own render — after the coordinator has already rendered
 * — so routing it through state would either re-render on every keystroke of a
 * drag or leave the coordinator a pass behind. The engine reads the registry
 * live at event time instead.
 */
import {
  createContext,
  useContext,
  type MutableRefObject,
  type ReactNode,
} from "react";

import type { SortableGroupDragState } from "./sortableDragTypes";
import type { SortableOrientation } from "./sortableListModel";
import type { SortableItemBinding } from "./sortableListTypes";

/** What a member list tells the coordinator about itself, refreshed each render. */
export type SortableGroupRegistration = {
  /** Whether a grab handle gates this list's drag. */
  handle: boolean;
  /** An item's accessible name, for the announcements. Owned by the list that holds it. */
  itemLabel?: (key: string) => string | undefined;
  /** The list's ordered item keys. */
  keys: string[];
  /** The list's accessible name — the group name in announcements. */
  label?: string;
  /** The list's flow axis. */
  orientation: SortableOrientation;
};

export type SortableGroupContextValue = {
  /**
   * Registers the floating-clone node. The list that owns the dragged row
   * renders the one ghost, so it binds through the coordinator's engine.
   */
  bindGhost: { ref: (node: unknown) => void };
  /** Binds a member list's container so the drag can measure within it. */
  bindList: (groupId: string) => { ref: (node: unknown) => void };
  /** The shared live drag state every member list renders from. */
  dragState: SortableGroupDragState;
  /** Per-item drag wiring, or `null` when the coordinator has no `onMove`. */
  itemBinding: (key: string) => SortableItemBinding | null;
  /**
   * The dragged row's rendered content, published by the list that owns it so
   * whichever list holds the current target can draw the drop preview.
   */
  preview: MutableRefObject<ReactNode>;
  /**
   * Register — or refresh — a member list's layout. `owner` identifies the list
   * instance so a teardown can tell one apart from its replacement.
   */
  register: (
    groupId: string,
    registration: SortableGroupRegistration,
    owner: object,
  ) => void;
  /**
   * Drop a member list when it unmounts. A no-op unless `owner` still holds the
   * id: React renders a replacement list before unmounting the one it replaces,
   * so an id-only delete would throw away the live registration.
   */
  unregister: (groupId: string, owner: object) => void;
};

const SortableGroupContext = createContext<SortableGroupContextValue | null>(
  null,
);

export const SortableGroupProvider = SortableGroupContext.Provider;

/**
 * The enclosing coordinator, or `null` when there is none — in which case a
 * {@link SortableList} behaves exactly as it does standalone.
 */
export function useSortableGroupContext(): SortableGroupContextValue | null {
  return useContext(SortableGroupContext);
}
