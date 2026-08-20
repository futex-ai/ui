import assert from "node:assert/strict";
import test from "node:test";

import {
  chartLayout,
  rovingStopIndices,
  usesPerMarkHitTargets,
  MAX_ROVING_STOPS,
} from "../../src/chart/chartLayout";
import {
  binValues,
  divergingSplit,
  foldToOther,
  normalizeSeries,
  percentStack,
  stackSeries,
  totalAt,
  type NormalizedSeries,
} from "../../src/chart/series/stack";

const at = (
  segments: ReturnType<typeof stackSeries>,
  id: string,
  index: number,
) => segments.find((s) => s.seriesId === id && s.index === index);

// --------------------------------------------------------------- normalizing

test("normalizeSeries pads short series with gaps, never zeros", () => {
  const out = normalizeSeries([{ id: "a", data: [1, 2] }], 4);
  assert.deepEqual(out[0].data, [1, 2, null, null]);
  assert.notEqual(out[0].data[2], 0);
});

test("normalizeSeries trims long series and resolves labels", () => {
  const out = normalizeSeries(
    [
      { id: "a", data: [1, 2, 3, 4, 5] },
      { id: "b", label: "Bravo", data: [1] },
    ],
    3,
  );
  assert.deepEqual(out[0].data, [1, 2, 3]);
  assert.equal(out[0].label, "a", "label defaults to the id");
  assert.equal(out[1].label, "Bravo");
});

test("normalizeSeries turns non-finite values into gaps", () => {
  const out = normalizeSeries(
    [{ id: "a", data: [1, Number.NaN, Number.POSITIVE_INFINITY, 4] }],
    4,
  );
  assert.deepEqual(out[0].data, [1, null, null, 4]);
});

// ------------------------------------------------------------------ stacking

test("stackSeries accumulates positives upward from zero", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [10, 5] },
      { id: "b", data: [20, 5] },
    ],
    2,
  );
  const segments = stackSeries(series, 2);
  assert.deepEqual(at(segments, "a", 0), {
    seriesId: "a",
    index: 0,
    value: 10,
    start: 0,
    end: 10,
  });
  assert.deepEqual(at(segments, "b", 0), {
    seriesId: "b",
    index: 0,
    value: 20,
    start: 10,
    end: 30,
  });
});

test("stackSeries stacks negatives downward so a mixed stack never folds over", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [10] },
      { id: "b", data: [-4] },
      { id: "c", data: [-6] },
    ],
    1,
  );
  const segments = stackSeries(series, 1);
  assert.deepEqual(at(segments, "a", 0)?.start, 0);
  assert.deepEqual(at(segments, "a", 0)?.end, 10);
  // Negatives grow below zero rather than continuing the positive run.
  assert.deepEqual(at(segments, "b", 0)?.start, -4);
  assert.deepEqual(at(segments, "b", 0)?.end, 0);
  assert.deepEqual(at(segments, "c", 0)?.start, -10);
  assert.deepEqual(at(segments, "c", 0)?.end, -4);
});

test("a gap contributes nothing and does not shift the series above it", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [null] },
      { id: "b", data: [7] },
    ],
    1,
  );
  const segments = stackSeries(series, 1);
  assert.equal(at(segments, "a", 0)?.value, null);
  // "b" still starts at the baseline because "a" contributed nothing.
  assert.equal(at(segments, "b", 0)?.start, 0);
  assert.equal(at(segments, "b", 0)?.end, 7);
});

test("percentStack normalizes each category to one", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [25, 1] },
      { id: "b", data: [75, 3] },
    ],
    2,
  );
  const segments = percentStack(series, 2);
  assert.equal(at(segments, "a", 0)?.value, 0.25);
  assert.equal(at(segments, "b", 0)?.end, 1);
  assert.equal(at(segments, "a", 1)?.value, 0.25);
});

test("percentStack leaves an all-zero category empty instead of dividing by zero", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [0] },
      { id: "b", data: [0] },
    ],
    1,
  );
  const segments = percentStack(series, 1);
  assert.equal(at(segments, "a", 0)?.value, null);
  assert.ok(Number.isFinite(at(segments, "a", 0)?.end ?? 0));
});

test("percentStack treats an all-gap category as empty", () => {
  const series = normalizeSeries([{ id: "a", data: [null] }], 1);
  const segments = percentStack(series, 1);
  assert.equal(at(segments, "a", 0)?.value, null);
});

