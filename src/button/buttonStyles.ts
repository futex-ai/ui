import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the button: track height, horizontal padding, the gap
 * between an optional leading icon and the label, the label type scale, and the
 * matching icon diameter. `md` matches the accounting button this was adapted
 * from (38px tall); `sm` is the compact toolbar density and `lg` the roomier
 * call-to-action density.
 */
const BUTTON_SIZES: Record<
  ControlSize,
  {
    fontSize: number;
    gap: number;
    height: number;
    iconSize: number;
    lineHeight: number;
    paddingHorizontal: number;
  }
> = {
  sm: {
    fontSize: 12,
    gap: 6,
    height: 30,
    iconSize: 14,
    lineHeight: 15,
    paddingHorizontal: 12,
  },
  md: {
    fontSize: 13,
    gap: 6,
    height: 38,
    iconSize: 16,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  lg: {
    fontSize: 15,
    gap: 8,
    height: 46,
    iconSize: 18,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
};

/** Diameter of the leading icon for a given button size, in px. */
export function buttonIconSize(size: ControlSize) {
  return BUTTON_SIZES[size].iconSize;
}

/**
 * Build the button's themed styles for a given size. The base `button` carries
 * the secondary (default) look — surface fill, `border2` outline, `radii.md` —
 * and the tone styles layer over it. The label colour is applied inline by the
 * component because it depends on the tone.
 */
export function createButtonStyles(theme: SharedUiTheme, size: ControlSize) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const sizing = BUTTON_SIZES[size];
  return StyleSheet.create({
    block: { alignSelf: "stretch", width: "100%" },
    button: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      gap: sizing.gap,
      height: sizing.height,
      justifyContent: "center",
      paddingHorizontal: sizing.paddingHorizontal,
    },
    danger: { borderColor: theme.colors.roseSoft },
    // Danger is the only tone whose label is a saturated colour (`rose`) on a
    // light fill, so washing the fill like the other tones would push the label
    // below WCAG AA (rose on `roseSoft` is ~4.4:1). Instead its hover sharpens
    // the warning edge from `roseSoft` to full `rose` and keeps the surface
    // fill, so the label's contrast stays at its (AA-passing) resting ratio.
    dangerHover: { borderColor: theme.colors.rose },
    disabled: { opacity: 0.55 },
    // A ring sitting just outside the button, so focus stays visible on every
    // tone — including `primary`, whose border already matches the theme primary
    // (a border-colour ring would be invisible there). The surface-coloured
    // inner band separates the ring from the button edge.
    focusRing: {
      boxShadow: `0 0 0 2px ${theme.colors.surface}, 0 0 0 4px ${theme.colors.primary}`,
    },
    ghost: { backgroundColor: "transparent", borderColor: "transparent" },
    // The accent's pale tint surfaces on hover (ghost's label is already
    // `primaryDeep`), keeping it visually distinct from the neutral secondary
    // hover while staying borderless.
    ghostHover: { backgroundColor: theme.colors.primarySoft },
    label: {
      ...baseText,
      fontSize: sizing.fontSize,
      fontWeight: "700",
      lineHeight: sizing.lineHeight,
    },
    primary: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    // A filled tone can't take a light wash, so hover deepens the fill (and its
    // matching border) to `primaryDeep`, which also raises the white label's
    // contrast rather than weakening it.
    primaryHover: {
      backgroundColor: theme.colors.primaryDeep,
      borderColor: theme.colors.primaryDeep,
    },
    // The neutral hover, reused verbatim from the calendar cells: swap the white
    // surface for `soft`, holding the `border2` edge.
    secondaryHover: { backgroundColor: theme.colors.soft },
  });
}

export type ButtonStyles = ReturnType<typeof createButtonStyles>;
