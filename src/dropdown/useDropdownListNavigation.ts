/** Active-row state, scroll tracking, and key handling for `DropdownList`. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ScrollView, View } from "../primitives/reactNative";

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
  shouldResetDropdownListActiveId,
} from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";
import { scrollDropdownActiveRowIntoView } from "./dropdownScroll";

type DropdownListNavigationOptions = {
  /** The caller's active row, or `undefined` to track it here. */
  controlledActiveId: string | null | undefined;
  /** Rows inside the scroll area. */
  entries: DropdownListEntry[];
  /** Rows pinned below the scroll area. */
  footerEntries: DropdownListEntry[];
  maxHeight: number;
  onActiveIdChange?: (id: string | null) => void;
  onClose: () => void;
};

/**
 * Tracks the keyboard-active row (controlled or not), keeps it scrolled into
 * view, and handles keys pressed while focus is inside the list. Pinned
 * footer rows navigate after the scrolling rows, so ArrowDown from the last
 * option reaches them and ArrowUp from the first wraps to them. They register
 * no scroll ref, so moving onto one never scrolls the options.
 */
export function useDropdownListNavigation({
  controlledActiveId,
  entries,
  footerEntries,
  maxHeight,
  onActiveIdChange,
  onClose,
}: DropdownListNavigationOptions) {
  const rowRefs = useRef(new Map<string, View>());
  const scrollRef = useRef<ScrollView>(null);
  const allEntries = useMemo(
    () => (footerEntries.length > 0 ? [...entries, ...footerEntries] : entries),
    [entries, footerEntries],
  );
  const navItems = useMemo<DropdownNavigationItem[]>(
    () => dropdownListNavigationItems(allEntries),
    [allEntries],
  );
  const navKey = navigationResetKey(navItems);
  const selectedId = selectedDropdownListEntryId(entries);
  const [uncontrolledActiveId, setUncontrolledActiveId] = useState<
    string | null
  >(selectedOrFirstId(navItems, selectedId));
  const activeId =
    controlledActiveId === undefined
      ? uncontrolledActiveId
      : controlledActiveId;
  const setActiveId = (id: string | null) => {
    if (controlledActiveId === undefined) {
      setUncontrolledActiveId(id);
    }
    onActiveIdChange?.(id);
  };

  useEffect(() => {
    if (shouldResetDropdownListActiveId(controlledActiveId)) {
      setUncontrolledActiveId(selectedOrFirstId(navItems, selectedId));
    }
  }, [controlledActiveId, navKey, selectedId]);

  // Also re-run when the list's height changes: a web portal lays the list out
  // once at its natural height to measure it, then clamps it to the room
  // beside the anchor, which can hide an active row that was in view.
  useEffect(() => {
    scrollDropdownActiveRowIntoView(
      scrollRef.current,
      activeId ? rowRefs.current.get(activeId) : null,
    );
  }, [activeId, maxHeight, navKey]);

  const setRowRef = (id: string) => (node: View | null) => {
    if (node) {
      rowRefs.current.set(id, node);
      return;
    }
    rowRefs.current.delete(id);
  };

  const keyProps = {
    onKeyDown: (event: {
      key?: string;
      nativeEvent?: { key?: string };
      preventDefault?: () => void;
    }) => {
      const action = dropdownKeyAction(
        event.nativeEvent?.key ?? event.key ?? "",
      );
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
      if (action === "select" || action === "toggle") {
        const active = allEntries.find((entry) => entry.id === activeId);
        if (active && "onPress" in active && !active.disabled) {
          active.onPress?.();
        }
      }
    },
  };

  return { activeId, keyProps, scrollRef, setActiveId, setRowRef };
}
