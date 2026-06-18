import { StyleSheet } from "react-native";

import { focusRingStyleFor } from "../focusRing";
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
    // A hairline boundary on every cell so adjacent intensity buckets are
    // distinguishable for low-vision users even when their fills are close in
    // luminance (WCAG 2.1 — 1.4.1 Use of Color, A; 1.4.11 Non-text Contrast,
    // AA). A translucent ink overlay sits inside the cell so it reads as a
    // darkening edge on every bucket — it never changes the cell's box size and
    // works on any custom ramp.
    cell: {
      boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.16)",
    },
    // A contrast-independent focus ring: a width-bearing outline that contrasts
    // with the page, not the cell underneath, so it stays visible on the darkest
    // bucket (WCAG 2.1 — 2.4.7 Focus Visible, AA; reconciles the old 2px ink
    // border that fell to ~2:1 on dark cells). Offset out so it never overlaps
    // the cell's own hairline border.
    cellPressableFocused: focusRingStyleFor({
      color: theme.colors.primary,
      offset: 2,
      width: 2,
    }),
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
    // `ink2` (not `muted`) so the small 10-11px chrome labels clear 4.5:1 on the
    // page background (WCAG 2.1 — 1.4.3 Contrast Minimum, AA).
    legendLabel: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 11,
      lineHeight: 14,
    },
    legendSwatches: { alignItems: "center", flexDirection: "row", gap: 3 },
    monthHeader: { height: MONTH_LABEL_HEIGHT, position: "relative" },
    monthLabel: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 11,
      lineHeight: 14,
      position: "absolute",
      top: 0,
    },
    weekColumn: {},
    weekdayCell: { justifyContent: "center" },
    weekdayLabel: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 10,
      lineHeight: 12,
    },
  });
}

export type HeatmapStyles = ReturnType<typeof createHeatmapStyles>;
