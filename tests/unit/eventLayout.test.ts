import assert from "node:assert/strict";
import test from "node:test";

import {
  layoutDayColumns,
  layoutMonthWeek,
} from "../../src/calendar/eventLayout";
import type { CalendarOccurrence } from "../../src/calendar/types";

/** Build a timed occurrence on a single day. */
function timed(id: string, start: string, end: string): CalendarOccurrence {
  return {
    event: { id, title: id, start, end },
    key: `${id}#${start}`,
    start,
    end,
    allDay: false,
  };
}

/** Build an all-day occurrence (date-only start/end, end inclusive). */
function allDay(id: string, start: string, end: string): CalendarOccurrence {
  return {
    event: { id, title: id, start, end, allDay: true },
    key: `${id}#${start}`,
    start,
    end,
    allDay: true,
  };
}

/** Map laid-out result to a compact `[id, column, columns]` shape. */
function cols(
  result: ReturnType<typeof layoutDayColumns>,
): Array<[string, number, number]> {
  return result.map((r) => [r.occurrence.event.id, r.column, r.columns]);
}

test("layoutDayColumns ignores all-day occurrences", () => {
  const result = layoutDayColumns(
    [allDay("a", "2026-06-17", "2026-06-17")],
    "2026-06-17",
  );
  assert.deepEqual(result, []);
});

test("non-overlapping events each get one column", () => {
  const result = layoutDayColumns(
    [
      timed("a", "2026-06-17T09:00", "2026-06-17T10:00"),
      timed("b", "2026-06-17T10:00", "2026-06-17T11:00"),
    ],
    "2026-06-17",
  );
  // Back-to-back (b starts exactly when a ends) => not overlapping => 1 column.
  assert.deepEqual(cols(result), [
    ["a", 0, 1],
    ["b", 0, 1],
  ]);
});

test("two overlapping events get two side-by-side columns", () => {
  const result = layoutDayColumns(
    [
      timed("a", "2026-06-17T09:00", "2026-06-17T10:30"),
      timed("b", "2026-06-17T10:00", "2026-06-17T11:00"),
    ],
    "2026-06-17",
  );
  assert.deepEqual(cols(result), [
    ["a", 0, 2],
    ["b", 1, 2],
  ]);
});

test("three mutually overlapping events get three columns", () => {
  const result = layoutDayColumns(
    [
      timed("a", "2026-06-17T09:00", "2026-06-17T12:00"),
      timed("b", "2026-06-17T09:30", "2026-06-17T11:00"),
      timed("c", "2026-06-17T10:00", "2026-06-17T11:30"),
    ],
    "2026-06-17",
  );
  assert.deepEqual(cols(result), [
    ["a", 0, 3],
    ["b", 1, 3],
    ["c", 2, 3],
  ]);
});

test("a freed column is reused by a later non-overlapping event", () => {
  // a 9-10, b 9-11 (overlaps a). c 10-11 starts after a ends. Sort is
  // longer-first on a tie, so b takes col 0; a takes col 1; c reuses a's freed
  // col 1 (a and c are non-overlapping). Cluster is transitively connected, so
  // columns = 2 throughout.
  const result = layoutDayColumns(
    [
      timed("a", "2026-06-17T09:00", "2026-06-17T10:00"),
      timed("b", "2026-06-17T09:00", "2026-06-17T11:00"),
      timed("c", "2026-06-17T10:00", "2026-06-17T11:00"),
    ],
    "2026-06-17",
  );
  const byId = new Map(cols(result).map(([id, col, n]) => [id, [col, n]]));
  assert.deepEqual(byId.get("b"), [0, 2]);
  assert.deepEqual(byId.get("a"), [1, 2]);
  assert.deepEqual(byId.get("c"), [1, 2]); // reuses a's freed column
});

test("a gap splits clusters so concurrency resets", () => {
  const result = layoutDayColumns(
    [
      timed("a", "2026-06-17T09:00", "2026-06-17T10:00"),
      timed("b", "2026-06-17T09:30", "2026-06-17T10:00"),
      // Gap here (nothing spans 10:00) — next pair is its own cluster.
      timed("c", "2026-06-17T11:00", "2026-06-17T12:00"),
      timed("d", "2026-06-17T11:30", "2026-06-17T12:00"),
    ],
    "2026-06-17",
  );
  const byId = new Map(cols(result).map(([id, col, n]) => [id, [col, n]]));
  assert.deepEqual(byId.get("a"), [0, 2]);
  assert.deepEqual(byId.get("b"), [1, 2]);
  assert.deepEqual(byId.get("c"), [0, 2]);
  assert.deepEqual(byId.get("d"), [1, 2]);
});

test("layoutDayColumns clips multi-day spans to the day window", () => {
  // Event runs from the night before into mid-morning of the target day.
  const result = layoutDayColumns(
    [timed("a", "2026-06-16T22:00", "2026-06-17T08:00")],
    "2026-06-17",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].startMinutes, 0); // clipped to start of day
  assert.equal(result[0].endMinutes, 8 * 60);
  // And a span continuing past the end of the day clips to 1440.
  const result2 = layoutDayColumns(
    [timed("b", "2026-06-17T22:00", "2026-06-18T06:00")],
    "2026-06-17",
  );
  assert.equal(result2[0].startMinutes, 22 * 60);
  assert.equal(result2[0].endMinutes, 1440);
});

