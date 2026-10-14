/** Shared context and hooks for drag-selectable targets. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Platform, type ViewStyle } from "../primitives/reactNative";

import { useFocusRing } from "../focusRing";
import { rovingTabIndex } from "../keyboardNavigation";

import { orderedTargetIds } from "./dragSelectableTargetOrder";
import type {
  DragSelectableChangeListener,
  DragSelectableState,
  DragSelectableTargetOptions,
  DragSelectableTargetRegistration,
  DragSelectableTargetResult,
} from "./dragSelectableTypes";
import { useDragSelectableTargetKeys } from "./useDragSelectableTargetKeys";

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
  /** Move the roving focus + DOM focus to the target at `id`. */
  focusTarget: (id: string) => void;
  matchedIdSet: ReadonlySet<string>;
  /** Stable registration map; used to resolve nodes for keyboard focus moves. */
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  registerTarget: (target: DragSelectableTargetRegistration) => () => void;
  selectedIdSet: ReadonlySet<string>;
  /** Toggle a single target's membership in the selection (Space / Enter). */
  toggleSelection: (id: string) => void;
  /** Select a keyboard range of target ids (Shift + Arrow). */
  setSelection: (ids: string[]) => void;
  state: DragSelectableState;
  subscribe: (listener: DragSelectableChangeListener) => () => void;
  updateTarget: (target: DragSelectableTargetOptions) => void;
};

const emptySet = new Set<string>();
const emptyMap = new Map<string, DragSelectableTargetRegistration>();

export const defaultDragSelectableContext: DragSelectableContextValue = {
  activeId: null,
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

export const DragSelectableContext = createContext<DragSelectableContextValue>(
  defaultDragSelectableContext,
);

/**
 * Kept for source compatibility with the earlier documented pattern
 * `target.focused ? target.focusRingStyle : null`. It is always empty: the CSS
 * marker in `a11yProps` paints the web glow, and handing out the hook's inline
 * glow as well made `View` compose a second halo on top of the first.
 */
const EMPTY_FOCUS_RING_STYLE = Object.freeze({}) as ViewStyle;

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
  const { data, disabled, focusIndicator, id, label, order } = options;
  const cleanupRef = useRef<(() => void) | null>(null);
  const latestOptionsRef = useRef(options);
  latestOptionsRef.current = options;
  const focus = useFocusRing({ indicator: focusIndicator });

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

  const handleKeyDown = useDragSelectableTargetKeys({
    disabled,
    focusTarget,
    id,
    registeredTargets,
    selectRange: setSelection,
    toggleSelection,
  });

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
        ...focus.focusRingProps,
        ...(Platform.OS === "web"
          ? {
              dataSet: {
                ...focus.focusRingProps.dataSet,
                dragSelectTarget: id,
              },
            }
          : {}),
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
      focused: focus.focusVisible,
      focusRingStyle: EMPTY_FOCUS_RING_STYLE,
      matching: matchedIdSet.has(id),
      ref: targetRef,
      selected,
    }),
    [
      disabled,
      focus.focusRingProps,
      focus.focusVisible,
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
