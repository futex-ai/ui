/** Pure row helpers for dropdown lists. */
import type { DropdownListEntry, DropdownListRole } from "./DropdownList";
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

/** A `section` entry: a heading line in the list. */
export type DropdownListSectionEntry = Extract<
  DropdownListEntry,
  { type: "section" }
>;

/** A run of rows, optionally named by a group heading. */
export type DropdownListSegment = {
  entries: DropdownListEntry[];
  /** The heading that names the run as a group. */
  heading?: DropdownListSectionEntry;
};

/**
 * Splits rows into the runs `DropdownList` renders. With `groupSections`, a
 * section heading and the rows after it, up to the next section or divider,
 * form one group named by the heading. A heading with no rows after it (an
 * empty state or a note) stays a plain line. Without `groupSections` all rows
 * form one run.
 */
export function dropdownListSegments(
  entries: DropdownListEntry[],
  groupSections: boolean,
): DropdownListSegment[] {
  if (!groupSections) {
    return [{ entries }];
  }
  const segments: DropdownListSegment[] = [];
  let current: DropdownListSegment | null = null;
  for (const entry of entries) {
    if (entry.type === "section") {
      current = { entries: [], heading: entry };
      segments.push(current);
    } else if (entry.type === "divider") {
      segments.push({ entries: [entry] });
      current = null;
    } else {
      if (!current) {
        current = { entries: [] };
        segments.push(current);
      }
      current.entries.push(entry);
    }
  }
  return segments.map((segment) =>
    segment.heading && segment.entries.length === 0
      ? { entries: [segment.heading] }
      : segment,
  );
}

/**
 * Web-only ARIA props for the option container. `listbox`/`menu` are web ARIA
 * roles; they are gated to web so native list semantics are not regressed (the
 * rows stay tappable Pressables on native). WCAG 4.1.2 Name/Role/Value. They are
 * passed via the literal `role` prop because `listbox`/`option` are absent from
 * the bundled React Native `AccessibilityRole`/`Role` types (the web backend
 * forwards them at runtime); the cast is scoped to this web-only props object.
 * `ownedIds` are rows rendered outside the container, such as pinned footer
 * rows, that `aria-owns` keeps inside the listbox or menu.
 */
export function dropdownListContainerA11y({
  isWeb,
  label,
  listId,
  listRole,
  ownedIds,
  required,
}: {
  isWeb: boolean;
  label?: string;
  listId?: string;
  listRole: DropdownListRole;
  ownedIds: string[];
  required?: boolean;
}): object {
  if (!isWeb) {
    return {};
  }
  return {
    "aria-label": label,
    ...(ownedIds.length > 0 ? { "aria-owns": ownedIds.join(" ") } : {}),
    // `aria-required` is allowed on `role="listbox"` but not on `menu`, so
    // only expose it for the listbox container (WCAG 4.1.2).
    ...(required && listRole === "listbox" ? { "aria-required": true } : {}),
    nativeID: listId,
    role: listRole,
  } as unknown as object;
}
