import assert from "node:assert/strict";
import test from "node:test";

import {
  barLabelPlacement,
  barPath,
  barThickness,
  groupedBars,
  stackedBars,
  type BarRect,
} from "../../src/chart/barGeometry";
import { nextHitIndex } from "../../src/chart/chartKeyboard";
import { CHART_MARKS } from "../../src/chart/chartMarks";
import { bandScale } from "../../src/chart/scale/band";
import { linearScale } from "../../src/chart/scale/linear";
import {
  normalizeSeries,
  percentStack,
  stackSeries,
} from "../../src/chart/series/stack";

const PLOT = { width: 400, height: 200 };
/** Screen y grows downward, so the value range is inverted. */
const value = linearScale([0, 100], [PLOT.height, 0]);

// ------------------------------------------------------------------ thickness

test("bars are capped rather than filling their band", () => {
  // A wide band must not produce a 90px slab: the leftover is air.
  assert.equal(barThickness(90), CHART_MARKS.maxBarThickness);
  assert.equal(barThickness(12), 12, "a narrow band keeps its own width");
  assert.equal(barThickness(90, 3), 24, "grouped slots divide the band first");
  assert.equal(barThickness(0), 0);
});

// -------------------------------------------------------------------- grouped

test("grouped bars sit side by side without overlapping", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [50, 20] },
      { id: "b", data: [30, 60] },
    ],
    2,
  );
  const band = bandScale(2, [0, PLOT.width]);
  const rects = groupedBars(series, band, value, "vertical");
  const first = rects.filter((r) => r.index === 0);
  assert.equal(first.length, 2);
  const [a, b] = first.sort((l, r) => l.x - r.x);
  assert.ok(a.x + a.width <= b.x + 0.001, "grouped bars must not overlap");
});

test("a bar grows from the baseline and rounds only at the data end", () => {
  const series = normalizeSeries([{ id: "a", data: [50] }], 1);
  const band = bandScale(1, [0, PLOT.width]);
  const [rect] = groupedBars(series, band, value, "vertical");
  assert.equal(rect.dataEnd, "top");
  // Zero maps to the plot floor; the bar's bottom edge must sit there.
  assert.equal(rect.y + rect.height, value.scale(0));
  assert.equal(rect.radius, CHART_MARKS.barRadius);
});

test("a negative bar hangs below the baseline and rounds downward", () => {
  const series = normalizeSeries([{ id: "a", data: [-40] }], 1);
  const negativeScale = linearScale([-100, 100], [PLOT.height, 0]);
  const band = bandScale(1, [0, PLOT.width]);
  const [rect] = groupedBars(series, band, negativeScale, "vertical");
  assert.equal(rect.dataEnd, "bottom");
  assert.equal(rect.y, negativeScale.scale(0));
  assert.ok(rect.height > 0);
});

test("gaps emit no rect at all rather than a zero-height bar", () => {
  const series = normalizeSeries([{ id: "a", data: [null, 10] }], 2);
  const band = bandScale(2, [0, PLOT.width]);
  const rects = groupedBars(series, band, value, "vertical");
  assert.equal(rects.length, 1);
  assert.equal(rects[0].index, 1);
});

test("horizontal bars swap the axes and round at the right edge", () => {
  const series = normalizeSeries([{ id: "a", data: [50] }], 1);
  const horizontal = linearScale([0, 100], [0, PLOT.width]);
  const band = bandScale(1, [0, PLOT.height]);
  const [rect] = groupedBars(series, band, horizontal, "horizontal");
  assert.equal(rect.dataEnd, "right");
  assert.equal(rect.x, horizontal.scale(0));
  assert.ok(rect.width > 0 && rect.height > 0);
});

// -------------------------------------------------------------------- stacked

test("stacked segments are separated by a surface gap, not a stroke", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [50] },
      { id: "b", data: [50] },
    ],
    1,
  );
  const band = bandScale(1, [0, PLOT.width]);
  const segments = stackSeries(series, 1);
  const rects = stackedBars(segments, band, value, "vertical");
  assert.equal(rects.length, 2);
  const full = Math.abs(value.scale(50) - value.scale(0));
  for (const rect of rects) {
    assert.equal(
      Math.round(rect.height),
      Math.round(full - CHART_MARKS.surfaceGap),
      "each segment gives up the gap",
    );
  }
});

test("only the outermost stacked segment rounds", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [30] },
      { id: "b", data: [30] },
      { id: "c", data: [30] },
    ],
    1,
  );
  const band = bandScale(1, [0, PLOT.width]);
  const rects = stackedBars(stackSeries(series, 1), band, value, "vertical");
  const rounded = rects.filter((r) => r.radius > 0);
  assert.equal(rounded.length, 1, "an interior rounded segment implies an end");
  assert.equal(rounded[0].seriesId, "c");
});

