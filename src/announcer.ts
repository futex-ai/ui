import { AccessibilityInfo, Platform } from "react-native";

/**
 * Shared screen-reader announcer for transient status messages.
 *
 * WCAG 2.1 — 4.1.3 Status Messages (AA) requires that updates which aren't given
 * focus (filter result counts, a calendar's new month, a validation error, a
 * selection-count change) still reach assistive tech. On web that means writing
 * into an `aria-live` region; on native it maps to
 * `AccessibilityInfo.announceForAccessibility`. Components that don't already own
 * a live region (the toast does) call {@link announce} so the behaviour — and the
 * single, correctly-configured live region — is shared rather than re-invented.
 */

export type AnnouncePoliteness = "polite" | "assertive";

export type AnnounceOptions = {
  /** `"assertive"` interrupts the screen reader; default `"polite"`. */
  politeness?: AnnouncePoliteness;
};

const REGION_ID: Record<AnnouncePoliteness, string> = {
  assertive: "firna-ui-live-region-assertive",
  polite: "firna-ui-live-region-polite",
};

function ensureRegion(politeness: AnnouncePoliteness): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  const id = REGION_ID[politeness];
  const existing = document.getElementById(id);
  if (existing) {
    return existing;
  }
  const region = document.createElement("div");
  region.id = id;
  region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
  region.setAttribute("aria-live", politeness);
  region.setAttribute("aria-atomic", "true");
  // Visually hidden but available to assistive tech.
  Object.assign(region.style, {
    border: "0",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: "0",
    position: "absolute",
    whiteSpace: "nowrap",
    width: "1px",
  });
  document.body.appendChild(region);
  return region;
}

/**
 * Announces `message` to assistive tech without moving focus. Safe to call on
 * any platform and during SSR (no-ops when there is no DOM / a11y bridge).
 */
export function announce(message: string, options: AnnounceOptions = {}): void {
  const politeness = options.politeness ?? "polite";
  if (!message) {
    return;
  }

  if (Platform.OS !== "web") {
    AccessibilityInfo.announceForAccessibility?.(message);
    return;
  }

  const region = ensureRegion(politeness);
  if (!region) {
    return;
  }
  // Clearing first guarantees the same message re-announces (screen readers
  // ignore a write that doesn't change the text node).
  region.textContent = "";
  const write = () => {
    region.textContent = message;
  };
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(write);
  } else {
    write();
  }
}

/** Hook form of {@link announce}; returns a stable `announce` reference. */
export function useAnnouncer(): {
  announce: (message: string, options?: AnnounceOptions) => void;
} {
  return { announce };
}
