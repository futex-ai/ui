import assert from "node:assert/strict";
import test from "node:test";

import {
  expandRecurrence,
  getOccurrences,
  occurrenceOf,
} from "../../src/calendar/recurrence";
import type { CalendarEvent } from "../../src/calendar/types";

/** Build a timed event fixture. */
function timed(
  id: string,
  start: string,
  end: string,
  recurrence?: CalendarEvent["recurrence"],
): CalendarEvent {
  return { id, title: id, start, end, recurrence };
}

/** Extract just the occurrence start strings. */
function starts(event: CalendarEvent, a: string, b: string): string[] {
  return expandRecurrence(event, a, b).map((occ) => occ.start);
}

test("occurrenceOf wraps a single event with a stable key", () => {
  const event = timed("a", "2026-06-17T09:00", "2026-06-17T10:00");
  assert.deepEqual(occurrenceOf(event), {
    event,
    key: "a#2026-06-17T09:00",
    start: "2026-06-17T09:00",
    end: "2026-06-17T10:00",
    allDay: false,
  });
});

test("non-recurring event returns its single occurrence inside the window", () => {
  const event = timed("a", "2026-06-17T09:00", "2026-06-17T10:00");
  assert.deepEqual(starts(event, "2026-06-01", "2026-06-30"), [
    "2026-06-17T09:00",
  ]);
  // Outside the window => nothing.
  assert.deepEqual(starts(event, "2026-07-01", "2026-07-31"), []);
});

test("non-recurring all-day event derives allDay from a date-only start", () => {
  const event: CalendarEvent = {
    id: "a",
    title: "a",
    start: "2026-06-17",
    end: "2026-06-19",
  };
  const occ = expandRecurrence(event, "2026-06-01", "2026-06-30")[0];
  assert.equal(occ.allDay, true);
});

test("daily recurrence walks every interval days within the window", () => {
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "daily",
  });
  assert.deepEqual(starts(event, "2026-06-15", "2026-06-18"), [
    "2026-06-15T09:00",
    "2026-06-16T09:00",
    "2026-06-17T09:00",
    "2026-06-18T09:00",
  ]);
  // interval 2 => every other day.
  const every2 = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "daily",
    interval: 2,
  });
  assert.deepEqual(starts(every2, "2026-06-15", "2026-06-20"), [
    "2026-06-15T09:00",
    "2026-06-17T09:00",
    "2026-06-19T09:00",
  ]);
});

test("daily recurrence only emits occurrences intersecting the window", () => {
  const event = timed("a", "2026-06-01T09:00", "2026-06-01T10:00", {
    frequency: "daily",
  });
  assert.deepEqual(starts(event, "2026-06-10", "2026-06-12"), [
    "2026-06-10T09:00",
    "2026-06-11T09:00",
    "2026-06-12T09:00",
  ]);
});

test("weekly recurrence defaults to the start weekday", () => {
  // 2026-06-15 is a Monday.
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "weekly",
  });
  assert.deepEqual(starts(event, "2026-06-01", "2026-07-06"), [
    "2026-06-15T09:00",
    "2026-06-22T09:00",
    "2026-06-29T09:00",
    "2026-07-06T09:00",
  ]);
});

test("weekly recurrence with byWeekday emits each listed day per active week", () => {
  // Start Monday 2026-06-15; recur Mon (1) + Wed (3).
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "weekly",
    byWeekday: [1, 3],
  });
  assert.deepEqual(starts(event, "2026-06-15", "2026-06-28"), [
    "2026-06-15T09:00", // Mon
    "2026-06-17T09:00", // Wed
    "2026-06-22T09:00", // Mon
    "2026-06-24T09:00", // Wed
  ]);
});

test("weekly byWeekday skips weekday occurrences before the start date", () => {
  // Start Wednesday 2026-06-17; recur Mon (1) + Wed (3). The Monday of the start
  // week (15th) is before the start, so it is skipped; later Mondays appear.
  const event = timed("a", "2026-06-17T09:00", "2026-06-17T10:00", {
    frequency: "weekly",
    byWeekday: [1, 3],
  });
  assert.deepEqual(starts(event, "2026-06-15", "2026-06-25"), [
    "2026-06-17T09:00", // Wed (start)
    "2026-06-22T09:00", // Mon next week
    "2026-06-24T09:00", // Wed next week
  ]);
});

