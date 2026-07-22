/** Pure platform policy for the data-grid date editor. */
import type { DatePickerVariant } from "../date";

/**
 * Use the compact anchored calendar on web and the touch-friendly wheel sheet
 * everywhere else.
 */
export function dataGridDatePickerVariant(platform: string): DatePickerVariant {
  return platform === "web" ? "calendar" : "wheel";
}
