/** Pure helpers for the web modal component contract. */

export type WebModalCloseSource =
  | "backdrop"
  | "closeButton"
  | "escape"
  | "request";

export type WebModalClosePolicy = {
  closeDisabled?: boolean;
  dismissible?: boolean;
};

export type WebModalSize = "lg" | "md" | "sm";

/**
 * Where the modal surface sits. `center` is the default centred dialog;
 * `bottom-sheet` pins it to the bottom of the viewport, full-width and
 * top-rounded with a grip handle (used for mobile-web surfaces).
 */
export type WebModalPlacement = "bottom-sheet" | "center";

export function webModalCanClose(
  policy: WebModalClosePolicy,
  source: WebModalCloseSource,
): boolean {
  if (policy.closeDisabled) {
    return false;
  }
  if (source === "closeButton") {
    return true;
  }
  return policy.dismissible !== false;
}
export function webModalMaxWidth(size: WebModalSize): number {
  if (size === "sm") {
    return 440;
  }
  if (size === "lg") {
    return 680;
  }
  return 540;
}
