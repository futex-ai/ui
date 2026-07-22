import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("DataGrid exposes and threads a per-cell loading resolver", () => {
  const grid = readSource("../../src/data-grid/DataGrid.tsx");
  const body = readSource("../../src/data-grid/DataGridBody.tsx");
  const row = readSource("../../src/data-grid/DataGridRow.tsx");
  const cards = readSource("../../src/data-grid/DataGridCardStack.tsx");

  assert.match(grid, /cellLoading\?: \(ref: DataGridCellRef\) => boolean;/);
  assert.match(grid, /cellLoading=\{cellLoading\}/);
  assert.match(body, /cellLoading=\{cellLoading\}/);
  assert.match(row, /loading=\{cellLoading\?\.\(cellRef\) \?\? false\}/);
  assert.match(cards, /cellLoading\?\.\(ref\) \?\? false/);
});

test("a loading grid cell renders a busy, decorative indicator", () => {
  const cell = readSource("../../src/data-grid/DataGridCell.tsx");
  const indicator = readSource(
    "../../src/data-grid/DataGridCellLoadingIndicator.tsx",
  );

  assert.match(cell, /loading: boolean;/);
  assert.match(
    cell,
    /accessibilityState=\{loading \? \{ busy: true \} : undefined\}/,
  );
  assert.match(cell, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(cell, /<DataGridCellLoadingIndicator/);
  assert.match(indicator, /testID="data-grid-cell-loading-indicator"/);
  assert.match(indicator, /accessibilityElementsHidden/);
  assert.match(indicator, /aria-hidden/);
  assert.match(indicator, /importantForAccessibility="no-hide-descendants"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
