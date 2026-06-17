/**
 * Pure recurrence expansion. Walks an event's RRULE subset into the concrete
 * occurrences that intersect a date window. No React, no clock — callers pass
 * the window as `YYYY-MM-DD` strings. Each occurrence preserves the master
 * event's duration; a hard iteration cap stops misconfigured rules from looping
 * forever.
 */

import {
  addDays,
  compareIso,
  daysInMonth,
  parseIso,
  toIso,
} from "../date/dateMath";

import { addMinutes, dateOf, diffMinutes, weekdayOf } from "./calendarMath";
import type { CalendarEvent, CalendarOccurrence } from "./types";

/** Hard ceiling on generated instances so a bad rule can't loop forever. */
const MAX_ITERATIONS = 1000;

/** Whether an event is all-day (explicit flag or date-only start). */
function isAllDay(event: CalendarEvent): boolean {
  return event.allDay === true || !event.start.includes("T");
}

/** Wrap a single event into a (non-expanded) occurrence. */
export function occurrenceOf(event: CalendarEvent): CalendarOccurrence {
  return {
    event,
    key: `${event.id}#${event.start}`,
    start: event.start,
    end: event.end,
    allDay: isAllDay(event),
  };
}

/**
 * Build the occurrence whose `start` is `startValue`, carrying the master
 * event's duration. Timed events shift `end` by the same minute span; all-day
 * events shift `end` by the same day span.
 */
function instanceAt(
  event: CalendarEvent,
  startValue: string,
  allDay: boolean,
): CalendarOccurrence {
  let end: string;
  if (allDay) {
    const dayspan =
      dayNumber(dateOf(event.end)) - dayNumber(dateOf(event.start));
    end = addDays(dateOf(startValue), dayspan);
  } else {
    end = addMinutes(startValue, diffMinutes(event.start, event.end));
  }
  return {
    event,
    key: `${event.id}#${startValue}`,
    start: startValue,
    end,
    allDay,
  };
}

/** Serial day count for all-day duration math (tz-safe, local midnight). */
function dayNumber(date: string): number {
  const parts = parseIso(date);
  if (!parts) {
    return 0;
  }
  return Math.round(
    new Date(parts.year, parts.month - 1, parts.day).getTime() /
      (24 * 60 * 60 * 1000),
  );
}

/** Whether an occurrence's `[start, end]` intersects the inclusive day window. */
function intersectsWindow(
  occStartDate: string,
  occEndDate: string,
  rangeStart: string,
  rangeEnd: string,
): boolean {
  // Overlap iff occ starts on/before window end AND occ ends on/after start.
  return (
    compareIso(occStartDate, rangeEnd) <= 0 &&
    compareIso(occEndDate, rangeStart) >= 0
  );
}

/**
 * The concrete occurrences of one event that intersect the inclusive date
 * window `[rangeStart, rangeEnd]` (both `YYYY-MM-DD`). Non-recurring events
 * yield at most their single occurrence; recurring events walk by
 * frequency×interval (daily/weekly/monthly/yearly), honoring interval, count,
 * until, exceptions, and the iteration cap.
 */