test("totalAt sums a category ignoring gaps", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [10] },
      { id: "b", data: [null] },
      { id: "c", data: [5] },
    ],
    1,
  );
  assert.equal(totalAt(series, 0), 15);
});

// ----------------------------------------------------------------- diverging

test("divergingSplit reports the delta and which side of the baseline it falls", () => {
  const out = divergingSplit([12, 8, 10, null], 10);
  assert.deepEqual(out[0], { index: 0, delta: 2, side: "positive" });
  assert.deepEqual(out[1], { index: 1, delta: -2, side: "negative" });
  assert.deepEqual(out[2], { index: 2, delta: 0, side: "zero" });
  assert.deepEqual(out[3], { index: 3, delta: null, side: "zero" });
});

// ------------------------------------------------------------------- binning

test("binValues buckets into equal widths and counts the maximum", () => {
  const bins = binValues([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
  assert.equal(bins.length, 5);
  const total = bins.reduce((sum, b) => sum + b.count, 0);
  assert.equal(total, 11, "the maximum must not fall off the last bin");
});

test("binValues handles empty, all-null and all-equal input", () => {
  assert.deepEqual(binValues([]), []);
  assert.deepEqual(binValues([null, null]), []);
  const same = binValues([4, 4, 4], 5);
  assert.equal(same.length, 1);
  assert.equal(same[0].count, 3);
});

// ------------------------------------------------------------------- folding

test("foldToOther sums the tail past the slot count", () => {
  const series: NormalizedSeries[] = normalizeSeries(
    Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, data: [i + 1] })),
    1,
  );
  const folded = foldToOther(series, 3, "__other__");
  assert.equal(folded.length, 4);
  assert.equal(folded[3].id, "__other__");
  assert.equal(folded[3].label, "Other");
  // s3 (4) + s4 (5)
  assert.equal(folded[3].data[0], 9);
});

test("foldToOther keeps an all-gap tail as a gap rather than a zero", () => {
  const series = normalizeSeries(
    [
      { id: "a", data: [1] },
      { id: "b", data: [null] },
      { id: "c", data: [null] },
    ],
    1,
  );
  const folded = foldToOther(series, 1, "__other__");
  assert.equal(folded[1].data[0], null);
});

test("foldToOther is a no-op when the series fit", () => {
  const series = normalizeSeries([{ id: "a", data: [1] }], 1);
  assert.deepEqual(foldToOther(series, 3, "__other__"), series);
});

// -------------------------------------------------------------------- layout

test("chartLayout subtracts every band from the total height", () => {
  const layout = chartLayout({
    width: 400,
    height: 200,
    xAxisHeight: 20,
    yAxisWidth: 40,
    legendHeight: 24,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  assert.equal(layout.plot.height, 200 - 20 - 24);
  assert.equal(layout.plot.width, 400 - 40);
  assert.equal(layout.plot.x, 40);
  // The axis band sits inside the frame, directly under the plot — this is
  // what stops a fixed-height card getting a nested scrollbar.
  assert.equal(layout.xAxis.y, layout.plot.y + layout.plot.height);
  assert.equal(
    layout.plot.y + layout.plot.height + layout.xAxis.height + 24,
    200,
  );
});

test("an unmeasured or collapsed container yields an unusable zero-size plot", () => {
  const unmeasured = chartLayout({ width: 0, height: 200 });
  assert.equal(unmeasured.plot.width, 0);
  assert.equal(unmeasured.usable, false);

  const tiny = chartLayout({ width: 10, height: 10 });
  assert.ok(tiny.plot.width >= 0, "never negative");
  assert.ok(tiny.plot.height >= 0, "never negative");
  assert.equal(tiny.usable, false);
});

test("hit-target strategy switches when bands get too narrow", () => {
  assert.equal(usesPerMarkHitTargets(40), true);
  assert.equal(usesPerMarkHitTargets(24), true);
  assert.equal(usesPerMarkHitTargets(9), false);
});

test("roving stops stay one-per-category until the count is unusable", () => {
  assert.deepEqual(rovingStopIndices(3), [0, 1, 2]);
  assert.equal(rovingStopIndices(MAX_ROVING_STOPS).length, MAX_ROVING_STOPS);

  const many = rovingStopIndices(1000);
  assert.ok(
    many.length <= MAX_ROVING_STOPS + 1,
    `1000 categories produced ${many.length} tab stops`,
  );
  assert.equal(many[0], 0, "the first category stays reachable");
  assert.equal(many[many.length - 1], 999, "the last category stays reachable");
});
