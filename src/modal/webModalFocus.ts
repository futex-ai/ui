/** DOM focus helpers for the web modal frame: initial focus and the Tab trap. */
import type { RefObject } from "react";
import type { View } from "../primitives/reactNative";

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
 * the first control the *caller* rendered — the form field, or the footer's
 * action button when the body holds nothing focusable. The close button is
 * skipped even though it comes first in DOM order, because opening a dialog
 * with "dismiss" preselected is a poor landing spot: it is the least likely
 * thing the user came to do, and a reflexive Enter throws the dialog away.
 *
 * Tab order itself needs no rework. A focus trap is a cycle, so starting on the
 * caller's first control already yields `field → … → action → close → field`:
 * the close button is the last stop on the way round, and Shift+Tab from the
 * landing element reaches it immediately.
 *
 * Falls back to the close button when the caller rendered nothing focusable at
 * all, then to the surface itself (`tabIndex={-1}`), so focus always enters the
 * dialog and screen readers announce it rather than being left on the trigger.
 */
export function webModalInitialFocusTarget(
  surfaceRef: RefObject<View | null>,
  closeButtonRef: RefObject<View | null>,
): HTMLElement | null {
  const surface = webModalElement(surfaceRef);
  if (!surface) {
    return null;
  }
  // Null once `showCloseButton` is false — the Pressable is unmounted, so React
  // has cleared the ref and every focusable below is already caller content.
  const closeButton = webModalElement(closeButtonRef);
  const callerControl = webModalFocusableElements(surface).find(
    (element) => element !== closeButton,
  );
  return callerControl ?? closeButton ?? surface;
}

export function trapWebModalFocus(
  event: KeyboardEvent,
  surfaceRef: RefObject<View | null>,
): void {
  const surface = webModalElement(surfaceRef);
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

export function webModalFocusableElements(surface: HTMLElement): HTMLElement[] {
  return Array.from(
    surface.querySelectorAll<HTMLElement>(WEB_MODAL_FOCUSABLE_SELECTOR),
  ).filter(webModalElementIsFocusable);
}

export function webModalElementIsFocusable(element: HTMLElement): boolean {
  const disabled = (element as HTMLElement & { disabled?: boolean }).disabled;
  if (disabled || element.getAttribute("aria-disabled") === "true") {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden";
}

/** RNW resolves a `View` ref to its host node; narrow it for DOM-only work. */
export function webModalElement(
  ref: RefObject<View | null>,
): HTMLElement | null {
  const node = ref.current as unknown;
  return node instanceof HTMLElement ? node : null;
}

/**
 * The surface lives inside the portal subtree mounted on `document.body`. Walk
 * up from the surface to find the direct child of `body` that roots this modal,
 * so the background-inertness effect can skip it (and only it) when hiding the
 * rest of the page.
 */
export function webModalPortalRoot(surface: HTMLElement): HTMLElement | null {
  const body = surface.ownerDocument.body;
  let node: HTMLElement | null = surface;
  while (node && node.parentElement !== body) {
    node = node.parentElement;
  }
  return node;
}

export function focusWebModalElement(
  target: Focusable | null | undefined,
): void {
  target?.focus?.();
}
