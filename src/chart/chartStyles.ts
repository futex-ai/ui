/** Shared chart chrome styles, driven entirely by theme tokens. */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/** Mark specs fixed across every chart in the family. */
export const CHART_MARKS = {
  /** Bars never fill their slot — the leftover band is air, not ink. */
  maxBarThickness: 24,
  /** Rounded at the data end, square at the baseline. */
  barRadius: 4,
  lineWidth: 2,
  /** Markers are hit targets as well as marks, so they have a floor. */
  markerRadius: 4,
  /** Area fills are a wash, never a saturated block. */
  areaOpacity: 0.1,
  /** White doing the separating: between stacked segments and touching bars. */
  surfaceGap: 2,
  /** Ring in the surface colour so overlapping dots stay legible. */
  surfaceRing: 2,
  gridWidth: StyleSheet.hairlineWidth,
} as const;

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

/**
 * Opacity applied to the previous render while new data loads.
 *
 * Holding the frame at reduced opacity beats a skeleton: no layout jump, no
 * flash, and the reader keeps their place while the numbers refresh.
 */
export const CHART_LOADING_OPACITY = 0.45;
