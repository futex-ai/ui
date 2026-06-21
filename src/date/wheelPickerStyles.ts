/** Shared styles for the spinning day/month/year wheel and its bottom sheets. */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/** Height of one wheel row; selection band and snap interval are sized off it. */
export const WHEEL_ITEM_HEIGHT = 36;
/** Visible rows per column (odd so one row sits dead-center). */
export const WHEEL_VISIBLE_ROWS = 5;
/** Total height of a column: the centered row plus the rows above and below. */
export const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ROWS;
/** Rows of padding above/below the list so the first/last item can center. */
export const WHEEL_PAD_ROWS = (WHEEL_VISIBLE_ROWS - 1) / 2;

export function createWheelPickerStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    // Caps and centers the wheel so it doesn't stretch across a wide sheet.
    frame: { alignSelf: "center", maxWidth: 320, width: "100%" },
    // The three columns sit in a row; the selection band spans them behind.
    wheel: {
      flexDirection: "row",
      height: WHEEL_HEIGHT,
      position: "relative",
    },
    column: { flex: 1 },
    // Top/bottom padding lets the first and last item scroll to the center row.
    columnContent: { paddingVertical: WHEEL_ITEM_HEIGHT * WHEEL_PAD_ROWS },
    item: {
      alignItems: "center",
      height: WHEEL_ITEM_HEIGHT,
      justifyContent: "center",
    },
    itemText: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 19,
      fontWeight: "500",
    },
    // Distance-from-center tiers fade the rows toward the edges (the iOS look),
    // standing in for a true scroll-tracked gradient without a gradient lib.
    itemTextNear: { color: theme.colors.ink2, opacity: 0.85 },
    itemTextFar: { color: theme.colors.muted, opacity: 0.5 },
    itemTextEdge: { color: theme.colors.faint, opacity: 0.28 },
    itemTextSelected: { color: theme.colors.primaryDeep, fontWeight: "700" },
    itemTextDisabled: { color: theme.colors.faint, opacity: 0.28 },
    // The centered selection pill, painted behind the columns (rendered first so
    // later siblings paint on top). Non-interactive so taps reach the rows.
    selectionBand: {
      backgroundColor: theme.colors.soft,
      borderRadius: theme.radii.md,
      height: WHEEL_ITEM_HEIGHT,
      left: 0,
      position: "absolute",
      right: 0,
      top: WHEEL_ITEM_HEIGHT * WHEEL_PAD_ROWS,
    },
    // Web footer actions (rendered inside WebModalFrame's footer slot). The
    // native sheet reuses the calendar sheet's Cancel/Done bar instead.
    footerButton: {
      alignItems: "center",
      borderRadius: theme.radii.md,
      justifyContent: "center",
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    // The Cancel button is an interactive control; give its edge the
    // `controlBorder` token (soft translucent-ink edge), not decorative `border2`.
    footerCancel: { borderColor: theme.colors.controlBorder, borderWidth: 1 },
    footerCancelText: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 14,
      fontWeight: "600",
    },
    footerDone: { backgroundColor: theme.colors.primaryDeep },
    footerDoneText: {
      ...baseText,
      color: theme.colors.surface,
      fontSize: 14,
      fontWeight: "700",
    },
  });
}

export type WheelPickerStyles = ReturnType<typeof createWheelPickerStyles>;
