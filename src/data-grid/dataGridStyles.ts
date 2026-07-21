/** Themed styles + fixed metrics for the data grid, on the shared size scale. */
import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

import { DATA_GRID_ROW_HEIGHT } from "./types";

/** Per-size geometry. Row height is fixed so windowing math stays exact. */
export type DataGridMetrics = {
  rowHeight: number;
  gutterWidth: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
};

const DATA_GRID_SIZES: Record<
  ControlSize,
  Omit<DataGridMetrics, "rowHeight">
> = {
  sm: { gutterWidth: 40, paddingHorizontal: 8, fontSize: 12, iconSize: 13 },
  md: { gutterWidth: 48, paddingHorizontal: 10, fontSize: 13, iconSize: 15 },
  lg: { gutterWidth: 56, paddingHorizontal: 12, fontSize: 14, iconSize: 16 },
};

/** The fixed metrics for a size, shared by layout, windowing, and hit-testing. */
export function dataGridMetrics(size: ControlSize = "md"): DataGridMetrics {
  return { rowHeight: DATA_GRID_ROW_HEIGHT[size], ...DATA_GRID_SIZES[size] };
}

/** Width (px) of the trailing add-column (+) cell, reserved in header + body. */
export const ADD_COLUMN_WIDTH = 44;

/**
 * Build the grid's themed styles for a size. Cells carry a right + bottom hairline
 * so the body reads as a real grid; the gutter, header, selection wash, active-cell
 * ring, and chrome all read from shared theme tokens.
 *
 * `borderRadius` and `borderWidth` shape the outer frame (and the mobile card),
 * so the whole component squares off / de-borders consistently. Corners are flat
 * by default (`borderRadius: 0`); the internal cell hairlines are unaffected.
 */
