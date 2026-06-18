/**
 * Pure, timezone-safe datetime + geometry helpers for the calendar. Builds on
 * the date layer in `src/date/dateMath.ts` (never duplicating it) and adds the
 * minute-precision time half, the view windows/titles, and the time-grid
 * pixel↔minute geometry. No React, no `Date.now()` — callers inject "today".
 *
 * Datetime model: timed values are `YYYY-MM-DDTHH:mm` (minute precision, no
 * timezone), all-day/date values are `YYYY-MM-DD`. Lexicographic string compare
 * equals chronological compare, so most comparisons are plain string compares.
 */

import {
  addDays,
  clampDay,
  daysInMonth,
  FULL_MONTHS,
  parseIso,
  SHORT_MONTHS,
  shiftMonth,
  toIso,
} from "../date/dateMath";

import type { CalendarViewType } from "./types";

const MINUTES_PER_DAY = 1440;

/** Pad an integer to two digits (e.g. `9` → `"09"`). */
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Split a datetime/date string into its date half and minutes-of-day. A
 * date-only `YYYY-MM-DD` yields `{ date, minutes: 0 }`; an invalid value (bad
 * date half or out-of-range time) yields null.
 */
export function parseDateTime(
  value: string,
): { date: string; minutes: number } | null {
  const [datePart, timePart] = value.split("T");
  if (!parseIso(datePart)) {
    return null;
  }
  if (timePart === undefined) {
    return { date: datePart, minutes: 0 };
  }
  const match = /^(\d{2}):(\d{2})$/.exec(timePart);
  if (!match) {
    return null;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return null;
  }
  return { date: datePart, minutes: hour * 60 + minute };
}

/** The `YYYY-MM-DD` portion of a timed or date-only value. */
export function dateOf(value: string): string {
  return value.split("T")[0];
}

/** Minutes-of-day (`hour*60+minute`); 0 for a date-only value. */
export function minutesOfDay(value: string): number {
  return parseDateTime(value)?.minutes ?? 0;
}

/**
 * Build a timed `YYYY-MM-DDTHH:mm` string. Assumes `0<=minutes<=1439`; use
 * {@link addMinutes} when a value might carry across midnight.
 */
