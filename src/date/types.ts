/**
 * Shared prop contracts for the date pickers. The platform overlays
 * (`DatePickerOverlay.tsx` native, `DatePickerOverlay.web.tsx`) both implement
 * `DatePickerOverlayProps` so the `DateField` seam is identical on every platform.
 */

/** Pressable style-callback state, widened with react-native-web's `hovered`. */
export type PressableHoverState = { pressed: boolean; hovered?: boolean };

/** Inclusive selectable-date bounds as ISO `YYYY-MM-DD` strings. */
export type DateBounds = {
  /** Earliest selectable date (inclusive). */
  min?: string | null;
  /** Latest selectable date (inclusive). */
  max?: string | null;
};

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
};
