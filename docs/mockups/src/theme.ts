import type { ColorScheme } from "@mokly/mokly";
import { rgbChannels } from "@firna/ui/focusRing";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  type SharedUiTheme,
} from "@firna/ui/theme";
import {
  createTypographyStyles,
  type TypographyVariant,
} from "@firna/ui/typography";

import {
  denseControl,
  denseRow,
  touchControl,
  touchRow,
  type ControlMetrics,
  type RowMetrics,
} from "./design/density";
import { compactText, type TextMetrics } from "./design/typeScale";

/** The text roles that the drawn parts style through CSS variables. */
const CSS_TEXT_ROLES = [
  "h4",
  "h5",
  "body",
  "label",
  "caption",
  "overline",
] as const satisfies readonly TypographyVariant[];

/** The library theme of a colour scheme: its default light or dark theme. */
export function themeFor(scheme: ColorScheme): SharedUiTheme {
  return scheme === "dark" ? darkSharedUiTheme : defaultSharedUiTheme;
}

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/** A colour at an alpha, for the faint outlines of tinted boxes. */
function alpha(color: string, value: number): string {
  const channels = rgbChannels(color);
  return channels ? `rgba(${channels}, ${value})` : color;
}

function controlDeclarations(metrics: ControlMetrics): string[] {
  return [
    `--control-height:${metrics.height}px`,
    `--control-label:${metrics.labelSize}px`,
    `--control-label-line:${metrics.labelLine}px`,
    `--control-label-weight:${metrics.labelWeight}`,
    `--control-field-text:${metrics.fieldText}px`,
    `--control-padding-x:${metrics.paddingX}px`,
    `--control-field-padding-x:${metrics.fieldPaddingX}px`,
    `--control-gap:${metrics.gap}px`,
    `--control-icon:${metrics.iconSize}px`,
  ];
}

function rowDeclarations(metrics: RowMetrics): string[] {
  return [
    `--row-min-height:${metrics.minHeight}px`,
    `--row-padding-x:${metrics.paddingX}px`,
    `--row-padding-y:${metrics.paddingY}px`,
    `--row-gap:${metrics.gap}px`,
    `--row-title:${metrics.titleSize}px`,
    `--row-title-line:${metrics.titleLine}px`,
    `--row-detail:${metrics.detailSize}px`,
    `--row-detail-line:${metrics.detailLine}px`,
    `--row-icon:${metrics.iconSize}px`,
  ];
}

/** The numbers of a text role as CSS values need them. */
type CssTextMetrics = Omit<TextMetrics, "fontWeight"> & { fontWeight: string };

function textDeclarations(
  metricsOf: (role: TypographyVariant) => CssTextMetrics,
): string[] {
  return CSS_TEXT_ROLES.flatMap((role) => {
    const metrics = metricsOf(role);
    return [
      `--text-${role}-size:${metrics.fontSize}px`,
      `--text-${role}-line:${metrics.lineHeight}px`,
      `--text-${role}-weight:${metrics.fontWeight}`,
      `--text-${role}-tracking:${metrics.letterSpacing}px`,
    ];
  });
}

/** The default type scale, read from the library so that it cannot drift. */
function defaultTextMetrics(theme: SharedUiTheme) {
  const styles = createTypographyStyles(theme);
  return (role: TypographyVariant): CssTextMetrics => {
    const style = styles[role];
    return {
      fontSize: Number(style.fontSize),
      lineHeight: Number(style.lineHeight),
      fontWeight: String(style.fontWeight),
      letterSpacing: Number(style.letterSpacing ?? 0),
    };
  };
}

/**
 * The theme and the proposed metrics as CSS custom properties. The colours,
 * radii, and fonts come from the library theme. A desktop surface reads the
 * dense metrics and the compact type scale, and a phone surface reads the
 * touch metrics and the default type scale.
 */
export function tokensCss(theme: SharedUiTheme): string {
  const colors = Object.entries(theme.colors).map(
    ([name, value]) => `--ui-${kebab(name)}:${value}`,
  );
  const radii = Object.entries(theme.radii)
    .filter(([name]) => name !== "avatarRatio")
    .map(([name, value]) => `--ui-radius-${kebab(name)}:${value}px`);
  const root = [
    ...colors,
    ...radii,
    `--ui-font-sans:${theme.fonts.sans}`,
    `--ui-font-mono:${theme.fonts.mono}`,
    `--ui-rose-line:${alpha(theme.colors.rose, 0.35)}`,
    `--ui-primary-line:${alpha(theme.colors.primary, 0.45)}`,
    "--ui-backdrop:rgba(20, 28, 22, 0.36)",
  ];
  const desktop = [
    ...controlDeclarations(denseControl),
    ...rowDeclarations(denseRow),
    ...textDeclarations((role) => compactText[role]),
  ];
  const phone = [
    ...controlDeclarations(touchControl),
    ...rowDeclarations(touchRow),
    ...textDeclarations(defaultTextMetrics(theme)),
  ];
  return [
    `:root{${root.join(";")}}`,
    `[data-surface="desktop"]{${desktop.join(";")}}`,
    `[data-surface="phone"]{${phone.join(";")}}`,
  ].join("\n");
}
