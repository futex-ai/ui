/**
 * Pure, timezone-safe date helpers for the date pickers. Works on integer
 * year/month/day and ISO `YYYY-MM-DD` strings rather than parsing `Date` from
 * strings, so results never shift across timezones. No React, no `Date.now()` —
 * callers inject "today" where a current date is needed.
 */

/** Short month names for the `D Mon YYYY` display format (e.g. `4 Mar 2024`). */
export const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Full month names for calendar headers (e.g. `March 2026`). */
export const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Weekday labels, Monday-first (UK convention). */
export const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;

/** Parsed calendar date. `month` is 1-12, `day` is 1-31. */
export type DateParts = { year: number; month: number; day: number };

/** One calendar grid cell. `inMonth` is false for leading/trailing days. */
export type DayCell = { iso: string; day: number; inMonth: boolean };

/** An ISO start/end date range. Either side may be `""` when unset. */
export type DateRange = { start: string; end: string };

const MONTH_LOOKUP: Record<string, number> = buildMonthLookup();

function buildMonthLookup(): Record<string, number> {
  const lookup: Record<string, number> = {};
  FULL_MONTHS.forEach((name, index) => {
    lookup[name.toLowerCase()] = index + 1;
    lookup[SHORT_MONTHS[index].toLowerCase()] = index + 1;
  });
  return lookup;
}

/** Map a full or abbreviated month name (case-insensitive) to 1-12, or null. */
export function monthNumber(value = ""): number | null {
  return MONTH_LOOKUP[value.trim().toLowerCase()] ?? null;
}

/** Days in `month` (1-12) of `year`, accounting for leap years. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamp `day` into the `1..daysInMonth(year, month)` window. Used by the wheel
 * picker so spinning the month/year to a shorter month (e.g. 31 → February)
 * keeps a valid day rather than rolling over into the next month.
 */
export function clampDay(year: number, month: number, day: number): number {
  return Math.min(Math.max(day, 1), daysInMonth(year, month));
}

/**
 * Inclusive `[lo, hi]` year span the wheel picker offers in its year column.
 * Bounds, when present, fix the ends (the wheel never offers a year that has no
 * selectable day); otherwise it spans a wide window around the anchor year (the
 * current value, falling back to today). The anchor is always representable.
 */
export function wheelYearRange(
  value: string,
  today: string,
  min?: string | null,
  max?: string | null,
): { lo: number; hi: number } {
  const anchor = parseIso(value)?.year ?? parseIso(today)?.year ?? 2000;
  const minYear = parseIso(min)?.year ?? null;
  const maxYear = parseIso(max)?.year ?? null;
  // Keep the anchor inside the span even if a caller passes an out-of-bounds
  // value (defensive — committed values are clamped to the bounds upstream).
  const lo = Math.min(minYear ?? anchor - 100, anchor);
  const hi = Math.max(maxYear ?? anchor + 10, anchor, lo);
  return { lo, hi };
}

/** Build an ISO `YYYY-MM-DD` string from parts. */
export function toIso({ year, month, day }: DateParts): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

/** Parse an ISO `YYYY-MM-DD` string into parts, validating the calendar date. */
export function parseIso(value?: string | null): DateParts | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return { year, month, day };
}

/** True when `value` is a valid ISO `YYYY-MM-DD` date. */
export function isValidIso(value?: string | null): boolean {
  return parseIso(value) !== null;
}

