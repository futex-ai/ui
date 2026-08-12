import assert from "node:assert/strict";
import test from "node:test";

import { bandScale, groupedBands } from "../../src/chart/scale/band";
import {
  clampDomain,
  extentOf,
  linearScale,
  timeScale,
  toEpoch,
} from "../../src/chart/scale/linear";
import {
  compactNumber,
  groupThousands,
  niceTicks,
  niceTimeTicks,
} from "../../src/chart/scale/ticks";

// ------------------------------------------------------------ linear scales

test("linearScale maps a domain onto a range and back", () => {
  const s = linearScale([0, 100], [0, 200]);
  assert.equal(s.scale(0), 0);
  assert.equal(s.scale(50), 100);
  assert.equal(s.scale(100), 200);
  assert.equal(s.invert(100), 50);
});

test("linearScale supports an inverted range (screen y grows downward)", () => {
  const s = linearScale([0, 10], [100, 0]);
  assert.equal(s.scale(0), 100);
  assert.equal(s.scale(10), 0);
  assert.equal(s.scale(5), 50);
});

test("a flat domain collapses to the range midpoint instead of dividing by zero", () => {
  const s = linearScale([5, 5], [0, 100]);
  assert.equal(s.scale(5), 50);
  assert.equal(s.scale(999), 50);
  assert.ok(Number.isFinite(s.scale(5)));
  // Inverting a degenerate scale returns the single domain value.
  assert.equal(s.invert(37), 5);
});

test("linearScale returns NaN for non-finite input rather than a bogus pixel", () => {
  const s = linearScale([0, 10], [0, 100]);
  assert.ok(Number.isNaN(s.scale(Number.NaN)));
  assert.ok(Number.isNaN(s.scale(Number.POSITIVE_INFINITY)));
});

test("extentOf includes zero by default so bars are not truncated", () => {
  assert.deepEqual(extentOf([10, 20, 30]), [0, 30]);
  assert.deepEqual(extentOf([10, 20, 30], { includeZero: false }), [10, 30]);
});

test("extentOf ignores gaps rather than reading them as zero", () => {
  assert.deepEqual(extentOf([10, null, 30]), [0, 30]);
  assert.deepEqual(extentOf([10, null, 30], { includeZero: false }), [10, 30]);
});

test("extentOf handles negatives, empty data and a single value", () => {
  assert.deepEqual(extentOf([-5, -20]), [-20, 0]);
  assert.deepEqual(extentOf([]), [0, 1]);
  assert.deepEqual(extentOf([null, null]), [0, 1]);
  const single = extentOf([7]);
  assert.ok(single[0] < single[1], "a single value still needs a span");
});

test("clampDomain clamps and tolerates a reversed domain", () => {
  assert.equal(clampDomain(5, [0, 10]), 5);
  assert.equal(clampDomain(-1, [0, 10]), 0);
  assert.equal(clampDomain(11, [0, 10]), 10);
  assert.equal(clampDomain(-1, [10, 0]), 0);
});

test("timeScale accepts Dates, epochs and ISO strings", () => {
  const a = new Date("2026-01-01T00:00:00Z");
  const b = new Date("2026-01-11T00:00:00Z");
  const s = timeScale([a, b], [0, 100]);
  assert.equal(s.scale(a.getTime()), 0);
  assert.equal(s.scale(b.getTime()), 100);
  assert.equal(toEpoch("2026-01-01T00:00:00Z"), a.getTime());
  assert.equal(toEpoch(a), a.getTime());
  assert.equal(toEpoch(1234), 1234);
});

test("an irregular time series spaces by value, not by index", () => {
  // Three points where the second sits far closer to the first in time.
  const t0 = Date.UTC(2026, 0, 1);
  const t1 = Date.UTC(2026, 0, 2);
  const t2 = Date.UTC(2026, 0, 31);
  const s = timeScale([t0, t2], [0, 300]);
  // Band spacing would put t1 at 150; a time scale puts it near the start.
  assert.ok(
    s.scale(t1) < 20,
    `expected t1 near the left edge, got ${s.scale(t1)}`,
  );
});

// -------------------------------------------------------------- band scales

test("bandScale spreads categories with padding and centres them", () => {
  const b = bandScale(4, [0, 400]);
  assert.equal(b.count, 4);
  assert.ok(b.bandwidth > 0 && b.bandwidth < b.step);
  assert.ok(b.start(0) >= 0);
  assert.ok(b.start(3) + b.bandwidth <= 400.001);
  assert.equal(b.center(0), b.start(0) + b.bandwidth / 2);
});

