/** Shared context and hooks for drag-selectable targets. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform } from "react-native";

import { useFocusRing } from "../focusRing";
import { nextNavIndex, rovingTabIndex } from "../keyboardNavigation";

import type {
  DragSelectableChangeListener,
  DragSelectableState,
  DragSelectableTargetKeyEvent,
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
  /** Id of the target that currently owns the group's single tab stop. */
  activeId: string | null;
  clearSelection: () => void;
  /** Move the roving focus + DOM focus to the target at `id`. */
  focusTarget: (id: string) => void;
  matchedIdSet: ReadonlySet<string>;
  /** Stable registration map; used to resolve nodes for keyboard focus moves. */
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  registerTarget: (target: DragSelectableTargetRegistration) => () => void;
  selectedIdSet: ReadonlySet<string>;
  /** Toggle a single target's membership in the committed selection. */
  toggleSelection: (id: string) => void;
  /** Replace the committed selection with `ids` (Shift+Arrow range select). */
  setSelection: (ids: string[]) => void;
  state: DragSelectableState;
  subscribe: (listener: DragSelectableChangeListener) => () => void;
  updateTarget: (target: DragSelectableTargetOptions) => void;
};

const emptySet = new Set<string>();
const emptyMap = new Map<string, DragSelectableTargetRegistration>();

const defaultContext: DragSelectableContextValue = {
  activeId: null,
  clearSelection: () => undefined,
  focusTarget: () => undefined,
  matchedIdSet: emptySet,
  registeredTargets: emptyMap,
  registerTarget: () => () => undefined,
  selectedIdSet: emptySet,
  setSelection: () => undefined,
  toggleSelection: () => undefined,
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
  const {
    activeId,
    focusTarget,
    matchedIdSet,
    registeredTargets,
    registerTarget,
    selectedIdSet,
    setSelection,
    state,
    toggleSelection,
    updateTarget,
  } = useContext(DragSelectableContext);
  const { data, disabled, disableFocusRing, id, label, order } = options;
  const cleanupRef = useRef<(() => void) | null>(null);
  const latestOptionsRef = useRef(options);
  latestOptionsRef.current = options;
  const focus = useFocusRing({ disabled: disableFocusRing });

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
    updateTarget({ data, disabled, id, label, order });
  }, [data, disabled, id, label, order, updateTarget]);

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    },
    [],
  );

  const selected = selectedIdSet.has(id);

  const handleKeyDown = useCallback(
    (event: DragSelectableTargetKeyEvent) => {
      if (disabled) {
        return;
      }
      const key = event.nativeEvent?.key ?? event.key;
      const shift = event.nativeEvent?.shiftKey ?? event.shiftKey ?? false;
      if (!key) {
        return;
      }
      // Build the ordered, non-disabled id list for arrow navigation.
      const orderedIds = orderedTargetIds(registeredTargets);
      const currentIndex = orderedIds.indexOf(id);

      if (key === " " || key === "Spacebar" || key === "Enter") {
        event.preventDefault?.();
        event.stopPropagation?.();
        toggleSelection(id);
        return;
      }

      const nextIndex = nextNavIndex({
        count: orderedIds.length,
        index: currentIndex < 0 ? 0 : currentIndex,
        key,
        orientation: "vertical",
      });
      if (nextIndex === null) {
        return;
      }
      event.preventDefault?.();
      event.stopPropagation?.();
      const nextId = orderedIds[nextIndex];
      if (nextId === undefined) {
        return;
      }
      // Shift+Arrow extends the selection from the anchor to the new target.
      if (shift && currentIndex >= 0) {
        const [from, to] =
          nextIndex < currentIndex
            ? [nextIndex, currentIndex]
            : [currentIndex, nextIndex];
        setSelection(orderedIds.slice(from, to + 1));
      }
      focusTarget(nextId);
    },
    [
      disabled,
      focusTarget,
      id,
      registeredTargets,
      setSelection,
      toggleSelection,
    ],
  );

  // The group is a single Tab stop: only the active target is tabbable (roving
  // tabindex, WCAG 2.1 — 2.1.1 Keyboard, A / 4.1.2 Name, Role, Value, A). When
  // no target has been focused yet, the first registered target seeds the stop.
  const orderedIds = useMemo(
    () => orderedTargetIds(registeredTargets),
    [registeredTargets],
  );
  const index = orderedIds.indexOf(id);
  const activeIndex = activeId === null ? 0 : orderedIds.indexOf(activeId);
  const tabIndex = rovingTabIndex(index, activeIndex < 0 ? 0 : activeIndex);

  return useMemo(
    () => ({
      a11yProps: {
        accessibilityLabel: label ?? id,
        accessibilityRole: "checkbox" as const,
        accessibilityState: { checked: selected, disabled: Boolean(disabled) },
        "aria-checked": selected,
        onBlur: focus.onBlur,
        onFocus: focus.onFocus,
        ...(Platform.OS === "web" ? { onKeyDown: handleKeyDown } : {}),
        ...(disabled ? {} : { tabIndex }),
      },
      dragging: state.dragging,
      focused: focus.focused,
      focusRingStyle: focus.focusRingStyle,
      matching: matchedIdSet.has(id),
      ref: targetRef,
      selected,
    }),
    [
      disabled,
      focus.focusRingStyle,
      focus.focused,
      focus.onBlur,
      focus.onFocus,
      handleKeyDown,
      id,
      label,
      matchedIdSet,
      selected,
      state.dragging,
      tabIndex,
      targetRef,
    ],
  );
}

/**
 * Resolves registered, non-disabled target ids in keyboard-navigation order:
 * by explicit `order` when provided, otherwise by DOM document order so arrow
 * keys move through the visible layout.
 */
export function orderedTargetIds(
  targets: ReadonlyMap<string, DragSelectableTargetRegistration>,
): string[] {
  const entries = [...targets.values()].filter((target) => !target.disabled);
  if (typeof document === "undefined" || typeof Node === "undefined") {
    return sortByOrder(entries).map((target) => target.id);
  }
  // Sort by DOM document order; fall back to explicit `order` to break ties.
  entries.sort((a, b) => {
    const nodeA = a.node as unknown as Node;
    const nodeB = b.node as unknown as Node;
    const position = nodeA.compareDocumentPosition?.(nodeB);
    if (position && position & Node.DOCUMENT_POSITION_FOLLOWING) {
      return -1;
    }
    if (position && position & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return entries.map((target) => target.id);
}

function sortByOrder(
  entries: DragSelectableTargetRegistration[],
): DragSelectableTargetRegistration[] {
  return [...entries].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
