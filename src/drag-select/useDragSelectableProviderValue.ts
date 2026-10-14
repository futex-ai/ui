/** The context value that a drag-select provider hands to its targets. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DragSelectableContextValue } from "./DragSelectableContext";
import type { DragSelectableActiveDrag } from "./dragSelectableSession";
import { dragSelectableFocusNode } from "./dragSelectableTargetNode";
import type {
  DragSelectableChangeListener,
  DragSelectableState,
  DragSelectableTargetSnapshot,
} from "./dragSelectableTypes";
import type { DragSelectableOptionLayers } from "./useDragSelectableOptionLayers";
import type { DragSelectableRegistry } from "./useDragSelectableRegistry";
import type { DragSelectableSelectionState } from "./useDragSelectableSelectionState";

/** The parts of a provider that the context value combines. */
export type DragSelectableProviderParts = {
  activeDrag: DragSelectableActiveDrag | null;
  optionLayers: DragSelectableOptionLayers;
  registry: DragSelectableRegistry;
  selection: DragSelectableSelectionState;
};

const emptyMatchingTargets: DragSelectableTargetSnapshot[] = [];

/**
 * Combines the registry, the selection, and the active drag into the state
 * and the context value, and notifies `useDragSelectableChanges` listeners
 * after each state change.
 */
export function useDragSelectableProviderValue({
  activeDrag,
  optionLayers,
  registry,
  selection,
}: DragSelectableProviderParts): DragSelectableContextValue {
  const [activeId, setActiveId] = useState<string | null>(null);
  const listenersRef = useRef(new Set<DragSelectableChangeListener>());
  const matchingTargets = activeDrag?.matchedTargets ?? emptyMatchingTargets;
  const state: DragSelectableState = useMemo(
    () => ({
      dragBox: activeDrag?.box ?? null,
      dragging: Boolean(activeDrag),
      dragMode: activeDrag?.mode ?? null,
      matchingCount: matchingTargets.length,
      matchingIds: matchingTargets.map((target) => target.id),
      matchingTargets,
      selectedCount: selection.selection.selectedCount,
      selectedIds: selection.selection.selectedIds,
      selectedTargets: selection.selection.selectedTargets,
    }),
    [activeDrag, matchingTargets, selection.selection],
  );
  const matchedIdSet = useMemo(
    () => new Set(state.matchingIds),
    [state.matchingIds],
  );

  useEffect(() => {
    for (const listener of listenersRef.current) {
      listener(state);
    }
  }, [state]);

  const { targetsRef } = registry;
  const focusTarget = useCallback(
    (id: string) => {
      setActiveId(id);
      if (typeof document === "undefined") {
        return;
      }
      dragSelectableFocusNode(targetsRef.current.get(id)?.node, id)?.focus?.();
    },
    [targetsRef],
  );

  const subscribe = useCallback((listener: DragSelectableChangeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  return useMemo(
    () => ({
      activeId,
      focusTarget,
      matchedIdSet,
      optionLayers,
      registeredTargets: registry.registeredTargets,
      registerTarget: registry.registerTarget,
      selectedIdSet: selection.selectedIdSet,
      setSelection: selection.selectRange,
      state,
      subscribe,
      toggleSelection: selection.toggle,
      updateTarget: registry.updateTarget,
    }),
    [
      activeId,
      focusTarget,
      matchedIdSet,
      optionLayers,
      registry.registeredTargets,
      registry.registerTarget,
      registry.updateTarget,
      selection.selectRange,
      selection.selectedIdSet,
      selection.toggle,
      state,
      subscribe,
    ],
  );
}
