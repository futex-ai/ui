/** Styles for the {@link EffectsRack} and its effect cards. */
import { StyleSheet } from "react-native";

import { focusRingStyleFor } from "../focusRing";
import type { SharedUiTheme } from "../theme";

export function createEffectsStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;

  return StyleSheet.create({
    root: {
      backgroundColor: theme.colors.bg,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      gap: 8,
      padding: 10,
    },
    header: { alignItems: "center", flexDirection: "row", gap: 8 },
    title: {
      ...baseText,
      color: theme.colors.muted,
      flex: 1,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    addButton: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderRadius: theme.radii.sm,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      overflow: "hidden",
    },
    cardHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      padding: 6,
    },
    cardName: { flex: 1 },
    nameText: { ...baseText, color: theme.colors.ink, fontWeight: "700" },
    // The nested parameter panel drops its own frame: it is already inside the
    // effect's card, and a border inside a border reads as a mistake.
    params: {
      backgroundColor: "transparent",
      borderWidth: 0,
      borderRadius: 0,
    },
    iconButton: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      height: 22,
      justifyContent: "center",
      width: 22,
    },
    iconButtonFocused: focusRingStyleFor({ color: theme.colors.primary }),
    empty: {
      ...baseText,
      color: theme.colors.placeholder,
      fontSize: 12,
      paddingVertical: 10,
      textAlign: "center",
    },
  });
}

export type EffectsStyles = ReturnType<typeof createEffectsStyles>;
