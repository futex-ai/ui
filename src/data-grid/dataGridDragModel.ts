/** Pure rules of the grid's drag selection: the marquee box, taps, and focus. */
import type { DataGridCellRef } from "./types";

/** The marquee rectangle of a cell drag, relative to the grid. */
export type DataGridDragBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** What a drag selects: a cell range, whole rows, or whole columns. */
export type DataGridDragMode = "cell" | "row" | "column";

/** Pointer travel (px) beyond which a press is a drag, not a tap-to-edit click. */
export const TAP_MOVE_THRESHOLD = 4;

/** Read the viewport point from a (synthetic or native) pointer event. */
export function dataGridPointFromEvent(
  rawEvent: unknown,
): { x: number; y: number } | null {
  const event = rawEvent as {
    clientX?: number;
    clientY?: number;
    nativeEvent?: { clientX?: number; clientY?: number };
  };
  const x = event.clientX ?? event.nativeEvent?.clientX;
  const y = event.clientY ?? event.nativeEvent?.clientY;
  return typeof x === "number" && typeof y === "number" ? { x, y } : null;
}

/**
 * The cell that a drag in `mode` reaches at a hit: the hit cell, the last
 * cell of a hit row, or the last cell of a hit column.
 */
export function dataGridDragFocus(
  mode: DataGridDragMode,
  hit: { rowId?: string; columnId?: string },
  rowIds: readonly string[],
  columnIds: readonly string[],
): DataGridCellRef | null {
  if (mode === "cell" && hit.rowId && hit.columnId) {
    return { rowId: hit.rowId, columnId: hit.columnId };
  }
  if (mode === "row" && hit.rowId) {
    return { rowId: hit.rowId, columnId: columnIds[columnIds.length - 1] };
  }
  if (mode === "column" && hit.columnId) {
    return { rowId: rowIds[rowIds.length - 1], columnId: hit.columnId };
  }
  return null;
}

type ClientRect = { bottom: number; left: number; right: number; top: number };

/** The anchor and focus cells are opposite corners, so their union is the marquee. */
export function dataGridMarqueeBox(
  grid: ClientRect,
  anchor: ClientRect,
  focus: ClientRect,
): DataGridDragBox {
  const left = Math.min(anchor.left, focus.left);
  const top = Math.min(anchor.top, focus.top);
  return {
    left: left - grid.left,
    top: top - grid.top,
    width: Math.max(anchor.right, focus.right) - left,
    height: Math.max(anchor.bottom, focus.bottom) - top,
  };
}
