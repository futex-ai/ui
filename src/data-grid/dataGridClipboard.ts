/**
 * Clipboard model for the data grid — pure, React-free (unit-tested).
 *
 * Copy serializes the selected rectangle to TSV (tab-separated columns,
 * newline-separated rows) using display text (option labels, ISO dates), which
 * pastes cleanly into spreadsheets. Paste parses TSV back and coerces each value
 * to the target column's field type (numbers parsed, select labels/ids matched).
 */
import type { DataGridRangeRect } from "./dataGridSelectionModel";
import type { DataGridCellValue, DataGridColumn, DataGridRow } from "./types";

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
