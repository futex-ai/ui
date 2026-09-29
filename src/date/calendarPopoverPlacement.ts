/**
 * Placement of the web calendar popover around its date field.
 *
 * The calendar is a fixed layout, not a scrolling list, so clamping it to a
 * scrolling menu's minimum room below the field would clip its last week rows.
 * It reserves the height of its tallest layout instead, and the shared
 * dropdown placement flips it above the field whenever that much room is not
 * free below. Reserving the tallest layout rather than the visible month's
 * keeps the popover on one side while the user pages between four-, five-, and
 * six-week months.
 */
import type { DropdownPlacementOptions } from "../dropdown";

/** Compact popover width, kept even below a wider field. */
export const CALENDAR_POPOVER_WIDTH = 280;

/**
 * Height of the calendar's tallest layout, a six-week month, including the
 * portal surface's border and padding. It renders at 278px in Inter, the
 * theme's first font; the extra 6px covers fallback system faces with taller
 * line boxes in the header and weekday row.
 */
export const CALENDAR_POPOVER_HEIGHT = 284;

/** `DropdownPortal` placement options for the web calendar popover. */
export const CALENDAR_POPOVER_PLACEMENT = {
  anchorWidthAsMinimum: false,
  maxWidth: CALENDAR_POPOVER_WIDTH,
  minHeight: CALENDAR_POPOVER_HEIGHT,
  minWidth: CALENDAR_POPOVER_WIDTH,
} as const satisfies DropdownPlacementOptions;
