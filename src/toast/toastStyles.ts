import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

/**
 * Theme-driven styles for the toast surface. The viewport region's position,
 * inset, stack direction, and alignment are applied inline by the viewport
 * component (they depend on placement, not the theme); everything visual —
 * the card, the solid fill, custom leading icons, the action row, and the
 * close control — lives here so it tracks `SharedUiThemeProvider`.
 *
 * The tone accent (the leading icon colour) is applied inline by {@link Toast}
 * because it depends on the tone, mirroring how {@link Button} applies its
 * tone-driven label colour.
 */
export function createToastStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  // The solid variant's hover wash brightens its fill. On the light themes that
  // fill is a deep accent, so a white wash lifts it; on the dark themes the
  // solid fills invert to light accents, where a white wash is invisible — so
  // it flips to a black wash that darkens instead.
  const solidHoverWash =
    theme.scheme === "dark"
      ? "rgba(0, 0, 0, 0.10)"
      : "rgba(255, 255, 255, 0.14)";
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
    cardToast: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    description: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 13,
      lineHeight: 19,
    },
    iconWrap: { paddingTop: 1 },
    solidActionButton: {
      borderRadius: theme.radii.sm,
      marginHorizontal: -6,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    solidActionButtonHover: { backgroundColor: solidHoverWash },
    solidActionText: {
      ...baseText,
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
    },
    solidActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 0,
    },
    solidCloseButton: {
      marginLeft: 2,
      marginRight: -8,
      marginTop: 0,
    },
    solidCloseButtonHover: { backgroundColor: solidHoverWash },
    solidContent: {
      flexGrow: 0,
      flexShrink: 1,
      gap: 2,
      minWidth: 0,
    },
    solidDescription: {
      lineHeight: 20,
      textAlign: "center",
    },
    solidIconWrap: {
      alignItems: "center",
      justifyContent: "center",
    },
    solidTitle: {
      fontSize: 14,
      fontWeight: "800",
      lineHeight: 20,
      textAlign: "center",
    },
    solidToast: {
      alignItems: "center",
      borderRadius: theme.radii.xl,
      boxShadow: "0 18px 44px rgba(20, 28, 22, 0.24)",
      gap: 10,
      maxWidth: 560,
      paddingHorizontal: 22,
      paddingVertical: 14,
    },
    title: {
      ...baseText,
      color: theme.colors.ink,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
    // Shared toast shell. Visual variants layer fill, border, and text styles.
    toast: {
      borderRadius: theme.radii.lg,
      // A soft, low-contrast elevation (a tight contact layer plus a diffuse
      // ambient one) rather than one heavy drop shadow, so the card reads as
      // gently lifted off the surface instead of harshly cut out.
      boxShadow:
        "0 1px 2px rgba(20, 28, 22, 0.04), 0 8px 24px rgba(20, 28, 22, 0.09)",
      flexDirection: "row",
      gap: 12,
      maxWidth: 380,
      overflow: "hidden",
      padding: 14,
    },
  });
}

export type ToastStyles = ReturnType<typeof createToastStyles>;
