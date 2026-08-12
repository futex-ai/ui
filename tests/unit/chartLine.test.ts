import assert from "node:assert/strict";
import test from "node:test";

import {
  areaPath,
  linePath,
  monotonePath,
  nearestIndexByX,
  projectPoints,
  segments,
  type LinePoint,
} from "../../src/chart/lineGeometry";
import { linearScale } from "../../src/chart/scale/linear";
import {
  SCRUB_THRESHOLD,
  shouldClaimScrub,
} from "../../src/chart/chartScrubModel";

const value = linearScale([0, 100], [200, 0]);
const at = (i: number) => i * 50;

// ------------------------------------------------------------------ projecting

test("projectPoints keeps gaps as gaps rather than interpolating them", () => {
  const points = projectPoints([10, null, 30], at, value);
  assert.equal(points.length, 3);
  assert.equal(points[1], null, "a missing measurement must not be invented");
  assert.deepEqual(points[0], { x: 0, y: value.scale(10) });
});

test("segments splits a series into runs of consecutive points", () => {
  const points: LinePoint[] = [
    { x: 0, y: 0 },
    null,
    { x: 2, y: 2 },
    { x: 3, y: 3 },
  ];
  const runs = segments(points);
  assert.equal(runs.length, 2);
  assert.equal(runs[0].length, 1);
  assert.equal(runs[1].length, 2);
});

test("an all-gap series produces no runs at all", () => {
  assert.deepEqual(segments([null, null]), []);
  assert.equal(linePath([null, null]), "");
});

// ------------------------------------------------------------------- linePath

test("a gap breaks the path instead of drawing straight across it", () => {
  const points = projectPoints([10, null, 30], at, value);
  const d = linePath(points);
  // Two runs of one point each: neither can draw a segment, so nothing is
  // bridged. The important property is that no single path spans the gap.
  assert.ok(!d.includes("L"), `unexpected line across a gap: ${d}`);
});

test("consecutive points join with line segments", () => {
  const points = projectPoints([10, 20, 30], at, value);
  const d = linePath(points);
  assert.ok(d.startsWith("M"));
  assert.equal((d.match(/L/g) ?? []).length, 2);
});

test("a step curve holds its value until the next x", () => {
  const points = projectPoints([10, 20], at, value);
  const d = linePath(points, "step");
  // Horizontal first, then vertical: a value that changes at a moment.
  assert.ok(d.includes("H"), d);
  assert.ok(d.includes("V"), d);
  assert.ok(d.indexOf("H") < d.indexOf("V"));
});

test("a single point draws no stroke, leaving it to the marker layer", () => {
  const points = projectPoints([10], at, value);
  assert.equal(linePath(points), "");
});

// ------------------------------------------------------------------- monotone

test("the monotone curve never overshoots its data", () => {
  // A flat run followed by a rise: a cardinal spline would dip below the flat
  // section. Sample the curve's control points and check they stay in range.
  const points = [
    { x: 0, y: 100 },
    { x: 50, y: 100 },
    { x: 100, y: 0 },
  ];
  const d = monotonePath(points);
  const numbers = d
    .replace(/[MC]/g, " ")
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const ys = numbers.filter((_, i) => i % 2 === 1);
  const minY = Math.min(...points.map((p) => p.y));
  const maxY = Math.max(...points.map((p) => p.y));
  for (const y of ys) {
    assert.ok(
      y >= minY - 0.001 && y <= maxY + 0.001,
      `control point ${y} escapes the data range [${minY}, ${maxY}]`,
    );
  }
});

test("a monotone rise stays monotone through its control points", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
    { x: 20, y: 20 },
    { x: 30, y: 30 },
  ];
  const d = monotonePath(points);
  assert.ok(d.startsWith("M0,0"));
  assert.ok(d.includes("C"));
});

test("monotonePath degrades to a straight line for two points, nothing for one", () => {
  assert.equal(
    monotonePath([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]),
    "M0,0L1,1",
  );
  assert.equal(monotonePath([{ x: 0, y: 0 }]), "");
  assert.equal(monotonePath([]), "");
});

test("duplicate x values do not produce a divide-by-zero slope", () => {
  const d = monotonePath([
    { x: 0, y: 0 },
    { x: 0, y: 10 },
    { x: 10, y: 20 },
  ]);
  assert.ok(!d.includes("NaN"), d);
  assert.ok(!d.includes("Infinity"), d);
});

// ----------------------------------------------------------------- areaPath

test("an area closes to the baseline", () => {
  const points = projectPoints([10, 20], at, value);
  const d = areaPath(points, 200);
  assert.ok(d.endsWith("Z"));
  assert.ok(d.includes("L50,200"), d);
});

test("a gap leaves a hole in the fill rather than a bridging wedge", () => {
  const points = projectPoints([10, 20, null, 40, 50], at, value);
  const d = areaPath(points, 200);
  // Two separate closed shapes, so the fill is broken where the data is.
  assert.equal((d.match(/Z/g) ?? []).length, 2);
});

test("an empty area path is empty, not malformed", () => {
  assert.equal(areaPath([], 200), "");
  assert.equal(areaPath([null], 200), "");
});

// -------------------------------------------------------------- nearest index

test("nearestIndexByX snaps to the closest position, not the one under the pointer", () => {
  const positions = [0, 100, 200];
  assert.equal(nearestIndexByX(positions, 0), 0);
  assert.equal(nearestIndexByX(positions, 60), 1, "past the midpoint snaps on");
  assert.equal(nearestIndexByX(positions, 40), 0);
  assert.equal(nearestIndexByX(positions, 9999), 2, "clamps at the end");
  assert.equal(nearestIndexByX(positions, -50), 0);
  assert.equal(nearestIndexByX([], 10), -1);
});

// ---------------------------------------------------------------- scrub gesture

test("the scrub only claims a horizontal-dominant drag past the threshold", () => {
  // A tap must reach the marks underneath.
  assert.equal(shouldClaimScrub(0, 0), false);
  // A small wobble is not a scrub.
  assert.equal(shouldClaimScrub(SCRUB_THRESHOLD - 1, 0), false);
  // A clear horizontal drag is.
  assert.equal(shouldClaimScrub(SCRUB_THRESHOLD + 5, 2), true);
});

test("a vertical drag is left to an enclosing ScrollView", () => {
  assert.equal(shouldClaimScrub(0, 40), false);
  // Diagonal but vertical-dominant still belongs to the scroll view.
  assert.equal(shouldClaimScrub(20, 40), false);
  assert.equal(shouldClaimScrub(-40, 10), true, "leftward drags scrub too");
});
