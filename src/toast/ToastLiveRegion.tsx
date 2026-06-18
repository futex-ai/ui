/** Persistent, always-mounted screen-reader live region for the toast stack. */
import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { TextProps } from "react-native";

import type { ToastItem } from "./toastModel";

export type ToastLiveRegionProps = {
  /** The live toast queue; new entries are announced as they appear. */
  toasts: ToastItem[];
};

/**
 * WCAG 2.1 — 4.1.3 Status Messages (AA). Some screen readers do not announce a
 * live region that is *created together with its content* (which is what each
 * visible toast used to be). The robust pattern is a pair of **persistent,
 * initially-empty** live regions that mount with the provider and have toast
 * text injected into them after they already exist in the accessibility tree.
 *
 * Two regions are kept so tone-appropriate politeness is preserved: errors are
 * announced in an `aria-live="assertive"` region (they interrupt), everything
 * else in an `aria-live="polite"` region (it waits for a pause). `aria-atomic`
 * makes the screen reader read the whole injected message (title + description)
 * as one unit rather than just the changed word. The regions deliberately carry
 * no `status`/`alert` *role* — the visible toast surfaces own those roles, and a
 * duplicate hidden landmark would muddy SR navigation; the `aria-live`
 * attribute alone drives the announcement.
 *
 * The visible toast surfaces keep their `role` for landmark/identification but
 * suppress their own live announcement (see {@link Toast}) so a toast is
 * announced exactly once, from here.
 */
export function ToastLiveRegion({ toasts }: ToastLiveRegionProps) {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  // Ids whose announcement has already been written, so re-renders (e.g. a
  // pause toggle or a sibling dismissal) never re-announce an existing toast.
  const announcedRef = useRef<Set<string>>(new Set());
  // Clear timers so an announced message does not linger in the DOM after a
  // screen reader has had time to read it (the visible toast remains the source
  // of truth for the text).
  const clearTimers = useRef<{ assertive?: number; polite?: number }>({});
  useEffect(
    () => () => {
      if (clearTimers.current.polite) {
        clearTimeout(clearTimers.current.polite);
      }
      if (clearTimers.current.assertive) {
        clearTimeout(clearTimers.current.assertive);
      }
    },
    [],
  );

  useEffect(() => {
    const live = new Set(toasts.map((toast) => toast.id));
    // Drop ids that have left the queue so a reused id could announce again.
    for (const id of announcedRef.current) {
      if (!live.has(id)) {
        announcedRef.current.delete(id);
      }
    }
    const fresh = toasts.filter((toast) => !announcedRef.current.has(toast.id));
    if (fresh.length === 0) {
      return;
    }
    for (const toast of fresh) {
      announcedRef.current.add(toast.id);
    }
    const polites: string[] = [];
    const assertives: string[] = [];
    for (const toast of fresh) {
      (toast.tone === "error" ? assertives : polites).push(
        toastAnnouncement(toast),
      );
    }
    // Re-write even when the text repeats: setting it always (a screen reader
    // ignores a write that leaves the text node unchanged, so we clear first),
    // then clear again shortly after so the text does not linger in the DOM.
    if (polites.length > 0) {
      const text = polites.join(" ");
      setPolite("");
      requestWrite(() => setPolite(text));
      if (clearTimers.current.polite) {
        clearTimeout(clearTimers.current.polite);
      }
      clearTimers.current.polite = scheduleClear(() => setPolite(""));
    }
    if (assertives.length > 0) {
      const text = assertives.join(" ");
      setAssertive("");
      requestWrite(() => setAssertive(text));
      if (clearTimers.current.assertive) {
        clearTimeout(clearTimers.current.assertive);
      }
      clearTimers.current.assertive = scheduleClear(() => setAssertive(""));
    }
  }, [toasts]);

  return (
    <View pointerEvents="none" style={styles.region}>
      <Text {...POLITE_REGION_PROPS} accessibilityLiveRegion="polite">
        {polite}
      </Text>
      <Text {...ASSERTIVE_REGION_PROPS} accessibilityLiveRegion="assertive">
        {assertive}
      </Text>
    </View>
  );
}

// `aria-live` (typed on RN) plus `aria-atomic` (not in RN's prop types, but RNW
// forwards the literal attribute to the DOM) so the whole message — title and
// description — is read as a single unit (WCAG 2.1 — 4.1.3, AA). Cast once,
// matching the codebase pattern for literal web-only aria attributes.
const POLITE_REGION_PROPS = {
  "aria-atomic": true,
  "aria-live": "polite",
} as unknown as TextProps;
const ASSERTIVE_REGION_PROPS = {
  "aria-atomic": true,
  "aria-live": "assertive",
} as unknown as TextProps;

/**
 * How long an announcement stays in the DOM before it is cleared. Long enough
 * for a screen reader to pick the live region up, short enough that the text
 * does not linger as stale content once the visible toast has been read.
 */
const ANNOUNCE_CLEAR_MS = 1500;

/** Schedules a deferred clear, returning a timer id usable with clearTimeout. */
function scheduleClear(clear: () => void): number {
  return setTimeout(clear, ANNOUNCE_CLEAR_MS) as unknown as number;
}

/** Flattens a toast into the single string a screen reader should read. */
function toastAnnouncement(toast: ToastItem): string {
  return toast.description
    ? `${toast.title}. ${toast.description}`
    : toast.title;
}

/** Defers a write to the next frame so clearing-then-setting re-announces. */
function requestWrite(write: () => void): void {
  if (Platform.OS === "web" && typeof requestAnimationFrame === "function") {
    requestAnimationFrame(write);
    return;
  }
  write();
}

const styles = StyleSheet.create({
  // Visually hidden but kept in the accessibility tree.
  region: {
    height: 1,
    left: -1,
    overflow: "hidden",
    position: "absolute",
    top: -1,
    width: 1,
  },
});
