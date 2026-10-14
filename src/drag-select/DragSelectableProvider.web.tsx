/** Web drag-select provider with DOM target measurement and marquee overlay. */
import { View } from "../primitives/reactNative";

import { useSharedUiTheme } from "../theme";

import { DragSelectableContext } from "./DragSelectableContext";
import { DragSelectableOverlay } from "./DragSelectableOverlay";
import type { DragSelectableProviderProps } from "./dragSelectableTypes";
import { useDragSelectableGesture } from "./useDragSelectableGesture";
import { useDragSelectableProviderValue } from "./useDragSelectableProviderValue";
import { useDragSelectableRegistry } from "./useDragSelectableRegistry";
import { useDragSelectableSelectionState } from "./useDragSelectableSelectionState";

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
  testID,
}: DragSelectableProviderProps) {
  const theme = useSharedUiTheme();
  const registry = useDragSelectableRegistry();
  const selection = useDragSelectableSelectionState({
    disabled,
    onSelectionChange,
    registeredTargets: registry.registeredTargets,
    selectionAnnouncement,
    targetsRef: registry.targetsRef,
  });
  const gesture = useDragSelectableGesture({
    commit: selection.commitDrag,
    disabled,
    minimumDragDistance,
    registry,
  });
  const context = useDragSelectableProviderValue({
    activeDrag: gesture.activeDrag,
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
        overlayZIndex={overlayZIndex}
        selectionLabel={selectionLabel}
        theme={theme}
      />
    </DragSelectableContext.Provider>
  );
}
