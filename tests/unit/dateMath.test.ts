import assert from "node:assert/strict";
import test from "node:test";

import {
  addDays,
  buildMonthGrid,
  clampIso,
  compareIso,
  daysInMonth,
  deriveCurrentPeriod,
  formatDisplay,
  formatDisplayRange,
  isValidIso,
  monthNumber,
  parseDisplay,
  parseDisplayRange,
  parseIso,
  shiftMonth,
  toIso,
  todayIso,
} from "../../src/date/dateMath";

test("parseIso accepts valid dates and rejects malformed or out-of-range", () => {
  assert.deepEqual(parseIso("2024-03-04"), { year: 2024, month: 3, day: 4 });
  assert.deepEqual(parseIso("2024-02-29"), { year: 2024, month: 2, day: 29 });
  assert.equal(parseIso("2023-02-29"), null);
  assert.equal(parseIso("2024-13-01"), null);
  assert.equal(parseIso("2024-03-32"), null);
  assert.equal(parseIso("2024-3-4"), null);
  assert.equal(parseIso(""), null);
  assert.equal(parseIso(null), null);
});

test("isValidIso mirrors parseIso", () => {
  assert.equal(isValidIso("2026-03-31"), true);
  assert.equal(isValidIso("nope"), false);
});

test("toIso zero-pads parts", () => {
  assert.equal(toIso({ year: 2024, month: 3, day: 4 }), "2024-03-04");
  assert.equal(toIso({ year: 26, month: 12, day: 31 }), "0026-12-31");
});

test("formatDisplay renders D Mon YYYY and empty for invalid", () => {
  assert.equal(formatDisplay("2024-03-04"), "4 Mar 2024");
  assert.equal(formatDisplay("2026-03-31"), "31 Mar 2026");
  assert.equal(formatDisplay("2025-04-01"), "1 Apr 2025");
  assert.equal(formatDisplay("bad"), "");
  assert.equal(formatDisplay(null), "");
});

test("parseDisplay accepts short and full month names, rejects bad input", () => {
  assert.equal(parseDisplay("4 Mar 2024"), "2024-03-04");
  assert.equal(parseDisplay("31 March 2026"), "2026-03-31");
  assert.equal(parseDisplay("1 apr 2025"), "2025-04-01");
  assert.equal(parseDisplay("31 Feb 2026"), null);
  assert.equal(parseDisplay("hello"), null);
  assert.equal(parseDisplay("4 Mar"), null);
  // A 2-digit year must be rejected, not parsed as year 24 (-> "0024-03-04").
  assert.equal(parseDisplay("4 Mar 24"), null);
});

test("range display strings round-trip through ISO", () => {
  assert.deepEqual(parseDisplayRange("1 Apr 2025 - 31 Mar 2026"), {
    start: "2025-04-01",
    end: "2026-03-31",
  });
  assert.deepEqual(parseDisplayRange("1 Apr 2025 — 31 Mar 2026"), {
    start: "2025-04-01",
    end: "2026-03-31",
  });
  assert.equal(
    formatDisplayRange({ start: "2025-04-01", end: "2026-03-31" }),
    "1 Apr 2025 — 31 Mar 2026",
  );
  assert.deepEqual(parseDisplayRange("garbage"), { start: "", end: "" });
  // A half-filled range keeps the separator so a single endpoint round-trips
  // (the user can fill start and end independently); a fully empty range is "".
  assert.equal(
    formatDisplayRange({ start: "2025-04-01", end: "" }),
    "1 Apr 2025 — ",
  );
  assert.equal(
    formatDisplayRange({ start: "", end: "2026-03-31" }),
    " — 31 Mar 2026",
  );
  assert.equal(formatDisplayRange({ start: "", end: "" }), "");
  assert.deepEqual(parseDisplayRange("1 Apr 2025 — "), {
    start: "2025-04-01",
    end: "",
  });
  assert.deepEqual(parseDisplayRange(" — 31 Mar 2026"), {
    start: "",
    end: "2026-03-31",
  });
  for (const range of [
    { start: "2025-04-01", end: "" },
    { start: "", end: "2026-03-31" },
  ]) {
    assert.deepEqual(parseDisplayRange(formatDisplayRange(range)), range);
  }
});

test("monthNumber maps abbreviations and full names case-insensitively", () => {
  assert.equal(monthNumber("Mar"), 3);
  assert.equal(monthNumber("march"), 3);
  assert.equal(monthNumber("DECEMBER"), 12);
  assert.equal(monthNumber("xyz"), null);
});

test("daysInMonth handles leap years and month lengths", () => {
  assert.equal(daysInMonth(2024, 2), 29);
  assert.equal(daysInMonth(2023, 2), 28);
  assert.equal(daysInMonth(2026, 4), 30);
  assert.equal(daysInMonth(2026, 12), 31);
});

test("shiftMonth carries across year boundaries", () => {
  assert.deepEqual(shiftMonth(2026, 3, 1), { year: 2026, month: 4 });
  assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
  assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  assert.deepEqual(shiftMonth(2026, 6, -13), { year: 2025, month: 5 });
});

test("compareIso and clampIso order and bound dates", () => {
  assert.ok(compareIso("2025-01-01", "2026-01-01") < 0);
  assert.equal(compareIso("2026-03-31", "2026-03-31"), 0);
  assert.equal(
    clampIso("2020-01-01", "2025-01-01", "2026-12-31"),
    "2025-01-01",
  );
  assert.equal(
    clampIso("2030-01-01", "2025-01-01", "2026-12-31"),
    "2026-12-31",
  );
  assert.equal(
    clampIso("2026-06-01", "2025-01-01", "2026-12-31"),
    "2026-06-01",
  );
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-03-31", 1), "2026-04-01");
  assert.equal(addDays("2025-04-01", -1), "2025-03-31");
  assert.equal(addDays("2026-01-01", -1), "2025-12-31");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
});

test("deriveCurrentPeriod returns the FY that ends on the year end", () => {
  assert.deepEqual(deriveCurrentPeriod("2026-03-31"), {
    start: "2025-04-01",
    end: "2026-03-31",
  });
  assert.deepEqual(deriveCurrentPeriod("2026-12-31"), {
    start: "2026-01-01",
    end: "2026-12-31",
  });
  assert.equal(deriveCurrentPeriod("bad"), null);
  // 29 Feb year end: the prior year (2023) has no 29 Feb, so the prior year-end
  // clamps to 28 Feb 2023 and the period starts 1 Mar 2023 — not an invalid date.
  assert.deepEqual(deriveCurrentPeriod("2024-02-29"), {
    start: "2023-03-01",
    end: "2024-02-29",
  });
});

test("todayIso uses the local calendar day", () => {
  assert.equal(todayIso(new Date(2026, 4, 28)), "2026-05-28");
  assert.equal(todayIso(new Date(2024, 0, 1)), "2024-01-01");
});

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
