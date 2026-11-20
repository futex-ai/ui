/** Keeps keyboard focus in the toast stack when a toast leaves it. */
import type { View } from "../primitives/reactNative";

/**
 * Web only. When a toast is dismissed from its own close control, the button is
 * about to unmount, so move keyboard focus to the next (or previous) toast's
 * close control before it goes — otherwise focus drops to `<body>` and the
 * keyboard user loses their place (WCAG 2.1 — 2.4.3 Focus Order, 2.1.2, A).
 * `container` is the dismissing toast's DOM node (RNW renders `View` as a div).
 */
export function moveFocusToNeighbourToast(container: View | null): void {
  const node = container as unknown;
  if (!(node instanceof HTMLElement) || typeof document === "undefined") {
    return;
  }
  const viewport = node.parentElement;
  if (!viewport) {
    return;
  }
  const buttons = Array.from(
    viewport.querySelectorAll<HTMLElement>('[aria-label^="Dismiss "]'),
  );
  // Drop the dismissing toast's own button (it sits inside `node`).
  const others = buttons.filter((button) => !node.contains(button));
  if (others.length === 0) {
    return;
  }
  // Prefer the button at this toast's position (the next toast that slides into
  // place); otherwise the last remaining one.
  const ownIndex = buttons.findIndex((button) => node.contains(button));
  const target =
    others.find((button) => buttons.indexOf(button) > ownIndex) ??
    others[others.length - 1];
  target.focus();
}
