import { StyleSheet } from "react-native";

import type { SharedUiTheme } from "../theme";

export function createRadioCardStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    group: {
      gap: 10,
      minWidth: 0,
    },
    radio: {
      alignItems: "flex-start",
      // ≥3:1 control boundary so the resting card edge is perceivable
      // (WCAG 2.1 — 1.4.11 Non-text Contrast, AA).
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: 12,
      minWidth: 0,
      padding: 14,
    },
    radioBody: {
      ...baseText,
      // `ink2` (not `muted`) so the ≤12px body still clears 4.5:1 on the tinted
      // `primarySoft` surface of a checked card (WCAG 2.1 — 1.4.3 Contrast, AA;
      // `muted` is only ~4.27:1 there).
      color: theme.colors.ink2,
      fontSize: 12,
      lineHeight: 18,
    },
    radioChecked: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    radioCheckGlyph: {
      ...baseText,
      color: theme.colors.surface,
      fontSize: 10,
      fontWeight: "900",
      lineHeight: 12,
      textAlign: "center",
    },
    radioDisabled: { opacity: 0.6 },
    radioDot: {
      alignItems: "center",
      // ≥3:1 boundary on the empty ring so the unchecked state reads as a
      // control affordance (WCAG 2.1 — 1.4.11, AA).
      borderColor: theme.colors.controlBorder,
      borderRadius: 8,
      borderWidth: 2,
      height: 16,
      justifyContent: "center",
      marginTop: 2,
      width: 16,
    },
    radioDotChecked: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
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
