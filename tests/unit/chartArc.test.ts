import assert from "node:assert/strict";
import test from "node:test";

import {
  arcPath,
  funnelStages,
  gaugeAngles,
  GAUGE_START,
  GAUGE_SWEEP,
  pieSlices,
  polarPoint,
  polygonPoints,
} from "../../src/chart/arcGeometry";

// ------------------------------------------------------------------- slices

test("pie slices sum to a full turn and carry their share", () => {
  const slices = pieSlices([
    { id: "a", value: 25 },
    { id: "b", value: 75 },
  ]);
  assert.equal(slices.length, 2);
  assert.equal(slices[0].fraction, 0.25);
  assert.equal(slices[1].fraction, 0.75);
  const sweep = slices.reduce((s, x) => s + (x.endAngle - x.startAngle), 0);
  assert.ok(Math.abs(sweep - Math.PI * 2) < 1e-9);
});

test("negative and non-finite values are dropped, not folded in", () => {
  // Taking the absolute value would misstate the total; a negative share of a
  // whole is meaningless.
  const slices = pieSlices([
    { id: "a", value: 50 },
    { id: "b", value: -50 },
    { id: "c", value: Number.NaN },
    { id: "d", value: null },
  ]);
  assert.deepEqual(
    slices.map((s) => s.id),
    ["a"],
  );
  assert.equal(slices[0].fraction, 1);
});

test("an all-zero total yields no slices rather than dividing by zero", () => {
  assert.deepEqual(pieSlices([{ id: "a", value: 0 }]), []);
  assert.deepEqual(pieSlices([]), []);
});

test("a slice gap is taken evenly from both sides, keeping centres put", () => {
  const gap = 0.1;
  const [a, b] = pieSlices(
    [
      { id: "a", value: 1 },
      { id: "b", value: 1 },
    ],
    gap,
  );
  const centreA = (a.startAngle + a.endAngle) / 2;
  const centreB = (b.startAngle + b.endAngle) / 2;
  assert.ok(Math.abs(centreA - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(centreB - Math.PI * 1.5) < 1e-9);
});

// --------------------------------------------------------------------- arcs

test("polarPoint puts zero radians at 12 o'clock and runs clockwise", () => {
  const top = polarPoint(0, 0, 10, 0);
  assert.ok(Math.abs(top.x) < 1e-9);
  assert.ok(Math.abs(top.y + 10) < 1e-9, "screen y grows downward");
  const right = polarPoint(0, 0, 10, Math.PI / 2);
  assert.ok(Math.abs(right.x - 10) < 1e-9);
});

test("a full turn renders as two arcs, since one SVG arc cannot express 360", () => {
  const d = arcPath(50, 50, 20, 40, 0, Math.PI * 2);
  assert.ok(d.length > 0);
  // Outer ring plus the punched inner ring.
  assert.ok((d.match(/M/g) ?? []).length >= 2, d);
});

test("a large slice sets the large-arc flag", () => {
  const small = arcPath(50, 50, 0, 40, 0, Math.PI / 2);
  const large = arcPath(50, 50, 0, 40, 0, Math.PI * 1.5);
  assert.ok(small.includes(" 0 1 "), small);
  assert.ok(large.includes(" 1 1 "), large);
});

test("a zero or negative sweep draws nothing", () => {
  assert.equal(arcPath(0, 0, 10, 20, 1, 1), "");
  assert.equal(arcPath(0, 0, 10, 20, 2, 1), "");
  assert.equal(arcPath(0, 0, 0, 0, 0, 1), "");
});

test("a pie wedge closes through the centre; a donut does not", () => {
  const wedge = arcPath(50, 50, 0, 40, 0, 1);
  const donut = arcPath(50, 50, 20, 40, 0, 1);
  assert.ok(wedge.startsWith("M50,50"), "a wedge starts at the centre");
  assert.ok(!donut.startsWith("M50,50"));
});

// -------------------------------------------------------------------- gauge

test("gauge angles clamp to the dial and start at its opening", () => {
  assert.deepEqual(gaugeAngles(0), {
    startAngle: GAUGE_START,
    endAngle: GAUGE_START,
  });
  assert.deepEqual(gaugeAngles(1), {
    startAngle: GAUGE_START,
    endAngle: GAUGE_START + GAUGE_SWEEP,
  });
  assert.equal(gaugeAngles(2).endAngle, GAUGE_START + GAUGE_SWEEP);
  assert.equal(gaugeAngles(-1).endAngle, GAUGE_START);
  assert.equal(gaugeAngles(Number.NaN).endAngle, GAUGE_START);
});

// ------------------------------------------------------------------- funnel

test("funnel widths are proportional to value, so the shape shows the drop", () => {
  const stages = funnelStages(
    [
      { id: "visits", value: 1000 },
      { id: "signups", value: 400 },
      { id: "paid", value: 100 },
    ],
    300,
    300,
    0,
  );
  assert.equal(stages.length, 3);
  const widthOf = (i: number) => stages[i].points[1].x - stages[i].points[0].x;
  assert.ok(Math.abs(widthOf(0) - 300) < 1e-9);
  assert.ok(Math.abs(widthOf(1) - 120) < 1e-9);
  assert.ok(Math.abs(widthOf(2) - 30) < 1e-9);
});

test("both conversion rates are reported, since they answer different questions", () => {
  const stages = funnelStages(
    [
      { id: "a", value: 1000 },
      { id: "b", value: 400 },
      { id: "c", value: 100 },
    ],
    300,
    300,
  );
  // "How many made it this far" vs "where did we lose them".
  assert.equal(stages[2].fromTop, 0.1);
  assert.equal(stages[2].fromPrevious, 0.25);
  assert.equal(stages[0].fromPrevious, 1);
});

test("the last funnel stage is a rectangle, not a taper to nothing", () => {
  const stages = funnelStages(
    [
      { id: "a", value: 100 },
      { id: "b", value: 50 },
    ],
    200,
    200,
    0,
  );
  const last = stages[1];
  const upper = last.points[1].x - last.points[0].x;
  const lower = last.points[2].x - last.points[3].x;
  assert.ok(Math.abs(upper - lower) < 1e-9);
});

test("a funnel degrades safely on empty or collapsed input", () => {
  assert.deepEqual(funnelStages([], 100, 100), []);
  assert.deepEqual(funnelStages([{ id: "a", value: 1 }], 0, 100), []);
  assert.deepEqual(funnelStages([{ id: "a", value: 1 }], 100, 0), []);
  // A zero-valued top stage must not divide by zero.
  const zeroTop = funnelStages(
    [
      { id: "a", value: 0 },
      { id: "b", value: 0 },
    ],
    100,
    100,
  );
  assert.equal(zeroTop.length, 2);
  assert.ok(Number.isFinite(zeroTop[0].points[1].x));
});

test("polygonPoints renders an SVG points attribute", () => {
  assert.equal(
    polygonPoints([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
    ]),
    "0,0 10,5",
  );
});
