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
 * for higher emphasis; `outline` is a white (`surface`) chip with a 1px accent
 * border and the deep accent text, for a bordered status pill.
 */
export type BadgeVariant = "outline" | "soft" | "solid";

/**
 * The container fill and label color for one tone/variant combination, plus an
 * optional 1px border color (set only by the `outline` variant; `soft`/`solid`
 * leave it undefined so no border is drawn).
 */
export type BadgeColors = {
  backgroundColor: string;
  borderColor?: string;
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
    dotSize: number;
    fontSize: number;
    gap: number;
    lineHeight: number;
    paddingHorizontal: number;
    paddingVertical: number;
  }
> = {
  sm: {
    dotSize: 5,
    fontSize: 11,
    gap: 5,
    lineHeight: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  md: {
    dotSize: 6,
    fontSize: 12,
    gap: 6,
    lineHeight: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lg: {
    dotSize: 7,
    fontSize: 13,
    gap: 7,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
};

/**
 * Resolve a tone/variant pair to its container fill and label color from the
 * theme. Every pair meets the WCAG 2.1 — 1.4.3 (AA, 4.5:1) text-contrast
 * minimum on its own fill in all four shipped themes: the `soft` fills pair their
 * tinted background with the deep accent text (`primaryDeep` / `amberDeep` /
 * `roseDeep`, all ≥4.5:1 on their soft tint); the `solid` fills use those same
 * deep accents under `onSolid` text (also ≥4.5:1); and the `outline` fills put
 * the same deep accent text on the `surface` (≥4.5:1) with a 1px accent
 * border. The label text itself states the status, so color is never the only
 * channel (1.4.1).
 */
export function resolveBadgeColors(
  colors: SharedUiTheme["colors"],
  tone: BadgeTone,
  variant: BadgeVariant,
): BadgeColors {
  if (variant === "solid") {
    switch (tone) {
      case "neutral":
        return { backgroundColor: colors.ink2, color: colors.onSolid };
      case "primary":
        return { backgroundColor: colors.primaryDeep, color: colors.onSolid };
      case "warning":
        return { backgroundColor: colors.amberDeep, color: colors.onSolid };
      case "danger":
        return { backgroundColor: colors.roseDeep, color: colors.onSolid };
    }
  }
  if (variant === "outline") {
    // A white chip with the deep accent text (AA on `surface`) and a 1px accent
    // border. The border is a decorative boundary that reinforces the label —
    // `neutral` uses the light `border2` divider; the tones use their mid accent.
    switch (tone) {
      case "neutral":
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border2,
          color: colors.ink2,
        };
      case "primary":
        return {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          color: colors.primaryDeep,
        };
      case "warning":
        return {
          backgroundColor: colors.surface,
          borderColor: colors.amber,
          color: colors.amberDeep,
        };
      case "danger":
        return {
          backgroundColor: colors.surface,
          borderColor: colors.rose,
          color: colors.roseDeep,
        };
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
 * variant only set the fill, text, and (for `outline`) border color, which the
 * component layers on top via {@link resolveBadgeColors}. The `gap` separates an
 * optional leading `dot` from the label. The label uses the theme `fonts.sans`
 * at a semibold weight.
 */
export function createBadgeStyles(theme: SharedUiTheme, size: ControlSize) {
  const sizing = BADGE_SIZES[size];
  return StyleSheet.create({
    badge: {
      alignItems: "center",
      alignSelf: "flex-start",
      borderRadius: theme.radii.pill,
      flexDirection: "row",
      gap: sizing.gap,
      justifyContent: "center",
      paddingHorizontal: sizing.paddingHorizontal,
      paddingVertical: sizing.paddingVertical,
    },
    // A small round status dot. Decorative — the label states the status — so it
    // is hidden from assistive tech. `dot` is the box that holds the layout;
    // `dotFill` is the visible circle the component tints to the tone (or a
    // custom color). Splitting them lets a `PulseHalo` sit between the two, so
    // the ping paints behind the fill and swells past the pill.
    dot: {
      height: sizing.dotSize,
      width: sizing.dotSize,
    },
    dotFill: {
      borderRadius: sizing.dotSize / 2,
      height: "100%",
      width: "100%",
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
