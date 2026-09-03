/**
 * The spreadsheet rule a secondary press follows: a press inside the current
 * selection keeps it, a press outside collapses to the target. Pure, so the
 * whole matrix is pinned here rather than inferred from browser behaviour.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  contextRowIds,
  contextSelectionFor,
} from "../../src/data-grid/dataGridContextSelection";
import type { DataGridSelection } from "../../src/data-grid/types";

const rowIds = ["r1", "r2", "r3", "r4"];
const columnIds = ["c1", "c2", "c3"];

const cell = (rowId: string, columnId: string) => ({ columnId, rowId });

const range = (
  from: [string, string],
  to: [string, string],
): DataGridSelection => ({
  anchor: cell(from[0], from[1]),
  focus: cell(to[0], to[1]),
});

const EMPTY: DataGridSelection = { anchor: null, focus: null };

/** Rows r2–r3 across every column: what a gutter drag produces. */
const TWO_WHOLE_ROWS = range(["r2", "c1"], ["r3", "c3"]);

test("a cell press inside the selection leaves it alone", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r2", "c2"),
    region: "cell",
    rowIds,
    selection: range(["r1", "c1"], ["r3", "c3"]),
  });
  assert.equal(result, null);
});

test("a cell press outside the selection collapses to that cell", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r4", "c2"),
    region: "cell",
    rowIds,
    selection: range(["r1", "c1"], ["r2", "c2"]),
  });
  assert.deepEqual(result, {
    anchor: cell("r4", "c2"),
    focus: cell("r4", "c2"),
  });
});

test("a row press inside a full-width row span leaves it alone", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r3", "c1"),
    region: "row",
    rowIds,
    selection: TWO_WHOLE_ROWS,
  });
  assert.equal(result, null);
});

test("a row press inside a partial-width range still selects the row", () => {
  // A 2x2 cell range that happens to overlap the row is a cell selection, not
  // a row selection — right-clicking the gutter should promote it to the row.
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r2", "c1"),
    region: "row",
    rowIds,
    selection: range(["r2", "c1"], ["r3", "c2"]),
  });
  assert.deepEqual(result, {
    anchor: cell("r2", "c1"),
    focus: cell("r2", "c3"),
  });
});

test("a row press outside the selection selects that whole row", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r4", "c1"),
    region: "row",
    rowIds,
    selection: TWO_WHOLE_ROWS,
  });
  assert.deepEqual(result, {
    anchor: cell("r4", "c1"),
    focus: cell("r4", "c3"),
  });
});

test("a column press inside a full-height column span leaves it alone", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r1", "c2"),
    region: "column",
    rowIds,
    selection: range(["r1", "c2"], ["r4", "c3"]),
  });
  assert.equal(result, null);
});

test("a column press inside a partial-height range still selects the column", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r1", "c2"),
    region: "column",
    rowIds,
    selection: range(["r1", "c2"], ["r2", "c3"]),
  });
  assert.deepEqual(result, {
    anchor: cell("r1", "c2"),
    focus: cell("r4", "c2"),
  });
});

test("a column press outside the selection selects that whole column", () => {
  const result = contextSelectionFor({
    columnIds,
    ref: cell("r1", "c1"),
    region: "column",
    rowIds,
    selection: range(["r1", "c2"], ["r4", "c2"]),
  });
  assert.deepEqual(result, {
    anchor: cell("r1", "c1"),
    focus: cell("r4", "c1"),
  });
});

test("an empty selection always collapses to the target", () => {
  assert.deepEqual(
    contextSelectionFor({
      columnIds,
      ref: cell("r2", "c2"),
      region: "cell",
      rowIds,
      selection: EMPTY,
    }),
    { anchor: cell("r2", "c2"), focus: cell("r2", "c2") },
  );
  assert.deepEqual(
    contextSelectionFor({
      columnIds,
      ref: cell("r2", "c1"),
      region: "row",
      rowIds,
      selection: EMPTY,
    }),
    { anchor: cell("r2", "c1"), focus: cell("r2", "c3") },
  );
});

test("a selection referencing a hidden column collapses rather than throwing", () => {
  // `rangeRect` returns null when an endpoint is no longer visible.
  const stale = range(["r1", "gone"], ["r3", "c2"]);
  assert.deepEqual(
    contextSelectionFor({
      columnIds,
      ref: cell("r2", "c2"),
      region: "cell",
      rowIds,
      selection: stale,
    }),
    { anchor: cell("r2", "c2"), focus: cell("r2", "c2") },
  );
});

test("a target that is no longer visible changes nothing", () => {
  assert.equal(
    contextSelectionFor({
      columnIds,
      ref: cell("gone", "c1"),
      region: "cell",
      rowIds,
      selection: EMPTY,
    }),
    null,
  );
});

test("contextRowIds returns the whole span for a covered row", () => {
  assert.deepEqual(
    contextRowIds({
      columnIds,
      rowId: "r3",
      rowIds,
      selection: TWO_WHOLE_ROWS,
    }),
    ["r2", "r3"],
  );
});

test("contextRowIds returns just the row when it is outside the span", () => {
  assert.deepEqual(
    contextRowIds({
      columnIds,
      rowId: "r1",
      rowIds,
      selection: TWO_WHOLE_ROWS,
    }),
    ["r1"],
  );
});

test("contextRowIds ignores a partial-width range", () => {
  assert.deepEqual(
    contextRowIds({
      columnIds,
      rowId: "r2",
      rowIds,
      selection: range(["r2", "c1"], ["r3", "c2"]),
    }),
    ["r2"],
  );
});

test("contextRowIds tolerates an unknown row", () => {
  assert.deepEqual(
    contextRowIds({
      columnIds,
      rowId: "gone",
      rowIds,
      selection: TWO_WHOLE_ROWS,
    }),
    [],
  );
});
