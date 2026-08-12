/**
 * Styles for {@link MediaBin} and {@link MediaBinItem}, kept beside them rather
 * than in the family sheet: the bin is the one panel with real card geometry,
 * and folding it in would make the shared sheet the biggest file in the family.
 */
import { StyleSheet } from "react-native";

import { focusRingStyleFor } from "../focusRing";
import type { SharedUiTheme } from "../theme";

export function createMediaBinStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const card = {
    borderRadius: theme.radii.md,
    borderWidth: 1,
    overflow: "hidden",
  } as const;

  return StyleSheet.create({
    root: {
      backgroundColor: theme.colors.bg,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    header: { gap: 8, padding: 10 },
    headerRow: { alignItems: "center", flexDirection: "row", gap: 8 },
    title: {
      ...baseText,
      color: theme.colors.muted,
      flex: 1,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    viewToggle: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 26,
      justifyContent: "center",
      width: 26,
    },
    viewToggleOn: { backgroundColor: theme.colors.primarySoft },
    viewToggleFocused: focusRingStyleFor({ color: theme.colors.primary }),
    body: { gap: 10, paddingBottom: 10, paddingHorizontal: 10 },
    groupTitle: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 11,
      fontWeight: "700",
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    list: { gap: 4 },

    cardGrid: { ...card, backgroundColor: theme.colors.surface, width: 104 },
    cardList: {
      ...card,
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      flexDirection: "row",
      gap: 8,
      padding: 4,
    },
    cardSelected: { borderWidth: 2 },
    cardHovered: { backgroundColor: theme.colors.soft },
    cardFocused: focusRingStyleFor({ color: theme.colors.primary }),

    thumbGrid: { height: 58, position: "relative", width: "100%" },
    thumbList: {
      borderRadius: theme.radii.sm,
      height: 30,
      overflow: "hidden",
      position: "relative",
      width: 44,
    },
    thumbImage: { height: "100%", width: "100%" },
    thumbFallback: {
      alignItems: "center",
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    // The duration pill is white on a fixed dark scrim over the frame, so it
    // stays legible whatever the thumbnail happens to be showing.
    durationBadge: {
      backgroundColor: "rgba(14, 16, 15, 0.74)",
      borderRadius: theme.radii.sm,
      bottom: 3,
      paddingHorizontal: 4,
      paddingVertical: 1,
      position: "absolute",
      right: 3,
    },
    durationText: {
      ...baseText,
      color: "#ffffff",
      fontFamily: theme.fonts.mono,
      fontSize: 10,
    },

    meta: { flex: 1, gap: 1, padding: 5 },
    metaRow: { alignItems: "center", flexDirection: "row", gap: 5 },
    name: {
      ...baseText,
      color: theme.colors.ink,
      flexShrink: 1,
      fontWeight: "600",
    },
    secondary: { ...baseText, color: theme.colors.ink2, fontSize: 10 },
    empty: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: 12,
      padding: 12,
      textAlign: "center",
    },
  });
}

export type MediaBinStyles = ReturnType<typeof createMediaBinStyles>;
