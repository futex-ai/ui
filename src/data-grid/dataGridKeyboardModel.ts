/**
 * Pure arrow-key navigation math for the data grid — no React.
 *
 * Maps a keyboard event key to the next active cell position (row/column display
 * indices), clamping at the grid edges. The grid layers selection extension
 * (Shift) and editing (Enter/Escape) on top; this module only resolves movement.
 * Kept framework-free for `node --test`.
 */

/** A cell position in row/column display indices. */
export type DataGridCellPosition = { row: number; col: number };

export type NextGridCellParams = {
  /** `KeyboardEvent.key` (e.g. "ArrowRight", "Home"). */
  key: string;
  /** Current position. */
  position: DataGridCellPosition;
  /** Number of visible rows. */
  rowCount: number;
  /** Number of visible columns. */
  colCount: number;
};

/**
 * Resolves the next active cell for an arrow / Home / End / Tab key, clamped to
 * the grid bounds, or `null` when the key is not a navigation key (so the caller
 * can ignore it).
 *
 * - Arrow keys move one cell; they clamp at the edges (no wrap), matching
 *   spreadsheet behaviour.
 * - Home/End jump to the first/last column of the current row;
 *   Ctrl/Cmd+Home/End jump to the very first/last cell.
 * - Tab / Shift+Tab move one column and wrap to the next/previous row's edge,
 *   so tabbing walks the whole grid in reading order.
 */
export function nextGridCell(
  params: NextGridCellParams & { ctrl?: boolean; shiftTab?: boolean },
): DataGridCellPosition | null {
  const { key, position, rowCount, colCount } = params;
  if (rowCount <= 0 || colCount <= 0) {
    return null;
  }
  const { row, col } = position;
  const clampRow = (value: number) =>
    Math.max(0, Math.min(rowCount - 1, value));
  const clampCol = (value: number) =>
    Math.max(0, Math.min(colCount - 1, value));

  switch (key) {
    case "ArrowUp":
      return { row: clampRow(row - 1), col };
    case "ArrowDown":
      return { row: clampRow(row + 1), col };
    case "ArrowLeft":
      return { row, col: clampCol(col - 1) };
    case "ArrowRight":
      return { row, col: clampCol(col + 1) };
    case "Home":
      return params.ctrl ? { row: 0, col: 0 } : { row, col: 0 };
    case "End":
      return params.ctrl
        ? { row: rowCount - 1, col: colCount - 1 }
        : { row, col: colCount - 1 };
    case "Tab":
      return params.shiftTab
        ? prevCellWrapping(row, col, rowCount, colCount)
        : nextCellWrapping(row, col, rowCount, colCount);
    default:
      return null;
  }
}

function nextCellWrapping(
  row: number,
  col: number,
  rowCount: number,
  colCount: number,
): DataGridCellPosition {
  if (col < colCount - 1) {
    return { row, col: col + 1 };
  }
  if (row < rowCount - 1) {
    return { row: row + 1, col: 0 };
  }
  return { row, col };
}

function prevCellWrapping(
  row: number,
  col: number,
  rowCount: number,
  colCount: number,
): DataGridCellPosition {
  if (col > 0) {
    return { row, col: col - 1 };
  }
  if (row > 0) {
    return { row: row - 1, col: colCount - 1 };
  }
  return { row, col };
}

/** Keys that should move the active cell (used to gate `preventDefault`). */
export function isGridNavigationKey(key: string): boolean {
  return (
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "Home" ||
    key === "End" ||
    key === "Tab"
  );
}

/** Keys that open the active cell's editor (Enter, or a printable character). */
export function isEditEntryKey(key: string): boolean {
  return key === "Enter" || (key.length === 1 && key !== " ");
}
