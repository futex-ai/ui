/** Shared open-state and row-close helpers for dropdown menus. */
import type { DropdownListEntry } from "./DropdownList";

/** Keyboard event shape handled by dropdown menu triggers. */
export type DropdownMenuTriggerKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

/** Props to spread onto a dropdown menu trigger. */
export type DropdownMenuTriggerProps = {
  "aria-expanded": boolean;
  onKeyDown?: (event: DropdownMenuTriggerKeyEvent) => boolean | void;
  onPress: () => void;
};

/** Resolved controlled/uncontrolled open state for a dropdown menu. */
export type DropdownMenuOpenState = {
  controlled: boolean;
  open: boolean;
};

/** Resolve dropdown menu open state from the optional controlled prop. */
export function resolveDropdownMenuOpen(
  openProp: boolean | undefined,
  uncontrolledOpen: boolean,
): DropdownMenuOpenState {
  if (openProp === undefined) {
    return { controlled: false, open: uncontrolledOpen };
  }
  return { controlled: true, open: openProp };
}

/** Build trigger props that toggle the menu and expose expanded state. */
export function dropdownMenuTriggerProps(
  open: boolean,
  toggle: () => void,
): DropdownMenuTriggerProps {
  return {
    "aria-expanded": open,
    onPress: toggle,
  };
}

/** Wrap selectable row presses so common action menus close after selection. */
export function closeDropdownMenuEntries(
  entries: DropdownListEntry[],
  onClose: () => void,
  closeOnSelect: boolean,
): DropdownListEntry[] {
  if (!closeOnSelect) {
    return entries;
  }
  return entries.map((entry): DropdownListEntry => {
    if ((entry.type !== "item" && entry.type !== "footer") || entry.disabled) {
      return entry;
    }
    return {
      ...entry,
      onPress: () => {
        entry.onPress?.();
        onClose();
      },
    };
  });
}
