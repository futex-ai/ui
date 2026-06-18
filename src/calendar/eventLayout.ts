/**
 * Pure overlap-packing geometry for the calendar. Two layouts:
 *  - {@link layoutDayColumns} packs timed occurrences into side-by-side columns
 *    for a day/week time-grid (Google-style cluster packing);
 *  - {@link layoutMonthWeek} places occurrences as horizontal spanning bars
 *    across a month week-row, assigning lanes and counting overflow.
 * No React, no clock — callers pass the day/week dates.
 */

import { compareIso } from "../date/dateMath";

import { dateOf, minutesOfDay } from "./calendarMath";
import type { CalendarOccurrence } from "./types";

const MINUTES_PER_DAY = 1440;

/** A timed occurrence positioned in a day column. */
export type LaidOutOccurrence = {
  occurrence: CalendarOccurrence;
  startMinutes: number;
  endMinutes: number;
  column: number;
  columns: number;
};

/** Internal: a clipped occurrence carrying its minute span before packing. */
type Span = {
  occurrence: CalendarOccurrence;
  startMinutes: number;
  endMinutes: number;
};

/**
 * Pack the timed (non-all-day) occurrences overlapping `date` into side-by-side
 * columns. Each is clipped to `[0, 1440]` within the day, sorted by start (then
 * longer first), grouped into clusters of transitively-overlapping events, and
 * greedily assigned the lowest free column. `columns` is the cluster's max
 * concurrency, so the component derives `left = column/columns`,
 * `width = 1/columns`.
 */
export function layoutDayColumns(
  occurrences: CalendarOccurrence[],
  date: string,
): LaidOutOccurrence[] {
  const spans: Span[] = [];
  for (const occurrence of occurrences) {
    if (occurrence.allDay) {
      continue;
    }
    const span = clipToDay(occurrence, date);
    if (span) {
      spans.push(span);
    }
  }
  // Stable order: earliest start first, then the longer event first so the
  // greedy column assignment fills left-to-right predictably.
  spans.sort(
    (a, b) =>
      a.startMinutes - b.startMinutes ||
      b.endMinutes - b.startMinutes - (a.endMinutes - a.startMinutes) ||
      0,
  );

  const out: LaidOutOccurrence[] = [];
  let cluster: Span[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length > 0) {
      out.push(...packCluster(cluster));
      cluster = [];
      clusterEnd = -Infinity;
    }
  };

  for (const span of spans) {
    // A gap (next start >= every prior end) closes the transitive-overlap
    // cluster, so concurrency resets.
    if (cluster.length > 0 && span.startMinutes >= clusterEnd) {
      flush();
    }
    cluster.push(span);
    clusterEnd = Math.max(clusterEnd, span.endMinutes);
  }
  flush();
  return out;
}

/** Clip an occurrence to `date`'s `[0, 1440]` minute window, or null if none. */
function clipToDay(occurrence: CalendarOccurrence, date: string): Span | null {
  const startDate = dateOf(occurrence.start);
  const endDate = dateOf(occurrence.end);
  // Outside the day entirely (end is exclusive-ish: an event ending at 00:00 of
  // `date` doesn't occupy it).
  if (compareIso(endDate, date) < 0 || compareIso(startDate, date) > 0) {
    return null;
  }
  const startMinutes =
    compareIso(startDate, date) < 0 ? 0 : minutesOfDay(occurrence.start);
  const endMinutes =
    compareIso(endDate, date) > 0
      ? MINUTES_PER_DAY
      : minutesOfDay(occurrence.end);
  // Drop events with no positive span on this day (e.g. one ending at the day's
  // start, or a zero-duration occurrence).
  if (endMinutes <= startMinutes) {
    return null;
  }
  return { occurrence, startMinutes, endMinutes };
}

/** Greedily column-pack one transitively-overlapping cluster of spans. */
function packCluster(cluster: Span[]): LaidOutOccurrence[] {
  // Each column tracks the end-minute of its last placed span.
  const columnEnds: number[] = [];
  const assigned = cluster.map((span) => {
    let column = columnEnds.findIndex((end) => span.startMinutes >= end);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(span.endMinutes);
    } else {
      columnEnds[column] = span.endMinutes;
    }
    return { span, column };
  });
  const columns = columnEnds.length;
  return assigned.map(({ span, column }) => ({
    occurrence: span.occurrence,
    startMinutes: span.startMinutes,
    endMinutes: span.endMinutes,
    column,
    columns,
  }));
}

/** A horizontal spanning bar in a month week-row. */
export type MonthBar = {
  occurrence: CalendarOccurrence;
  startCol: number;
  endCol: number;
  lane: number;
};

/** Month week-row layout: placed bars plus per-column hidden-bar counts. */
export type MonthWeekLayout = {
  bars: MonthBar[];
  overflowByCol: number[];
};