export function expandRecurrence(
  event: CalendarEvent,
  rangeStart: string,
  rangeEnd: string,
): CalendarOccurrence[] {
  const allDay = isAllDay(event);
  if (!event.recurrence) {
    const occ = occurrenceOf(event);
    return intersectsWindow(
      dateOf(occ.start),
      dateOf(occ.end),
      rangeStart,
      rangeEnd,
    )
      ? [occ]
      : [];
  }

  const rule = event.recurrence;
  const interval = Math.max(1, rule.interval ?? 1);
  const exceptions = new Set(rule.exceptions ?? []);
  const startDate = dateOf(event.start);
  const startParts = parseIso(startDate);
  if (!startParts) {
    return [];
  }
  const time = allDay ? "" : event.start.slice(event.start.indexOf("T"));
  const out: CalendarOccurrence[] = [];
  let emitted = 0;

  // Fast-forward so the iteration cap bounds *emitted-in-window* occurrences, not
  // the distance from a long-past series start (a daily/weekly event that began
  // years before the window would otherwise exhaust the cap before reaching it
  // and silently vanish). When `count` is set the series is finite and counted
  // from its start, so we keep walking from the start (raising the cap to cover
  // the count) instead of skipping ahead. The `floor` backs off by the event's
  // own duration so a multi-day instance starting just before the window is not
  // skipped.
  const counted = rule.count !== undefined;
  const maxSteps = counted
    ? Math.max(MAX_ITERATIONS, (rule.count ?? 0) + 8)
    : MAX_ITERATIONS;
  const durationDays = allDay
    ? Math.max(0, dayNumber(dateOf(event.end)) - dayNumber(dateOf(event.start)))
    : Math.max(0, Math.ceil(diffMinutes(event.start, event.end) / 1440));
  const floorDate = addDays(rangeStart, -(durationDays + 1));
  const floorParts = parseIso(floorDate) ?? startParts;
  const dayGap = counted
    ? 0
    : Math.max(0, dayNumber(floorDate) - dayNumber(startDate));
  const monthGap = counted
    ? 0
    : Math.max(
        0,
        floorParts.year * 12 +
          floorParts.month -
          (startParts.year * 12 + startParts.month),
      );
  const yearGap = counted ? 0 : Math.max(0, floorParts.year - startParts.year);

  // Emit one occurrence for a candidate start date, applying the window /
  // exceptions filters. Returns false once `count` is reached (stop signal).
  const emit = (date: string): boolean => {
    if (rule.until && compareIso(date, rule.until) > 0) {
      return false;
    }
    if (!exceptions.has(date)) {
      const startValue = allDay ? date : `${date}${time}`;
      const occ = instanceAt(event, startValue, allDay);
      if (intersectsWindow(date, dateOf(occ.end), rangeStart, rangeEnd)) {
        out.push(occ);
      }
      emitted += 1;
      if (rule.count !== undefined && emitted >= rule.count) {
        return false;
      }
    }
    return true;
  };

  if (rule.frequency === "weekly") {
    expandWeekly(
      rule.byWeekday && rule.byWeekday.length > 0
        ? [...rule.byWeekday].sort((a, b) => a - b)
        : [weekdayOf(startDate)],
      startDate,
      interval,
      rangeEnd,
      rule.until,
      emit,
      Math.floor(dayGap / (7 * interval)),
      maxSteps,
    );
  } else if (rule.frequency === "daily") {
    expandStepped(
      startDate,
      rangeEnd,
      rule.until,
      emit,
      (date, step) => addDays(date, interval * step),
      Math.floor(dayGap / interval),
      maxSteps,
    );
  } else if (rule.frequency === "monthly") {
    expandCalendar(
      startParts,
      interval,
      rangeEnd,
      rule.until,
      emit,
      (parts, step) => monthlyCandidate(parts, step),
      Math.floor(monthGap / interval),
      maxSteps,
    );
  } else {
    expandCalendar(
      startParts,
      interval,
      rangeEnd,
      rule.until,
      emit,
      (parts, step) => yearlyCandidate(parts, step),
      Math.floor(yearGap / interval),
      maxSteps,
    );
  }

  return out;
}

/** Stop once we pass the earlier of `rangeEnd` and `until`. */
function windowEnd(rangeEnd: string, until?: string): string {
  return until && compareIso(until, rangeEnd) < 0 ? until : rangeEnd;
}

/**
 * Daily-style walk: candidate dates derived by a step function. `startStep`
 * fast-forwards toward the window so `maxSteps` bounds emitted-in-window
 * occurrences rather than the distance from the series start.
 */
function expandStepped(
  startDate: string,
  rangeEnd: string,
  until: string | undefined,
  emit: (date: string) => boolean,
  step: (date: string, index: number) => string,
  startStep: number,
  maxSteps: number,
): void {
  const stopAt = windowEnd(rangeEnd, until);
  const from = Math.max(0, startStep);
  for (let i = from; i < from + maxSteps; i += 1) {
    const date = step(startDate, i);
    if (compareIso(date, stopAt) > 0) {
      return;
    }
    if (!emit(date)) {
      return;
    }
  }
}

