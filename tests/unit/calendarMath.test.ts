import assert from "node:assert/strict";
import test from "node:test";

import {
  addMinutes,
  clampDateTime,
  compareDateTime,
  dateOf,
  diffMinutes,
  formatHourLabel,
  formatTime,
  formatTimeRange,
  hours,
  makeDateTime,
  minutesOfDay,
  minutesToY,
  monthGridDates,
  parseDateTime,
  snap,
  startOfWeek,
  stepDate,
  viewRange,
  viewTitle,
  weekDates,
  weekdayLabels,
  weekdayOf,
  WEEKDAY_LABELS,
  yToMinutes,
} from "../../src/calendar/calendarMath";

test("parseDateTime splits timed, dates, and rejects invalid", () => {
  assert.deepEqual(parseDateTime("2026-06-17T09:30"), {
    date: "2026-06-17",
    minutes: 9 * 60 + 30,
  });
  assert.deepEqual(parseDateTime("2026-06-17"), {
    date: "2026-06-17",
    minutes: 0,
  });
  assert.deepEqual(parseDateTime("2026-06-17T00:00"), {
    date: "2026-06-17",
    minutes: 0,
  });
  assert.equal(parseDateTime("2026-06-17T24:00"), null);
  assert.equal(parseDateTime("2026-06-17T09:60"), null);
  assert.equal(parseDateTime("2026-13-01T09:30"), null);
  assert.equal(parseDateTime("nope"), null);
});

test("dateOf and minutesOfDay extract the halves", () => {
  assert.equal(dateOf("2026-06-17T09:30"), "2026-06-17");
  assert.equal(dateOf("2026-06-17"), "2026-06-17");
  assert.equal(minutesOfDay("2026-06-17T09:30"), 570);
  assert.equal(minutesOfDay("2026-06-17"), 0);
  assert.equal(minutesOfDay("2026-06-17T23:59"), 1439);
});

test("makeDateTime formats HH:mm and zero-pads", () => {
  assert.equal(makeDateTime("2026-06-17", 570), "2026-06-17T09:30");
  assert.equal(makeDateTime("2026-06-17", 0), "2026-06-17T00:00");
  assert.equal(makeDateTime("2026-06-17", 1439), "2026-06-17T23:59");
  assert.equal(makeDateTime("2026-06-17", 5), "2026-06-17T00:05");
});

test("addMinutes carries across day boundaries both directions", () => {
  assert.equal(addMinutes("2026-06-17T09:30", 45), "2026-06-17T10:15");
  assert.equal(addMinutes("2026-06-17T23:30", 60), "2026-06-18T00:30");
  assert.equal(addMinutes("2026-06-17T00:30", -60), "2026-06-16T23:30");
  assert.equal(addMinutes("2026-06-17T09:00", 24 * 60), "2026-06-18T09:00");
  assert.equal(
    addMinutes("2026-06-17T09:00", -2 * 24 * 60),
    "2026-06-15T09:00",
  );
});

test("diffMinutes is b - a, across days too", () => {
  assert.equal(diffMinutes("2026-06-17T09:30", "2026-06-17T10:00"), 30);
  assert.equal(diffMinutes("2026-06-17T10:00", "2026-06-17T09:30"), -30);
  assert.equal(diffMinutes("2026-06-17T23:30", "2026-06-18T00:30"), 60);
  assert.equal(diffMinutes("2026-06-17T00:00", "2026-06-19T00:00"), 2 * 1440);
});

test("compareDateTime and clampDateTime", () => {
  assert.equal(compareDateTime("2026-06-17T09:00", "2026-06-17T10:00"), -1);
  assert.equal(compareDateTime("2026-06-17T10:00", "2026-06-17T09:00"), 1);
  assert.equal(compareDateTime("2026-06-17T09:00", "2026-06-17T09:00"), 0);
  assert.equal(
    clampDateTime("2026-06-17T08:00", "2026-06-17T09:00", "2026-06-17T17:00"),
    "2026-06-17T09:00",
  );
  assert.equal(
    clampDateTime("2026-06-17T18:00", "2026-06-17T09:00", "2026-06-17T17:00"),
    "2026-06-17T17:00",
  );
  assert.equal(
    clampDateTime("2026-06-17T12:00", "2026-06-17T09:00", "2026-06-17T17:00"),
    "2026-06-17T12:00",
  );
});

