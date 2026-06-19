/** Themed text and heading family: H1–H5 plus Body, Label, Caption, Overline. */
import { useMemo } from "react";
import type { ReactNode } from "react";
import { Text as RNText, StyleProp, TextStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import {
  createTypographyStyles,
  resolveTypographyColor,
  typographyLevel,
} from "./typographyStyles";
import type { TypographyColor, TypographyVariant } from "./typographyStyles";

/** The semantic color tokens, for the runtime token-vs-raw-string check. */
const SEMANTIC_COLORS = new Set<TypographyColor>([
  "default",
  "secondary",
  "muted",
  "placeholder",
  "primary",
  "danger",
  "inverse",
]);

export type TextProps = {
  /** Text content to render. */
  children: ReactNode;
  /**
   * Override the variant's default color. Pass a semantic {@link TypographyColor}
   * token (theme-aware and AA-safe by construction) or a raw color string (whose
   * contrast you then own). Omit to keep the variant's default.
   */
  color?: TypographyColor | (string & {});
  /** Truncate to this many lines with a trailing ellipsis. */
  numberOfLines?: number;
  /** Extra style merged on top of the variant style. */
  style?: StyleProp<TextStyle>;
  /**
   * The text role. Headings (`h1`–`h5`) are exposed to assistive tech as
   * headings at the matching level; `body` (the default), `label`, `caption`,
   * and `overline` are plain text.
   */
  variant?: TypographyVariant;
};

/**
 * The single base text component. It resolves a {@link TypographyVariant} to the
 * family's locally-owned type scale (size / weight / leading / tracking) and the
 * theme `fonts.sans`, paints it with the variant's default theme color
 * (overridable per instance via a {@link TypographyColor} token or a raw color
 * string), and — for the heading variants — exposes it to assistive tech as a
 * heading at the matching level (`accessibilityRole="header"`, which RNW maps to
 * `role="heading"`, plus the web `aria-level`). The named `H1`–`H5`, `Body`,
 * `Label`, `Caption`, and `Overline` exports are thin wrappers that pin
 * `variant`.
 */
export function Text({
  children,
  color,
  numberOfLines,
  style,
  variant = "body",
}: TextProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createTypographyStyles(theme), [theme]);
  const level = typographyLevel(variant);
  // A semantic token resolves to its AA-safe theme color; any other string is a
  // raw color passed straight through (the consumer owns its contrast).
  const resolvedColor =
    color === undefined
      ? undefined
      : SEMANTIC_COLORS.has(color as TypographyColor)
        ? resolveTypographyColor(theme.colors, color as TypographyColor)
        : color;
  return (
    <RNText
      // Heading variants are announced as headings at their level so the page
      // outline is navigable; the text roles stay plain text (1.3.1, 2.4.10).
      // Native RN has no heading-level concept, so `aria-level` is web-only — it
      // is simply ignored on iOS/Android, where the header role still applies.
      accessibilityRole={level === undefined ? undefined : "header"}
      aria-level={level}
      numberOfLines={numberOfLines}
      style={[
        styles[variant],
        resolvedColor === undefined ? null : { color: resolvedColor },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

/** Props for the named heading/text wrappers — `TextProps` without `variant`. */
export type HeadingProps = Omit<TextProps, "variant">;

/** Level-1 heading. The most prominent step in the scale. */
export function H1(props: HeadingProps) {
  return <Text variant="h1" {...props} />;
}

/** Level-2 heading. */
export function H2(props: HeadingProps) {
  return <Text variant="h2" {...props} />;
}

/** Level-3 heading. */
export function H3(props: HeadingProps) {
  return <Text variant="h3" {...props} />;
}

/** Level-4 heading. */
export function H4(props: HeadingProps) {
  return <Text variant="h4" {...props} />;
}

/** Level-5 heading. The smallest heading step. */
export function H5(props: HeadingProps) {
  return <Text variant="h5" {...props} />;
}

/** Default running text. */
export function Body(props: HeadingProps) {
  return <Text variant="body" {...props} />;
}

/** Form-field and control labels — slightly heavier than body. */
export function Label(props: HeadingProps) {
  return <Text variant="label" {...props} />;
}

/** Small secondary text for captions, metadata, and small print. */
export function Caption(props: HeadingProps) {
  return <Text variant="caption" {...props} />;
}

/** Uppercased section eyebrow shown above a heading or group of content. */
export function Overline(props: HeadingProps) {
  return <Text variant="overline" {...props} />;
}