export function createDataGridStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
  borderRadius = 0,
  borderWidth = 1,
) {
  const metrics = dataGridMetrics(size);
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    grid: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius,
      borderWidth,
      overflow: "hidden",
      // Dragging a cell range must not start a native text selection.
      userSelect: "none",
      width: "100%",
    },
    // The role="grid" wrapper inside the horizontal scroller fills the resolved
    // content width so the header and body rows share one width.
    gridContent: { width: "100%" },
    // Bounded body (a `maxHeight` is set): the scroll content container fills the
    // fixed body height (`flexGrow`) and paints a muted grey behind the rows.
    // When the rows are shorter than the height they stack at the top on their
    // opaque `surface` (see `bodyRow`), so the area below the last row reads as a
    // quiet empty zone (Airtable / Notion style) instead of blank white. When the
    // rows overflow, the container is exactly content-height so no grey shows.
    bodyContent: { backgroundColor: theme.colors.bg2, flexGrow: 1 },
    headerRow: {
      backgroundColor: theme.colors.bg,
      borderBottomColor: theme.colors.border2,
      borderBottomWidth: 1,
      flexDirection: "row",
    },
    headerCell: {
      alignItems: "center",
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      flexDirection: "row",
      gap: 6,
      height: metrics.rowHeight,
      paddingHorizontal: metrics.paddingHorizontal,
    },
    headerLabel: {
      ...baseText,
      color: theme.colors.muted,
      // Grow to fill so the caret menu is pushed to the cell's right edge.
      flex: 1,
      fontSize: metrics.fontSize - 1,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    headerSort: { ...baseText, color: theme.colors.muted, fontSize: 11 },
    headerMenuButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 22,
      justifyContent: "center",
      marginLeft: "auto",
      width: 22,
    },
    headerMenuButtonHover: { backgroundColor: theme.colors.bg2 },
    // A thin hit target straddling the header cell's right edge; the line inside
    // it lights up on hover / while dragging. The `col-resize` cursor is added by
    // the handle itself (it is web-only and not in RN's `cursor` union).
    resizeHandle: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      position: "absolute",
      right: -4,
      top: 0,
      width: 9,
      zIndex: 3,
    },
    resizeHandleLine: {
      backgroundColor: "transparent",
      borderRadius: 1,
      height: "55%",
      width: 2,
    },
    resizeHandleLineActive: {
      backgroundColor: theme.colors.primary,
      height: "100%",
    },
    addColumnCell: {
      alignItems: "center",
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      height: metrics.rowHeight,
      justifyContent: "center",
      width: 44,
    },
    addColumnHover: { backgroundColor: theme.colors.bg2 },
    // Rows paint an opaque `surface` so they read as solid white bands over the
    // bounded body's muted grey empty zone (see `bodyContent`); on an unbounded
    // grid this is white-on-white and changes nothing.
    bodyRow: {
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      height: metrics.rowHeight,
    },
    cell: {
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      borderRightColor: theme.colors.border,
      borderRightWidth: 1,
      height: metrics.rowHeight,
      justifyContent: "center",
      paddingHorizontal: metrics.paddingHorizontal,
    },
    cellRight: { alignItems: "flex-end" },
    cellCenter: { alignItems: "center" },
    cellSelected: { backgroundColor: theme.colors.primarySoft },
    // Inset ring (like the table's focused row) so the active cell reads even
    // with its own hairline borders; native ignores boxShadow and uses the OS
    // focus affordance.
    cellActive: {
      boxShadow: `inset 0 0 0 2px ${theme.colors.primary}`,
    },
    cellText: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: metrics.fontSize,
    },
    cellMuted: { color: theme.colors.muted },
    cellNumeric: { fontVariant: ["tabular-nums"], textAlign: "right" },
    cellPlaceholder: { ...baseText, color: theme.colors.placeholder },
    pillRow: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "nowrap",
      gap: 4,
    },
    gutterCell: {
      alignItems: "center",
      backgroundColor: theme.colors.bg,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      borderRightColor: theme.colors.border2,
      borderRightWidth: 1,
      flexDirection: "row",
      gap: 4,
      height: metrics.rowHeight,
      justifyContent: "space-between",
      paddingHorizontal: 6,
      width: metrics.gutterWidth,
    },
    gutterHeaderCell: {
      backgroundColor: theme.colors.bg,
      borderRightColor: theme.colors.border2,
      borderRightWidth: 1,
      height: metrics.rowHeight,
      width: metrics.gutterWidth,
    },
    gutterNumber: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: metrics.fontSize - 2,
      fontVariant: ["tabular-nums"],
    },
    gutterExpand: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 18,
      justifyContent: "center",
      width: 18,
    },
    gutterExpandHover: { backgroundColor: theme.colors.bg2 },
    addRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      height: metrics.rowHeight,
      paddingHorizontal: metrics.paddingHorizontal,
    },
    addRowHover: { backgroundColor: theme.colors.soft },
    addRowText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: metrics.fontSize,
      fontWeight: "600",
    },
    loadingRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      height: metrics.rowHeight,
      justifyContent: "center",
    },
    loadingText: { ...baseText, color: theme.colors.muted, fontSize: 12 },
    // The drag-selection marquee: a primary-bordered box over the selected cells.
    marquee: {
      borderColor: theme.colors.primary,
      borderRadius: 3,
      borderWidth: 2,
      position: "absolute",
      zIndex: 5,
    },
    footer: {
      borderTopColor: theme.colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: 16,
      paddingHorizontal: metrics.paddingHorizontal,
      paddingVertical: 6,
    },
    footerText: { ...baseText, color: theme.colors.muted, fontSize: 12 },
    editorWrap: { justifyContent: "center", paddingHorizontal: 2 },
    cardStack: { gap: 10, width: "100%" },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius,
      borderWidth,
      gap: 8,
      padding: 12,
    },
    cardTitle: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: metrics.fontSize + 1,
      fontWeight: "600",
    },
    cardField: {
      alignItems: "center",
      flexDirection: "row",
      gap: 10,
      justifyContent: "space-between",
    },
    cardLabel: {
      ...baseText,
      color: theme.colors.muted,
      flexShrink: 0,
      fontSize: metrics.fontSize - 1,
    },
    cardValue: { alignItems: "flex-end", flexShrink: 1 },
  });
}

export type DataGridStyles = ReturnType<typeof createDataGridStyles>;
