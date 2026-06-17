import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/**
 * Fixed height (px) reserved for the month-label row above the grid. The
 * weekday gutter reuses it as a top spacer so its rows line up with the grid
 * rows that sit below the labels.
 */
export const MONTH_LABEL_HEIGHT = 16;

/**
 * Static, theme-driven styles for the heatmap. Geometry that depends on the
 * `cellSize` / `cellGap` props (cell boxes, column and row gaps, month-label
 * offsets) is applied inline by the component; this sheet owns the type scale,
 * the muted label colors, and the focus treatment for pressable cells.
 */
export function createHeatmapStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    cellPressableFocused: {
      borderColor: theme.colors.ink,
      borderWidth: 2,
    },
    container: { alignItems: "flex-start" },
    body: { flexDirection: "row", gap: 8 },
    grid: { flexDirection: "row" },
    gutter: { alignItems: "flex-end" },
    legend: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      marginTop: 10,
    },
    legendLabel: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 14,
    },
    legendSwatches: { alignItems: "center", flexDirection: "row", gap: 3 },
    monthHeader: { height: MONTH_LABEL_HEIGHT, position: "relative" },
    monthLabel: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 14,
      position: "absolute",
      top: 0,
    },
    weekColumn: {},
    weekdayCell: { justifyContent: "center" },
    weekdayLabel: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 10,
      lineHeight: 12,
    },
  });
}

export type HeatmapStyles = ReturnType<typeof createHeatmapStyles>;
