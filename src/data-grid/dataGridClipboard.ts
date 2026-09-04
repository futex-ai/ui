/**
 * Clipboard model for the data grid — pure, React-free (unit-tested).
 *
 * Copy serializes the selected rectangle to TSV (tab-separated columns,
 * newline-separated rows) using display text (option labels, ISO dates), which
 * pastes cleanly into spreadsheets. Paste parses TSV back and coerces each value
 * to the target column's field type (numbers parsed, select labels/ids matched).
 *
 * Coercion is *validating*: {@link coerceCellValue} answers with a
 * {@link DataGridCoercedValue}, so a value that cannot be read for its column is
 * reported as invalid rather than folded into `null`. That keeps an unreadable
 * value distinct from an intentional clear — a blank source cell still clears
 * its target, but junk never silently wipes one. {@link planPaste} collects the
 * invalid cells so the caller can validate the whole block before committing
 * anything and abort as a unit (`onCellChange` is fire-and-forget, so a partial
 * paste could not be rolled back).
 *
 * Paste follows Excel / Google-Sheets semantics: {@link planPaste} grows the
 * target to at least the copied block and *tiles* the source across it, so a
 * single copied cell fills the whole selection, a single row/column repeats down
 * or across, and a block pasted onto one cell drops in at full size.
 */
import { isValidIso } from "../date/dateMath";

import { parseDecimalString } from "./dataGridNumberValue";
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

/** A clipboard cell that could not be read as a value for its column. */
export type DataGridInvalidCell = {
  rowId: string;
  columnId: string;
  /** The offending clipboard text, for diagnostics. */
  text: string;
  /**
   * Where the text came from in the clipboard block. Tiling repeats one source
   * cell across many targets, so counting *these* — not the target cells —
   * is what tells a user how many clipboard values were actually unreadable.
   */
  source: { row: number; col: number };
};

/** How many distinct clipboard values the invalid target cells came from. */
export function invalidSourceCount(
  invalid: readonly DataGridInvalidCell[],
): number {
  return new Set(invalid.map((cell) => `${cell.source.row}:${cell.source.col}`))
    .size;
}

/** Polite live-region copy for a paste aborted by invalid values. */
export function pasteRejectedMessage(count: number): string {
  return `Paste cancelled, ${count} invalid value${count === 1 ? "" : "s"}`;
}

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

/**
 * The outcome of coercing one clipboard cell. `ok: false` means the text cannot
 * be read as a value for that column; it is deliberately *not* a value, so a
 * legitimate empty result (`null`, or `[]` for a multi-select) stays distinct
 * from unreadable input.
 */
export type DataGridCoercedValue =
  | { ok: true; value: DataGridCellValue }
  | { ok: false };

/**
 * Coerce pasted clipboard text into a value for the target column's field type,
 * or report it invalid. Empty text is always a valid, intentional clear.
 *
 * Per field type: `number` parses (exactly, as a decimal string, under
 * `numberValueMode: "decimalString"`); `date` must be a real ISO `YYYY-MM-DD`
 * calendar date; `singleSelect` must match an option by id or label;
 * `multiSelect` must match *every* comma-separated token — one unknown token
 * invalidates the whole cell rather than silently dropping just that token;
 * `text` accepts anything.
 */
export function coerceCellValue(
  column: DataGridColumn,
  text: string,
): DataGridCoercedValue {
  const trimmed = text.trim();
  if (trimmed === "") {
    return { ok: true, value: emptyCellValue(column) };
  }
  switch (column.fieldType) {
    case "number": {
      if (column.numberValueMode === "decimalString") {
        const decimal = parseDecimalString(trimmed);
        return decimal === null ? { ok: false } : { ok: true, value: decimal };
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed)
        ? { ok: true, value: parsed }
        : { ok: false };
    }
    case "date":
      return isValidIso(trimmed) ? { ok: true, value: trimmed } : { ok: false };
    case "singleSelect": {
      const id = matchOption(column, trimmed);
      return id === undefined ? { ok: false } : { ok: true, value: id };
    }
    case "multiSelect": {
      const ids: string[] = [];
      for (const part of trimmed.split(",")) {
        const token = part.trim();
        // "Alpha, " and "Alpha,,Beta" are formatting, not a missing option.
        if (token === "") {
          continue;
        }
        const id = matchOption(column, token);
        if (id === undefined) {
          return { ok: false };
        }
        ids.push(id);
      }
      // Non-empty text that yields no token at all (",", ", ,") is punctuation,
      // not a clear — only genuinely empty text may empty a cell.
      return ids.length === 0 ? { ok: false } : { ok: true, value: ids };
    }
    default:
      return { ok: true, value: trimmed };
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
 *
 * `invalid` lists the cells whose clipboard text could not be read for their
 * column, so the caller can abort the paste as a unit. Only cells that would
 * actually have been written can appear there — text landing past the grid's
 * edge or on a non-editable column is dropped as before and never blocks an
 * otherwise legitimate paste.
 */
export function planPaste(
  source: string[][],
  anchor: { row: number; col: number },
  selRows: number,
  selCols: number,
  rowIds: readonly string[],
  columnIds: readonly string[],
  columns: DataGridColumn[],
): {
  writes: DataGridCellWrite[];
  target: DataGridRangeRect;
  invalid: DataGridInvalidCell[];
} {
  const single: DataGridRangeRect = {
    minRow: anchor.row,
    maxRow: anchor.row,
    minCol: anchor.col,
    maxCol: anchor.col,
  };
  if (source.length === 0) {
    // Nothing on the clipboard → no-op (never clear the selection).
    return { writes: [], target: single, invalid: [] };
  }
  const columnById = new Map(columns.map((column) => [column.id, column]));
  const srcRows = source.length;
  const srcCols = source.reduce((max, row) => Math.max(max, row.length), 0);
  const targetRows = Math.max(selRows, srcRows);
  const targetCols = Math.max(selCols, srcCols);
  const writes: DataGridCellWrite[] = [];
  const invalid: DataGridInvalidCell[] = [];
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
      const sourceRow = i % srcRows;
      const sourceCol = j % srcCols;
      const text = source[sourceRow][sourceCol] ?? "";
      const coerced = coerceCellValue(column, text);
      if (!coerced.ok) {
        invalid.push({
          rowId,
          columnId,
          text,
          source: { row: sourceRow, col: sourceCol },
        });
        continue;
      }
      writes.push({ rowId, columnId, value: coerced.value });
    }
  }
  return {
    writes,
    target: { minRow: anchor.row, maxRow, minCol: anchor.col, maxCol },
    invalid,
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
