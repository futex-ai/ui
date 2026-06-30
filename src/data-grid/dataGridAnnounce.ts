/**
 * Debounced screen-reader announcements for the grid.
 *
 * Arrow-key navigation and pointer drags fire many announcements in quick
 * succession; debouncing to the final state (~90ms) keeps the polite live region
 * from queueing intermediate messages behind the visible selection (WCAG 2.1 —
 * 4.1.3 Status Messages, AA). Falls back to an immediate {@link announce} where
 * timers are unavailable.
 */
import { announce } from "../announcer";

let pendingTimer: ReturnType<typeof setTimeout> | null = null;

export function announceGrid(message: string): void {
  if (!message || typeof setTimeout === "undefined") {
    announce(message);
    return;
  }
  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    announce(message);
  }, 90);
}
