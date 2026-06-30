import assert from "node:assert/strict";
import test from "node:test";

import {
  cellKey,
  cellRefEquals,
  isCellSelected,
  rangeBetween,
  rangeRect,
  rectContains,
  selectAll,
  selectionCount,
  singleCell,
} from "../../src/data-grid/dataGridSelectionModel";
import type { DataGridSelection } from "../../src/data-grid/types";

const rowIds = ["r0", "r1", "r2", "r3"];
const columnIds = ["c0", "c1", "c2"];

test("cellKey and cellRefEquals identify cells", () => {
  assert.equal(cellKey({ rowId: "r1", columnId: "c2" }), "r1::c2");
  assert.equal(
    cellRefEquals(
      { rowId: "r1", columnId: "c2" },
      { rowId: "r1", columnId: "c2" },
    ),
    true,
  );
  assert.equal(
    cellRefEquals(
      { rowId: "r1", columnId: "c2" },
      { rowId: "r1", columnId: "c0" },
    ),
    false,
  );
  assert.equal(cellRefEquals(null, null), true);
  assert.equal(cellRefEquals(null, { rowId: "r1", columnId: "c0" }), false);
});

test("rangeRect normalizes an anchor/focus pair to display-index bounds", () => {
  const selection: DataGridSelection = {
    anchor: { rowId: "r2", columnId: "c2" },
    focus: { rowId: "r1", columnId: "c0" },
  };
  assert.deepEqual(rangeRect(selection, rowIds, columnIds), {
    minRow: 1,
    maxRow: 2,
    minCol: 0,
    maxCol: 2,
  });
});

test("rangeRect is null when an endpoint is missing or absent from the grid", () => {
  assert.equal(
    rangeRect({ anchor: null, focus: null }, rowIds, columnIds),
    null,
  );
  assert.equal(
    rangeRect(
      {
        anchor: { rowId: "gone", columnId: "c0" },
        focus: { rowId: "r1", columnId: "c1" },
      },
      rowIds,
      columnIds,
    ),
    null,
  );
});

test("rangeBetween enumerates the rectangle in row-major order", () => {
  const selection: DataGridSelection = {
    anchor: { rowId: "r1", columnId: "c0" },
    focus: { rowId: "r2", columnId: "c1" },
  };
  assert.deepEqual(rangeBetween(selection, rowIds, columnIds), [
    { rowId: "r1", columnId: "c0" },
    { rowId: "r1", columnId: "c1" },
    { rowId: "r2", columnId: "c0" },
    { rowId: "r2", columnId: "c1" },
  ]);
  assert.deepEqual(
    rangeBetween({ anchor: null, focus: null }, rowIds, columnIds),
    [],
  );
});

test("rectContains and isCellSelected agree on membership", () => {
  const selection: DataGridSelection = {
    anchor: { rowId: "r1", columnId: "c0" },
    focus: { rowId: "r2", columnId: "c1" },
  };
  const rect = rangeRect(selection, rowIds, columnIds);
  assert.equal(rectContains(rect, 1, 0), true);
  assert.equal(rectContains(rect, 2, 1), true);
  assert.equal(rectContains(rect, 3, 0), false);
  assert.equal(rectContains(rect, 0, 0), false);
  assert.equal(rectContains(null, 0, 0), false);
  assert.equal(
    isCellSelected(
      { rowId: "r2", columnId: "c1" },
      selection,
      rowIds,
      columnIds,
    ),
    true,
  );
  assert.equal(
    isCellSelected(
      { rowId: "r0", columnId: "c2" },
      selection,
      rowIds,
      columnIds,
    ),
    false,
  );
});

test("selectionCount multiplies the rectangle dimensions", () => {
  const selection: DataGridSelection = {
    anchor: { rowId: "r0", columnId: "c0" },
    focus: { rowId: "r2", columnId: "c1" },
  };
  assert.equal(selectionCount(selection, rowIds, columnIds), 6);
  assert.equal(
    selectionCount({ anchor: null, focus: null }, rowIds, columnIds),
    0,
  );
  const single = singleCell({ rowId: "r1", columnId: "c1" });
  assert.equal(selectionCount(single, rowIds, columnIds), 1);
});

test("selectAll spans the first to last visible cell", () => {
  assert.deepEqual(selectAll(rowIds, columnIds), {
    anchor: { rowId: "r0", columnId: "c0" },
    focus: { rowId: "r3", columnId: "c2" },
  });
  assert.deepEqual(selectAll([], columnIds), { anchor: null, focus: null });
  assert.deepEqual(selectAll(rowIds, []), { anchor: null, focus: null });
});
