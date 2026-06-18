/**
 * Core data shapes for the calendar family. Pure types only — no React, no
 * clock. The datetime model is ISO-local, minute precision, no timezone:
 * timed values are `YYYY-MM-DDTHH:mm`, all-day/date values are `YYYY-MM-DD`.
 * Lexicographic string compare equals chronological compare for both.
 */

/** Which view the calendar renders. */
export type CalendarViewType = "month" | "week" | "day" | "agenda";

/** How often a recurrence repeats. */
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

/** A pragmatic RRULE subset. */
export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  /** Repeat every `interval` units (default 1). */
  interval?: number;
  /** Weekly only: weekdays it lands on, 0=Sun..6=Sat. Defaults to the start
   *  date's weekday. */
  byWeekday?: number[];
  /** Stop after this many occurrences total (>=1). */
  count?: number;
  /** Inclusive last date (`YYYY-MM-DD`); no occurrence starts after it. */
  until?: string;
  /** Dates (`YYYY-MM-DD`) to skip (cancellations). */
  exceptions?: string[];
};

/** A consumer-owned calendar event (the source-of-truth record). */
export type CalendarEvent = {
  id: string;
  title: string;
  /** Timed: `YYYY-MM-DDTHH:mm`. All-day: `YYYY-MM-DD`. */
  start: string;
  /** Exclusive-ish end; for all-day, the last day is inclusive (see README). */
  end: string;
  allDay?: boolean;
  /** Raw color for the block/chip; defaults to theme primary. */
  color?: string;
  recurrence?: RecurrenceRule;
  /** Opaque consumer payload echoed back in occurrences. */
  data?: unknown;
};

/** A concrete (recurrence-expanded) instance. */
export type CalendarOccurrence = {
  event: CalendarEvent;
  /** Stable key `${event.id}#${start}`. */
  key: string;
  start: string;
  end: string;
  allDay: boolean;
};

/** Draft from drag-to-create, before the consumer persists it. */
export type CalendarDraftRange = {
  start: string;
  end: string;
  allDay: boolean;
};

/** Shared time-grid geometry config for the week/day renderers. */
export type CalendarTimeGridConfig = {
  /** First hour shown (default 0). */
  minHour?: number;
  /** One-past-last hour shown (default 24). */
  maxHour?: number;
  /** Drag-snap step in minutes (default 30). */
  slotMinutes?: number;
  /** Vertical pixels per hour (default 48). */
  pxPerHour?: number;
};
