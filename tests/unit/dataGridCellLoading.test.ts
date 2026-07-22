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

test("a loading grid cell keeps its value beside a decorative indicator", () => {
  const cell = readSource("../../src/data-grid/DataGridCell.tsx");
  const cards = readSource("../../src/data-grid/DataGridCardStack.tsx");
  const indicator = readSource(
    "../../src/data-grid/DataGridCellLoadingIndicator.tsx",
  );
  const styles = readSource("../../src/data-grid/dataGridStyles.ts");

  assert.match(cell, /loading: boolean;/);
  assert.match(
    cell,
    /accessibilityState=\{loading \? \{ busy: true \} : undefined\}/,
  );
  assert.match(cell, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(cell, /<DataGridCellLoadingContent/);
  assert.match(cards, /<DataGridCellLoadingContent/);
  assert.match(indicator, /testID="data-grid-cell-loading-content"/);
  assert.match(indicator, /<DataGridCellLoadingIndicator/);
  assert.match(
    styles,
    /cellLoadingContent: \{[\s\S]*?flexDirection: "row"[\s\S]*?\}/,
  );
  assert.match(indicator, /testID="data-grid-cell-loading-indicator"/);
  assert.match(indicator, /accessibilityElementsHidden/);
  assert.match(indicator, /aria-hidden/);
  assert.match(indicator, /importantForAccessibility="no-hide-descendants"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
