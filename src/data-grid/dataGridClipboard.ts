/**
 * Clipboard model for the data grid — pure, React-free (unit-tested).
 *
 * Copy serializes the selected rectangle to TSV (tab-separated columns,
 * newline-separated rows) using display text (option labels, ISO dates), which
 * pastes cleanly into spreadsheets. Paste parses TSV back and coerces each value
 * to the target column's field type (numbers parsed, select labels/ids matched).
 *
 * Paste follows Excel / Google-Sheets semantics: {@link planPaste} grows the
 * target to at least the copied block and *tiles* the source across it, so a
 * single copied cell fills the whole selection, a single row/column repeats down
 * or across, and a block pasted onto one cell drops in at full size.
 */
import type { DataGridRangeRect } from "./dataGridSelectionModel";
import type {
  DataGridCellRef,
  DataGridCellValue,
  DataGridColumn,
  DataGridRow,
} from "./types";

/** A single planned cell write produced by a paste or a clear. */
export type DataGridCellWrite = {
  rowId: string;
  columnId: string;
  value: DataGridCellValue;
};

/** The clipboard text for one cell in its column. */
export function cellCopyText(
  column: DataGridColumn,
  value: DataGridCellValue,
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  switch (column.fieldType) {
    case "singleSelect":
      return (
        column.options?.find((option) => option.id === value)?.label ??
        String(value)
      );
    case "multiSelect": {
      const ids = Array.isArray(value) ? value : [];
      return ids
        .map((id) => column.options?.find((o) => o.id === id)?.label ?? id)
        .join(", ");
    }
    default:
      // text / number / date (ISO) round-trip as their raw string.
      return String(value);
  }
}

/** Coerce pasted clipboard text into a value for the target column's field type. */
export function coerceCellValue(
  column: DataGridColumn,
  text: string,
): DataGridCellValue {
  const trimmed = text.trim();
  if (trimmed === "") {
    return column.fieldType === "multiSelect" ? [] : null;
  }
  switch (column.fieldType) {
    case "number": {
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    }
    case "singleSelect":
      return matchOption(column, trimmed) ?? null;
    case "multiSelect":
      return trimmed
        .split(",")
        .map((part) => matchOption(column, part.trim()))
        .filter((id): id is string => id !== undefined);
    default:
      return trimmed;
  }
}

/** Match a select option by label (case-insensitive) or id; undefined if none. */
function matchOption(column: DataGridColumn, text: string): string | undefined {
  const lower = text.toLowerCase();
  const option = column.options?.find(
    (candidate) =>
      candidate.id === text || candidate.label.toLowerCase() === lower,
  );
  return option?.id;
}

/** Serialize the selected rectangle to TSV. */
export function buildClipboardText(
  rect: DataGridRangeRect,
  rowIds: readonly string[],
  columnIds: readonly string[],
  columns: DataGridColumn[],
  rows: DataGridRow[],
): string {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const rowById = new Map(rows.map((row) => [row.id, row]));
  const lines: string[] = [];
  for (let r = rect.minRow; r <= rect.maxRow; r += 1) {
    const cells: string[] = [];
    for (let c = rect.minCol; c <= rect.maxCol; c += 1) {
      const column = columnById.get(columnIds[c]);
      const value = rowById.get(rowIds[r])?.cells[columnIds[c]] ?? null;
      cells.push(column ? cellCopyText(column, value) : "");
    }
    lines.push(cells.join("\t"));
  }
  return lines.join("\n");
}

/** Parse clipboard TSV into a 2-D array of raw strings (drops a trailing newline). */
export function parseClipboardGrid(text: string): string[][] {
  const normalized = text.replace(/\r/g, "").replace(/\n$/, "");
  if (normalized === "") {
    return [];
  }
  return normalized.split("\n").map((line) => line.split("\t"));
}

/** The empty value for a column's field type (used by cut / delete-to-clear). */
export function emptyCellValue(column: DataGridColumn): DataGridCellValue {
  return column.fieldType === "multiSelect" ? [] : null;
}

/**
 * Plan the writes for a paste, Excel / Google-Sheets style. `source` is the
 * parsed clipboard grid; `anchor` is the top-left target cell (display indices)
 * and `selRows` / `selCols` the size of the current selection at that anchor.
 *
 * The paste area is the selection grown to at least the source's size, and the
 * source is then *tiled* to fill it (modulo indexing). This gives the familiar
 * behaviors: a single copied cell fills the whole selection; a single row or
 * column repeats across it; a block pasted onto one cell drops in at full size.
 * Writes are clamped to the grid and skip non-editable columns; `target` is the
 * (clamped) rectangle actually written, so the caller can reselect it.
 */