export function makeDateTime(date: string, minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${date}T${pad2(hour)}:${pad2(minute)}`;
}

/**
 * Add `delta` minutes to a timed value, carrying across day boundaries via
 * {@link addDays}. Returns a `YYYY-MM-DDTHH:mm` string.
 */
export function addMinutes(value: string, delta: number): string {
  const parsed = parseDateTime(value);
  if (!parsed) {
    return value;
  }
  const total = parsed.minutes + delta;
  // Carry whole days (floor handles negatives) so the time half stays 0..1439.
  const dayCarry = Math.floor(total / MINUTES_PER_DAY);
  const minutes =
    ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return makeDateTime(addDays(parsed.date, dayCarry), minutes);
}

/** Whole-minute difference `b - a` (both timed values). */
export function diffMinutes(a: string, b: string): number {
  const pa = parseDateTime(a);
  const pb = parseDateTime(b);
  if (!pa || !pb) {
    return 0;
  }
  const dayDelta = dayNumber(pb.date) - dayNumber(pa.date);
  return dayDelta * MINUTES_PER_DAY + (pb.minutes - pa.minutes);
}

/** Serial day count (days since a fixed epoch) for cheap day arithmetic. */
function dayNumber(date: string): number {
  const parts = parseIso(date);
  if (!parts) {
    return 0;
  }
  // Days since 1970-01-01 in local calendar terms (tz-safe: midnight local).
  return Math.round(
    new Date(parts.year, parts.month - 1, parts.day).getTime() /
      (24 * 60 * 60 * 1000),
  );
}

/** Compare two timed/date values: -1 / 0 / 1 (string compare is chronological). */
export function compareDateTime(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Clamp a datetime into the inclusive `[min, max]` window. */
export function clampDateTime(value: string, min: string, max: string): string {
  if (compareDateTime(value, min) < 0) {
    return min;
  }
  if (compareDateTime(value, max) > 0) {
    return max;
  }
  return value;
}

/** Weekday of an ISO date, 0=Sun..6=Sat. */
export function weekdayOf(date: string): number {
  const parts = parseIso(date);
  if (!parts) {
    return 0;
  }
  return new Date(parts.year, parts.month - 1, parts.day).getDay();
}

/**
 * The ISO date of the first day of `date`'s week, given `weekStartsOn`
 * (0=Sun..6=Sat).
 */
export function startOfWeek(date: string, weekStartsOn: number): string {
  const back = (weekdayOf(date) - weekStartsOn + 7) % 7;
  return addDays(date, -back);
}

/** The 7 ISO dates of `date`'s week, starting on `weekStartsOn`. */
export function weekDates(date: string, weekStartsOn: number): string[] {
  const start = startOfWeek(date, weekStartsOn);
  return Array.from({ length: 7 }, (_unused, index) => addDays(start, index));
}

/**
 * Weeks×7 ISO dates covering `month` (1-12) of `year`, with lead/trail days
 * from the neighboring months so every row is full. Generalizes
 * `buildMonthGrid` (Monday-first) to any `weekStartsOn`.
 */
export function monthGridDates(
  year: number,
  month: number,
  weekStartsOn: number,
): string[][] {
  const firstIso = toIso({ year, month, day: 1 });
  const lead = (weekdayOf(firstIso) - weekStartsOn + 7) % 7;
  const total = daysInMonth(year, month);
  const weeks: string[][] = [];
  let offset = -lead;
  // Keep emitting full weeks until the month is covered and the row is complete.
  while (
    offset < total ||
    weeks.length === 0 ||
    weeks[weeks.length - 1].length < 7
  ) {
    if (weeks.length === 0 || weeks[weeks.length - 1].length === 7) {
      weeks.push([]);
    }
    weeks[weeks.length - 1].push(addDays(firstIso, offset));
    offset += 1;
  }
  return weeks;
}

/** Sunday-first 3-letter weekday labels; rotate via `weekStartsOn`. */
export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/** 3-letter weekday labels rotated so index 0 is `weekStartsOn`. */
export function weekdayLabels(weekStartsOn: number): string[] {
  return Array.from(
    { length: 7 },
    (_unused, index) => WEEKDAY_LABELS[(weekStartsOn + index) % 7],
  );
}

/**
 * Inclusive date window `[start, end]` the view shows:
 * - month: the full weeks covering the month;
 * - week: the week containing `date`;
 * - day: `date`..`date`;
 * - agenda: `date`..`addDays(date, agendaDays-1)`.
 */
export function viewRange(
  view: CalendarViewType,
  date: string,
  weekStartsOn: number,
  agendaDays: number,
): { start: string; end: string } {
  if (view === "month") {
    const parts = parseIso(date);
    if (!parts) {
      return { start: date, end: date };
    }
    const grid = monthGridDates(parts.year, parts.month, weekStartsOn);
    const first = grid[0][0];
    const lastRow = grid[grid.length - 1];
    return { start: first, end: lastRow[lastRow.length - 1] };
  }
  if (view === "week") {
    const dates = weekDates(date, weekStartsOn);
    return { start: dates[0], end: dates[6] };
  }
  if (view === "agenda") {
    return { start: date, end: addDays(date, agendaDays - 1) };
  }
  return { start: date, end: date };
}

/** Format an ISO date as `D Mon YYYY` (e.g. `17 Jun 2026`). */
function shortDate(date: string): string {
  const parts = parseIso(date);
  if (!parts) {
    return date;
  }
  return `${parts.day} ${SHORT_MONTHS[parts.month - 1]} ${parts.year}`;
}

/**
 * Human title for the view's window, e.g. `"June 2026"`,
 * `"16 – 22 Jun 2026"`, `"Tuesday, 17 Jun 2026"`, `"17 Jun – 16 Jul 2026"`.
 */
export function viewTitle(
  view: CalendarViewType,
  date: string,
  weekStartsOn: number,
  agendaDays: number,
): string {
  const parts = parseIso(date);
  if (!parts) {
    return date;
  }
  if (view === "month") {
    return `${FULL_MONTHS[parts.month - 1]} ${parts.year}`;
  }
  if (view === "day") {
    return `${WEEKDAY_NAMES[weekdayOf(date)]}, ${shortDate(date)}`;
  }
  const { start, end } =
    view === "week"
      ? {
          start: weekDates(date, weekStartsOn)[0],
          end: weekDates(date, weekStartsOn)[6],
        }
      : { start: date, end: addDays(date, agendaDays - 1) };
  return spanTitle(start, end);
}

/** Full weekday names for the day-view title. */
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Title for an inclusive date span, collapsing shared month/year:
 * same month → `"16 – 22 Jun 2026"`; cross-month → `"17 Jun – 16 Jul 2026"`.
 */
function spanTitle(start: string, end: string): string {
  const a = parseIso(start);
  const b = parseIso(end);
  if (!a || !b) {
    return `${shortDate(start)} – ${shortDate(end)}`;
  }
  if (a.year === b.year && a.month === b.month) {
    return `${a.day} – ${b.day} ${SHORT_MONTHS[b.month - 1]} ${b.year}`;
  }
  if (a.year === b.year) {
    return `${a.day} ${SHORT_MONTHS[a.month - 1]} – ${b.day} ${SHORT_MONTHS[b.month - 1]} ${b.year}`;
  }
  return `${shortDate(start)} – ${shortDate(end)}`;
}

/**
 * The anchor date for the previous/next view step (`dir` -1 or 1):
 * - month: ±1 month via `shiftMonth`, keeping the day clamped to the new month;
 * - week: ±7 days; day: ±1 day; agenda: ±`agendaDays`.
 */
export function stepDate(
  view: CalendarViewType,
  date: string,
  _weekStartsOn: number,
  agendaDays: number,
  dir: -1 | 1,
): string {
  const parts = parseIso(date);
  if (!parts) {
    return date;
  }
  if (view === "month") {
    const shifted = shiftMonth(parts.year, parts.month, dir);
    return toIso({
      year: shifted.year,
      month: shifted.month,
      day: clampDay(shifted.year, shifted.month, parts.day),
    });
  }
  if (view === "week") {
    return addDays(date, 7 * dir);
  }
  if (view === "agenda") {
    return addDays(date, agendaDays * dir);
  }
  return addDays(date, dir);
}

/** The hours `[minHour..maxHour-1]` shown in the time grid. */
export function hours(minHour: number, maxHour: number): number[] {
  const out: number[] = [];
  for (let hour = minHour; hour < maxHour; hour += 1) {
    out.push(hour);
  }
  return out;
}

/** Vertical pixel offset of `minutes` within a grid starting at `minHour`. */
export function minutesToY(
  minutes: number,
  minHour: number,
  pxPerHour: number,
): number {
  return ((minutes - minHour * 60) / 60) * pxPerHour;
}

/** Minutes-of-day for a pixel offset `y` within a grid starting at `minHour`. */
export function yToMinutes(
  y: number,
  minHour: number,
  pxPerHour: number,
): number {
  return (y / pxPerHour) * 60 + minHour * 60;
}

/** Round `minutes` to the nearest `step`. */
export function snap(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}

/** Format an hour-of-day as a gutter label: `"9 AM"`, `"12 PM"`, `"12 AM"`. */
export function formatHourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized < 12 ? "AM" : "PM";
  const display = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${display} ${period}`;
}

