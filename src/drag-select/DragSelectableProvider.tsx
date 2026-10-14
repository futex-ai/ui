/** Native-safe drag-select provider fallback. */
import { useCallback, useMemo, useRef } from "react";
import { View } from "../primitives/reactNative";

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
import { useDragSelectableOptionLayers } from "./useDragSelectableOptionLayers";

const emptySet = new Set<string>();
const emptyMap = new Map<string, DragSelectableTargetRegistration>();

export function DragSelectableProvider({
  accessibilityLabel,
  children,
  role = "group",
  style,
  testID,
  ...providerOptions
}: DragSelectableProviderProps) {
  const { layers } = useDragSelectableOptionLayers(providerOptions);
  const listenersRef = useRef(new Set<DragSelectableChangeListener>());
  const subscribe = useCallback((listener: DragSelectableChangeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);
  const context = useMemo(
    () => ({
      activeId: null,
      focusTarget: (_id: string) => undefined,
      matchedIdSet: emptySet,
      optionLayers: layers,
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
    [layers, subscribe],
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
