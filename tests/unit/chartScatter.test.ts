import assert from "node:assert/strict";
import test from "node:test";

import {
  bubbleRadius,
  nearestPoint,
  waterfallExtent,
  waterfallSteps,
} from "../../src/chart/scatterGeometry";

// ------------------------------------------------------------------- bubbles

test("bubble magnitude is encoded as area, never radius", () => {
  const max = 22;
  const min = 3;
  // Quadrupling the value should roughly double the radius, because area — not
  // radius — is proportional to value. Scaling radius directly would overstate
  // a 4x value as 16x the ink.
  const quarter = bubbleRadius(25, 100, max, min);
  const full = bubbleRadius(100, 100, max, min);
  assert.equal(full, max);
  const quarterSpan = quarter - min;
  const fullSpan = full - min;
  assert.ok(Math.abs(quarterSpan / fullSpan - 0.5) < 1e-9);
});

test("bubble radius floors rather than vanishing", () => {
  assert.equal(bubbleRadius(0, 100, 22, 3), 3);
  assert.equal(bubbleRadius(null, 100, 22, 3), 3);
  assert.equal(bubbleRadius(-5, 100, 22, 3), 3);
  assert.equal(bubbleRadius(Number.NaN, 100, 22, 3), 3);
  // A zero maximum must not divide by zero.
  assert.equal(bubbleRadius(10, 0, 22, 3), 3);
});

test("a value above the maximum clamps rather than overflowing", () => {
  assert.equal(bubbleRadius(500, 100, 22, 3), 22);
});

// ------------------------------------------------------------ nearest point

test("nearestPoint finds the closest mark, not the one under the pointer", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
  ];
  // An 8px dot is a pinpoint; the pointer only has to be closest.
  assert.equal(nearestPoint(points, 10, 5), 0);
  assert.equal(nearestPoint(points, 90, 10), 1);
  assert.equal(nearestPoint(points, 95, 95), 2);
});

test("nearestPoint respects a maximum distance so empty space selects nothing", () => {
  const points = [{ x: 0, y: 0 }];
  assert.equal(nearestPoint(points, 5, 5, 24), 0);
  assert.equal(nearestPoint(points, 500, 500, 24), -1);
  assert.equal(nearestPoint([], 0, 0), -1);
});

// -------------------------------------------------------------- waterfall

test("a waterfall bridges deltas through a running total", () => {
  const steps = waterfallSteps([
    { id: "start", value: 100 },
    { id: "up", value: 50 },
    { id: "down", value: -30 },
  ]);
  assert.deepEqual(
    steps.map((s) => [s.start, s.end]),
    [
      [0, 100],
      [100, 150],
      [150, 120],
    ],
  );
  assert.deepEqual(
    steps.map((s) => s.kind),
    ["increase", "increase", "decrease"],
  );
});

test("a total restates the running sum instead of adding to it", () => {
  const steps = waterfallSteps([
    { id: "a", value: 100 },
    { id: "b", value: 50 },
    { id: "total", value: 0, isTotal: true },
  ]);
  const total = steps[2];
  assert.equal(total.kind, "total");
  assert.equal(total.start, 0, "a total is drawn from the baseline");
  assert.equal(total.end, 150);
  // Double-counting here is the single most common way a waterfall lies.
  assert.equal(steps[1].end, 150);
});

test("non-finite entries are skipped rather than corrupting the running total", () => {
  const steps = waterfallSteps([
    { id: "a", value: 100 },
    { id: "bad", value: Number.NaN },
    { id: "b", value: 25 },
  ]);
  assert.equal(steps.length, 2);
  assert.equal(steps[1].end, 125);
});

test("the extent covers every intermediate total, not just the endpoints", () => {
  // The running total peaks at 200 mid-way then falls back to 50; an axis
  // derived from the final value alone would clip the peak.
  const steps = waterfallSteps([
    { id: "a", value: 200 },
    { id: "b", value: -150 },
  ]);
  assert.deepEqual(waterfallExtent(steps), [0, 200]);
  assert.deepEqual(waterfallExtent([]), [0, 1]);
});

test("a waterfall dipping below zero includes the negative range", () => {
  const steps = waterfallSteps([
    { id: "a", value: 50 },
    { id: "b", value: -120 },
  ]);
  assert.deepEqual(waterfallExtent(steps), [-70, 50]);
});
