/** Keyboard state for input-backed combobox result lists. */
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DropdownListEntry } from "./DropdownList";
import { handleComboboxKeyDown } from "./comboboxKeys";
import type { ComboboxKeyboardEvent } from "./comboboxKeys";
import {
  dropdownListNavigationItems,
  selectedDropdownListEntryId,
} from "./dropdownListModel";
import { navigationResetKey, selectedOrFirstId } from "./dropdownNavigation";

type ComboboxNavigationOptions = {
  entries: DropdownListEntry[];
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
  /**
   * DOM ids of the elements that own the combobox's keys: normally the input
   * and its result list. When set, the document listener leaves alone a
   * keydown aimed at any other focused control, so Enter on a chip's remove
   * button or the next field reaches that control instead of activating the
   * active row. Omit to claim every keydown while the list is open.
   */
  ownerIds?: string[];
};

export function useComboboxNavigation({
  entries,
  onClose,
  onOpen,
  open,
  ownerIds,
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
    (event: ComboboxKeyboardEvent): boolean =>
      handleComboboxKeyDown(event, {
        activeId,
        entries,
        navItems,
        onClose,
        onOpen,
        open,
        setActiveId,
      }),
    [activeId, entries, navItems, onClose, onOpen, open],
  );

  // Arrow/Enter/Escape navigation runs through a document-level capture
  // listener while the result list is open rather than the field's own
  // `onKeyDown`, the same approach `useDropdownSelectorNavigation` uses: a
  // field's key events do not propagate, so a handler on an ancestor never sees
  // them (WCAG 2.1.1 Keyboard). The listener runs first and stops propagation
  // for the keys it claims, so the `onKeyDown` in `keyProps` — which the web
  // backend does deliver, and which native needs — never handles one twice.
  const ownerKey = ownerIds?.join(" ");
  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }
    const owners = ownerKey ? ownerKey.split(" ") : null;
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (owners && !ownsComboboxKeyTarget(owners, event.target)) {
        return;
      }
      if (handleKeyDown(event)) {
        event.stopPropagation();
      }
    };
    document.addEventListener("keydown", handleDocumentKeyDown, true);
    return () =>
      document.removeEventListener("keydown", handleDocumentKeyDown, true);
  }, [handleKeyDown, open, ownerKey]);

  return {
    activeId,
    keyProps: { onKeyDown: handleKeyDown },
    setActiveId,
  };
}

/**
 * Whether a keydown belongs to the combobox: its target sits inside one of the
 * owner elements, or no control has focus (the event lands on the page root,
 * for example after a press on a non-focusable part of the result list). Any
 * other focused control keeps its own keys.
 */
function ownsComboboxKeyTarget(
  ownerIds: string[],
  target: EventTarget | null,
): boolean {
  if (
    !(target instanceof Node) ||
    target === document.body ||
    target === document.documentElement
  ) {
    return true;
  }
  return ownerIds.some(
    (id) => document.getElementById(id)?.contains(target) ?? false,
  );
}