test("bandScale.nearestIndex snaps to the closest band, clamped at the ends", () => {
  const b = bandScale(5, [0, 500]);
  assert.equal(b.nearestIndex(b.center(0)), 0);
  assert.equal(b.nearestIndex(b.center(3)), 3);
  assert.equal(b.nearestIndex(-999), 0);
  assert.equal(b.nearestIndex(9999), 4);
});

test("an empty band scale is inert rather than NaN", () => {
  const b = bandScale(0, [0, 100]);
  assert.equal(b.bandwidth, 0);
  assert.equal(b.step, 0);
  assert.equal(b.nearestIndex(50), -1);
  assert.ok(Number.isFinite(b.start(0)));
});

test("a zero-width range yields zero-width bands without crashing", () => {
  const b = bandScale(3, [0, 0]);
  assert.equal(b.bandwidth, 0);
  assert.equal(b.nearestIndex(0), 0);
});

test("groupedBands splits a band into non-overlapping sub-bands", () => {
  const b = bandScale(3, [0, 300]);
  const groups = groupedBands(b, 0, 3);
  assert.equal(groups.length, 3);
  for (let i = 1; i < groups.length; i += 1) {
    assert.ok(
      groups[i].start >= groups[i - 1].start + groups[i - 1].width,
      "grouped bars must not overlap",
    );
  }
  const span = groups[2].start + groups[2].width - groups[0].start;
  assert.ok(span <= b.bandwidth + 0.001, "the group must fit inside its band");
  assert.deepEqual(groupedBands(b, 0, 0), []);
});

// -------------------------------------------------------------------- ticks

test("niceTicks lands on round numbers and covers the data", () => {
  const { ticks, domain } = niceTicks(0, 4873, 5);
  assert.ok(domain[0] <= 0 && domain[1] >= 4873);
  assert.deepEqual(ticks, [0, 1000, 2000, 3000, 4000, 5000]);
});

test("niceTicks avoids floating-point drift on fractional steps", () => {
  const { ticks } = niceTicks(0, 1, 5);
  for (const tick of ticks) {
    assert.equal(
      tick,
      Number(tick.toFixed(6)),
      `tick ${tick} carries floating-point noise`,
    );
  }
});

test("niceTicks handles negatives, a flat domain and non-finite input", () => {
  const negative = niceTicks(-50, 50, 4);
  assert.ok(negative.ticks.includes(0), "a spanning domain must include zero");
  const flat = niceTicks(7, 7);
  assert.ok(flat.ticks.length >= 2);
  assert.ok(flat.domain[0] < flat.domain[1]);
  const bad = niceTicks(Number.NaN, 10);
  assert.deepEqual(bad.ticks, [0, 1]);
});

test("niceTimeTicks steps on recognisable intervals", () => {
  const start = Date.UTC(2026, 0, 1);
  const end = Date.UTC(2026, 0, 8);
  const ticks = niceTimeTicks(start, end, 5);
  assert.ok(ticks.length > 0);
  assert.ok(ticks.every((t) => t >= start && t <= end));
  // Day-scale ticks land on a day boundary in local time.
  assert.ok(ticks.every((t) => t % 60_000 === 0));
});

test("niceTimeTicks walks the calendar for multi-month spans", () => {
  const ticks = niceTimeTicks(Date.UTC(2026, 0, 1), Date.UTC(2027, 0, 1), 6);
  assert.ok(ticks.length >= 2);
  // Calendar steps land on the first of a month, not on 30-day multiples.
  assert.ok(ticks.every((t) => new Date(t).getDate() === 1));
});

test("niceTimeTicks degrades safely on bad or empty input", () => {
  assert.deepEqual(niceTimeTicks(Number.NaN, 10), []);
  assert.deepEqual(niceTimeTicks(100, 50), []);
  assert.deepEqual(niceTimeTicks(100, 100), [100]);
});

// ------------------------------------------------------------- number format

test("compactNumber keeps mid-range values exact and compacts large ones", () => {
  assert.equal(compactNumber(1284), "1,284");
  assert.equal(compactNumber(12_900), "12.9K");
  assert.equal(compactNumber(4_200_000), "4.2M");
  assert.equal(compactNumber(1_000_000), "1M");
  assert.equal(compactNumber(-12_900), "-12.9K");
  assert.equal(compactNumber(Number.NaN), "—");
});

test("groupThousands preserves sign and decimals", () => {
  assert.equal(groupThousands(1234567), "1,234,567");
  assert.equal(groupThousands(-1234), "-1,234");
  assert.equal(groupThousands(1234.5), "1,234.5");
  assert.equal(groupThousands(999), "999");
});
