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

  // Arrow/Enter/Escape navigation runs through a document-level capture
  // listener while the result list is open rather than the field's own
  // `onKeyDown`, the same approach `useDropdownSelectorNavigation` uses: a
  // field's key events do not propagate, so a handler on an ancestor never sees
  // them (WCAG 2.1.1 Keyboard). The listener runs first and stops propagation
  // for the keys it claims, so the `onKeyDown` in `keyProps` — which the web
  // backend does deliver, and which native needs — never handles one twice.
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
