/**
 * What a secondary press does to the selection.
 *
 * Cells follow the spreadsheet rule — a press inside the current selection
 * keeps it, a press outside collapses to the pressed cell — so the cell menu's
 * Copy / Cut / Clear always act on what was actually right-clicked.
 *
 * Rows and columns do not: opening a gutter or header menu never selects the
 * row or column. Reaching for a menu is not the same gesture as selecting, and
 * a right-click that silently replaced a carefully built selection was the
 * complaint. The menu still knows its target — `contextRowIds` reads the
 * pressed row, not the selection — so nothing depends on the promotion.
 *
 * Pure, so the whole matrix is pinned here rather than inferred from browser
 * behaviour.
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

test("a row press never changes the selection", () => {
  const press = (selection: DataGridSelection, rowId = "r2") =>
    contextSelectionFor({
      columnIds,
      ref: cell(rowId, "c1"),
      region: "row",
      rowIds,
      selection,
    });

  // Inside a full-width row span.
  assert.equal(press(TWO_WHOLE_ROWS, "r3"), null);
  // Inside a partial-width range that merely overlaps the row.
  assert.equal(press(range(["r2", "c1"], ["r3", "c2"])), null);
  // Outside the selection entirely — the case that used to promote the row.
  assert.equal(press(TWO_WHOLE_ROWS, "r4"), null);
  // With nothing selected at all.
  assert.equal(press(EMPTY), null);
});

test("a column press never changes the selection", () => {
  const press = (selection: DataGridSelection, columnId = "c2") =>
    contextSelectionFor({
      columnIds,
      ref: cell("r1", columnId),
      region: "column",
      rowIds,
      selection,
    });

  // Inside a full-height column span.
  assert.equal(press(range(["r1", "c2"], ["r4", "c3"])), null);
  // Inside a partial-height range.
  assert.equal(press(range(["r1", "c2"], ["r2", "c3"])), null);
  // Outside the selection entirely.
  assert.equal(press(range(["r1", "c2"], ["r4", "c2"]), "c1"), null);
  // With nothing selected at all.
  assert.equal(press(EMPTY), null);
});

test("an empty selection collapses to the target cell", () => {
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
