import assert from "node:assert/strict";
import test from "node:test";

import {
  buildClipboardText,
  cellCopyText,
  clearCellsWrites,
  clearRectWrites,
  coerceCellValue,
  emptyCellValue,
  parseClipboardGrid,
  planPaste,
} from "../../src/data-grid/dataGridClipboard";
import type { DataGridColumn, DataGridRow } from "../../src/data-grid/types";

const columns: DataGridColumn[] = [
  { id: "name", label: "Name", fieldType: "text" },
  { id: "score", label: "Score", fieldType: "number" },
  {
    id: "status",
    label: "Status",
    fieldType: "singleSelect",
    options: [
      { id: "todo", label: "To do" },
      { id: "done", label: "Done" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    fieldType: "multiSelect",
    options: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
    ],
  },
];

const rows: DataGridRow[] = [
  {
    id: "r1",
    cells: { name: "Ada", score: 5, status: "todo", tags: ["a", "b"] },
  },
  { id: "r2", cells: { name: "Bob", score: 3, status: "done", tags: [] } },
];

const byId = (id: string) => columns.find((c) => c.id === id)!;

test("cellCopyText renders display text per field type", () => {
  assert.equal(cellCopyText(byId("name"), "Ada"), "Ada");
  assert.equal(cellCopyText(byId("score"), 5), "5");
  assert.equal(cellCopyText(byId("status"), "todo"), "To do");
  assert.equal(cellCopyText(byId("tags"), ["a", "b"]), "Alpha, Beta");
  assert.equal(cellCopyText(byId("name"), null), "");
});

test("coerceCellValue parses pasted text into typed values", () => {
  assert.equal(coerceCellValue(byId("score"), "7"), 7);
  assert.equal(coerceCellValue(byId("score"), "x"), null);
  assert.equal(coerceCellValue(byId("status"), "Done"), "done"); // by label
  assert.equal(coerceCellValue(byId("status"), "todo"), "todo"); // by id
  assert.equal(coerceCellValue(byId("status"), "nope"), null);
  assert.deepEqual(coerceCellValue(byId("tags"), "Alpha, Beta"), ["a", "b"]);
  assert.deepEqual(coerceCellValue(byId("tags"), ""), []);
  assert.equal(coerceCellValue(byId("name"), "hi"), "hi");
  assert.equal(coerceCellValue(byId("name"), ""), null);
});

test("buildClipboardText serializes a rectangle to TSV", () => {
  const text = buildClipboardText(
    { minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 },
    ["r1", "r2"],
    ["name", "score", "status", "tags"],
    columns,
    rows,
  );
  assert.equal(text, "Ada\t5\nBob\t3");
});

test("parseClipboardGrid splits TSV and drops a trailing newline", () => {
  assert.deepEqual(parseClipboardGrid("Ada\t5\nBob\t3"), [
    ["Ada", "5"],
    ["Bob", "3"],
  ]);
  assert.deepEqual(parseClipboardGrid("x\n"), [["x"]]);
  assert.deepEqual(parseClipboardGrid(""), []);
});

// ── Excel-style paste planning + clear ────────────────────────────────────────

const rowIds = ["r1", "r2", "r3", "r4"];
const columnIds = ["name", "score", "status", "tags"];

test("emptyCellValue is null, except [] for multiSelect", () => {
  assert.equal(emptyCellValue(byId("name")), null);
  assert.equal(emptyCellValue(byId("score")), null);
  assert.equal(emptyCellValue(byId("status")), null);
  assert.deepEqual(emptyCellValue(byId("tags")), []);
});

test("planPaste fills a whole selection from a single copied cell", () => {
  // One value pasted onto a 3-row × 1-col selection fills every cell.
  const { writes, target } = planPaste(
    [["9"]],
    { row: 0, col: 1 },
    3,
    1,
    rowIds,
    columnIds,
    columns,
  );
  assert.deepEqual(writes, [
    { rowId: "r1", columnId: "score", value: 9 },
    { rowId: "r2", columnId: "score", value: 9 },
    { rowId: "r3", columnId: "score", value: 9 },
  ]);
  assert.deepEqual(target, { minRow: 0, maxRow: 2, minCol: 1, maxCol: 1 });
});

test("planPaste drops a full block onto a single-cell selection", () => {
  // A 2×2 clipboard pasted onto one cell grows to fit (coerced per column).
  const { writes, target } = planPaste(
    [
      ["Ann", "5"],
      ["Bo", "3"],
    ],
    { row: 0, col: 0 },
    1,
    1,
    rowIds,
    columnIds,
    columns,
  );
  assert.deepEqual(writes, [
    { rowId: "r1", columnId: "name", value: "Ann" },
    { rowId: "r1", columnId: "score", value: 5 },
    { rowId: "r2", columnId: "name", value: "Bo" },
    { rowId: "r2", columnId: "score", value: 3 },
  ]);
  assert.deepEqual(target, { minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 });
});

// An all-text grid so tiled values round-trip as their raw strings (no coercion
// noise) — used for the horizontal / 2-D / ragged tiling cases.
const textColumns: DataGridColumn[] = [
  { id: "a", label: "A", fieldType: "text" },
  { id: "b", label: "B", fieldType: "text" },
  { id: "c", label: "C", fieldType: "text" },
  { id: "d", label: "D", fieldType: "text" },
];
const textColumnIds = ["a", "b", "c", "d"];

test("planPaste tiles a single copied row across a wider selection", () => {
  // 1×2 [X,Y] pasted into a 1×4 selection repeats horizontally: X,Y,X,Y.
  const { writes } = planPaste(
    [["X", "Y"]],
    { row: 0, col: 0 },
    1,
    4,
    rowIds,
    textColumnIds,
    textColumns,
  );
  assert.deepEqual(
    writes.map((w) => w.value),
    ["X", "Y", "X", "Y"],
  );
});

test("planPaste tiles a 2×2 block across a 4×2 selection in both axes", () => {
  const { writes } = planPaste(
    [
      ["1", "2"],
      ["3", "4"],
    ],
    { row: 0, col: 0 },
    4,
    2,
    rowIds,
    textColumnIds,
    textColumns,
  );
  // Rows repeat 1,2 / 3,4 / 1,2 / 3,4 down the four rows.
  assert.deepEqual(
    writes.map((w) => w.value),
    ["1", "2", "3", "4", "1", "2", "3", "4"],
  );
});

test("planPaste pads a ragged clipboard row with empty trailing cells", () => {
  // Second row is short; its missing 3rd column must be empty, not a repeat of
  // its own first cell (regression guard for `j % srcCols`).
  const { writes } = planPaste(
    [
      ["1", "2", "3"],
      ["4", "5"],
    ],
    { row: 0, col: 0 },
    2,
    3,
    rowIds,
    textColumnIds,
    textColumns,
  );
  assert.deepEqual(
    writes.map((w) => w.value),
    ["1", "2", "3", "4", "5", null], // "" coerces to null for a text cell
  );
});

test("planPaste tiles a single copied row down a taller selection", () => {
  const { writes } = planPaste(
    [["Ann", "5"]],
    { row: 0, col: 0 },
    3,
    2,
    rowIds,
    columnIds,
    columns,
  );
  // The one source row repeats down all three selected rows.
  assert.equal(writes.length, 6);
  assert.deepEqual(
    writes.map((w) => w.value),
    ["Ann", 5, "Ann", 5, "Ann", 5],
  );
});

test("planPaste clamps writes and the target rect to the grid edge", () => {
  // A 3-tall block pasted on the last row only writes the one in-bounds cell.
  const { writes, target } = planPaste(
    [["1"], ["2"], ["3"]],
    { row: 3, col: 1 },
    1,
    1,
    rowIds,
    columnIds,
    columns,
  );
  assert.deepEqual(writes, [{ rowId: "r4", columnId: "score", value: 1 }]);
  assert.deepEqual(target, { minRow: 3, maxRow: 3, minCol: 1, maxCol: 1 });
});

test("planPaste skips non-editable columns but still spans them in the target", () => {
  const locked: DataGridColumn[] = columns.map((c) =>
    c.id === "score" ? { ...c, editable: false } : c,
  );
  const { writes, target } = planPaste(
    [["Ann", "5"]],
    { row: 0, col: 0 },
    1,
    1,
    rowIds,
    columnIds,
    locked,
  );
  assert.deepEqual(writes, [{ rowId: "r1", columnId: "name", value: "Ann" }]);
  // The locked Score cell is skipped for writing but the pasted area still
  // covers it (so the caller reselects the full 1×2 block).
  assert.deepEqual(target, { minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 });
});

test("planPaste with an empty clipboard is a no-op", () => {
  const { writes, target } = planPaste(
    [],
    { row: 2, col: 1 },
    2,
    2,
    rowIds,
    columnIds,
    columns,
  );
  assert.deepEqual(writes, []);
  assert.deepEqual(target, { minRow: 2, maxRow: 2, minCol: 1, maxCol: 1 });
});

test("clearRectWrites empties every editable cell in the rectangle", () => {
  const writes = clearRectWrites(
    { minRow: 0, maxRow: 1, minCol: 0, maxCol: 3 },
    rowIds,
    columnIds,
    columns,
  );
  assert.equal(writes.length, 8); // 2 rows × 4 cols
  const tags = writes.find((w) => w.columnId === "tags");
  assert.deepEqual(tags?.value, []); // multiSelect clears to []
  const name = writes.find((w) => w.columnId === "name");
  assert.equal(name?.value, null);
});

test("clearRectWrites leaves the skip rectangle untouched", () => {
  const writes = clearRectWrites(
    { minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 },
    rowIds,
    columnIds,
    columns,
    { minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 }, // paste overwrote row r1
  );
  // Only r2's two cells are cleared; r1 (the skip) is preserved.
  assert.deepEqual(
    writes.map((w) => `${w.rowId}:${w.columnId}`),
    ["r2:name", "r2:score"],
  );
});

test("clearRectWrites skips non-editable columns", () => {
  const locked: DataGridColumn[] = columns.map((c) =>
    c.id === "score" ? { ...c, editable: false } : c,
  );
  const writes = clearRectWrites(
    { minRow: 0, maxRow: 0, minCol: 0, maxCol: 1 },
    rowIds,
    columnIds,
    locked,
  );
  assert.deepEqual(
    writes.map((w) => w.columnId),
    ["name"],
  );
});

test("clearCellsWrites clears exactly the given cells by id", () => {
  const writes = clearCellsWrites(
    [
      { rowId: "r1", columnId: "name" },
      { rowId: "r2", columnId: "tags" },
    ],
    rowIds,
    columnIds,
    columns,
  );
  assert.deepEqual(writes, [
    { rowId: "r1", columnId: "name", value: null },
    { rowId: "r2", columnId: "tags", value: [] },
  ]);
});

test("clearCellsWrites addresses cells by id, so a reorder never clears the wrong cell", () => {
  // A cut of r1/name resolved when rows were [r1,r2]; before the paste the grid
  // is re-sorted to [r2,r1]. The skip rect (paste target) is r2's row (index 0)
  // — it must NOT match r1 just because r1 is now at a different index.
  const reordered = ["r2", "r1", "r3", "r4"];
  const writes = clearCellsWrites(
    [{ rowId: "r1", columnId: "name" }],
    reordered,
    columnIds,
    columns,
    { minRow: 0, maxRow: 0, minCol: 0, maxCol: 3 }, // the r2 row, in the new order
  );
  // r1/name is still cleared (it wasn't in the paste target); the rectangle math
  // can't accidentally spare or clobber the wrong row.
  assert.deepEqual(writes, [{ rowId: "r1", columnId: "name", value: null }]);
});

test("clearCellsWrites leaves cells inside the skip rectangle untouched", () => {
  const writes = clearCellsWrites(
    [
      { rowId: "r1", columnId: "name" }, // inside skip
      { rowId: "r2", columnId: "name" }, // outside skip
    ],
    rowIds,
    columnIds,
    columns,
    { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 }, // r1/name
  );
  assert.deepEqual(writes, [{ rowId: "r2", columnId: "name", value: null }]);
});

test("clearCellsWrites skips non-editable and missing columns", () => {
  const locked: DataGridColumn[] = columns.map((c) =>
    c.id === "score" ? { ...c, editable: false } : c,
  );
  const writes = clearCellsWrites(
    [
      { rowId: "r1", columnId: "score" }, // non-editable
      { rowId: "r1", columnId: "gone" }, // deleted column
      { rowId: "r1", columnId: "name" }, // ok
    ],
    rowIds,
    columnIds,
    locked,
  );
  assert.deepEqual(writes, [{ rowId: "r1", columnId: "name", value: null }]);
});
