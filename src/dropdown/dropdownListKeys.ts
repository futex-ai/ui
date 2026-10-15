/** Keyboard handling for a dropdown list that holds DOM focus itself. */
import type { DropdownListEntry } from "./DropdownList";
import { isActivatableDropdownListEntry } from "./dropdownListModel";
import { dropdownKeyAction, nextSelectableId } from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";

export type DropdownListKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
};

/**
 * Arrow keys move the active row, Enter and Space activate it when it can be
 * activated, and Escape closes the list. Used while focus sits inside the list
 * (a row or its scroll view); input-backed lists drive the same state from a
 * document listener instead.
 */
export function handleDropdownListKeyDown(
  event: DropdownListKeyEvent,
  {
    activeId,
    entries,
    navItems,
    onClose,
    setActiveId,
  }: {
    activeId: string | null;
    entries: DropdownListEntry[];
    navItems: DropdownNavigationItem[];
    onClose: () => void;
    setActiveId: (id: string | null) => void;
  },
): void {
  const action = dropdownKeyAction(event.nativeEvent?.key ?? event.key ?? "");
  if (!action) return;
  event.preventDefault?.();
  if (action === "close") {
    onClose();
    return;
  }
  if (action === "moveDown" || action === "moveUp") {
    setActiveId(
      nextSelectableId(navItems, activeId, action === "moveDown" ? 1 : -1),
    );
    return;
  }
  const active = entries.find((entry) => entry.id === activeId);
  if (isActivatableDropdownListEntry(active)) {
    active.onPress?.();
  }
}
