import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  buildHeatmapWeeks,
  monthLabelColumns,
} from "../../src/heatmap/heatmapGrid";
import {
  colorForValue,
  levelForValue,
  resolveThresholds,
} from "../../src/heatmap/heatmapScale";

test("buildHeatmapWeeks rejects invalid or reversed ranges", () => {
  assert.deepEqual(buildHeatmapWeeks("not-a-date", "2024-01-31"), []);
  assert.deepEqual(buildHeatmapWeeks("2024-01-01", "bad"), []);
  assert.deepEqual(buildHeatmapWeeks("2024-02-01", "2024-01-01"), []);
});

test("buildHeatmapWeeks builds aligned, rectangular week columns", () => {
  // 2024-01-01 is a Monday, so a Monday start needs no leading padding.
  const monday = buildHeatmapWeeks("2024-01-01", "2024-01-14", 1);
  assert.equal(monday.length, 2);
  assert.ok(monday.every((week) => week.length === 7));
  assert.equal(monday[0][0].iso, "2024-01-01");
  assert.equal(monday[0][0].inRange, true);
  assert.equal(monday[0][0].weekday, 0);
  assert.equal(monday[1][6].iso, "2024-01-14");

  // A Sunday start pads the column back to the prior Sunday (out of range).
  const sunday = buildHeatmapWeeks("2024-01-01", "2024-01-14", 0);
  assert.equal(sunday[0][0].iso, "2023-12-31");
  assert.equal(sunday[0][0].inRange, false);
  assert.equal(sunday[0][1].iso, "2024-01-01");
  assert.equal(sunday[0][1].inRange, true);
  assert.ok(sunday.every((week) => week.length === 7));
});

test("monthLabelColumns labels each month at its starting column", () => {
  const labels = monthLabelColumns(
    buildHeatmapWeeks("2024-01-01", "2024-03-31", 1),
  );
  assert.deepEqual(
    labels.map((entry) => entry.label),
    ["Jan", "Feb", "Mar"],
  );
  assert.equal(labels[0].weekIndex, 0);
  assert.ok(labels[1].weekIndex > labels[0].weekIndex);
  assert.ok(labels[2].weekIndex > labels[1].weekIndex);
});

test("monthLabelColumns uses in-range days, not leading padding", () => {
  // 2024-03-02 is a Saturday; a Monday-start column leads with February days,
  // but the label must follow the first in-range (March) day.
  const labels = monthLabelColumns(
    buildHeatmapWeeks("2024-03-02", "2024-03-31", 1),
  );
  assert.equal(labels[0].label, "Mar");
});

test("resolveThresholds derives strictly ascending bands from the max", () => {
  assert.deepEqual(resolveThresholds(4, 10), [1, 3, 5, 8]);
  // Small maxima still produce strictly ascending bounds.
  assert.deepEqual(resolveThresholds(4, 1), [1, 2, 3, 4]);
  // No positive data falls back to a usable scale.
  assert.deepEqual(resolveThresholds(4, 0), [1, 2, 3, 4]);
});

test("levelForValue maps values to ramp indices, empty for non-positive", () => {
  const thresholds = [1, 3, 5, 8];
  assert.equal(levelForValue(undefined, thresholds), -1);
  assert.equal(levelForValue(null, thresholds), -1);
  assert.equal(levelForValue(0, thresholds), -1);
  assert.equal(levelForValue(-4, thresholds), -1);
  // NaN is invalid data, not the lowest band.
  assert.equal(levelForValue(Number.NaN, thresholds), -1);
  assert.equal(levelForValue(1, thresholds), 0);
  assert.equal(levelForValue(2, thresholds), 0);
  assert.equal(levelForValue(3, thresholds), 1);
  assert.equal(levelForValue(7, thresholds), 2);
  assert.equal(levelForValue(8, thresholds), 3);
  assert.equal(levelForValue(100, thresholds), 3);
  assert.equal(levelForValue(5, []), -1);
});

test("colorForValue resolves ramp colors and clamps to the ramp length", () => {
  const colors = ["a", "b", "c", "d"];
  const thresholds = [1, 3, 5, 8];
  assert.equal(colorForValue(0, colors, thresholds, "E"), "E");
  assert.equal(colorForValue(undefined, colors, thresholds, "E"), "E");
  assert.equal(colorForValue(1, colors, thresholds, "E"), "a");
  assert.equal(colorForValue(8, colors, thresholds, "E"), "d");
  // Fewer colors than levels clamps to the last ramp entry.
  assert.equal(colorForValue(8, ["a", "b"], thresholds, "E"), "b");
});

test("heatmap component drives geometry, colors, and chrome from props", () => {
  const source = readSource("../../src/heatmap/Heatmap.tsx");

  assert.match(source, /startDate,\n\s*endDate,/);
  assert.match(source, /cellSize = 12,/);
  assert.match(source, /cellGap = 3,/);
  assert.match(source, /cellRadius = 2,/);
  assert.match(source, /weekStart = 0,/);
  assert.match(source, /showMonthLabels = true,/);
  assert.match(source, /showWeekdayLabels = true,/);
  assert.match(source, /showLegend = true,/);
  assert.match(source, /scrollable = false,/);
});

test("heatmap defaults its ramp and empty cell to shared theme tokens", () => {
  const source = readSource("../../src/heatmap/Heatmap.tsx");

  assert.match(source, /theme\.colors\.primarySoft/);
  assert.match(source, /theme\.colors\.primaryBorder/);
  assert.match(source, /theme\.colors\.primary,/);
  assert.match(source, /theme\.colors\.primaryDeep/);
  assert.match(source, /emptyColor \?\? theme\.colors\.soft/);
});

test("heatmap exposes accessible, optionally pressable cells", () => {
  const source = readSource("../../src/heatmap/Heatmap.tsx");

  // Cells are pressable only when `onCellPress` is supplied: the render branch
  // short-circuits to a static, accessible cell otherwise, and the interactive
  // path mounts the dedicated pressable cell.
  assert.match(source, /if \(!onCellPress\)/);
  assert.match(source, /<HeatmapPressableCell/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityLabel=\{label\}/);
  // Padding cells outside the range are hidden from assistive technology.
  assert.match(source, /aria-hidden/);
  // A region label names the grid as a group without merging the cells.
  assert.match(source, /role=\{accessibilityLabel \? "group" : undefined\}/);
});

test("heatmap has public root, subpath, and helper exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const heatmapSource = readSource("../../src/heatmap/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/heatmap"/);
  assert.match(heatmapSource, /Heatmap/);
  assert.match(heatmapSource, /heatmapGrid/);
  assert.match(heatmapSource, /heatmapScale/);
  assert.match(packageJson, /"\.\/heatmap"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
