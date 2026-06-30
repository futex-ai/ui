/** Pure column layout helpers shared by the header and body cells. */
import { Platform, type ViewStyle } from "react-native";

import type { DataGridColumn, DataGridColumnAlign } from "./types";

/**
 * RN's `Role` union omits `gridcell`, so it is forwarded as a literal DOM
 * attribute via a spread (web only; native grid roles are weaker). Returns `{}`
 * off web so no invalid role reaches native.
 */
export function gridcellRole(): Record<string, unknown> {
  return Platform.OS === "web" ? { role: "gridcell" } : {};
}

/** A fixed `width` wins; otherwise the column shares space by `flex`. */
export function columnLayoutStyle(column: DataGridColumn): ViewStyle {
  if (column.width !== undefined) {
    return { width: column.width };
  }
  return { flex: column.flex ?? 1, minWidth: column.minWidth ?? 80 };
}

/** Resolve a column's alignment, defaulting number columns to the right. */
export function resolveColumnAlign(
  column: DataGridColumn,
): DataGridColumnAlign {
  if (column.align) {
    return column.align;
  }
  return column.fieldType === "number" ? "right" : "left";
}
