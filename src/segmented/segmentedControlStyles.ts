import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createSegmentedControlStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    cell: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 36,
      minWidth: 0,
      paddingHorizontal: 8,
    },
    cellSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    cellText: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
      minWidth: 0,
    },
    cellTextSelected: { color: theme.colors.primaryDeep },
    contentSegment: {
      flex: 0,
      paddingHorizontal: 10,
    },
    disabled: { opacity: 0.6 },
    error: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16.5,
    },
    field: { gap: 6 },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    label: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    pill: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      flex: 1,
      height: 36,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 12,
    },
    pillActive: {
      backgroundColor: theme.colors.surface,
      boxShadow: "0 1px 4px rgba(20, 28, 22, 0.08)",
    },
    pillText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
      minWidth: 0,
    },
    pillTextActive: { color: theme.colors.ink },
    required: { color: theme.colors.rose },
    row: { flexDirection: "row", gap: 8 },
    rowWrap: { flexWrap: "wrap" },
    track: {
      backgroundColor: theme.colors.soft,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      padding: 3,
    },
  });
}

export type SegmentedControlStyles = ReturnType<
  typeof createSegmentedControlStyles
>;
