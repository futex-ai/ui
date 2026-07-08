import { StyleSheet } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * The semantic status colors a badge can carry. `neutral` (the default) is a
 * quiet grey chip; `primary` is the brand/positive accent (the green "Active"
 * status in the default theme); `warning` is amber; `danger` is rose. There is
 * deliberately no `success` or `info` tone: the shared theme exposes no green
 * or blue accent distinct from the brand `primary`, so a status badge maps onto
 * the existing accent families rather than inventing palette tokens.
 */
export type BadgeTone = "neutral" | "primary" | "warning" | "danger";

/**
 * The fill style. `soft` (the default) is a tinted fill with deep accent text —
 * the quiet status-pill look; `solid` is a filled accent chip with white text
 * for higher emphasis.
 */
export type BadgeVariant = "soft" | "solid";

/** The container fill and the label color for one tone/variant combination. */
export type BadgeColors = {
  backgroundColor: string;
  color: string;
};

/**
 * Per-size geometry. A badge is non-interactive, but it shares the library's
 * `ControlSize` vocabulary (like the spinner) so a badge reads at the same
 * density as the control it sits beside. `md` is the default. `lineHeight` is
 * absolute pixels (React Native has no unitless multiplier); the pill height is
 * `lineHeight + 2 * paddingVertical`.
 */
const BADGE_SIZES: Record<
  ControlSize,
  {
    fontSize: number;
    lineHeight: number;
    paddingHorizontal: number;
    paddingVertical: number;
  }
> = {
  sm: {
    fontSize: 11,
    lineHeight: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  md: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lg: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
};

/**
 * Resolve a tone/variant pair to its container fill and label color from the
 * theme. Every pair meets the WCAG 2.1 — 1.4.3 (AA, 4.5:1) text-contrast
 * minimum on its own fill in both shipped themes: the `soft` fills pair their
 * tinted background with the deep accent text (`primaryDeep` / `amberDeep` /
 * `roseDeep`, all ≥4.5:1 on their soft tint), and the `solid` fills use those
 * same deep accents under white text (also ≥4.5:1). The label text itself
 * states the status, so color is never the only channel (1.4.1).
 */
export function resolveBadgeColors(
  colors: SharedUiTheme["colors"],
  tone: BadgeTone,
  variant: BadgeVariant,
): BadgeColors {
  if (variant === "solid") {
    switch (tone) {
      case "neutral":
        return { backgroundColor: colors.ink2, color: "#fff" };
      case "primary":
        return { backgroundColor: colors.primaryDeep, color: "#fff" };
      case "warning":
        return { backgroundColor: colors.amberDeep, color: "#fff" };
      case "danger":
        return { backgroundColor: colors.roseDeep, color: "#fff" };
    }
  }
  switch (tone) {
    case "neutral":
      return { backgroundColor: colors.bg2, color: colors.ink2 };
    case "primary":
      return { backgroundColor: colors.primarySoft, color: colors.primaryDeep };
    case "warning":
      return { backgroundColor: colors.amberSoft, color: colors.amberDeep };
    case "danger":
      return { backgroundColor: colors.roseSoft, color: colors.roseDeep };
  }
}

/**
 * Build the size-driven container and label styles. The container is a
 * content-hugging (`alignSelf: "flex-start"`) fully-rounded pill; the tone and
 * variant only set the fill and text color, which the component layers on top
 * via {@link resolveBadgeColors}. The label uses the theme `fonts.sans` at a
 * semibold weight.
 */
export function createBadgeStyles(theme: SharedUiTheme, size: ControlSize) {
  const sizing = BADGE_SIZES[size];
  return StyleSheet.create({
    badge: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: theme.radii.pill,
      flexDirection: "row",
      justifyContent: "center",
      paddingHorizontal: sizing.paddingHorizontal,
      paddingVertical: sizing.paddingVertical,
    },
    label: {
      fontFamily: theme.fonts.sans,
      fontSize: sizing.fontSize,
      fontWeight: "600",
      lineHeight: sizing.lineHeight,
    },
  });
}

export type BadgeStyles = ReturnType<typeof createBadgeStyles>;
