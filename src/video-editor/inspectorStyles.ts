/**
 * Styles for the {@link Inspector}, its property rows, and the
 * {@link NumberScrubber} field they are built from.
 */
import { StyleSheet } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";

export function createInspectorStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;

  return StyleSheet.create({
    root: {
      backgroundColor: theme.colors.bg,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 13,
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingTop: 10,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    sectionTitle: {
      ...baseText,
      color: theme.colors.muted,
      flex: 1,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    rowLabel: { ...baseText, color: theme.colors.ink2, width: 76 },
    rowControl: { flex: 1 },
    rowActions: { alignItems: "center", flexDirection: "row", gap: 2 },

    field: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      paddingHorizontal: 6,
    },
    fieldInput: { flex: 1, padding: 0 },
    fieldUnit: { ...baseText, color: theme.colors.muted, paddingLeft: 4 },

    selectTrigger: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      gap: 4,
      justifyContent: "space-between",
      paddingHorizontal: 6,
    },
    selectText: { ...baseText, color: theme.colors.ink, flexShrink: 1 },

    swatchRow: { flexDirection: "row", gap: 4 },
    swatch: {
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.sm,
      borderWidth: 1,
      height: 20,
      width: 20,
    },
    swatchSelected: { borderColor: theme.colors.ink, borderWidth: 2 },

    iconButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 22,
      justifyContent: "center",
      width: 22,
    },
    iconButtonOn: { backgroundColor: theme.colors.primarySoft },

    empty: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: 12,
      padding: 14,
      textAlign: "center",
    },
  });
}

export type InspectorStyles = ReturnType<typeof createInspectorStyles>;
