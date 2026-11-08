/** Keys and keyboard focus of a dropdown list. */
import type { ViewStyle } from "../primitives/reactNative";

import { hideWebOutlineView, useFocusRing } from "../focusRing";

import type { DropdownListEntry } from "./dropdownListTypes";
import { dropdownRowDomId } from "./dropdownListModel";
import { dropdownKeyAction, nextSelectableId } from "./dropdownNavigation";
import type { DropdownNavigationItem } from "./dropdownNavigation";

/**
 * Where keyboard focus sits. `rows` keeps each row its own tab stop. `list`
 * makes the list one tab stop that points at the active row.
 */
export type DropdownListFocusMode = "list" | "rows";

type DropdownListKeyEvent = {
  key?: string;
  nativeEvent?: { key?: string };
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

type DropdownListKeyboardOptions = {
  activeId: string | null;
  entries: DropdownListEntry[];
  focusMode: DropdownListFocusMode;
  listId?: string;
  navItems: DropdownNavigationItem[];
  onClose: () => void;
  setActiveId: (id: string | null) => void;
};

/** DOM id of a note row, so the list can name its notes as its description. */
function noteDomId(listId: string | undefined, rowId: string) {
  return listId ? `${listId}-note-${rowId}` : undefined;
}

/**
 * The key handler of the list, and in `list` focus mode the props that make
 * the list one focus target: a tab stop that points `aria-activedescendant`
 * at the active row. The active row's highlight shows the keyboard position,
 * so the list hides the browser outline then. With no active row, as when a
 * sheet opens, the list shows the shared focus glow instead.
 *
 * In `list` mode the handled keys stop at the list, so an ancestor such as a
 * grid or a list with its own keys does not act on them too.
 */
export function useDropdownListKeyboard({
  activeId,
  entries,
  focusMode,
  listId,
  navItems,
  onClose,
  setActiveId,
}: DropdownListKeyboardOptions) {
  const list = focusMode === "list";
  // Inset: the list scrolls inside a clipped surface.
  const ring = useFocusRing({ offset: -2 });
  // Only an enabled row that the keys can reach shows the keyboard position.
  // A controlled active row that turns disabled, or an id of a label, leaves
  // the list with its own glow and no `aria-activedescendant`.
  const hasActiveRow =
    activeId !== null &&
    navItems.some(
      (item) =>
        item.id === activeId && item.selectable !== false && !item.disabled,
    );
  const noteIds = entries
    .filter((entry) => entry.type === "note")
    .map((entry) => noteDomId(listId, entry.id))
    .filter((id): id is string => Boolean(id));

  const keyProps = {
    onKeyDown: (event: DropdownListKeyEvent) => {
      const action = dropdownKeyAction(
        event.nativeEvent?.key ?? event.key ?? "",
      );
      if (!action) return;
      event.preventDefault?.();
      if (list) {
        event.stopPropagation?.();
      }
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
        const active = entries.find((entry) => entry.id === activeId);
        if (active && "onPress" in active && !active.disabled) {
          active.onPress?.();
        }
      }
    },
  };

  const containerProps: object = {
    ...(noteIds.length > 0 ? { "aria-describedby": noteIds.join(" ") } : {}),
    ...(list
      ? {
          "aria-activedescendant": hasActiveRow
            ? dropdownRowDomId(listId, activeId)
            : undefined,
          tabIndex: 0,
          ...(hasActiveRow ? {} : ring.focusRingProps),
        }
      : {}),
  };
  const containerStyle: ViewStyle | null = list
    ? hasActiveRow
      ? hideWebOutlineView
      : ring.focusRingVariables
    : null;

  return {
    containerProps,
    containerStyle,
    keyProps,
    noteDomId: (rowId: string) => noteDomId(listId, rowId),
  };
}
