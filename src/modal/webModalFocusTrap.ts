/** Element-based focus selection and Tab containment for web modal surfaces. */
import type { Focusable } from "./types";

const WEB_MODAL_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Where focus lands when a modal opens, absent an explicit `initialFocusRef`:
 * the first focusable control in the dialog other than the close button. The
 * close button is skipped because opening a dialog with "dismiss" preselected
 * is a poor landing spot: it is the least likely thing the user came to do,
 * and a reflexive Enter throws the dialog away. Tab order needs no rework,
 * because the focus trap is a cycle that still reaches the close button.
 *
 * Falls back to the close button when the caller rendered nothing focusable at
 * all, then to the surface itself (`tabIndex={-1}`), so focus always enters the
 * dialog and screen readers announce it rather than being left on the trigger.
 */
export function webModalInitialFocusTarget(
  surface: HTMLElement | null,
  closeButton: HTMLElement | null,
): HTMLElement | null {
  if (!surface) {
    return null;
  }
  // Null once `showCloseButton` is false — the Pressable is unmounted, so React
  // has cleared the ref and every focusable below is already caller content.
  const callerControl = webModalFocusableElements(surface).find(
    (element) => element !== closeButton,
  );
  return callerControl ?? closeButton ?? surface;
}

/** Wraps Tab inside the surface and brings escaped focus back into the dialog. */
export function trapWebModalFocus(
  event: KeyboardEvent,
  surface: HTMLElement | null,
): void {
  if (!surface) {
    return;
  }
  const focusable = webModalFocusableElements(surface);
  if (focusable.length === 0) {
    event.preventDefault();
    focusWebModalElement(surface);
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const activeElement = document.activeElement;
  const activeInside = activeElement ? surface.contains(activeElement) : false;
  if (event.shiftKey && (!activeInside || activeElement === first)) {
    event.preventDefault();
    focusWebModalElement(last);
    return;
  }
  if (!event.shiftKey && (!activeInside || activeElement === last)) {
    event.preventDefault();
    focusWebModalElement(first);
  }
}

/** Returns enabled, visible controls in the surface's DOM order. */
export function webModalFocusableElements(surface: HTMLElement): HTMLElement[] {
  return Array.from(
    surface.querySelectorAll<HTMLElement>(WEB_MODAL_FOCUSABLE_SELECTOR),
  ).filter(webModalElementIsFocusable);
}

function webModalElementIsFocusable(element: HTMLElement): boolean {
  const disabled = "disabled" in element && element.disabled;
  if (disabled || element.getAttribute("aria-disabled") === "true") {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

/** Focuses a DOM element or the caller's focusable handle when one is present. */
export function focusWebModalElement(
  target: Focusable | null | undefined,
): void {
  target?.focus?.();
}
