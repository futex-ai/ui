/** Shared chrome for the date-field triggers (single and range). */
import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

import { DATE_FIELD_LAYERS } from "./dateFieldLayers";

export function createDateFieldStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    anchor: { position: "relative" },
    field: { gap: 6 },
    fieldError: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
    fieldLabel: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    // Lifts the open field root (and the range row) above following/later-DOM
    // content so the calendar is not trapped by a sibling. See `dateFieldLayers`.
    fieldOpen: { zIndex: DATE_FIELD_LAYERS.open },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 16.5,
    },
    required: { color: theme.colors.rose },
    trigger: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      height: 40,
      justifyContent: "space-between",
      paddingHorizontal: 12,
    },
    triggerActive: { borderColor: theme.colors.primary },
    triggerFlex: { flex: 1 },
    triggerIcon: { paddingLeft: 8 },
    // `minWidth: 0` lets the web <input> shrink below its intrinsic size so the
    // calendar icon stays inside the box in the narrow range endpoints.
    triggerInput: {
      ...baseText,
      color: theme.colors.ink,
      flex: 1,
      fontSize: 14,
      height: 38,
      minWidth: 0,
    },
    triggerInvalid: { borderColor: theme.colors.rose },
    triggerPlaceholder: {
      ...baseText,
      color: theme.colors.faint,
      flexShrink: 1,
      fontSize: 14,
    },
    triggerValue: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontSize: 14,
    },
  });
}

export type DateFieldStyles = ReturnType<typeof createDateFieldStyles>;