test("weekdayOf returns 0=Sun..6=Sat", () => {
  // 2026-06-17 is a Wednesday.
  assert.equal(weekdayOf("2026-06-17"), 3);
  assert.equal(weekdayOf("2026-06-14"), 0); // Sunday
  assert.equal(weekdayOf("2026-06-20"), 6); // Saturday
});

test("startOfWeek and weekDates respect weekStartsOn", () => {
  // Sunday-start: week of Wed 2026-06-17 begins Sun 2026-06-14.
  assert.equal(startOfWeek("2026-06-17", 0), "2026-06-14");
  assert.deepEqual(weekDates("2026-06-17", 0), [
    "2026-06-14",
    "2026-06-15",
    "2026-06-16",
    "2026-06-17",
    "2026-06-18",
    "2026-06-19",
    "2026-06-20",
  ]);
  // Monday-start: week begins Mon 2026-06-15.
  assert.equal(startOfWeek("2026-06-17", 1), "2026-06-15");
  assert.deepEqual(weekDates("2026-06-17", 1)[0], "2026-06-15");
  assert.deepEqual(weekDates("2026-06-17", 1)[6], "2026-06-21");
});

test("monthGridDates covers the month with lead/trail and full weeks", () => {
  const grid = monthGridDates(2026, 6, 0); // June 2026, Sunday-start.
  // Every row has 7 dates.
  for (const row of grid) {
    assert.equal(row.length, 7);
  }
  // First cell is a Sunday on/before the 1st; June 1 2026 is a Monday so the
  // grid leads with Sunday May 31.
  assert.equal(grid[0][0], "2026-05-31");
  // The 1st appears in the first row.
  assert.ok(grid[0].includes("2026-06-01"));
  // Last cell is a Saturday on/after the 30th.
  const last = grid[grid.length - 1];
  assert.equal(weekdayOf(last[6]), 6);
  assert.ok(grid.flat().includes("2026-06-30"));
});

test("monthGridDates with weekStartsOn=1 matches a Monday-first layout", () => {
  const grid = monthGridDates(2026, 6, 1);
  assert.equal(weekdayOf(grid[0][0]), 1); // Monday
  assert.equal(grid[0][0], "2026-06-01"); // June 1 2026 is a Monday
});

