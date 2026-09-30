import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { addDays } from "../../src/date/dateMath";
import { buildMonthGrid } from "../../src/date/monthGrid";

test("buildMonthGrid is Monday-first with adjacent-month padding", () => {
  const weeks = buildMonthGrid(2026, 3);
  const flat = weeks.flat();
  assert.equal(flat.length % 7, 0);
  // March 2026: the 1st is a Sunday, so six leading Feb days fill the first week.
  assert.equal(weeks[0][0].iso, "2026-02-23");
  assert.equal(weeks[0][0].inMonth, false);
  assert.equal(weeks[0][6].iso, "2026-03-01");
  assert.equal(weeks[0][6].inMonth, true);
  const lastInMonth = flat.filter((cell) => cell.inMonth);
  assert.equal(lastInMonth.length, 31);
  assert.equal(lastInMonth[30].iso, "2026-03-31");
  assert.equal(lastInMonth[30].day, 31);
});

test("buildMonthGrid spans only the month's own weeks by default", () => {
  // February 2027 starts on a Monday and fills exactly four weeks.
  assert.equal(buildMonthGrid(2027, 2).length, 4);
  // February 2026 starts on a Sunday, so it reaches into a fifth week.
  assert.equal(buildMonthGrid(2026, 2).length, 5);
  assert.equal(buildMonthGrid(2026, 3).length, 6);
});

test("buildMonthGrid pads every month to six weeks with fixedWeeks", () => {
  for (const [year, month] of [
    [2027, 2],
    [2026, 2],
    [2026, 3],
  ]) {
    const weeks = buildMonthGrid(year, month, { fixedWeeks: true });
    assert.equal(weeks.length, 6);
    assert.ok(weeks.every((week) => week.length === 7));
    // One unbroken run of days, so keyboard navigation can walk across rows.
    const flat = weeks.flat();
    flat.forEach((cell, index) => {
      assert.equal(cell.iso, addDays(flat[0].iso, index));
    });
  }

  // February 2027's four weeks gain two whole weeks of March, marked outside
  // the month.
  const february = buildMonthGrid(2027, 2, { fixedWeeks: true });
  assert.equal(february[4][0].iso, "2027-03-01");
  assert.equal(february[5][6].iso, "2027-03-14");
  assert.ok(
    february
      .slice(4)
      .flat()
      .every((cell) => !cell.inMonth),
  );
  assert.equal(february.flat().filter((cell) => cell.inMonth).length, 28);
});

test("the calendar renders six weeks for every month", () => {
  const source = readFileSync(
    new URL("../../src/date/CalendarMonth.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /buildMonthGrid\(view\.year, view\.month, \{ fixedWeeks: true \}\)/,
  );
});
