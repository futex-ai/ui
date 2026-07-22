/** Shared styles for the calendar grid and the web popover frame. */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createWebCalendarStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    cell: {
      alignItems: "center",
      height: 34,
      justifyContent: "center",
      width: 34,
    },
    cellHover: {
      backgroundColor: theme.colors.soft,
      borderRadius: theme.radii.md,
    },
    cellMuted: { color: theme.colors.faint },
    cellRadius: { borderRadius: theme.radii.md },
    cellSelected: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.md,
    },
    cellText: { ...baseText, color: theme.colors.ink, fontSize: 13 },
    cellTextSelected: { color: theme.colors.surface, fontWeight: "700" },
    cellToday: {
      borderColor: theme.colors.primary,
      borderRadius: theme.radii.md,
      borderWidth: 1,
    },
    dow: {
      // 10px weekday headers need a darker token to clear 4.5:1 (WCAG 2.1 1.4.3).
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 10,
      fontWeight: "700",
      textAlign: "center",
      width: 34,
    },
    dowRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    foot: {
      // 11px footnote text uses the darker `ink2` to clear 4.5:1 (WCAG 2.1 1.4.3).
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 11,
      marginTop: 8,
      textAlign: "center",
    },
    head: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    nav: {
      // The chevron is an interactive control, so its resting edge uses the
      // `controlBorder` token (soft translucent-ink edge), not decorative `border`.
      alignItems: "center",
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      height: 26,
      justifyContent: "center",
      width: 26,
    },
    // DropdownPortal supplies the first 6px of inset plus the surface chrome.
    portalBody: { padding: 6 },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 14,
      fontWeight: "700",
    },
    titleButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      justifyContent: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    titleButtonHover: { backgroundColor: theme.colors.soft },
    week: { flexDirection: "row", justifyContent: "space-between" },
    yearCell: {
      alignItems: "center",
      borderRadius: theme.radii.md,
      height: 38,
      justifyContent: "center",
      width: 72,
    },
    yearCellHover: { backgroundColor: theme.colors.soft },
    yearCellSelected: { backgroundColor: theme.colors.primary },
    // Fixed to the day grid's intrinsic width (7 × 34) so the three 72px cells
    // are evenly spaced on both platforms — not only inside the web popover whose
    // 280px frame happens to give `space-between` room. The native sheet sizes
    // the calendar to its widest child, so without this the cells would butt
    // together when the day grid is unmounted.
    yearGrid: { marginTop: 4, width: 238 },
    yearRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    yearText: { ...baseText, color: theme.colors.ink, fontSize: 13 },
    yearTextSelected: { color: theme.colors.surface, fontWeight: "700" },
  });
}

export type WebCalendarStyles = ReturnType<typeof createWebCalendarStyles>;