test("weekdayLabels rotate and WEEKDAY_LABELS source", () => {
  assert.deepEqual(WEEKDAY_LABELS, [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);
  assert.deepEqual(weekdayLabels(0), [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ]);
  assert.deepEqual(weekdayLabels(1), [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);
});

test("viewRange returns inclusive windows per view", () => {
  // Month: full weeks covering June 2026.
  assert.deepEqual(viewRange("month", "2026-06-17", 0, 30), {
    start: "2026-05-31",
    end: "2026-07-04",
  });
  // Week (Sunday-start).
  assert.deepEqual(viewRange("week", "2026-06-17", 0, 30), {
    start: "2026-06-14",
    end: "2026-06-20",
  });
  // Day.
  assert.deepEqual(viewRange("day", "2026-06-17", 0, 30), {
    start: "2026-06-17",
    end: "2026-06-17",
  });
  // Agenda spans agendaDays.
  assert.deepEqual(viewRange("agenda", "2026-06-17", 0, 30), {
    start: "2026-06-17",
    end: "2026-07-16",
  });
});

test("viewTitle formats per view", () => {
  assert.equal(viewTitle("month", "2026-06-17", 0, 30), "June 2026");
  assert.equal(viewTitle("week", "2026-06-17", 0, 30), "14 – 20 Jun 2026");
  assert.equal(viewTitle("day", "2026-06-17", 0, 30), "Wednesday, 17 Jun 2026");
  assert.equal(
    viewTitle("agenda", "2026-06-17", 0, 30),
    "17 Jun – 16 Jul 2026",
  );
});

test("viewTitle collapses month-spanning weeks", () => {
  // Week of 2026-06-29 (Sun-start: 28 Jun .. 4 Jul) crosses the month boundary.
  assert.equal(viewTitle("week", "2026-06-30", 0, 30), "28 Jun – 4 Jul 2026");
});

test("stepDate moves by the view granularity", () => {
  // Month: ±1 month via shiftMonth, clamping the day.
  assert.equal(stepDate("month", "2026-06-17", 0, 30, 1), "2026-07-17");
  assert.equal(stepDate("month", "2026-06-17", 0, 30, -1), "2026-05-17");
  // Day clamp: Jan 31 +1 month => Feb 28 (2026 non-leap).
  assert.equal(stepDate("month", "2026-01-31", 0, 30, 1), "2026-02-28");
  // Week: ±7 days.
  assert.equal(stepDate("week", "2026-06-17", 0, 30, 1), "2026-06-24");
  assert.equal(stepDate("week", "2026-06-17", 0, 30, -1), "2026-06-10");
  // Day: ±1 day.
  assert.equal(stepDate("day", "2026-06-17", 0, 30, 1), "2026-06-18");
  // Agenda: ±agendaDays.
  assert.equal(stepDate("agenda", "2026-06-17", 0, 30, 1), "2026-07-17");
  assert.equal(stepDate("agenda", "2026-06-17", 0, 7, -1), "2026-06-10");
});

test("hours enumerates [minHour..maxHour-1]", () => {
  assert.deepEqual(hours(0, 24).length, 24);
  assert.deepEqual(hours(0, 24)[0], 0);
  assert.deepEqual(hours(0, 24)[23], 23);
  assert.deepEqual(hours(9, 17), [9, 10, 11, 12, 13, 14, 15, 16]);
});

test("minutesToY and yToMinutes are inverse geometry", () => {
  // 48 px/hour, starting at hour 0: 60 min => 48 px.
  assert.equal(minutesToY(60, 0, 48), 48);
  assert.equal(minutesToY(0, 0, 48), 0);
  // Starting at hour 8: 8:00 (480 min) is at the top (y=0).
  assert.equal(minutesToY(480, 8, 48), 0);
  assert.equal(minutesToY(540, 8, 48), 48);
  // Inverse.
  assert.equal(yToMinutes(48, 0, 48), 60);
  assert.equal(yToMinutes(0, 8, 48), 480);
  assert.equal(yToMinutes(minutesToY(615, 8, 48), 8, 48), 615);
});

test("snap rounds to the nearest step", () => {
  assert.equal(snap(0, 30), 0);
  assert.equal(snap(14, 30), 0);
  assert.equal(snap(15, 30), 30);
  assert.equal(snap(44, 30), 30);
  assert.equal(snap(45, 30), 60);
  assert.equal(snap(7, 15), 0);
  assert.equal(snap(8, 15), 15);
});

test("formatHourLabel renders 12-hour clock with AM/PM", () => {
  assert.equal(formatHourLabel(0), "12 AM");
  assert.equal(formatHourLabel(9), "9 AM");
  assert.equal(formatHourLabel(12), "12 PM");
  assert.equal(formatHourLabel(13), "1 PM");
  assert.equal(formatHourLabel(23), "11 PM");
});

test("formatTime renders a timed value", () => {
  assert.equal(formatTime("2026-06-17T09:30"), "9:30 AM");
  assert.equal(formatTime("2026-06-17T00:00"), "12:00 AM");
  assert.equal(formatTime("2026-06-17T12:00"), "12:00 PM");
  assert.equal(formatTime("2026-06-17T13:05"), "1:05 PM");
});

test("formatTimeRange collapses a shared period", () => {
  assert.equal(
    formatTimeRange("2026-06-17T09:30", "2026-06-17T10:00"),
    "9:30 – 10:00 AM",
  );
  assert.equal(
    formatTimeRange("2026-06-17T11:30", "2026-06-17T13:00"),
    "11:30 AM – 1:00 PM",
  );
  assert.equal(
    formatTimeRange("2026-06-17T22:00", "2026-06-18T00:30"),
    "10:00 PM – 12:30 AM",
  );
});
