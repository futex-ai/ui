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

export function DragSelectableProvider({
  children,
  style,
}: DragSelectableProviderProps) {
  const listenersRef = useRef(new Set<DragSelectableChangeListener>());
  const subscribe = useCallback((listener: DragSelectableChangeListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);
  const context = useMemo(
    () => ({
      clearSelection: () => undefined,
      matchedIdSet: emptySet,
      registerTarget: (_target: DragSelectableTargetRegistration) => () =>
        undefined,
      selectedIdSet: emptySet,
      state: emptyDragSelectableState,
      subscribe,
      updateTarget: (_target: DragSelectableTargetOptions) => undefined,
    }),
    [subscribe],
  );

  return (
    <DragSelectableContext.Provider value={context}>
      <View style={style}>{children}</View>
    </DragSelectableContext.Provider>
  );
}
