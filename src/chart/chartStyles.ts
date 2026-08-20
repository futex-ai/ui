/** Shared chart chrome styles, driven entirely by theme tokens. */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

import { CHART_MARKS } from "./chartMarks";

export { CHART_LOADING_OPACITY, CHART_MARKS } from "./chartMarks";

export type ChartStyles = ReturnType<typeof createChartStyles>;

export function createChartStyles(theme: SharedUiTheme) {
  return StyleSheet.create({
    root: {
      width: "100%",
    },
    header: {
      gap: 2,
      paddingBottom: 8,
    },
    title: {
      color: theme.colors.ink,
      fontFamily: theme.fonts.sans,
      fontSize: 14,
      fontWeight: "600",
    },
    caption: {
      color: theme.colors.muted,
      fontFamily: theme.fonts.sans,
      fontSize: 12,
    },
    plotArea: {
      position: "relative",
      width: "100%",
    },
    /**
     * The marks layer. Held at zero opacity until the container reports its
     * width, so the first paint never shows marks at the wrong scale and then
     * jumps — the chrome is already at its final height underneath.
     */
    marks: {
      left: 0,
      position: "absolute",
      top: 0,
    },
    axisLabel: {
      color: theme.charts.label,
      fontFamily: theme.fonts.sans,
      fontSize: 11,
      // Ticks are a column of numbers that must align vertically.
      fontVariant: ["tabular-nums"],
    },
    xAxisLabel: {
      textAlign: "center",
    },
    yAxisLabel: {
      textAlign: "right",
    },
    empty: {
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: {
      color: theme.colors.placeholder,
      fontFamily: theme.fonts.sans,
      fontSize: 13,
    },
    footer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      justifyContent: "space-between",
      paddingTop: 8,
    },
    toggle: {
      borderRadius: theme.radii.sm,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    toggleText: {
      color: theme.colors.muted,
      fontFamily: theme.fonts.sans,
      fontSize: 12,
    },
    toggleFocused: {
      backgroundColor: theme.colors.soft,
    },
    tableWrap: {
      paddingTop: 8,
    },
  });
}