/**
 * Lay out a month week-row (`weekDates` length 7). Each occurrence overlapping
 * the week becomes a bar from its first to last visible column; bars are
 * assigned the lowest lane with no column overlap. Bars that would need
 * `lane >= maxLanes` are dropped and counted into `overflowByCol` per covered
 * column (the `+N more` indicator). All-day/multi-day bars sort before short
 * timed events so the spanning bars take the top lanes.
 */
export function layoutMonthWeek(
  weekDates: string[],
  occurrences: CalendarOccurrence[],
  maxLanes: number,
): MonthWeekLayout {
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  type Candidate = {
    occurrence: CalendarOccurrence;
    startCol: number;
    endCol: number;
    spanDays: number;
    multiDay: boolean;
  };

  const candidates: Candidate[] = [];
  for (const occurrence of occurrences) {
    const startDate = dateOf(occurrence.start);
    // For timed events the end is exclusive-ish; treat the last covered day as
    // the day before the end when the end is at midnight, else the end's date.
    const lastDate = lastCoveredDate(occurrence);
    if (
      compareIso(lastDate, weekStart) < 0 ||
      compareIso(startDate, weekEnd) > 0
    ) {
      continue;
    }
    const startCol = Math.max(0, columnOf(weekDates, startDate));
    const endCol = Math.min(
      weekDates.length - 1,
      columnOf(weekDates, lastDate),
    );
    candidates.push({
      occurrence,
      startCol,
      endCol,
      spanDays: endCol - startCol,
      multiDay: occurrence.allDay || endCol > startCol,
    });
  }

  // All-day / multi-day bars first (top lanes), then by span, then by start.
  candidates.sort(
    (a, b) =>
      Number(b.multiDay) - Number(a.multiDay) ||
      b.spanDays - a.spanDays ||
      compareIso(a.occurrence.start, b.occurrence.start) ||
      compareIso(a.occurrence.event.id, b.occurrence.event.id),
  );

  const bars: MonthBar[] = [];
  const overflowByCol = weekDates.map(() => 0);
  // laneOccupancy[lane][col] = true when a bar already covers that cell.
  const laneOccupancy: boolean[][] = [];

  for (const candidate of candidates) {
    const lane = lowestFreeLane(
      laneOccupancy,
      candidate.startCol,
      candidate.endCol,
    );
    if (lane >= maxLanes) {
      for (let col = candidate.startCol; col <= candidate.endCol; col += 1) {
        overflowByCol[col] += 1;
      }
      continue;
    }
    occupyLane(laneOccupancy, lane, candidate.startCol, candidate.endCol);
    bars.push({
      occurrence: candidate.occurrence,
      startCol: candidate.startCol,
      endCol: candidate.endCol,
      lane,
    });
  }

  return { bars, overflowByCol };
}

/** The last calendar day an occurrence visibly covers. */
function lastCoveredDate(occurrence: CalendarOccurrence): string {
  const endDate = dateOf(occurrence.end);
  if (occurrence.allDay) {
    // All-day ends are inclusive of the last day.
    return endDate;
  }
  // Timed: an event ending at 00:00 doesn't paint the end day, but any later
  // time does; clipToDay handles the column math, here we just need coverage.
  return compareIso(endDate, dateOf(occurrence.start)) > 0 &&
    minutesOfDay(occurrence.end) === 0
    ? previousDate(endDate)
    : endDate;
}

/** The ISO date one day before `date` (string math via the week list isn't ok). */
function previousDate(date: string): string {
  // Local-midnight tz-safe decrement (mirrors dateMath.addDays without import
  // churn here; we only need a single-day step).
  const [y, m, d] = date.split("-").map(Number);
  const prev = new Date(y, m - 1, d - 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}-${pad(prev.getDate())}`;
}

/** Index of `date` within `weekDates`, or the nearest clamp side (-1 / len). */
function columnOf(weekDates: string[], date: string): number {
  if (compareIso(date, weekDates[0]) < 0) {
    return -1;
  }
  if (compareIso(date, weekDates[weekDates.length - 1]) > 0) {
    return weekDates.length;
  }
  return weekDates.findIndex((d) => d === date);
}

/** Lowest lane index with no covered cell in `[startCol, endCol]`. */
function lowestFreeLane(
  laneOccupancy: boolean[][],
  startCol: number,
  endCol: number,
): number {
  let lane = 0;
  for (;;) {
    const row = laneOccupancy[lane];
    if (!row) {
      return lane;
    }
    let free = true;
    for (let col = startCol; col <= endCol; col += 1) {
      if (row[col]) {
        free = false;
        break;
      }
    }
    if (free) {
      return lane;
    }
    lane += 1;
  }
}

/** Mark `[startCol, endCol]` of `lane` as covered. */
function occupyLane(
  laneOccupancy: boolean[][],
  lane: number,
  startCol: number,
  endCol: number,
): void {
  if (!laneOccupancy[lane]) {
    laneOccupancy[lane] = [];
  }
  for (let col = startCol; col <= endCol; col += 1) {
    laneOccupancy[lane][col] = true;
  }
}
