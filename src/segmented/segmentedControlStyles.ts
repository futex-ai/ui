import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createSegmentedControlStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    cell: {
      alignItems: "center",
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 10,
      paddingVertical: 7,
    },
    cellSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    cellText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      fontWeight: "700",
      minWidth: 0,
    },
    cellTextSelected: { color: theme.colors.primaryDeep },
    contentSegment: {
      flexGrow: 0,
      flexShrink: 0,
    },
    disabled: { opacity: 0.6 },
    equalSegment: {
      flex: 1,
    },
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
      borderRadius: theme.radii.md,
      justifyContent: "center",
      minWidth: 0,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    pillActive: {
      backgroundColor: theme.colors.surface,
      boxShadow: "0 1px 2px rgba(20, 28, 22, 0.06)",
    },
    pillText: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19.5,
      minWidth: 0,
    },
    pillTextActive: { color: theme.colors.ink },
    required: { color: theme.colors.rose },
    row: { flexDirection: "row", gap: 8 },
    rowWrap: { flexWrap: "wrap" },
    track: {
      alignSelf: "flex-start",
      backgroundColor: theme.colors.soft,
      borderRadius: theme.radii.lg,
      flexDirection: "row",
      gap: 4,
      padding: 4,
    },
  });
}

export type SegmentedControlStyles = ReturnType<
  typeof createSegmentedControlStyles
>;