/** Format an ISO date as `D Mon YYYY` (e.g. `4 Mar 2024`); `""` if invalid. */
export function formatDisplay(value?: string | null): string {
  const parts = parseIso(value);
  if (!parts) {
    return "";
  }
  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${parts.year}`;
}

/** Parse a `D Mon YYYY — D Mon YYYY` range string into an ISO range. */
export function parseDisplayRange(value: string): DateRange {
  const parts = value.split(/\s[–—-]\s/);
  return {
    start: parseDisplay(parts[0] ?? "") ?? "",
    end: parseDisplay(parts[1] ?? "") ?? "",
  };
}

/**
 * Format an ISO range as `D Mon YYYY — D Mon YYYY`. A half-filled range keeps the
 * separator (e.g. `1 Apr 2025 — ` or ` — 31 Mar 2026`) so a single endpoint
 * survives the draft-string round-trip while the user fills the other; a fully
 * empty range is `""`.
 */
export function formatDisplayRange(range: DateRange): string {
  const start = formatDisplay(range.start);
  const end = formatDisplay(range.end);
  if (!start && !end) {
    return "";
  }
  return `${start} — ${end}`;
}

/** Parse a `D Mon YYYY` / `D Month YYYY` string into ISO, or null. */
export function parseDisplay(value: string): string | null {
  const [dayText, monthText, yearText] = value.trim().split(/[\s,]+/);
  const day = Number.parseInt(dayText, 10);
  const month = monthNumber(monthText);
  // Require a full 4-digit year so `4 Mar 24` is rejected rather than parsed as
  // the year 24 and serialised as the junk date `0024-03-04`.
  if (!Number.isFinite(day) || !month || !/^\d{4}$/.test(yearText ?? "")) {
    return null;
  }
  const year = Number.parseInt(yearText, 10);
  if (day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return toIso({ year, month, day });
}

/** Full month + year header label (e.g. `March 2026`). */
export function monthLabel(year: number, month: number): string {
  return `${FULL_MONTHS[month - 1]} ${year}`;
}

/** ISO date for the local calendar day of `now` (inject the clock for purity). */
export function todayIso(now: Date): string {
  return toIso({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
}

/** Move `month` (1-12) of `year` by `delta` months, carrying the year. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (((zero % 12) + 12) % 12) + 1 };
}

/** Compare two ISO dates: negative if a<b, 0 if equal, positive if a>b. */
export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Clamp an ISO date into the inclusive [min, max] window (either optional). */
export function clampIso(
  value: string,
  min?: string | null,
  max?: string | null,
): string {
  if (min && compareIso(value, min) < 0) {
    return min;
  }
  if (max && compareIso(value, max) > 0) {
    return max;
  }
  return value;
}

/** Add `days` to an ISO date (can be negative), returning ISO. */
export function addDays(value: string, days: number): string {
  const parts = parseIso(value);
  if (!parts) {
    return value;
  }
  const date = new Date(parts.year, parts.month - 1, parts.day + days);
  return toIso({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

/**
 * Derive an accounting-style period from a year-end date: the period ends on the
 * year end and starts the day after the previous year's year end (the FY
 * containing the year end). Returns null if the year end is invalid. Domain
 * helper kept for parity with the source; the field components do not use it.
 */
export function deriveCurrentPeriod(yearEndIso: string): DateRange | null {
  const parts = parseIso(yearEndIso);
  if (!parts) {
    return null;
  }
  const priorYear = parts.year - 1;
  const priorDay = Math.min(parts.day, daysInMonth(priorYear, parts.month));
  const priorYearEnd = toIso({
    year: priorYear,
    month: parts.month,
    day: priorDay,
  });
  return { start: addDays(priorYearEnd, 1), end: yearEndIso };
}

/**
 * Build a Monday-first month grid as rows of seven cells. Leading/trailing cells
 * are the adjacent months' days with `inMonth: false`. Every cell carries its
 * full ISO date so selection and keyboard navigation work across boundaries.
 */
export function buildMonthGrid(year: number, month: number): DayCell[][] {
  const lead = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const total = daysInMonth(year, month);
  const startIso = toIso({ year, month, day: 1 });
  const cells: DayCell[] = [];
  let offset = -lead;
  while (offset < total || cells.length % 7 !== 0) {
    const iso = addDays(startIso, offset);
    const parts = parseIso(iso);
    if (!parts) {
      break;
    }
    cells.push({ iso, day: parts.day, inMonth: parts.month === month });
    offset += 1;
  }
  const weeks: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
