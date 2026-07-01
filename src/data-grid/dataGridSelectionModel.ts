/**
 * Pure 2-D rectangular selection logic for the data grid — no React.
 *
 * The selection is an anchor/focus pair of {@link DataGridCellRef}s; the selected
 * set is the rectangle of cells spanning the rows and columns between them. The
 * grid passes the ordered, *visible* row and column id arrays so the math works
 * on display indices (hidden columns never participate). Kept framework-free so
 * it can be unit-tested with `node --test`.
 */
import type { DataGridCellRef, DataGridSelection } from "./types";

/** A stable string key for a cell ref, for `Set`/`Map` membership. */
export function cellKey(ref: DataGridCellRef): string {
  return `${ref.rowId}::${ref.columnId}`;
}

/** Whether two cell refs point at the same cell (null-safe). */
export function cellRefEquals(
  a: DataGridCellRef | null,
  b: DataGridCellRef | null,
): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.rowId === b.rowId && a.columnId === b.columnId;
}

/** The bounding rectangle of a selection, in display-index space. */
export type DataGridRangeRect = {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
};

/**
 * The selection rectangle in row/column display indices, or `null` when the
 * selection is empty or either endpoint is no longer present (e.g. its row was
 * filtered out). `rowIds` / `columnIds` are the ordered visible ids.
 */
export function rangeRect(
  selection: DataGridSelection,
  rowIds: readonly string[],
  columnIds: readonly string[],
): DataGridRangeRect | null {
  const { anchor, focus } = selection;
  if (!anchor || !focus) {
    return null;
  }
  const anchorRow = rowIds.indexOf(anchor.rowId);
  const focusRow = rowIds.indexOf(focus.rowId);
  const anchorCol = columnIds.indexOf(anchor.columnId);
  const focusCol = columnIds.indexOf(focus.columnId);
  if (anchorRow < 0 || focusRow < 0 || anchorCol < 0 || focusCol < 0) {
    return null;
  }
  return {
    minRow: Math.min(anchorRow, focusRow),
    maxRow: Math.max(anchorRow, focusRow),
    minCol: Math.min(anchorCol, focusCol),
    maxCol: Math.max(anchorCol, focusCol),
  };
}

/** Whether a cell at the given display indices lies inside the rectangle. */
export function rectContains(
  rect: DataGridRangeRect | null,
  rowIndex: number,
  colIndex: number,
): boolean {
  if (!rect) {
    return false;
  }
  return (
    rowIndex >= rect.minRow &&
    rowIndex <= rect.maxRow &&
    colIndex >= rect.minCol &&
    colIndex <= rect.maxCol
  );
}

/** Every cell ref inside the current selection, in row-major order. */
export function rangeBetween(
  selection: DataGridSelection,
  rowIds: readonly string[],
  columnIds: readonly string[],
): DataGridCellRef[] {
  const rect = rangeRect(selection, rowIds, columnIds);
  if (!rect) {
    return [];
  }
  const cells: DataGridCellRef[] = [];
  for (let row = rect.minRow; row <= rect.maxRow; row += 1) {
    for (let col = rect.minCol; col <= rect.maxCol; col += 1) {
      cells.push({ rowId: rowIds[row], columnId: columnIds[col] });
    }
  }
  return cells;
}

/** Whether a specific cell ref is inside the current selection. */
export function isCellSelected(
  ref: DataGridCellRef,
  selection: DataGridSelection,
  rowIds: readonly string[],
  columnIds: readonly string[],
): boolean {
  const rect = rangeRect(selection, rowIds, columnIds);
  return rectContains(
    rect,
    rowIds.indexOf(ref.rowId),
    columnIds.indexOf(ref.columnId),
  );
}

/** The number of cells in the current selection. */
export function selectionCount(
  selection: DataGridSelection,
  rowIds: readonly string[],
  columnIds: readonly string[],
): number {
  const rect = rangeRect(selection, rowIds, columnIds);
  if (!rect) {
    return 0;
  }
  return (rect.maxRow - rect.minRow + 1) * (rect.maxCol - rect.minCol + 1);
}

/** A single-cell selection (anchor === focus). */
export function singleCell(ref: DataGridCellRef): DataGridSelection {
  return { anchor: ref, focus: { ...ref } };
}

/** A selection spanning every visible cell, or empty when the grid is empty. */
export function selectAll(
  rowIds: readonly string[],
  columnIds: readonly string[],
): DataGridSelection {
  if (rowIds.length === 0 || columnIds.length === 0) {
    return { anchor: null, focus: null };
  }
  return {
    anchor: { rowId: rowIds[0], columnId: columnIds[0] },
    focus: {
      rowId: rowIds[rowIds.length - 1],
      columnId: columnIds[columnIds.length - 1],
    },
  };
}
