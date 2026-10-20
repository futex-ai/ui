/** Keyboard state for button-backed dropdown selectors. */
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOverlayInputOwner } from "../modal/useOverlayInputOwner";

import type { DropdownListEntry } from "./DropdownList";
import {
  dropdownListNavigationItems,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
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
  resetOnOpen?: boolean;
  // When the menu is backed by a search input, the space bar must reach the
  // input as typed text rather than activating the active row.
  typeahead?: boolean;
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
  resetOnOpen = false,
  typeahead = false,
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

  useEffect(() => {
    if (open && resetOnOpen) {
      setActiveId(selectedOrFirstId(navItems, selectedId));
    }
  }, [navKey, open, resetOnOpen, selectedId]);

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
      if (typeahead && action === "toggle") {
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
      typeahead,
    ],
  );

  // The document listener sees keys typed into a web dialog above the open
  // menu too, so it handles a key only while the menu owns input.
  const ownsInput = useOverlayInputOwner();
  useEffect(() => {
    if (!open || !interactive || typeof document === "undefined") {
      return;
    }
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (!ownsInput()) {
        return;
      }
      if (handleKeyDown(event)) {
        event.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () =>
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [handleKeyDown, interactive, open, ownsInput]);

  return {
    activeId,
    keyProps: { onKeyDown: handleKeyDown },
    setActiveId,
  };
}
