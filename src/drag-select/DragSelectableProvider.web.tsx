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
  dragSelectableThresholdForValue,
  hasDragSelectableMoved,
} from "./dragSelectableModel";
import type { DragSelectablePoint } from "./dragSelectableModel";
import {
  dragSelectableEventTarget,
  dragSelectablePointFromUnknownEvent,
  dragSelectablePointerSource,
  dragSelectableRegistrationInvalidatesRegistry,
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
  threshold: number;
};

const emptyMatchingTargets: DragSelectableTargetSnapshot[] = [];

export function DragSelectableProvider({
  children,
  disabled = false,
  minimumDragDistance,
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
      if (dragSelectableRegistrationInvalidatesRegistry(previous, target)) {
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
    const next = { ...current, ...target };
    if (current.data === next.data && current.disabled === next.disabled) {
      return;
    }
    targetsRef.current.set(target.id, next);
    if (dragSelectableRegistrationInvalidatesRegistry(current, next)) {
      setRegistryVersion((version) => version + 1);
    }
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

  const cancelDrag = useCallback(() => {
    removeDragListenersRef.current?.();
    removeDragListenersRef.current = null;
    dragSessionRef.current = null;
    setActiveDrag(null);
  }, []);

  const updateDrag = useCallback((point: DragSelectablePoint) => {
    const session = dragSessionRef.current;
    if (!session) {
      return;
    }
    session.current = point;
    session.moved =
      session.moved ||
      hasDragSelectableMoved(session.start, point, session.threshold);
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
    const moved =
      session.moved ||
      hasDragSelectableMoved(session.start, point, session.threshold);
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
    const handleCancel = () => {
      cancelDrag();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        cancelDrag();
      }
    };
    document.addEventListener("pointermove", handleMove, true);
    document.addEventListener("pointerup", handleUp, true);
    document.addEventListener("pointercancel", handleCancel, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);
    window.addEventListener("blur", handleCancel, true);
    removeDragListenersRef.current = () => {
      document.removeEventListener("pointermove", handleMove, true);
      document.removeEventListener("pointerup", handleUp, true);
      document.removeEventListener("pointercancel", handleCancel, true);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
        true,
      );
      window.removeEventListener("blur", handleCancel, true);
    };
  }, [cancelDrag, finishDrag, updateDrag]);

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
        threshold: dragSelectableThresholdForValue(minimumDragDistance),
      };
      dragSessionRef.current = session;
      setActiveDrag({
        box: null,
        matchedTargets: [],
        moved: false,
      });
      attachDragListeners();
    },
    [attachDragListeners, disabled, minimumDragDistance],
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