/**
 * Weekly walk: for each active week, emit each listed weekday in order.
 * `startWeek` fast-forwards toward the window so `maxSteps` (weeks) bounds the
 * weeks visited near the window rather than the distance from the series start.
 */
function expandWeekly(
  weekdays: number[],
  startDate: string,
  interval: number,
  rangeEnd: string,
  until: string | undefined,
  emit: (date: string) => boolean,
  startWeek: number,
  maxSteps: number,
): void {
  const stopAt = windowEnd(rangeEnd, until);
  const startWeekday = weekdayOf(startDate);
  const from = Math.max(0, startWeek);
  for (let week = from; week < from + maxSteps; week += 1) {
    // Anchor on the start date's own weekday so week 0 begins at the start; the
    // listed weekdays are placed relative to that anchor's weekday.
    const weekAnchor = addDays(startDate, week * interval * 7);
    for (const weekday of weekdays) {
      const date = addDays(weekAnchor, weekday - startWeekday);
      // Don't emit days that fall before the event's own start (only possible in
      // week 0 / when the fast-forward lands on the first week).
      if (compareIso(date, startDate) < 0) {
        continue;
      }
      if (compareIso(date, stopAt) > 0) {
        // Past the window: every later weekday/week is later too — stop.
        return;
      }
      if (!emit(date)) {
        return;
      }
    }
  }
}

/**
 * Monthly/yearly walk: candidates may be null (skipped months/years).
 * `startStep` fast-forwards toward the window so `maxSteps` bounds the
 * months/years visited near the window rather than the distance from the start.
 */
function expandCalendar(
  startParts: { year: number; month: number; day: number },
  interval: number,
  rangeEnd: string,
  until: string | undefined,
  emit: (date: string) => boolean,
  candidate: (
    parts: { year: number; month: number; day: number },
    step: number,
  ) => string | null,
  startStep: number,
  maxSteps: number,
): void {
  const stopAt = windowEnd(rangeEnd, until);
  const from = Math.max(0, startStep);
  for (let i = from; i < from + maxSteps; i += 1) {
    const date = candidate(startParts, i * interval);
    if (date === null) {
      continue;
    }
    if (compareIso(date, stopAt) > 0) {
      return;
    }
    if (!emit(date)) {
      return;
    }
  }
}

/** Same day-of-month `monthsAhead` months on, or null if that month lacks it. */
function monthlyCandidate(
  start: { year: number; month: number; day: number },
  monthsAhead: number,
): string | null {
  const zeroMonth = start.month - 1 + monthsAhead;
  const year = start.year + Math.floor(zeroMonth / 12);
  const month = (((zeroMonth % 12) + 12) % 12) + 1;
  if (start.day > daysInMonth(year, month)) {
    return null;
  }
  return toIso({ year, month, day: start.day });
}

/** Same month+day `yearsAhead` years on, or null (e.g. Feb-29 non-leap). */
function yearlyCandidate(
  start: { year: number; month: number; day: number },
  yearsAhead: number,
): string | null {
  const year = start.year + yearsAhead;
  if (start.day > daysInMonth(year, start.month)) {
    return null;
  }
  return toIso({ year, month: start.month, day: start.day });
}

/**
 * Expand every event into its occurrences intersecting `[rangeStart, rangeEnd]`,
 * sorted by `start` then `event.id` for a stable render order.
 */
export function getOccurrences(
  events: CalendarEvent[],
  rangeStart: string,
  rangeEnd: string,
): CalendarOccurrence[] {
  const all = events.flatMap((event) =>
    expandRecurrence(event, rangeStart, rangeEnd),
  );
  all.sort((a, b) => {
    const byStart = compareIso(a.start, b.start);
    return byStart !== 0 ? byStart : compareIso(a.event.id, b.event.id);
  });
  return all;
}
