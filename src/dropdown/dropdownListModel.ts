/** Pure row helpers for dropdown lists. */
import type { DropdownListEntry } from "./DropdownList";
import type { DropdownNavigationItem } from "./dropdownNavigation";

export function dropdownListNavigationItems(
  entries: DropdownListEntry[],
): DropdownNavigationItem[] {
  return entries.map((entry) => {
    const selectable = entry.type === "item" || entry.type === "footer";
    return {
      disabled: selectable ? entry.disabled : true,
      id: entry.id,
      selectable,
    };
  });
}

export function selectedDropdownListEntryId(
  entries: DropdownListEntry[],
): string | null {
  return (
    entries.find((entry) => "selected" in entry && entry.selected)?.id ?? null
  );
}

/**
 * Stable DOM id for a row so a trigger/input can point `aria-activedescendant`
 * at the active option (WCAG 4.1.2). Returns `undefined` when either part is
 * missing so the attribute is simply omitted rather than dangling.
 */
export function dropdownRowDomId(
  listId: string | undefined,
  rowId: string | null | undefined,
): string | undefined {
  if (!listId || !rowId) {
    return undefined;
  }
  return `${listId}-row-${rowId}`;
}
