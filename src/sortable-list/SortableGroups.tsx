/**
 * Coordinates several {@link SortableList}s so an item can be dragged from one
 * into another — by pointer or keyboard on the web. It is a **pure provider**:
 * it renders its children and nothing else, contributing no layout box, so the
 * section titles, spacing, collapse chrome and empty states around each list
 * stay entirely the consumer's.
 *
 * Every committed move — across groups *and* within one — is reported through a
 * single `onMove` as `{ key, fromGroupId, fromIndex, toGroupId, toIndex }`, and
 * the lists stay controlled: apply the move to your own data (see
 * {@link applyGroupedSortableMove}) and the lists re-render from the new props.
 * Because nothing mutates until you apply it, a destination that needs
 * confirming is just a move you withhold — the lists snap back on their own.
 *
 * On native the drag engine is an inert no-op, exactly as a lone list is today,
 * so the coordinator renders its children unchanged.
 */
import { useCallback, useMemo, useRef, type ReactNode } from "react";

import { devWarn } from "../devWarn";

import type { SortableDragGroup } from "./sortableDragTypes";
import {
  SortableGroupProvider,
  type SortableGroupContextValue,
  type SortableGroupRegistration,
} from "./sortableGroupContext";
import type {
  SortableGroupFlow,
  SortableGroupMove,
} from "./sortableGroupModel";
import { useSortableDrag } from "./useSortableDrag";

/** Live member lists, keyed by group id, each tagged with the instance that owns it. */
type GroupRegistry = Map<
  string,
  { owner: object; registration: SortableGroupRegistration }
>;

export type SortableGroupsProps = {
  /**
   * Bar a destination outright. Called with each candidate move; returning
   * `false` means the pointer never adopts that target (so no preview opens
   * there) and the keyboard steps over it. The item's own slot is always
   * allowed, so a drag can always be abandoned back home.
   *
   * This is for destinations an item genuinely cannot occupy. A destination
   * that merely needs *confirming* does not need it: withhold the move, show
   * your dialog, and apply it on confirm — nothing has mutated, so the lists
   * snap back on their own.
   */
  canDrop?: (move: SortableGroupMove) => boolean;
  children: ReactNode;
  /**
   * How the member lists sit relative to each other, which picks the keyboard
   * model. `"vertical"` (default) — the lists are stacked, so Up / Down step
   * within a list and overflow into the next one at its near end. `"horizontal"`
   * — the lists sit in a row, so Left / Right jump between them and Up / Down
   * stay inside one (Kanban parity).
   */
  groupFlow?: SortableGroupFlow;
  /**
   * Called with every committed move, including moves within a single list
   * (`fromGroupId === toGroupId`). Providing it is what enables dragging for
   * the member lists, the way `onReorder` does for a standalone one.
   */
  onMove?: (move: SortableGroupMove) => void;
};

export function SortableGroups({
  canDrop,
  children,
  groupFlow = "vertical",
  onMove,
}: SortableGroupsProps) {
  // Insertion-ordered, so lists that are never laid out still fall back to a
  // sensible order. Written during a member list's render — see the module note
  // on `sortableGroupContext`.
  const registryRef = useRef(
    new Map<
      string,
      { owner: object; registration: SortableGroupRegistration }
    >(),
  );
  const preview = useRef<ReactNode>(null);

  const groups = useCallback(
    (): SortableDragGroup[] =>
      [...registryRef.current.entries()].map(
        ([
          groupId,
          {
            registration: { handle, keys, label, orientation },
          },
        ]) => ({
          groupId,
          handle,
          keys,
          label,
          orientation,
        }),
      ),
    [],
  );

  const drag = useSortableDrag({
    canDrop,
    enabled: Boolean(onMove),
    groupFlow,
    groups,
    label: useCallback((key: string) => labelOf(registryRef.current, key), []),
    onMove,
  });

  const register = useCallback(
    (
      groupId: string,
      registration: SortableGroupRegistration,
      owner: object,
    ) => {
      registryRef.current.set(groupId, { owner, registration });
      warnOnDuplicateKeys(registryRef.current);
    },
    [],
  );

  const unregister = useCallback((groupId: string, owner: object) => {
    if (registryRef.current.get(groupId)?.owner === owner) {
      registryRef.current.delete(groupId);
    }
  }, []);

  const value = useMemo<SortableGroupContextValue>(
    () => ({
      bindGhost: drag.bindGhost,
      bindList: drag.bindList,
      dragState: drag.dragState,
      itemBinding: drag.itemBinding,
      preview,
      register,
      unregister,
    }),
    [
      drag.bindGhost,
      drag.bindList,
      drag.dragState,
      drag.itemBinding,
      register,
      unregister,
    ],
  );

  return (
    <SortableGroupProvider value={value}>{children}</SortableGroupProvider>
  );
}

/**
 * An item's accessible name is owned by whichever list holds it. The engine
 * asks by key alone, which is exactly why keys must be unique across a
 * coordinator.
 */
function labelOf(registry: GroupRegistry, key: string): string | undefined {
  for (const { registration } of registry.values()) {
    if (registration.keys.includes(key)) {
      return registration.itemLabel?.(key);
    }
  }
  return undefined;
}

/**
 * Item keys identify a row across the whole coordinator — the drop math, the
 * hit test and the focus restore all key off them — so a key repeated in two
 * lists would move the wrong row. Kanban holds the same rule for card keys.
 */
function warnOnDuplicateKeys(registry: GroupRegistry): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const { registration } of registry.values()) {
    for (const key of registration.keys) {
      if (seen.has(key)) {
        duplicates.add(key);
      }
      seen.add(key);
    }
  }
  if (duplicates.size > 0) {
    devWarn(
      `SortableGroups: item keys must be unique across every group, but ${[...duplicates].join(", ")} appear in more than one. The drag will move the wrong row.`,
    );
  }
}
