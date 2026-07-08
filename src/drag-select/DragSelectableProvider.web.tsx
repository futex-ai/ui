/** Web drag-select provider with DOM target measurement and marquee overlay. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";

import { announce } from "../announcer";
import { DragSelectableContext } from "./DragSelectableContext";
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
  dragSelectableSelectionForTargets,
  dragSelectableShouldStartFromTarget,
  measureDragSelectableTargets,
} from "./dragSelectableDom";
import type { DragSelectableMeasuredTarget } from "./dragSelectableDom";
import type {
  DragSelectableChangeListener,
  DragSelectableProviderProps,
  DragSelectableSelection,
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
const emptySelection: DragSelectableSelection = {
  selectedCount: 0,
  selectedIds: [],
  selectedTargets: [],
};

function defaultSelectionAnnouncement(count: number): string {
  return count === 0
    ? "Selection cleared"
    : `${count} item${count === 1 ? "" : "s"} selected`;
}

export function DragSelectableProvider({
  accessibilityLabel,
  children,
  disabled = false,
  minimumDragDistance,
  onSelectionChange,
  overlayZIndex,
  role = "group",
  selectionAnnouncement,
  selectionLabel,
  style,
}: DragSelectableProviderProps) {
  const theme = useSharedUiTheme();
  const targetsRef = useRef(
    new Map<string, DragSelectableTargetRegistration>(),
  );
  const [registeredTargets, setRegisteredTargets] = useState<
    ReadonlyMap<string, DragSelectableTargetRegistration>
  >(targetsRef.current);
  const [activeId, setActiveId] = useState<string | null>(null);
  const listenersRef = useRef(new Set<DragSelectableChangeListener>());
  const dragSessionRef = useRef<DragSession | null>(null);
  const removeDragListenersRef = useRef<(() => void) | null>(null);
  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const selectionAnnouncementRef = useRef(selectionAnnouncement);
  selectionAnnouncementRef.current = selectionAnnouncement;
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const [selection, setSelection] =
    useState<DragSelectableSelection>(emptySelection);
  const notifiedSelectedIdsRef = useRef<readonly string[]>(
    selection.selectedIds,
  );
  const [activeDrag, setActiveDrag] = useState<DragSelectableActiveDrag | null>(
    null,
  );

  // Publish a fresh snapshot so consumers re-derive roving tabIndex / a11y
  // props when the set of registered targets (or their disabled flags) changes.
  const publishTargets = useCallback(() => {
    setRegisteredTargets(new Map(targetsRef.current));
  }, []);

  const registerTarget = useCallback(
    (target: DragSelectableTargetRegistration) => {
      targetsRef.current.set(target.id, target);
      publishTargets();
      return () => {
        if (targetsRef.current.get(target.id)?.node !== target.node) {
          return;
        }
        targetsRef.current.delete(target.id);
        publishTargets();
      };
    },
    [publishTargets],
  );

  const updateTarget = useCallback(
    (target: DragSelectableTargetOptions) => {
      const current = targetsRef.current.get(target.id);
      if (!current) {
        return;
      }
      const next = { ...current, ...target };
      if (
        current.data === next.data &&
        current.disabled === next.disabled &&
        current.label === next.label &&
        current.order === next.order
      ) {
        return;
      }
      targetsRef.current.set(target.id, next);
      // Only `disabled` / `order` changes affect navigation order; republish so
      // roving tabIndex stays correct, but skip pure data churn.
      if (current.disabled !== next.disabled || current.order !== next.order) {
        publishTargets();
      }
    },
    [publishTargets],
  );

  const matchingTargets = activeDrag?.matchedTargets ?? emptyMatchingTargets;
  const state: DragSelectableState = useMemo(
    () => ({
      dragBox: activeDrag?.box ?? null,
      dragging: Boolean(activeDrag),
      matchingCount: matchingTargets.length,
      matchingIds: matchingTargets.map((target) => target.id),
      matchingTargets,
      selectedCount: selection.selectedCount,
      selectedIds: selection.selectedIds,
      selectedTargets: selection.selectedTargets,
    }),
    [activeDrag, matchingTargets, selection],
  );
  const selectedIdSet = useMemo(
    () => new Set(selection.selectedIds),
    [selection.selectedIds],
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

  useEffect(() => {
    if (
      dragSelectableIdsEqual(
        notifiedSelectedIdsRef.current,
        selection.selectedIds,
      )
    ) {
      return;
    }
    notifiedSelectedIdsRef.current = [...selection.selectedIds];
    onSelectionChangeRef.current?.(selection);
    // Announce the new selection count to assistive tech without moving focus
    // (WCAG 2.1 — 4.1.3 Status Messages, AA). The live count badge lives in a
    // `pointerEvents: none` overlay, so it is invisible to screen readers.
    const message = (
      selectionAnnouncementRef.current ?? defaultSelectionAnnouncement
    )(selection.selectedCount, selection);
    announce(message);
  }, [selection]);

  const clearSelection = useCallback(() => {
    setSelection((current) =>
      current.selectedIds.length === 0 ? current : emptySelection,
    );
  }, []);

  // Keyboard selection: build a fresh selection object from a set of ids by
  // reading current target metadata so `selectedTargets` snapshots stay valid.
  const selectionForIds = useCallback(
    (ids: readonly string[]): DragSelectableSelection => {
      const selectedTargets: DragSelectableTargetSnapshot[] = ids.map((id) => {
        const target = targetsRef.current.get(id);
        return { data: target?.data, id };
      });
      return {
        selectedCount: ids.length,
        selectedIds: [...ids],
        selectedTargets,
      };
    },
    [],
  );

  const setSelectionToIds = useCallback(
    (ids: string[]) => {
      if (disabledRef.current) {
        return;
      }
      setSelection((current) =>
        dragSelectableIdsEqual(current.selectedIds, ids)
          ? current
          : selectionForIds(ids),
      );
    },
    [selectionForIds],
  );

  const toggleSelection = useCallback(
    (id: string) => {
      if (disabledRef.current || targetsRef.current.get(id)?.disabled) {
        return;
      }
      setSelection((current) => {
        const next = current.selectedIds.includes(id)
          ? current.selectedIds.filter((selectedId) => selectedId !== id)
          : [...current.selectedIds, id];
        return selectionForIds(next);
      });
    },
    [selectionForIds],
  );

  const focusTarget = useCallback((id: string) => {
    setActiveId(id);
    if (typeof document === "undefined") {
      return;
    }
    const node = targetsRef.current.get(id)?.node as unknown as
      | { focus?: () => void }
      | undefined;
    node?.focus?.();
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
    if (disabledRef.current) {
      return;
    }
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
    setSelection(dragSelectableSelectionForTargets(selectedTargetsForBox));
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

  useEffect(() => {
    if (disabled) {
      cancelDrag();
    }
  }, [cancelDrag, disabled]);

  const subscribe = useCallback((listener: DragSelectableChangeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const context = useMemo(
    () => ({
      activeId,
      clearSelection,
      focusTarget,
      matchedIdSet,
      registeredTargets,
      registerTarget,
      selectedIdSet,
      setSelection: setSelectionToIds,
      state,
      subscribe,
      toggleSelection,
      updateTarget,
    }),
    [
      activeId,
      clearSelection,
      focusTarget,
      matchedIdSet,
      registeredTargets,
      registerTarget,
      selectedIdSet,
      setSelectionToIds,
      state,
      subscribe,
      toggleSelection,
      updateTarget,
    ],
  );

  return (
    <DragSelectableContext.Provider value={context}>
      <View
        accessibilityLabel={accessibilityLabel}
        // RNW forwards the literal `role` prop to the DOM; the base RN
        // `accessibilityRole` type omits `"group"`, so use `role` (matching the
        // heatmap legend) to expose the selectable collection (WCAG 2.1 — 1.3.1
        // Info & Relationships, A).
        onPointerDown={beginDrag}
        role={role}
        style={style}
      >
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
