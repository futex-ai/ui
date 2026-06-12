/** Keyboard state for input-backed combobox result lists. */
import { useEffect, useMemo, useState } from "react";

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

  const keyProps = {
    onKeyDown: (event: {
      key?: string;
      nativeEvent?: { key?: string };
      preventDefault?: () => void;
    }) => {
      const action = dropdownKeyAction(
        event.nativeEvent?.key ?? event.key ?? "",
      );
      if (!action || action === "toggle") {
        return;
      }
      event.preventDefault?.();
      if (action === "close") {
        onClose();
        return;
      }
      if (action === "moveDown" || action === "moveUp") {
        if (!open) {
          onOpen();
        }
        setActiveId((current) =>
          nextSelectableId(
            navItems,
            open ? current : null,
            action === "moveDown" ? 1 : -1,
          ),
        );
        return;
      }
      if (!open) {
        onOpen();
        return;
      }
      const active = entries.find((entry) => entry.id === activeId);
      if (active && "onPress" in active && !active.disabled) {
        active.onPress?.();
      }
    },
  };

  return { activeId, keyProps, setActiveId };
}
