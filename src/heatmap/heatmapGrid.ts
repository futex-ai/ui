/**
 * Pure, timezone-safe layout helpers for the calendar heatmap. They turn an
 * inclusive ISO `YYYY-MM-DD` date range into the column-major week grid the
 * component renders, plus the month labels that sit above it. No React and no
 * `Date.now()` — callers pass the range explicitly. Built on the shared
 * {@link parseIso}/{@link addDays} helpers so results never shift across
 * timezones.
 */
import { addDays, compareIso, parseIso, SHORT_MONTHS } from "../date/dateMath";

/** Which weekday sits in the top row of every column: `0` Sunday, `1` Monday. */
export type HeatmapWeekStart = 0 | 1;

/** One day cell of the grid. */
export type HeatmapDay = {
  /** ISO `YYYY-MM-DD` date of this cell. */
  iso: string;
  /** False for leading/trailing padding days outside the requested range. */
  inRange: boolean;
  /** Row index within the week column, `0..6`, relative to the week start. */
  weekday: number;
};

/** A single grid column: always seven days, row 0 = the configured week start. */
export type HeatmapWeek = HeatmapDay[];

/** A month label and the week column it should sit above. */
export type HeatmapMonthLabel = { label: string; weekIndex: number };

/** Row index (`0..6`) of an ISO date relative to `weekStart` (0 Sun, 1 Mon). */
export function weekdayIndex(iso: string, weekStart: HeatmapWeekStart): number {
  const parts = parseIso(iso);
  if (!parts) {
    return 0;
  }
  // Construct from parts at local midnight so the weekday never shifts by zone.
  const jsDay = new Date(parts.year, parts.month - 1, parts.day).getDay();
  return (jsDay - weekStart + 7) % 7;
}

/** Inclusive whole-day count between two valid ISO dates (`>= 1`). */
function daysInclusive(startIso: string, endIso: string): number {
  const a = parseIso(startIso);
  const b = parseIso(endIso);
  if (!a || !b) {
    return 0;
  }
  const start = new Date(a.year, a.month - 1, a.day).getTime();
  const end = new Date(b.year, b.month - 1, b.day).getTime();
  // Round to absorb the ±1h a DST boundary adds to the raw millisecond span.
  return Math.round((end - start) / 86_400_000) + 1;
}

/**
 * Build the column-major week grid covering `[startIso, endIso]` inclusive.
 * Every returned week has seven {@link HeatmapDay} cells (row 0 is the week
 * start). Days before the start or after the end are padding cells with
 * `inRange: false`, so the grid stays rectangular. Returns `[]` when either
 * bound is invalid or the start is after the end.
 */
export function buildHeatmapWeeks(
  startIso: string,
  endIso: string,
  weekStart: HeatmapWeekStart = 0,
): HeatmapWeek[] {
  if (
    !parseIso(startIso) ||
    !parseIso(endIso) ||
    compareIso(startIso, endIso) > 0
  ) {
    return [];
  }
  const lead = weekdayIndex(startIso, weekStart);
  const span = lead + daysInclusive(startIso, endIso);
  const totalCells = Math.ceil(span / 7) * 7;
  const firstCellIso = addDays(startIso, -lead);
  const weeks: HeatmapWeek[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const row = i % 7;
    if (row === 0) {
      weeks.push([]);
    }
    weeks[weeks.length - 1].push({
      // `span` is `lead + dayCount`, so a cell is in range from the lead offset
      // up to (but not including) the end of the requested days.
      iso: addDays(firstCellIso, i),
      inRange: i >= lead && i < span,
      weekday: row,
    });
  }
  return weeks;
}

/**
 * One short month label per week column where a new month's in-range days
 * begin. The transition is detected from the first in-range day of each week,
 * so a leading partial week never mislabels with the previous month's padding
 * days. Use {@link HeatmapMonthLabel.weekIndex} to position each label above
 * its column.
 */
export function monthLabelColumns(weeks: HeatmapWeek[]): HeatmapMonthLabel[] {
  const labels: HeatmapMonthLabel[] = [];
  let lastMonth: number | null = null;
  weeks.forEach((week, weekIndex) => {
    const firstInRange = week.find((day) => day.inRange);
    const parts = firstInRange ? parseIso(firstInRange.iso) : null;
    if (!parts) {
      return;
    }
    if (parts.month !== lastMonth) {
      labels.push({ label: SHORT_MONTHS[parts.month - 1], weekIndex });
      lastMonth = parts.month;
    }
  });
  return labels;
}
