/** Shared context and hooks for drag-selectable targets. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import type {
  DragSelectableChangeListener,
  DragSelectableState,
  DragSelectableTargetOptions,
  DragSelectableTargetRegistration,
  DragSelectableTargetResult,
} from "./dragSelectableTypes";

export const emptyDragSelectableState: DragSelectableState = {
  dragBox: null,
  dragging: false,
  matchingCount: 0,
  matchingIds: [],
  matchingTargets: [],
  selectedCount: 0,
  selectedIds: [],
  selectedTargets: [],
};

export type DragSelectableContextValue = {
  clearSelection: () => void;
  matchedIdSet: ReadonlySet<string>;
  registerTarget: (target: DragSelectableTargetRegistration) => () => void;
  selectedIdSet: ReadonlySet<string>;
  state: DragSelectableState;
  subscribe: (listener: DragSelectableChangeListener) => () => void;
  updateTarget: (target: DragSelectableTargetOptions) => void;
};

const emptySet = new Set<string>();

const defaultContext: DragSelectableContextValue = {
  clearSelection: () => undefined,
  matchedIdSet: emptySet,
  registerTarget: () => () => undefined,
  selectedIdSet: emptySet,
  state: emptyDragSelectableState,
  subscribe: () => () => undefined,
  updateTarget: () => undefined,
};

export const DragSelectableContext =
  createContext<DragSelectableContextValue>(defaultContext);

export function useDragSelectableSelection(): DragSelectableState {
  return useContext(DragSelectableContext).state;
}

export function useDragSelectableChanges(
  listener: DragSelectableChangeListener,
): DragSelectableState {
  const { state, subscribe } = useContext(DragSelectableContext);
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(
    () => subscribe((nextState) => listenerRef.current(nextState)),
    [subscribe],
  );

  return state;
}

export function useDragSelectableTarget(
  options: DragSelectableTargetOptions,
): DragSelectableTargetResult {
  const { matchedIdSet, registerTarget, selectedIdSet, state, updateTarget } =
    useContext(DragSelectableContext);
  const { data, disabled, id } = options;
  const cleanupRef = useRef<(() => void) | null>(null);
  const latestOptionsRef = useRef(options);
  latestOptionsRef.current = options;

  const targetRef = useCallback(
    (node: Parameters<DragSelectableTargetResult["ref"]>[0]) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!node) {
        return;
      }
      cleanupRef.current = registerTarget({
        ...latestOptionsRef.current,
        id,
        node,
      });
    },
    [id, registerTarget],
  );

  useEffect(() => {
    updateTarget({ data, disabled, id });
  }, [data, disabled, id, updateTarget]);

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    [],
  );

  return useMemo(
    () => ({
      dragging: state.dragging,
      matching: matchedIdSet.has(id),
      ref: targetRef,
      selected: selectedIdSet.has(id),
    }),
    [id, matchedIdSet, selectedIdSet, state.dragging, targetRef],
  );
}