export function planPaste(
  source: string[][],
  anchor: { row: number; col: number },
  selRows: number,
  selCols: number,
  rowIds: readonly string[],
  columnIds: readonly string[],
  columns: DataGridColumn[],
): { writes: DataGridCellWrite[]; target: DataGridRangeRect } {
  const single: DataGridRangeRect = {
    minRow: anchor.row,
    maxRow: anchor.row,
    minCol: anchor.col,
    maxCol: anchor.col,
  };
  if (source.length === 0) {
    // Nothing on the clipboard → no-op (never clear the selection).
    return { writes: [], target: single };
  }
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const srcRows = source.length;
  const srcCols = source.reduce((max, row) => Math.max(max, row.length), 0);
  const targetRows = Math.max(selRows, srcRows);
  const targetCols = Math.max(selCols, srcCols);
  const writes: DataGridCellWrite[] = [];
  let maxRow = anchor.row;
  let maxCol = anchor.col;
  for (let i = 0; i < targetRows; i += 1) {
    for (let j = 0; j < targetCols; j += 1) {
      const r = anchor.row + i;
      const c = anchor.col + j;
      const rowId = rowIds[r];
      const columnId = columnIds[c];
      // Clamp: anything past the grid's edges is dropped.
      if (rowId === undefined || columnId === undefined) {
        continue;
      }
      // The selected area is reported even for cells we skip writing (so the
      // whole pasted block is reselected), hence widen the target here.
      maxRow = Math.max(maxRow, r);
      maxCol = Math.max(maxCol, c);
      const column = columnById.get(columnId);
      if (!column || column.editable === false) {
        continue;
      }
      // Tile within the block's width (`srcCols`), not the individual row's — a
      // ragged clipboard row is padded with empty trailing cells (`?? ""`) rather
      // than repeating its own leading cells.
      const text = source[i % srcRows][j % srcCols] ?? "";
      writes.push({ rowId, columnId, value: coerceCellValue(column, text) });
    }
  }
  return {
    writes,
    target: { minRow: anchor.row, maxRow, minCol: anchor.col, maxCol },
  };
}

/**
 * Plan the writes to clear a specific list of cells, addressed by id — used to
 * clear a cut range's source. Because the cells are identified by `rowId` /
 * `columnId` (not display index), this survives a row/column reorder (sort /
 * filter) between the cut and the paste, so it can never blank a cell that
 * wasn't cut. Cells inside `skip` (the paste's target rectangle, in *current*
 * display indices) are left untouched, as are cells whose column is gone or
 * non-editable.
 */
export function clearCellsWrites(
  refs: readonly DataGridCellRef[],
  rowIds: readonly string[],
  columnIds: readonly string[],
  columns: DataGridColumn[],
  skip?: DataGridRangeRect | null,
): DataGridCellWrite[] {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const writes: DataGridCellWrite[] = [];
  for (const ref of refs) {
    if (skip) {
      const rowIndex = rowIds.indexOf(ref.rowId);
      const colIndex = columnIds.indexOf(ref.columnId);
      if (
        rowIndex >= skip.minRow &&
        rowIndex <= skip.maxRow &&
        colIndex >= skip.minCol &&
        colIndex <= skip.maxCol
      ) {
        continue;
      }
    }
    const column = columnById.get(ref.columnId);
    if (!column || column.editable === false) {
      continue;
    }
    writes.push({
      rowId: ref.rowId,
      columnId: ref.columnId,
      value: emptyCellValue(column),
    });
  }
  return writes;
}

/**
 * Plan the writes to clear every editable cell in a rectangle (Delete/Backspace).
 * `skip`, when given, is a rectangle whose cells are left untouched.
 */
export function clearRectWrites(
  rect: DataGridRangeRect,
  rowIds: readonly string[],
  columnIds: readonly string[],
  columns: DataGridColumn[],
  skip?: DataGridRangeRect | null,
): DataGridCellWrite[] {
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const writes: DataGridCellWrite[] = [];
  for (let r = rect.minRow; r <= rect.maxRow; r += 1) {
    for (let c = rect.minCol; c <= rect.maxCol; c += 1) {
      if (
        skip &&
        r >= skip.minRow &&
        r <= skip.maxRow &&
        c >= skip.minCol &&
        c <= skip.maxCol
      ) {
        continue;
      }
      const rowId = rowIds[r];
      const columnId = columnIds[c];
      if (rowId === undefined || columnId === undefined) {
        continue;
      }
      const column = columnById.get(columnId);
      if (!column || column.editable === false) {
        continue;
      }
      writes.push({ rowId, columnId, value: emptyCellValue(column) });
    }
  }
  return writes;
}
