/** Keyboard state for button-backed dropdown selectors. */
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

type DropdownSelectorNavigationOptions = {
  entries: DropdownListEntry[];
  interactive: boolean;
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
};

type DropdownKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export function useDropdownSelectorNavigation({
  entries,
  interactive,
  onClose,
  onOpen,
  open,
}: DropdownSelectorNavigationOptions) {
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
    (event: DropdownKeyboardEvent): boolean => {
      if (!interactive) {
        return false;
      }
      const action = dropdownKeyAction(
        event.nativeEvent?.key ?? event.key ?? "",
      );
      if (!action) {
        return false;
      }
      if (!open && (action === "select" || action === "toggle")) {
        return false;
      }
      event.preventDefault?.();
      if (action === "close") {
        onClose();
        return true;
      }
      if (action === "moveDown" || action === "moveUp") {
        setActiveId(
          nextSelectableId(
            navItems,
            open ? activeId : selectedId,
            action === "moveDown" ? 1 : -1,
          ),
        );
        if (!open) {
          onOpen();
        }
        return true;
      }
      const active = entries.find((entry) => entry.id === activeId);
      if (active && "onPress" in active && !active.disabled) {
        active.onPress?.();
      }
      return true;
    },
    [
      activeId,
      entries,
      interactive,
      navItems,
      onClose,
      onOpen,
      open,
      selectedId,
    ],
  );

  useEffect(() => {
    if (!open || !interactive || typeof document === "undefined") {
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
  }, [handleKeyDown, interactive, open]);

  return {
    activeId,
    keyProps: { onKeyDown: handleKeyDown },
    setActiveId,
  };
}
