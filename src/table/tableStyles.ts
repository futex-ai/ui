import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the table: the horizontal cell padding, the header and
 * body row vertical padding, and the header / cell type scale. `md` matches the
 * accounting data table this was adapted from (12px cell padding, 13px cells);
 * `sm` is the compact density for dense rows and `lg` the roomier, touch-first
 * density, in lockstep with the other controls' {@link ControlSize} scale.
 */
const TABLE_SIZES: Record<
  ControlSize,
  {
    cellFontSize: number;
    cellLineHeight: number;
    headerFontSize: number;
    headerPaddingVertical: number;
    paddingHorizontal: number;
    rowPaddingVertical: number;
  }
> = {
  sm: {
    cellFontSize: 12,
    cellLineHeight: 16,
    headerFontSize: 10,
    headerPaddingVertical: 7,
    paddingHorizontal: 10,
    rowPaddingVertical: 8,
  },
  md: {
    cellFontSize: 13,
    cellLineHeight: 16,
    headerFontSize: 10,
    headerPaddingVertical: 10,
    paddingHorizontal: 12,
    rowPaddingVertical: 12,
  },
  lg: {
    cellFontSize: 14,
    cellLineHeight: 18,
    headerFontSize: 11,
    headerPaddingVertical: 12,
    paddingHorizontal: 14,
    rowPaddingVertical: 14,
  },
};

/**
 * Build the table's themed styles for a given size. Header and body rows are
 * flex rows (React Native has no `<table>`); the shared column widths keep their
 * cells aligned. The pressable-row treatments (`rowHover`, `rowPressed`,
 * `rowFocused`, `rowDisabled`) layer over the base `row` and are only applied
 * when the table is given an `onRowPress` handler.
 */
export function createTableStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const sizing = TABLE_SIZES[size];
  return StyleSheet.create({
    cellCenter: { alignItems: "center" },
    cellRight: { alignItems: "flex-end" },
    headRow: {
      backgroundColor: theme.colors.bg,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      paddingHorizontal: sizing.paddingHorizontal,
      paddingVertical: sizing.headerPaddingVertical,
    },
    row: {
      alignItems: "center",
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      paddingHorizontal: sizing.paddingHorizontal,
      paddingVertical: sizing.rowPaddingVertical,
    },
    rowDisabled: { opacity: 0.55 },
    // An inset ring keeps focus visible on a row that only has a bottom border
    // (a border-colour ring would not read), mirroring the button's box-shadow
    // ring approach. Pairs with `hideWebOutlineView` to drop the browser outline.
    rowFocused: { boxShadow: `inset 0 0 0 2px ${theme.colors.primary}` },
    rowHover: { backgroundColor: theme.colors.soft },
    rowPressable: { cursor: "pointer" },
    rowPressed: { backgroundColor: theme.colors.bg2 },
    rowLast: { borderBottomWidth: 0 },
    table: { width: "100%" },
    td: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: sizing.cellFontSize,
      lineHeight: sizing.cellLineHeight,
    },
    tdBold: { fontWeight: "700" },
    tdCenter: { textAlign: "center" },
    tdLeft: { textAlign: "left" },
    tdMuted: { color: theme.colors.muted },
    tdNumeric: {
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      textAlign: "right",
    },
    tdRight: { textAlign: "right" },
    th: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: sizing.headerFontSize,
      fontWeight: "700",
      letterSpacing: 0.8,
      lineHeight: sizing.headerFontSize + 2,
      textTransform: "uppercase",
    },
    thCenter: { textAlign: "center" },
    thRight: { textAlign: "right" },
  });
}

export type TableStyles = ReturnType<typeof createTableStyles>;