test("weekly recurrence honors interval (every other week)", () => {
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "weekly",
    interval: 2,
  });
  assert.deepEqual(starts(event, "2026-06-01", "2026-07-31"), [
    "2026-06-15T09:00",
    "2026-06-29T09:00",
    "2026-07-13T09:00",
    "2026-07-27T09:00",
  ]);
});

test("monthly recurrence repeats the day-of-month and skips short months", () => {
  const event = timed("a", "2026-01-31T09:00", "2026-01-31T10:00", {
    frequency: "monthly",
  });
  // Feb, Apr, Jun lack the 31st => skipped.
  assert.deepEqual(starts(event, "2026-01-01", "2026-05-31"), [
    "2026-01-31T09:00",
    "2026-03-31T09:00",
    "2026-05-31T09:00",
  ]);
});

test("monthly recurrence honors interval", () => {
  const event = timed("a", "2026-01-15T09:00", "2026-01-15T10:00", {
    frequency: "monthly",
    interval: 2,
  });
  assert.deepEqual(starts(event, "2026-01-01", "2026-07-31"), [
    "2026-01-15T09:00",
    "2026-03-15T09:00",
    "2026-05-15T09:00",
    "2026-07-15T09:00",
  ]);
});

test("yearly recurrence repeats month+day and skips Feb-29 non-leap years", () => {
  const event = timed("a", "2024-02-29T09:00", "2024-02-29T10:00", {
    frequency: "yearly",
  });
  // 2024 leap, 2028 leap; 2025-2027 skipped.
  assert.deepEqual(starts(event, "2024-01-01", "2028-12-31"), [
    "2024-02-29T09:00",
    "2028-02-29T09:00",
  ]);
});

test("count caps the total number of occurrences", () => {
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "daily",
    count: 3,
  });
  assert.deepEqual(starts(event, "2026-06-01", "2026-06-30"), [
    "2026-06-15T09:00",
    "2026-06-16T09:00",
    "2026-06-17T09:00",
  ]);
});

test("until stops occurrences after the inclusive last date", () => {
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "daily",
    until: "2026-06-17",
  });
  assert.deepEqual(starts(event, "2026-06-01", "2026-06-30"), [
    "2026-06-15T09:00",
    "2026-06-16T09:00",
    "2026-06-17T09:00",
  ]);
});

test("exceptions skip listed dates", () => {
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "daily",
    exceptions: ["2026-06-16"],
  });
  assert.deepEqual(starts(event, "2026-06-15", "2026-06-18"), [
    "2026-06-15T09:00",
    "2026-06-17T09:00",
    "2026-06-18T09:00",
  ]);
  // count caps emitted (non-excepted) occurrences: 3 emitted spans 15,17,18.
  const capped = timed("a", "2026-06-15T09:00", "2026-06-15T10:00", {
    frequency: "daily",
    count: 3,
    exceptions: ["2026-06-16"],
  });
  assert.deepEqual(starts(capped, "2026-06-01", "2026-06-30"), [
    "2026-06-15T09:00",
    "2026-06-17T09:00",
    "2026-06-18T09:00",
  ]);
});

test("occurrences preserve the master event duration (timed)", () => {
  const event = timed("a", "2026-06-15T09:00", "2026-06-15T10:30", {
    frequency: "daily",
  });
  const occ = expandRecurrence(event, "2026-06-17", "2026-06-17")[0];
  assert.equal(occ.start, "2026-06-17T09:00");
  assert.equal(occ.end, "2026-06-17T10:30");
});

test("occurrences preserve duration across midnight-spanning events", () => {
  const event = timed("a", "2026-06-15T23:00", "2026-06-16T01:00", {
    frequency: "daily",
  });
  // The window day 06-18 is fully owned by the instance starting 06-18T23:00,
  // whose end carries to 06-19T01:00 — duration (120 min) is preserved.
  const occ = expandRecurrence(event, "2026-06-18", "2026-06-18").find(
    (o) => o.start === "2026-06-18T23:00",
  );
  assert.ok(occ);
  assert.equal(occ.end, "2026-06-19T01:00");
  // And the night-before instance (06-17T23:00) also intersects 06-18 via its
  // 06-18T01:00 end, confirming window intersection on the trailing edge.
  const trailing = expandRecurrence(event, "2026-06-18", "2026-06-18").map(
    (o) => o.start,
  );
  assert.ok(trailing.includes("2026-06-17T23:00"));
});

