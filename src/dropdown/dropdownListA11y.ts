/**
 * Web-only ARIA props for the dropdown list container and its row groups.
 *
 * `listbox`/`menu`/`group` are web ARIA roles. They are gated to web so native
 * list semantics are not regressed (the rows stay tappable Pressables there),
 * and passed through the literal `role`/`aria-*` props because those values are
 * absent from the bundled React Native `AccessibilityRole`/`Role` types (the
 * web backend forwards them at runtime). Each builder returns a cast object so
 * the cast stays scoped to these web-only props (WCAG 4.1.2 Name/Role/Value).
 */
import type { DropdownListRole } from "./DropdownList";

/** Props for the list container: the listbox or menu element. */
export function dropdownListContainerA11y({
  isWeb,
  label,
  listId,
  listRole,
  required,
}: {
  isWeb: boolean;
  label?: string;
  listId?: string;
  listRole: DropdownListRole;
  required?: boolean;
}): object {
  if (!isWeb) {
    return {};
  }
  return {
    "aria-label": label,
    // `aria-required` is allowed on `role="listbox"` but not on `menu`, so
    // only expose it for the listbox container (WCAG 4.1.2).
    ...(required && listRole === "listbox" ? { "aria-required": true } : {}),
    nativeID: listId,
    role: listRole,
  } as unknown as object;
}

/**
 * Props for the container that holds a grouped heading and its rows: a
 * `role="group"` named by the heading through `aria-labelledby`, the listbox
 * pattern for options under a visible section title (WCAG 1.3.1 / 4.1.2).
 */
export function dropdownGroupA11y(
  isWeb: boolean,
  headingDomId: string | undefined,
): object {
  if (!isWeb) {
    return {};
  }
  return {
    "aria-labelledby": headingDomId,
    role: "group",
  } as unknown as object;
}