/** Convert minutes-of-day into a `"9:30 AM"` clock label. */
function clockLabel(minutes: number): string {
  const hour24 = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const period = hour24 < 12 ? "AM" : "PM";
  const display = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${display}:${pad2(minute)} ${period}`;
}

/** Format a timed value as `"9:30 AM"`. */
export function formatTime(value: string): string {
  return clockLabel(minutesOfDay(value));
}

/**
 * Format a timed range, collapsing a shared AM/PM period:
 * `"9:30 – 10:00 AM"` within one period, `"11:30 AM – 1:00 PM"` across.
 */
export function formatTimeRange(start: string, end: string): string {
  const startMin = minutesOfDay(start);
  const endMin = minutesOfDay(end);
  const startPeriod = Math.floor(startMin / 60) % 24 < 12 ? "AM" : "PM";
  const endPeriod = Math.floor(endMin / 60) % 24 < 12 ? "AM" : "PM";
  if (startPeriod === endPeriod && dateOf(start) === dateOf(end)) {
    // Drop the leading period when both ends share it: "9:30 – 10:00 AM".
    const startNoPeriod = clockLabel(startMin).replace(/ (AM|PM)$/, "");
    return `${startNoPeriod} – ${clockLabel(endMin)}`;
  }
  return `${clockLabel(startMin)} – ${clockLabel(endMin)}`;
}
