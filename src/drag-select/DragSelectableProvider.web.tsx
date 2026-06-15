/** Web drag-select provider with DOM target measurement and marquee overlay. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import {
  DragSelectableContext,
  emptyDragSelectableState,
} from "./DragSelectableContext";
import {
  dragSelectableBoundsForBox,
  dragSelectableBox,
  dragSelectableIdsEqual,
  hasDragSelectableMoved,
} from "./dragSelectableModel";
import type { DragSelectablePoint } from "./dragSelectableModel";
import {
  dragSelectableEventTarget,
  dragSelectablePointFromUnknownEvent,
  dragSelectablePointerSource,
  dragSelectableSnapshotsForIds,
  dragSelectableShouldStartFromTarget,
  measureDragSelectableTargets,
} from "./dragSelectableDom";
import type { DragSelectableMeasuredTarget } from "./dragSelectableDom";
import type {
  DragSelectableChangeListener,
  DragSelectableProviderProps,
  DragSelectableState,
  DragSelectableTargetOptions,
  DragSelectableTargetRegistration,
  DragSelectableTargetSnapshot,
} from "./dragSelectableTypes";
import {
  DragSelectableOverlay,
  type DragSelectableActiveDrag,
} from "./DragSelectableOverlay";
import { useSharedUiTheme } from "../theme";

type DragSession = {
  current: DragSelectablePoint;
  moved: boolean;
  start: DragSelectablePoint;
  targets: DragSelectableMeasuredTarget[];
};

const emptyMatchingTargets: DragSelectableTargetSnapshot[] = [];

export function DragSelectableProvider({
  children,
  disabled = false,
  onSelectionChange,
  overlayZIndex,
  selectionLabel,
  style,
}: DragSelectableProviderProps) {
  const theme = useSharedUiTheme();
  const targetsRef = useRef(
    new Map<string, DragSelectableTargetRegistration>(),
  );
  const listenersRef = useRef(new Set<DragSelectableChangeListener>());
  const dragSessionRef = useRef<DragSession | null>(null);
  const removeDragListenersRef = useRef<(() => void) | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const [registryVersion, setRegistryVersion] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const notifiedSelectedIdsRef = useRef<readonly string[]>(selectedIds);
  const [activeDrag, setActiveDrag] = useState<DragSelectableActiveDrag | null>(
    null,
  );

  const registerTarget = useCallback(
    (target: DragSelectableTargetRegistration) => {
      const previous = targetsRef.current.get(target.id);
      targetsRef.current.set(target.id, target);
      if (
        previous?.node !== target.node ||
        previous.data !== target.data ||
        previous.disabled !== target.disabled
      ) {
        setRegistryVersion((version) => version + 1);
      }
      return () => {
        if (targetsRef.current.get(target.id)?.node !== target.node) {
          return;
        }
        targetsRef.current.delete(target.id);
        setRegistryVersion((version) => version + 1);
      };
    },
    [],
  );

  const updateTarget = useCallback((target: DragSelectableTargetOptions) => {
    const current = targetsRef.current.get(target.id);
    if (!current) {
      return;
    }
    if (current.data === target.data && current.disabled === target.disabled) {
      return;
    }
    targetsRef.current.set(target.id, { ...current, ...target });
    setRegistryVersion((version) => version + 1);
  }, []);

  const selectedTargets = useMemo(
    () => dragSelectableSnapshotsForIds(selectedIds, targetsRef.current),
    [registryVersion, selectedIds],
  );
  const matchingTargets = activeDrag?.matchedTargets ?? emptyMatchingTargets;
  const state: DragSelectableState = useMemo(
    () => ({
      dragBox: activeDrag?.box ?? null,
      dragging: Boolean(activeDrag),
      matchingCount: matchingTargets.length,
      matchingIds: matchingTargets.map((target) => target.id),
      matchingTargets,
      selectedCount: selectedTargets.length,
      selectedIds,
      selectedTargets,
    }),
    [activeDrag, matchingTargets, selectedIds, selectedTargets],
  );
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const matchedIdSet = useMemo(
    () => new Set(state.matchingIds),
    [state.matchingIds],
  );

  useEffect(() => {
    for (const listener of listenersRef.current) {
      listener(state);
    }
  }, [state]);

  useEffect(() => {
    if (dragSelectableIdsEqual(notifiedSelectedIdsRef.current, selectedIds)) {
      return;
    }
    notifiedSelectedIdsRef.current = [...selectedIds];
    onSelectionChangeRef.current?.({
      selectedCount: selectedTargets.length,
      selectedIds,
      selectedTargets,
    });
  }, [selectedIds, selectedTargets]);

  const clearSelection = useCallback(() => {
    setSelectedIds((current) => (current.length === 0 ? current : []));
  }, []);

  const updateDrag = useCallback((point: DragSelectablePoint) => {
    const session = dragSessionRef.current;
    if (!session) {
      return;
    }
    session.current = point;
    session.moved =
      session.moved || hasDragSelectableMoved(session.start, point);
    const box = dragSelectableBox(session.start, point);
    const matchedTargets = session.moved
      ? dragSelectableBoundsForBox(session.targets, box)
      : [];
    setActiveDrag({
      box: session.moved ? box : null,
      matchedTargets,
      moved: session.moved,
    });
  }, []);

  const finishDrag = useCallback((point: DragSelectablePoint) => {
    removeDragListenersRef.current?.();
    removeDragListenersRef.current = null;
    const session = dragSessionRef.current;
    if (!session) {
      return;
    }
    dragSessionRef.current = null;
    setActiveDrag(null);
    const moved = session.moved || hasDragSelectableMoved(session.start, point);
    if (!moved) {
      return;
    }
    const box = dragSelectableBox(session.start, point);
    const measuredTargets = measureDragSelectableTargets(
      targetsRef.current.values(),
    );
    const selectedTargetsForBox = dragSelectableBoundsForBox(
      measuredTargets.length > 0 ? measuredTargets : session.targets,
      box,
    );
    setSelectedIds(selectedTargetsForBox.map((target) => target.id));
  }, []);

  const attachDragListeners = useCallback(() => {
    removeDragListenersRef.current?.();
    const handleMove = (event: PointerEvent) => {
      const point = dragSelectablePointFromUnknownEvent(event);
      if (!point) {
        return;
      }
      event.preventDefault();
      updateDrag(point);
    };
    const handleUp = (event: PointerEvent) => {
      const point = dragSelectablePointFromUnknownEvent(event);
      if (point) {
        finishDrag(point);
      }
    };
    document.addEventListener("pointermove", handleMove, true);
    document.addEventListener("pointerup", handleUp, true);
    removeDragListenersRef.current = () => {
      document.removeEventListener("pointermove", handleMove, true);
      document.removeEventListener("pointerup", handleUp, true);
    };
  }, [finishDrag, updateDrag]);

  const beginDrag = useCallback(
    (event: unknown) => {
      if (disabled || typeof document === "undefined") {
        return;
      }
      const source = dragSelectablePointerSource(event);
      if (source.button !== undefined && source.button !== 0) {
        return;
      }
      if (source.pointerType === "touch") {
        return;
      }
      const target = dragSelectableEventTarget(event);
      if (
        !dragSelectableShouldStartFromTarget(
          target,
          targetsRef.current.values(),
        )
      ) {
        return;
      }
      const point = dragSelectablePointFromUnknownEvent(event);
      if (!point) {
        return;
      }
      const session: DragSession = {
        current: point,
        moved: false,
        start: point,
        targets: measureDragSelectableTargets(targetsRef.current.values()),
      };
      dragSessionRef.current = session;
      setActiveDrag({
        box: null,
        matchedTargets: [],
        moved: false,
      });
      attachDragListeners();
    },
    [attachDragListeners, disabled],
  );

  useEffect(
    () => () => {
      removeDragListenersRef.current?.();
    },
    [],
  );

  const subscribe = useCallback((listener: DragSelectableChangeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const context = useMemo(
    () => ({
      clearSelection,
      matchedIdSet,
      registerTarget,
      selectedIdSet,
      state,
      subscribe,
      updateTarget,
    }),
    [
      clearSelection,
      matchedIdSet,
      registerTarget,
      selectedIdSet,
      state,
      subscribe,
      updateTarget,
    ],
  );

  return (
    <DragSelectableContext.Provider value={context}>
      <View onPointerDown={beginDrag} style={style}>
        {children}
      </View>
      <DragSelectableOverlay
        activeDrag={activeDrag}
        overlayZIndex={overlayZIndex}
        selectionLabel={selectionLabel}
        theme={theme}
      />
    </DragSelectableContext.Provider>
  );
}
