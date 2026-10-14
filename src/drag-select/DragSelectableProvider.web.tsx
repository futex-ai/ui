/** Web drag-select provider with DOM target measurement and marquee overlay. */
import { View } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";

import { DragSelectableContext } from "./DragSelectableContext";
import { DragSelectableOverlay } from "./DragSelectableOverlay";
import type { DragSelectableProviderProps } from "./dragSelectableTypes";
import { useDragSelectableGesture } from "./useDragSelectableGesture";
import { useDragSelectableOptionLayers } from "./useDragSelectableOptionLayers";
import { useDragSelectableProviderValue } from "./useDragSelectableProviderValue";
import { useDragSelectableRegistry } from "./useDragSelectableRegistry";
import { useDragSelectableSelectionState } from "./useDragSelectableSelectionState";

export function DragSelectableProvider({
  accessibilityLabel,
  children,
  role = "group",
  style,
  testID,
  ...providerOptions
}: DragSelectableProviderProps) {
  const theme = useSharedUiTheme();
  const { layers, options, readOptions } =
    useDragSelectableOptionLayers(providerOptions);
  const registry = useDragSelectableRegistry();
  const selection = useDragSelectableSelectionState({
    disabled: options.disabled,
    onSelectionChange: options.onSelectionChange,
    registeredTargets: registry.registeredTargets,
    selectionAnnouncement: options.selectionAnnouncement,
    targetsRef: registry.targetsRef,
  });
  const gesture = useDragSelectableGesture({
    commit: selection.commitDrag,
    disabled: options.disabled,
    readOptions,
    registry,
  });
  const context = useDragSelectableProviderValue({
    activeDrag: gesture.activeDrag,
    optionLayers: layers,
    registry,
    selection,
  });

  return (
    <DragSelectableContext.Provider value={context}>
      <View
        accessibilityLabel={accessibilityLabel}
        // RNW forwards the literal `role` prop to the DOM; the base RN
        // `accessibilityRole` type omits `"group"`, so use `role` (matching the
        // heatmap legend) to expose the selectable collection (WCAG 2.1 — 1.3.1
        // Info & Relationships, A).
        onPointerDown={gesture.onPointerDown}
        role={role}
        style={style}
        testID={testID}
      >
        {children}
      </View>
      <DragSelectableOverlay
        activeDrag={gesture.activeDrag}
        overlayZIndex={options.overlayZIndex}
        selectionLabel={options.selectionLabel}
        theme={theme}
      />
    </DragSelectableContext.Provider>
  );
}
