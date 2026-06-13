import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createRadioCardStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    radio: {
      alignItems: "flex-start",
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      minWidth: 0,
      padding: 14,
    },
    radioBody: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    radioChecked: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    radioDisabled: { opacity: 0.6 },
    radioDot: {
      borderColor: theme.colors.border2,
      borderRadius: 8,
      borderWidth: 2,
      height: 16,
      marginTop: 2,
      width: 16,
    },
    radioDotChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
      boxShadow: "inset 0 0 0 3px #fff",
    },
    radioDotCol: { alignItems: "flex-start", width: 22 },
    radioText: { flex: 1, minWidth: 0 },
    radioTitle: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 19.5,
    },
  });
}

export type RadioCardStyles = ReturnType<typeof createRadioCardStyles>;
