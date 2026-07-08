/**
 * Resolve columns to concrete pixel widths from the measured container width.
 *
 * Fixed-`width` columns keep their width; `flex` columns share the remaining
 * space (clamped to `minWidth`). Resolving to pixels — instead of flexing at
 * render time — means the header and every body row use identical widths (so
 * they always align, even with the add-column reserve), and the total content
 * width is deterministic, which is what drives horizontal scrolling.
 */
import type { DataGridColumn } from "./types";

const DEFAULT_MIN_WIDTH = 80;

/** A column with a resolved pixel `width` (never `flex`). */
export type ResolvedColumn = DataGridColumn & { width: number };

export type ResolvedColumns = {
  columns: ResolvedColumn[];
  /** Total content width: chrome + every resolved column width. */
  contentWidth: number;
};

/**
 * @param columns  visible columns, in display order
 * @param containerWidth  the grid's inner content width in px
 * @param chromeWidth  fixed leading/trailing chrome (gutter + add-column)
 */
export function resolveColumnWidths(
  columns: DataGridColumn[],
  containerWidth: number,
  chromeWidth: number,
): ResolvedColumns {
  const available = Math.max(0, containerWidth - chromeWidth);
  const fixedTotal = columns.reduce(
    (sum, column) => sum + (column.width ?? 0),
    0,
  );
  const flexTotal = columns.reduce(
    (sum, column) =>
      sum + (column.width === undefined ? (column.flex ?? 1) : 0),
    0,
  );
  const remaining = Math.max(0, available - fixedTotal);

  let columnsTotal = 0;
  const resolved = columns.map((column): ResolvedColumn => {
    let width: number;
    if (column.width !== undefined) {
      width = column.width;
    } else {
      const share =
        flexTotal > 0 ? (remaining * (column.flex ?? 1)) / flexTotal : 0;
      width = Math.max(column.minWidth ?? DEFAULT_MIN_WIDTH, Math.round(share));
    }
    columnsTotal += width;
    return { ...column, width };
  });

  return { columns: resolved, contentWidth: chromeWidth + columnsTotal };
}
