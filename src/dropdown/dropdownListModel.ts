/** Pure row helpers for dropdown lists. */
import type { DropdownListEntry } from "./DropdownList";
import type { DropdownNavigationItem } from "./dropdownNavigation";

/** A row a user can press: an `item` or `footer` entry. */
export type DropdownListItemEntry = Extract<
  DropdownListEntry,
  { type: "footer" | "item" }
>;

/** A section heading entry. */
export type DropdownListSectionEntry = Extract<
  DropdownListEntry,
  { type: "section" }
>;

/**
 * A run of consecutive list rows. `heading` is set for a group: a `section`
 * entry with `group: true` and the rows after it, up to the next section,
 * divider, or the end of the list. Rows outside any group have no heading.
 */
export type DropdownListSegment = {
  heading?: DropdownListSectionEntry;
  key: string;
  rows: DropdownListEntry[];
};

export function dropdownListNavigationItems(
  entries: DropdownListEntry[],
): DropdownNavigationItem[] {
  return entries.map((entry) => {
    if (entry.type !== "item" && entry.type !== "footer") {
      return { disabled: true, id: entry.id, selectable: false };
    }
    const disabled = entry.focusableWhenDisabled ? false : entry.disabled;
    return isInertDropdownListEntry(entry)
      ? { disabled, id: entry.id, inert: true, selectable: true }
      : { disabled, id: entry.id, selectable: true };
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
 * Whether a press or Enter runs the row's `onPress`: an `item` or `footer` row
 * that is neither disabled nor locked.
 */
export function isActivatableDropdownListEntry(
  entry: DropdownListEntry | undefined,
): entry is DropdownListItemEntry {
  return (
    entry !== undefined &&
    (entry.type === "item" || entry.type === "footer") &&
    !entry.disabled &&
    !entry.locked
  );
}

/**
 * Whether a row stays reachable by keyboard while it can never be activated: a
 * locked row, or a disabled row with `focusableWhenDisabled`.
 */
export function isInertDropdownListEntry(entry: DropdownListEntry): boolean {
  if (entry.type !== "item" && entry.type !== "footer") {
    return false;
  }
  return (
    Boolean(entry.locked) ||
    (Boolean(entry.disabled) && Boolean(entry.focusableWhenDisabled))
  );
}

/**
 * Splits rows into segments so a grouped section and its rows can render
 * inside one labelled container. A list without `group` sections is a single
 * segment, so its rows render exactly as before.
 */
export function dropdownListSegments(
  entries: DropdownListEntry[],
): DropdownListSegment[] {
  const segments: DropdownListSegment[] = [];
  let group: DropdownListSegment | null = null;
  for (const entry of entries) {
    if (entry.type === "section" && entry.group) {
      group = { heading: entry, key: `group-${entry.id}`, rows: [] };
      segments.push(group);
      continue;
    }
    if (entry.type === "section" || entry.type === "divider") {
      group = null;
    }
    if (group) {
      group.rows.push(entry);
      continue;
    }
    const last = segments[segments.length - 1];
    if (last && !last.heading) {
      last.rows.push(entry);
    } else {
      segments.push({ key: `rows-${entry.id}`, rows: [entry] });
    }
  }
  return segments;
}

/**
 * DOM id for a grouped section heading, referenced by its group's
 * `aria-labelledby`. `undefined` without a list id.
 */
export function dropdownGroupHeadingDomId(
  listId: string | undefined,
  headingId: string,
): string | undefined {
  return listId ? `${listId}-group-${headingId}` : undefined;
}

/**
 * DOM id for a row's secondary text, referenced by the row's
 * `aria-describedby`. `undefined` when the row has no DOM id.
 */
export function dropdownRowDescriptionDomId(
  rowDomId: string | undefined,
): string | undefined {
  return rowDomId ? `${rowDomId}-description` : undefined;
}
