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
