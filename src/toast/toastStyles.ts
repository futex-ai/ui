import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/**
 * Theme-driven styles for the toast surface. The viewport region's position,
 * inset, stack direction, and alignment are applied inline by the viewport
 * component (they depend on placement, not the theme); everything visual —
 * the card, the tone-tinted text, the action row, and the close control — lives
 * here so it tracks `SharedUiThemeProvider`.
 *
 * The tone accent (a left border strip and the leading icon colour) is applied
 * inline by {@link Toast} because it depends on the tone, mirroring how
 * {@link Button} applies its tone-driven label colour.
 */
export function createToastStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 10,
    },
    closeButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 28,
      justifyContent: "center",
      marginRight: -4,
      marginTop: -2,
      width: 28,
    },
    closeButtonHover: { backgroundColor: theme.colors.soft },
    content: { flex: 1, gap: 2, minWidth: 0 },
    description: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 13,
      lineHeight: 19,
    },
    iconWrap: { paddingTop: 1 },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
    // The resting card: surface fill, neutral hairline border, soft drop
    // shadow, clipped corners. The left accent strip is layered in inline.
    toast: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderLeftWidth: 3,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      boxShadow: "0 12px 32px rgba(20, 28, 22, 0.18)",
      flexDirection: "row",
      gap: 12,
      maxWidth: 380,
      overflow: "hidden",
      padding: 14,
    },
  });
}

export type ToastStyles = ReturnType<typeof createToastStyles>;
