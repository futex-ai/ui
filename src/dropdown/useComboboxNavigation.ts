/** Keyboard state for input-backed combobox result lists. */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  DropdownListEntry,
  dropdownListNavigationItems,
  selectedDropdownListEntryId,
} from "./DropdownList";
import {
  dropdownKeyAction,
  navigationResetKey,
  nextSelectableId,
  selectedOrFirstId,
} from "./dropdownNavigation";

type ComboboxNavigationOptions = {
  entries: DropdownListEntry[];
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
};

type ComboboxKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};

export function useComboboxNavigation({
  entries,
  onClose,
  onOpen,
  open,
}: ComboboxNavigationOptions) {
  const navItems = useMemo(
    () => dropdownListNavigationItems(entries),
    [entries],
  );
  const navKey = navigationResetKey(navItems);
  const selectedId = selectedDropdownListEntryId(entries);
  const [activeId, setActiveId] = useState<string | null>(
    selectedOrFirstId(navItems, selectedId),
  );

  useEffect(() => {
    setActiveId(selectedOrFirstId(navItems, selectedId));
  }, [navKey, selectedId]);

  const handleKeyDown = useCallback(
    (event: ComboboxKeyboardEvent): boolean => {
      const action = dropdownKeyAction(
        event.nativeEvent?.key ?? event.key ?? "",
      );
      // Space must reach the input as typed text (the combobox filters as you
      // type), so the toggle action is never consumed here.
      if (!action || action === "toggle") {
        return false;
      }
      event.preventDefault?.();
      if (action === "close") {
        onClose();
        return true;
      }
      if (action === "moveDown" || action === "moveUp") {
        if (!open) {
          onOpen();
        }
        setActiveId(
          nextSelectableId(
            navItems,
            open ? activeId : null,
            action === "moveDown" ? 1 : -1,
          ),
        );
        return true;
      }
      if (!open) {
        onOpen();
        return true;
      }
      const active = entries.find((entry) => entry.id === activeId);
      if (active && "onPress" in active && !active.disabled) {
        active.onPress?.();
      }
      return true;
    },
    [activeId, entries, navItems, onClose, onOpen, open],
  );

  // React Native Web's `TextInput` replaces a forwarded `onKeyDown` with its
  // internal handler, so a key handler spread onto the input never fires
  // (WCAG 2.1.1 Keyboard). Arrow/Enter/Escape navigation therefore runs through
  // a document-level capture listener while the result list is open, the same
  // approach `useDropdownSelectorNavigation` uses. The `onKeyDown` in `keyProps`
  // is kept only so a non-`TextInput` consumer (or native) still works.
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (handleKeyDown(event)) {
        event.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () =>
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [handleKeyDown, open]);

  return {
    activeId,
    keyProps: { onKeyDown: handleKeyDown },
    setActiveId,
  };
}
