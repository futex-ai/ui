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

/** Fallback minimum column width (px) when a column sets no `minWidth`. */
export const DEFAULT_MIN_WIDTH = 80;

/**
 * Default cap (px) on how wide a column may grow from its `flex` share when it
 * declares no explicit `maxWidth`. Without it a lone flexible column in a sparse
 * table — e.g. one text column beside a couple of fixed-width ones — would
 * stretch to fill the whole viewport, so a 2-column grid ends up with one
 * enormous column. The cap only bounds *automatic* flex sizing: an explicit
 * `maxWidth`, a fixed `width`, and a manual resize all override it, and it never
 * shrinks a column below its own `minWidth`. Leftover space past the cap is left
 * empty (the grid fills it as a clean trailing area rather than over-widening).
 */
export const DEFAULT_MAX_FLEX_WIDTH = 480;

/** A column with a resolved pixel `width` (never `flex`). */
export type ResolvedColumn = DataGridColumn & { width: number };

export type ResolvedColumns = {
  columns: ResolvedColumn[];
  /** Total content width: chrome + every resolved column width. */
  contentWidth: number;
};

/** Per-column pixel widths from user resizes, keyed by column id. */
export type ColumnWidthOverrides = Readonly<Record<string, number>>;

/** Round a resized width and clamp it to the column's [min, max] bounds. */
export function clampColumnWidth(
  column: DataGridColumn,
  width: number,
): number {
  const min = column.minWidth ?? DEFAULT_MIN_WIDTH;
  const max = column.maxWidth ?? Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, Math.round(width)));
}

/**
 * Clamp a column's automatic `flex` share. Like {@link clampColumnWidth}, but a
 * column with no explicit `maxWidth` is capped at {@link DEFAULT_MAX_FLEX_WIDTH}
 * (never below its own `minWidth`) so a single flexible column can't stretch
 * across the whole viewport. Fixed widths and manual resizes keep using
 * {@link clampColumnWidth}, so they stay unbounded by the default cap.
 */
export function clampFlexWidth(column: DataGridColumn, width: number): number {
  const min = column.minWidth ?? DEFAULT_MIN_WIDTH;
  // The default cap must never fight the column's own minimum, so a column whose
  // minWidth already exceeds the default keeps that larger floor as its max.
  const max = column.maxWidth ?? Math.max(min, DEFAULT_MAX_FLEX_WIDTH);
  return Math.min(max, Math.max(min, Math.round(width)));
}

/**
 * @param columns  visible columns, in display order
 * @param containerWidth  the grid's inner content width in px
 * @param chromeWidth  fixed leading/trailing chrome (gutter + add-column)
 * @param overrides  per-column resized widths that pin a column to a fixed width
 */
export function resolveColumnWidths(
  columns: DataGridColumn[],
  containerWidth: number,
  chromeWidth: number,
  overrides?: ColumnWidthOverrides,
): ResolvedColumns {
  const available = Math.max(0, containerWidth - chromeWidth);
  // A resize override pins the column to a fixed (clamped) width, taking
  // precedence over its declared `width`/`flex`; `undefined` means "size by flex".
  const fixedWidthOf = (column: DataGridColumn): number | undefined => {
    const override = overrides?.[column.id];
    if (override !== undefined) {
      return clampColumnWidth(column, override);
    }
    return column.width;
  };
  const fixedTotal = columns.reduce(
    (sum, column) => sum + (fixedWidthOf(column) ?? 0),
    0,
  );
  const flexTotal = columns.reduce(
    (sum, column) =>
      sum + (fixedWidthOf(column) === undefined ? (column.flex ?? 1) : 0),
    0,
  );
  const remaining = Math.max(0, available - fixedTotal);

  let columnsTotal = 0;
  const resolved = columns.map((column): ResolvedColumn => {
    const fixed = fixedWidthOf(column);
    let width: number;
    if (fixed !== undefined) {
      width = fixed;
    } else {
      const share =
        flexTotal > 0 ? (remaining * (column.flex ?? 1)) / flexTotal : 0;
      // Clamp the flex share to BOTH bounds — including the default cap for an
      // unbounded column — so a flex column never renders (or reports via
      // aria-valuenow) above its max, and a lone one can't fill the viewport.
      width = clampFlexWidth(column, share);
    }
    columnsTotal += width;
    return { ...column, width };
  });

  return { columns: resolved, contentWidth: chromeWidth + columnsTotal };
}
