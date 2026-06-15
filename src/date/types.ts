/**
 * Shared prop contracts for the date pickers. The platform overlays
 * (`DatePickerOverlay.tsx` native, `DatePickerOverlay.web.tsx`) both implement
 * `DatePickerOverlayProps` so the `DateField` seam is identical on every platform.
 */

// Defined in the shared focus-ring helper; re-exported here so date consumers
// (and the `@firna/ui/date` subpath) keep importing it from this module.
export type { PressableHoverState } from "../focusRing";

/** Inclusive selectable-date bounds as ISO `YYYY-MM-DD` strings. */
export type DateBounds = {
  /** Earliest selectable date (inclusive). */
  min?: string | null;
  /** Latest selectable date (inclusive). */
  max?: string | null;
};

/**
 * Which picker the field opens:
 * - `calendar` (default) — the branded month grid (web popover / native sheet).
 * - `wheel` — an iOS-style spinning day/month/year wheel in a bottom sheet.
 */
export type DatePickerVariant = "calendar" | "wheel";

/** Props for a single-date picker overlay (web popover or native sheet). */
export type DatePickerOverlayProps = DateBounds & {
  /** Currently selected ISO date, or `""` when unset. */
  value: string;
  /** Today's ISO date, used for the "today" marker on the calendar. */
  today: string;
  /** Called with the picked ISO date. */
  onSelect: (iso: string) => void;
  /** Called when the overlay should close without selecting. */
  onClose: () => void;
  /** Calendar grid (default) or spinning day/month/year wheel. */
  variant?: DatePickerVariant;
  /** Field label, used as the wheel bottom sheet's title/accessibility name. */
  label?: string;
};
