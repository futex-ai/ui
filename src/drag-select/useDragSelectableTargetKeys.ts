/** Keyboard selection and roving focus for one drag-select target. */
import { useCallback } from "react";

import { nextNavIndex } from "../keyboardNavigation";

import { orderedTargetIds } from "./dragSelectableTargetOrder";
import type {
  DragSelectableTargetKeyEvent,
  DragSelectableTargetRegistration,
} from "./dragSelectableTypes";

/** What a target's key handler reads from its provider. */
export type DragSelectableTargetKeysConfig = {
  disabled: boolean | undefined;
  focusTarget: (id: string) => void;
  id: string;
  registeredTargets: ReadonlyMap<string, DragSelectableTargetRegistration>;
  selectRange: (ids: string[]) => void;
  toggleSelection: (id: string) => void;
};

/**
 * Space or Enter toggles the target. Arrow keys, Home, and End move the
 * roving focus in keyboard order. Shift with an arrow key selects the range
 * from this target to the next one.
 */
export function useDragSelectableTargetKeys({
  disabled,
  focusTarget,
  id,
  registeredTargets,
  selectRange,
  toggleSelection,
}: DragSelectableTargetKeysConfig) {
  return useCallback(
    (event: DragSelectableTargetKeyEvent) => {
      if (disabled) {
        return;
      }
      const key = event.nativeEvent?.key ?? event.key;
      const shift = event.nativeEvent?.shiftKey ?? event.shiftKey ?? false;
      if (!key) {
        return;
      }
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
      if (shift && currentIndex >= 0) {
        const [from, to] =
          nextIndex < currentIndex
            ? [nextIndex, currentIndex]
            : [currentIndex, nextIndex];
        selectRange(orderedIds.slice(from, to + 1));
      }
      focusTarget(nextId);
    },
    [
      disabled,
      focusTarget,
      id,
      registeredTargets,
      selectRange,
      toggleSelection,
    ],
  );
}
