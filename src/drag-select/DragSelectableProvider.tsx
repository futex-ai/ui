/** Native-safe drag-select provider fallback. */
import { useCallback, useMemo, useRef } from "react";
import { View } from "react-native";

import {
  DragSelectableContext,
  emptyDragSelectableState,
} from "./DragSelectableContext";
import type {
  DragSelectableChangeListener,
  DragSelectableProviderProps,
  DragSelectableTargetOptions,
  DragSelectableTargetRegistration,
} from "./dragSelectableTypes";

const emptySet = new Set<string>();
const emptyMap = new Map<string, DragSelectableTargetRegistration>();

export function DragSelectableProvider({
  accessibilityLabel,
  children,
  role = "group",
  style,
  testID,
}: DragSelectableProviderProps) {
  const listenersRef = useRef(new Set<DragSelectableChangeListener>());
  const subscribe = useCallback((listener: DragSelectableChangeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);
  const context = useMemo(
    () => ({
      activeId: null,
      clearSelection: () => undefined,
      focusTarget: (_id: string) => undefined,
      matchedIdSet: emptySet,
      registeredTargets: emptyMap,
      registerTarget: (_target: DragSelectableTargetRegistration) => () =>
        undefined,
      selectedIdSet: emptySet,
      setSelection: (_ids: string[]) => undefined,
      state: emptyDragSelectableState,
      subscribe,
      toggleSelection: (_id: string) => undefined,
      updateTarget: (_target: DragSelectableTargetOptions) => undefined,
    }),
    [subscribe],
  );

  return (
    <DragSelectableContext.Provider value={context}>
      <View
        accessibilityLabel={accessibilityLabel}
        role={role}
        style={style}
        testID={testID}
      >
        {children}
      </View>
    </DragSelectableContext.Provider>
  );
}
