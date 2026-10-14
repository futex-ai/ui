/**
 * The parts that the web and the native provider share: the option layers,
 * the target registry, and the selection with its page-change rule.
 */
import { useRef } from "react";

import type { DragSelectableOptions } from "./dragSelectableOptionTypes";
import {
  useDragSelectableOptionLayers,
  type DragSelectableOptionState,
} from "./useDragSelectableOptionLayers";
import {
  useDragSelectableRegistry,
  type DragSelectableRegistry,
} from "./useDragSelectableRegistry";
import {
  useDragSelectableSelectionState,
  type DragSelectableSelectionState,
} from "./useDragSelectableSelectionState";

/** The shared state of one provider. */
export type DragSelectableCore = DragSelectableOptionState & {
  registry: DragSelectableRegistry;
  selection: DragSelectableSelectionState;
};

/** Builds the shared state of a provider from its options. */
export function useDragSelectableCore(
  providerOptions: DragSelectableOptions,
  defaultSelectedIds: readonly string[] | undefined,
): DragSelectableCore {
  const optionState = useDragSelectableOptionLayers(providerOptions);
  const { options } = optionState;
  const clearAfterEmptyRef = useRef<() => void>(() => undefined);
  const registry = useDragSelectableRegistry(() =>
    clearAfterEmptyRef.current(),
  );
  const selection = useDragSelectableSelectionState({
    defaultSelectedIds,
    disabled: options.disabled,
    onSelectedIdsChange: options.onSelectedIdsChange,
    onSelectionChange: options.onSelectionChange,
    registeredTargets: registry.registeredTargets,
    selectedIds: options.selectedIds,
    selectionAnnouncement: options.selectionAnnouncement,
    targetsRef: registry.targetsRef,
  });
  clearAfterEmptyRef.current = selection.clearAfterEmpty;
  return { ...optionState, registry, selection };
}