test("an event ending exactly at the day start does not occupy it", () => {
  const result = layoutDayColumns(
    [timed("a", "2026-06-16T22:00", "2026-06-17T00:00")],
    "2026-06-17",
  );
  assert.deepEqual(result, []);
});

// --- Month week layout ---------------------------------------------------

const WEEK = [
  "2026-06-14", // Sun
  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
  "2026-06-19",
  "2026-06-20", // Sat
];

test("month single-day timed event becomes a one-column bar", () => {
  const layout = layoutMonthWeek(
    WEEK,
    [timed("a", "2026-06-17T09:00", "2026-06-17T10:00")],
    3,
  );
  assert.equal(layout.bars.length, 1);
  assert.deepEqual(
    { startCol: layout.bars[0].startCol, endCol: layout.bars[0].endCol },
    { startCol: 3, endCol: 3 },
  );
  assert.equal(layout.bars[0].lane, 0);
  assert.deepEqual(layout.overflowByCol, [0, 0, 0, 0, 0, 0, 0]);
});

test("month multi-day all-day event spans across the week columns", () => {
  // All-day Tue..Thu (end inclusive) => columns 1..3.
  const layout = layoutMonthWeek(
    WEEK,
    [allDay("a", "2026-06-15", "2026-06-17")],
    3,
  );
  assert.equal(layout.bars.length, 1);
  assert.equal(layout.bars[0].startCol, 1);
  assert.equal(layout.bars[0].endCol, 3);
  assert.equal(layout.bars[0].lane, 0);
});

test("month bars overlapping in columns take separate lanes", () => {
  const layout = layoutMonthWeek(
    WEEK,
    [
      allDay("a", "2026-06-15", "2026-06-18"), // cols 1..4
      allDay("b", "2026-06-16", "2026-06-17"), // cols 2..3 (overlaps a)
    ],
    3,
  );
  const byId = new Map(
    layout.bars.map((bar) => [bar.occurrence.event.id, bar.lane]),
  );
  // The longer span sorts first onto lane 0; the shorter takes lane 1.
  assert.equal(byId.get("a"), 0);
  assert.equal(byId.get("b"), 1);
});

test("month bars in disjoint columns can share a lane", () => {
  const layout = layoutMonthWeek(
    WEEK,
    [
      allDay("a", "2026-06-14", "2026-06-15"), // cols 0..1
      allDay("b", "2026-06-18", "2026-06-19"), // cols 4..5
    ],
    3,
  );
  // No column overlap => both fit on lane 0.
  assert.deepEqual(
    layout.bars.map((bar) => bar.lane),
    [0, 0],
  );
});

test("month all-day/multi-day bars sort before short timed events", () => {
  const layout = layoutMonthWeek(
    WEEK,
    [
      timed("t", "2026-06-16T09:00", "2026-06-16T10:00"), // single col 2
      allDay("d", "2026-06-15", "2026-06-18"), // cols 1..4
    ],
    3,
  );
  const byId = new Map(
    layout.bars.map((bar) => [bar.occurrence.event.id, bar.lane]),
  );
  // The multi-day all-day bar takes the top lane.
  assert.equal(byId.get("d"), 0);
  assert.equal(byId.get("t"), 1);
});

test("month lane overflow drops bars beyond maxLanes and counts per column", () => {
  // Four single-day events all on col 2; maxLanes 3 keeps 3, overflows 1.
  const layout = layoutMonthWeek(
    WEEK,
    [
      allDay("a", "2026-06-16", "2026-06-16"),
      allDay("b", "2026-06-16", "2026-06-16"),
      allDay("c", "2026-06-16", "2026-06-16"),
      allDay("d", "2026-06-16", "2026-06-16"),
    ],
    3,
  );
  assert.equal(layout.bars.length, 3);
  assert.deepEqual(layout.overflowByCol, [0, 0, 1, 0, 0, 0, 0]);
});

test("month overflow counts each covered column of a dropped span", () => {
  // A wide bar that lands on the overflow lane bumps every column it covers.
  const layout = layoutMonthWeek(
    WEEK,
    [
      allDay("a", "2026-06-15", "2026-06-17"), // lane 0, cols 1..3
      allDay("b", "2026-06-15", "2026-06-17"), // lane 1, cols 1..3
      allDay("c", "2026-06-15", "2026-06-17"), // lane 2, cols 1..3
      allDay("d", "2026-06-15", "2026-06-17"), // overflow, cols 1..3
    ],
    3,
  );
  assert.equal(layout.bars.length, 3);
  assert.deepEqual(layout.overflowByCol, [0, 1, 1, 1, 0, 0, 0]);
});

test("month layout clips spans that start before / end after the week", () => {
  const layout = layoutMonthWeek(
    WEEK,
    [allDay("a", "2026-06-12", "2026-06-22")], // spans the whole week + beyond
    3,
  );
  assert.equal(layout.bars[0].startCol, 0);
  assert.equal(layout.bars[0].endCol, 6);
});

test("month layout ignores events outside the week entirely", () => {
  const layout = layoutMonthWeek(
    WEEK,
    [allDay("a", "2026-07-01", "2026-07-03")],
    3,
  );
  assert.deepEqual(layout.bars, []);
  assert.deepEqual(layout.overflowByCol, [0, 0, 0, 0, 0, 0, 0]);
});
