/**
 * Native drag-select provider. It keeps the options, the registered targets,
 * and the selection (controlled or uncontrolled) like the web provider, so
 * `target.selected` and the selection hooks work, but it has no drag gesture
 * and draws no box.
 */
import { View } from "../primitives/reactNative";

import { DragSelectableContext } from "./DragSelectableContext";
import { dragSelectableProviderRole } from "./dragSelectableRole";
import type { DragSelectableProviderProps } from "./dragSelectableTypes";
import { useDragSelectableCore } from "./useDragSelectableCore";
import { useDragSelectableProviderValue } from "./useDragSelectableProviderValue";

export function DragSelectableProvider({
  accessibilityLabel,
  children,
  defaultSelectedIds,
  role,
  style,
  testID,
  ...providerOptions
}: DragSelectableProviderProps) {
  const { layers, registry, selection } = useDragSelectableCore(
    providerOptions,
    defaultSelectedIds,
  );
  const context = useDragSelectableProviderValue({
    activeDrag: null,
    optionLayers: layers,
    registry,
    selection,
  });

  return (
    <DragSelectableContext.Provider value={context}>
      <View
        accessibilityLabel={accessibilityLabel}
        role={dragSelectableProviderRole(role, accessibilityLabel)}
        style={style}
        testID={testID}
      >
        {children}
      </View>
    </DragSelectableContext.Provider>
  );
}
