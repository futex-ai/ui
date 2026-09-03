/**
 * What a secondary press does to the selection, before the menu opens.
 *
 * The spreadsheet rule, which Excel, Sheets, and Airtable all share: pressing
 * inside the current selection keeps it, so "Delete 5 rows" acts on all five;
 * pressing outside collapses to whatever was pressed. Pure so the matrix can be
 * pinned without a DOM.
 */
import { rangeRect, rectContains, singleCell } from "./dataGridSelectionModel";
import type { DataGridCellRef, DataGridSelection } from "./types";

type ContextSelectionArgs = {
  columnIds: readonly string[];
  ref: DataGridCellRef;
  region: "cell" | "column" | "row";
  rowIds: readonly string[];
  selection: DataGridSelection;
};

/** The whole of one row, as the grid expresses it: a full-width rectangle. */
function wholeRow(
  rowId: string,
  columnIds: readonly string[],
): DataGridSelection | null {
  const first = columnIds[0];
  const last = columnIds[columnIds.length - 1];
  if (!first || !last) {
    return null;
  }
  return {
    anchor: { rowId, columnId: first },
    focus: { rowId, columnId: last },
  };
}

/** The whole of one column: a full-height rectangle. */
function wholeColumn(
  columnId: string,
  rowIds: readonly string[],
): DataGridSelection | null {
  const first = rowIds[0];
  const last = rowIds[rowIds.length - 1];
  if (!first || !last) {
    return null;
  }
  return {
    anchor: { rowId: first, columnId },
    focus: { rowId: last, columnId },
  };
}

/**
 * The selection to apply before opening a context menu, or `null` when the
 * current selection already covers the target and must be left alone.
 *
 * A row counts as covered only when the rectangle spans it *and* is full-width
 * — a 2×2 range that happens to overlap the row is a cell selection, not a row
 * selection, so right-clicking that row's gutter should select the row. The
 * column case is the same rule transposed.
 */
export function contextSelectionFor({
  columnIds,
  ref,
  region,
  rowIds,
  selection,
}: ContextSelectionArgs): DataGridSelection | null {
  const rowIndex = rowIds.indexOf(ref.rowId);
  const colIndex = columnIds.indexOf(ref.columnId);
  if (rowIndex < 0 || colIndex < 0) {
    return null;
  }
  const rect = rangeRect(selection, rowIds, columnIds);

  if (region === "cell") {
    return rectContains(rect, rowIndex, colIndex) ? null : singleCell(ref);
  }

  if (region === "row") {
    const covered =
      rect !== null &&
      rowIndex >= rect.minRow &&
      rowIndex <= rect.maxRow &&
      rect.minCol === 0 &&
      rect.maxCol === columnIds.length - 1;
    return covered ? null : wholeRow(ref.rowId, columnIds);
  }

  const covered =
    rect !== null &&
    colIndex >= rect.minCol &&
    colIndex <= rect.maxCol &&
    rect.minRow === 0 &&
    rect.maxRow === rowIds.length - 1;
  return covered ? null : wholeColumn(ref.columnId, rowIds);
}

type ContextRowIdsArgs = {
  columnIds: readonly string[];
  rowId: string;
  rowIds: readonly string[];
  selection: DataGridSelection;
};

/**
 * The rows a row-region action applies to: the full-width selected span when it
 * contains `rowId`, otherwise just that row. This is what makes a row menu
 * opened inside a five-row selection say "Delete 5 rows" and act on all five.
 */
export function contextRowIds({
  columnIds,
  rowId,
  rowIds,
  selection,
}: ContextRowIdsArgs): string[] {
  const rowIndex = rowIds.indexOf(rowId);
  if (rowIndex < 0) {
    return [];
  }
  const rect = rangeRect(selection, rowIds, columnIds);
  const covered =
    rect !== null &&
    rowIndex >= rect.minRow &&
    rowIndex <= rect.maxRow &&
    rect.minCol === 0 &&
    rect.maxCol === columnIds.length - 1;
  if (!covered || !rect) {
    return [rowId];
  }
  return rowIds.slice(rect.minRow, rect.maxRow + 1);
}