test("a hairline segment shrinks to zero rather than inverting", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [0.01] },
      { id: "b", data: [99.99] },
    ],
    1,
  );
  const band = bandScale(1, [0, PLOT.width]);
  const rects = stackedBars(stackSeries(series, 1), band, value, "vertical");
  for (const rect of rects) {
    assert.ok(rect.height >= 0, `negative height ${rect.height}`);
  }
});

test("percent-stacked segments fill exactly one band height", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [25] },
      { id: "b", data: [75] },
    ],
    1,
  );
  const fraction = linearScale([0, 1], [PLOT.height, 0]);
  const band = bandScale(1, [0, PLOT.width]);
  const rects = stackedBars(
    percentStack(series, 1),
    band,
    fraction,
    "vertical",
  );
  const painted = rects.reduce((sum, r) => sum + r.height, 0);
  const gaps = CHART_MARKS.surfaceGap * rects.length;
  assert.ok(Math.abs(painted + gaps - PLOT.height) < 1);
});

// ----------------------------------------------------------------------- path

test("barPath rounds one edge and never self-intersects", () => {
  const rect: BarRect = {
    seriesId: "a",
    index: 0,
    value: 1,
    x: 0,
    y: 0,
    width: 20,
    height: 60,
    radius: 4,
    dataEnd: "top",
  };
  const d = barPath(rect);
  assert.ok(d.includes("A4,4"), "expected a 4px arc at the data end");
  // A bar shorter than twice the radius clamps rather than producing a
  // self-intersecting path.
  const squat = barPath({ ...rect, height: 3 });
  assert.ok(squat.length > 0);
  assert.ok(
    !squat.includes("A4,4"),
    "radius must clamp to half the short side",
  );
});

test("barPath emits nothing for a zero-size rect", () => {
  const base: BarRect = {
    seriesId: "a",
    index: 0,
    value: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 10,
    radius: 4,
    dataEnd: "top",
  };
  assert.equal(barPath(base), "");
  assert.equal(barPath({ ...base, width: 10, height: 0 }), "");
});

test("a zero radius produces a plain rectangle", () => {
  const d = barPath({
    seriesId: "a",
    index: 0,
    value: 1,
    x: 1,
    y: 2,
    width: 10,
    height: 20,
    radius: 0,
    dataEnd: "top",
  });
  assert.equal(d, "M1,2h10v20h-10Z");
});

// --------------------------------------------------------------------- labels

const labelRect: BarRect = {
  seriesId: "a",
  index: 0,
  value: 1,
  x: 100,
  y: 20,
  width: 24,
  height: 120,
  radius: 4,
  dataEnd: "top",
};

test("a label goes inside only when it genuinely fits", () => {
  const inside = barLabelPlacement(labelRect, 20, 12, PLOT);
  assert.ok(inside?.inside, "a tall bar has room for an inside label");
});

test("a label that will not fit moves outside the data end", () => {
  const shortBar = { ...labelRect, y: 180, height: 16 };
  const placement = barLabelPlacement(shortBar, 20, 12, PLOT);
  assert.equal(placement?.inside, false);
  assert.ok(
    placement != null && placement.y < shortBar.y,
    "placed above the bar end",
  );
});

test("a label with nowhere to go is dropped, never clipped", () => {
  // A tiny bar flush against the top of the plot: no room inside or outside.
  const pinned = { ...labelRect, y: 0, height: 8 };
  const placement = barLabelPlacement(pinned, 20, 12, PLOT);
  assert.equal(placement, null, "the value stays in the table view instead");
});

test("a wide-but-short bar refuses an inside label that would overflow across", () => {
  const wide = { ...labelRect, width: 8, height: 120 };
  const placement = barLabelPlacement(wide, 40, 12, PLOT);
  assert.notEqual(
    placement?.inside,
    true,
    "40px of text cannot sit in an 8px bar",
  );
});

// -------------------------------------------------------------------- keyboard

test("arrow keys walk the categories and clamp at the ends", () => {
  assert.equal(nextHitIndex("ArrowRight", 0, 5), 1);
  assert.equal(nextHitIndex("ArrowLeft", 3, 5), 2);
  assert.equal(nextHitIndex("ArrowLeft", 0, 5), 0, "clamps at the start");
  assert.equal(nextHitIndex("ArrowRight", 4, 5), 4, "clamps at the end");
  assert.equal(nextHitIndex("Home", 3, 5), 0);
  assert.equal(nextHitIndex("End", 1, 5), 4);
  assert.equal(nextHitIndex("Tab", 1, 5), null, "unhandled keys pass through");
});