test("all-day recurrence preserves the multi-day span", () => {
  const event: CalendarEvent = {
    id: "a",
    title: "a",
    start: "2026-06-15",
    end: "2026-06-17",
    recurrence: { frequency: "weekly" },
  };
  const occ = expandRecurrence(event, "2026-06-22", "2026-06-22")[0];
  assert.equal(occ.start, "2026-06-22");
  assert.equal(occ.end, "2026-06-24");
  assert.equal(occ.allDay, true);
});

test("window intersection includes occurrences that span into the window", () => {
  // A 3-day all-day event starting before the window still intersects it.
  const event: CalendarEvent = {
    id: "a",
    title: "a",
    start: "2026-06-14",
    end: "2026-06-18",
  };
  assert.deepEqual(starts(event, "2026-06-16", "2026-06-20"), ["2026-06-14"]);
});

test("recurrence respects the iteration cap (no infinite loop)", () => {
  // A daily rule over a huge window must terminate; assert it returns a bounded
  // result rather than hanging.
  const event = timed("a", "2026-01-01T09:00", "2026-01-01T10:00", {
    frequency: "daily",
  });
  const result = expandRecurrence(event, "2026-01-01", "2099-12-31");
  assert.ok(result.length <= 1000);
});

test("getOccurrences flat-maps and sorts by start then event id", () => {
  const a = timed("b", "2026-06-17T10:00", "2026-06-17T11:00");
  const b = timed("a", "2026-06-17T10:00", "2026-06-17T11:00");
  const c = timed("c", "2026-06-17T09:00", "2026-06-17T09:30");
  const occs = getOccurrences([a, b, c], "2026-06-17", "2026-06-17");
  assert.deepEqual(
    occs.map((o) => `${o.start}/${o.event.id}`),
    ["2026-06-17T09:00/c", "2026-06-17T10:00/a", "2026-06-17T10:00/b"],
  );
});

test("long-running recurrence still expands far past its start (iteration-cap fix)", () => {
  // Regression: a daily/weekly series that began years before the visible window
  // must not exhaust the iteration cap before reaching it and vanish.
  const daily = timed("d", "2020-01-01T09:00", "2020-01-01T09:15", {
    frequency: "daily",
  });
  assert.equal(expandRecurrence(daily, "2026-06-01", "2026-06-30").length, 30);

  const weekdays = timed("w", "2020-01-06T09:00", "2020-01-06T09:30", {
    frequency: "weekly",
    byWeekday: [1, 2, 3, 4, 5],
  });
  // June 2026 has 22 weekdays.
  assert.equal(
    expandRecurrence(weekdays, "2026-06-01", "2026-06-30").length,
    22,
  );

  const monthly: CalendarEvent = {
    id: "m",
    title: "m",
    start: "2010-03-15",
    end: "2010-03-15",
    allDay: true,
    recurrence: { frequency: "monthly" },
  };
  assert.equal(expandRecurrence(monthly, "2026-06-01", "2026-06-30").length, 1);

  const yearly: CalendarEvent = {
    id: "y",
    title: "y",
    start: "2000-06-20",
    end: "2000-06-20",
    allDay: true,
    recurrence: { frequency: "yearly" },
  };
  assert.equal(expandRecurrence(yearly, "2026-06-01", "2026-06-30").length, 1);
});

test("count is still honored relative to the series start after fast-forward", () => {
  // A count-limited series whose occurrences are all consumed before the window
  // must yield nothing in the window (count counts from the start, not the view).
  const finished = timed("c", "2026-01-01T09:00", "2026-01-01T09:30", {
    frequency: "daily",
    count: 10,
  });
  assert.equal(
    expandRecurrence(finished, "2026-06-01", "2026-06-30").length,
    0,
  );

  const fromStart = timed("c2", "2026-06-01T09:00", "2026-06-01T09:30", {
    frequency: "daily",
    count: 3,
  });
  assert.deepEqual(starts(fromStart, "2026-06-01", "2026-06-30"), [
    "2026-06-01T09:00",
    "2026-06-02T09:00",
    "2026-06-03T09:00",
  ]);
});

test("a long-running multi-day instance that starts before the window is kept", () => {
  // The fast-forward floor backs off by the event duration so a multi-day
  // instance that begins just before the window still surfaces.
  const span: CalendarEvent = {
    id: "sp",
    title: "sp",
    start: "2020-06-01",
    end: "2020-06-03",
    allDay: true,
    recurrence: { frequency: "weekly" },
  };
  const occ = expandRecurrence(span, "2026-06-16", "2026-06-16");
  assert.equal(occ.length, 1);
  assert.equal(occ[0].start, "2026-06-15");
  assert.equal(occ[0].end, "2026-06-17");
});
