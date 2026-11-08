/** The data grid's per-size geometry on the shared size scale. */
import type { ControlSize } from "../controlSize";
import { withDenseAsSmall } from "../controlSizeTables";

/** Per-size geometry. Row height is fixed so windowing math stays exact. */
export type DataGridMetrics = {
  rowHeight: number;
  gutterWidth: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
};

export const DATA_GRID_SIZES: Record<
  ControlSize,
  Omit<DataGridMetrics, "rowHeight">
> = withDenseAsSmall({
  sm: { gutterWidth: 40, paddingHorizontal: 8, fontSize: 12, iconSize: 13 },
  md: { gutterWidth: 48, paddingHorizontal: 10, fontSize: 13, iconSize: 15 },
  lg: { gutterWidth: 56, paddingHorizontal: 12, fontSize: 14, iconSize: 16 },
});
