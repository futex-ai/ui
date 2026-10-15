/** Key handling for input-backed combobox result lists. */
import type { DropdownListEntry } from "./DropdownList";
import { isActivatableDropdownListEntry } from "./dropdownListModel";
import { dropdownKeyAction, nextSelectableId } from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";

export type ComboboxKeyboardEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};

/** The list state a combobox keydown reads and updates. */
export type ComboboxKeyState = {
  activeId: string | null;
  entries: DropdownListEntry[];
  navItems: DropdownNavigationItem[];
  onClose: () => void;
  onOpen: () => void;
  open: boolean;
  setActiveId: (id: string | null) => void;
};

/**
 * Handles one keydown from the combobox input and returns whether it claimed
 * the key. Arrow keys open the list and move the active row (wrapping, and
 * stopping on reachable disabled or locked rows), Enter opens the list or
 * activates the active row when it can be activated, and Escape closes the
 * list. Space is never claimed: it types into the input.
 */
export function handleComboboxKeyDown(
  event: ComboboxKeyboardEvent,
  {
    activeId,
    entries,
    navItems,
    onClose,
    onOpen,
    open,
    setActiveId,
  }: ComboboxKeyState,
): boolean {
  const action = dropdownKeyAction(event.nativeEvent?.key ?? event.key ?? "");
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
  if (isActivatableDropdownListEntry(active)) {
    active.onPress?.();
  }
  return true;
}
