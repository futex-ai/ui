/** The accessibility props of one selectable dropdown row, per platform. */
import type { DropdownListEntry } from "./DropdownList";

/** A row that the user can choose: an `item` or a `footer` entry. */
export type DropdownSelectableEntry = Extract<
  DropdownListEntry,
  { type: "footer" | "item" }
>;

export type DropdownRowA11y = {
  /** Props to spread on the row's pressable. */
  props: object;
  /**
   * The id of the row's secondary line on web, which describes the row.
   * Undefined on native and when the row has no secondary line.
   */
  secondaryId?: string;
};

/**
 * The accessible name, state, and platform props of a selectable row.
 *
 * - Both platforms: the name is `accessibilityLabel`, else the visible label,
 *   and the state carries `disabled` and, for an option, `selected`.
 * - Web: the ARIA list-item role (`option` or `menuitem`), the row id that
 *   `aria-activedescendant` points at, `aria-selected` on an option, and the
 *   secondary line as `aria-describedby`. The row is not a Tab stop: the list
 *   is one Tab stop whose trigger or input keeps focus while the arrow keys
 *   move the active row (WCAG 2.1.1, 4.1.2).
 * - Web, with `inputKeepsFocus`: a pointer press on the row does not move
 *   focus. A row with `tabIndex={-1}` still takes focus from a click, which
 *   would take the keys away from the combobox input that controls the list.
 * - Native: the tappable `button` role, and the secondary line as the
 *   accessibility hint, because the row's name replaces the text of its
 *   children for VoiceOver and TalkBack (WCAG 1.3.1).
 *
 * The literal `role` and `aria-*` names are web ARIA that the bundled React
 * Native types do not declare, so the props travel as an untyped object.
 */
export function dropdownRowA11y({
  entry,
  inputKeepsFocus = false,
  isWeb,
  itemRole,
  rowDomId,
}: {
  entry: DropdownSelectableEntry;
  /** A combobox input controls the list and keeps focus. */
  inputKeepsFocus?: boolean;
  isWeb: boolean;
  itemRole: "menuitem" | "option";
  rowDomId?: string;
}): DropdownRowA11y {
  const shared = {
    accessibilityLabel: entry.accessibilityLabel ?? entry.label,
    accessibilityState: {
      disabled: entry.disabled,
      selected: itemRole === "option" ? entry.selected : undefined,
    },
  };
  if (!isWeb) {
    const props: object = {
      ...shared,
      accessibilityHint: entry.secondary,
      accessibilityRole: "button",
    };
    return { props };
  }
  const secondaryId =
    entry.secondary && rowDomId ? `${rowDomId}-secondary` : undefined;
  const props: object = {
    ...shared,
    "aria-describedby": secondaryId,
    nativeID: rowDomId,
    role: itemRole,
    tabIndex: -1,
    ...(itemRole === "option"
      ? { "aria-selected": Boolean(entry.selected) }
      : {}),
    ...(inputKeepsFocus ? { onMouseDown: keepFocus } : {}),
  };
  return { props, secondaryId };
}

/** Cancels the focus change that a `mousedown` makes by default. */
function keepFocus(event: { preventDefault: () => void }) {
  event.preventDefault();
}
