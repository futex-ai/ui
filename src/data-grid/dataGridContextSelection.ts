/**
 * What a secondary press does to the selection, before the menu opens.
 *
 * Cells follow the spreadsheet rule Excel, Sheets, and Airtable share: pressing
 * inside the current selection keeps it, pressing outside collapses to the
 * pressed cell. That much has to happen — the cell menu's Copy / Cut / Clear
 * act on the selection, so a menu opened on a cell outside it would otherwise
 * operate on something else entirely, off screen.
 *
 * Rows and columns deliberately do not: opening a gutter or header menu never
 * selects the row or column. Reaching for a menu is not the same gesture as
 * selecting, and a right-click that silently replaced a carefully built
 * selection is worse than one that leaves it alone. Nothing depends on the old
 * promotion — {@link contextRowIds} reads the pressed row directly, so a row
 * menu still knows its target whatever is selected.
 *
 * Pure, so the matrix can be pinned without a DOM.
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

/**
 * The selection to apply before opening a context menu, or `null` to leave the
 * current one untouched.
 *
 * Always `null` for the row and header regions. For a cell, `null` when the
 * press landed inside the current selection.
 */
export function contextSelectionFor({
  columnIds,
  ref,
  region,
  rowIds,
  selection,
}: ContextSelectionArgs): DataGridSelection | null {
  // A gutter or header press opens a menu without disturbing the selection.
  if (region !== "cell") {
    return null;
  }
  const rowIndex = rowIds.indexOf(ref.rowId);
  const colIndex = columnIds.indexOf(ref.columnId);
  if (rowIndex < 0 || colIndex < 0) {
    return null;
  }
  const rect = rangeRect(selection, rowIds, columnIds);
  return rectContains(rect, rowIndex, colIndex) ? null : singleCell(ref);
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
 * opened inside a five-row selection say "Delete 5 rows" and act on all five,
 * while one opened outside it acts only on the row under the pointer.
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
