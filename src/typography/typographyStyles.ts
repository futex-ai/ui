import { StyleSheet, TextStyle } from "react-native";

import type { SharedUiTheme } from "../theme";

/**
 * The text roles this family renders. `h1`–`h5` are the heading scale; the rest
 * are non-heading roles: `body` (default running text), `label` (form-field and
 * control labels), `caption` (small secondary text / metadata), and `overline`
 * (an uppercased section eyebrow). There is no `h6`: five heading levels cover
 * the documents the apps build, and a sixth would only invite deeper,
 * harder-to-scan outlines.
 */
export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "body"
  | "label"
  | "caption"
  | "overline";

/**
 * Semantic text-color tokens. Every token resolves to a theme color that meets
 * the WCAG 2.1 — 1.4.3 (AA, 4.5:1) text-contrast minimum on the surface in both
 * shipped themes, so picking a token can never fall below AA. The decorative
 * `faint` theme color (2.26:1 on white) is deliberately not exposed here. Use
 * `inverse` only on a dark fill, where the consumer owns the background and its
 * contrast.
 */
export type TypographyColor =
  | "default"
  | "secondary"
  | "muted"
  | "placeholder"
  | "primary"
  | "danger"
  | "inverse";

type TypographyMetrics = Required<
  Pick<TextStyle, "fontSize" | "fontWeight" | "lineHeight" | "letterSpacing">
> & {
  /** The variant's default semantic color token. */
  color: TypographyColor;
  /** Render the text uppercased (the overline eyebrow). */
  uppercase: boolean;
};

/**
 * Per-variant type scale. The shared theme owns no type scale today, so — like
 * the spinner's diameter table and the avatar's `size * 0.38` font size — this
 * family owns its numeric scale locally. `lineHeight` is absolute pixels (React
 * Native has no unitless multiplier), `fontWeight` is a string (RN rejects
 * numeric weights), and `letterSpacing` is in pixels (negative tightens). The
 * leading on every step is ≈1.2× for headings and ≈1.4× for the text roles for
 * comfortable reading; large headings tighten their tracking, and the overline
 * widens it.
 */
const TYPOGRAPHY_SCALE: Record<TypographyVariant, TypographyMetrics> = {
  h1: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    letterSpacing: -0.3,
    color: "default",
    uppercase: false,
  },
  h2: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    letterSpacing: -0.2,
    color: "default",
    uppercase: false,
  },
  h3: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    letterSpacing: -0.1,
    color: "default",
    uppercase: false,
  },
  h4: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 23,
    letterSpacing: 0,
    color: "default",
    uppercase: false,
  },
  h5: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
    letterSpacing: 0,
    color: "default",
    uppercase: false,
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: 0,
    color: "default",
    uppercase: false,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: 0,
    color: "default",
    uppercase: false,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: 0,
    color: "muted",
    uppercase: false,
  },
  overline: {
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16,
    letterSpacing: 1,
    color: "muted",
    uppercase: true,
  },
};

/** Heading variants carry a 1–5 level; the non-heading roles carry none. */
const HEADING_LEVELS: Partial<Record<TypographyVariant, 1 | 2 | 3 | 4 | 5>> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
};

/**
 * The heading level (1–5) for a heading variant, or `undefined` for the
 * non-heading roles. Drives `accessibilityRole="header"` (which RNW maps to
 * `role="heading"`) and the web `aria-level`.
 */
export function typographyLevel(
  variant: TypographyVariant,
): 1 | 2 | 3 | 4 | 5 | undefined {
  return HEADING_LEVELS[variant];
}

/**
 * Resolve a semantic {@link TypographyColor} token to a concrete theme color.
 * Every mapping is held to WCAG 2.1 — 1.4.3 (AA) on the surface; `default` is
 * the primary `ink`, the others step down through the secondary and muted inks
 * and the brand/danger accents, all of which stay ≥4.5:1. `inverse` is white
 * for use on dark fills, where the consumer owns the background contrast.
 */
export function resolveTypographyColor(
  colors: SharedUiTheme["colors"],
  token: TypographyColor,
): string {
  switch (token) {
    case "default":
      return colors.ink;
    case "secondary":
      return colors.ink2;
    case "muted":
      return colors.muted;
    case "placeholder":
      return colors.placeholder;
    case "primary":
      return colors.primaryDeep;
    case "danger":
      return colors.rose;
    case "inverse":
      return "#fff";
  }
}

/**
 * Resolve every variant into a flat text style. The font family comes from the
 * theme (`fonts.sans`); size, weight, leading, tracking, and casing come from
 * the local scale; and the default color is the variant's token resolved
 * through {@link resolveTypographyColor}. A per-instance `color` (token or raw
 * string) composes cleanly on top of these in the component.
 */
export function createTypographyStyles(theme: SharedUiTheme) {
  const base = { fontFamily: theme.fonts.sans } as const;
  const styles = {} as Record<TypographyVariant, TextStyle>;
  for (const variant of Object.keys(TYPOGRAPHY_SCALE) as TypographyVariant[]) {
    const metrics = TYPOGRAPHY_SCALE[variant];
    styles[variant] = {
      ...base,
      color: resolveTypographyColor(theme.colors, metrics.color),
      fontSize: metrics.fontSize,
      fontWeight: metrics.fontWeight,
      letterSpacing: metrics.letterSpacing,
      lineHeight: metrics.lineHeight,
      ...(metrics.uppercase ? { textTransform: "uppercase" as const } : null),
    };
  }
  return StyleSheet.create(styles);
}

export type TypographyStyles = ReturnType<typeof createTypographyStyles>;
