import type { ColorScheme } from "@mokly/mokly";
import { createButtonStyles, createTouchButtonStyles } from "@firna/ui/button";
import { createListStyles, createTouchListStyles } from "@firna/ui/list";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  type SharedUiTheme,
} from "@firna/ui/theme";
import {
  createTypographyStyles,
  type TextScale,
  type TypographyVariant,
} from "@firna/ui/typography";

/** The text roles that the layout styles through CSS variables. */
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

/** The text roles of a library scale, as CSS custom properties. */
function textDeclarations(theme: SharedUiTheme, scale: TextScale): string[] {
  const styles = createTypographyStyles(theme, scale);
  return CSS_TEXT_ROLES.flatMap((role) => {
    const style = styles[role];
    return [
      `--text-${role}-size:${Number(style.fontSize)}px`,
      `--text-${role}-line:${Number(style.lineHeight)}px`,
      `--text-${role}-weight:${String(style.fontWeight)}`,
      `--text-${role}-tracking:${Number(style.letterSpacing ?? 0)}px`,
    ];
  });
}

/**
 * The layout numbers of one kind of surface, read from the library: the
 * height of an `xs` control and the padding and text of an `xs` row, or
 * their touch metrics on a phone. The layout aligns its own headings, labels,
 * and row content with them.
 */
function surfaceDeclarations(theme: SharedUiTheme, touch: boolean): string[] {
  const control = touch
    ? createTouchButtonStyles(theme).button
    : createButtonStyles(theme, "xs").button;
  const rows = touch
    ? createTouchListStyles(theme, "xs")
    : createListStyles(theme, "xs");
  return [
    `--control-height:${Number(control.height)}px`,
    `--row-padding-x:${Number(rows.item.paddingHorizontal)}px`,
    `--row-title:${Number(rows.itemTitle.fontSize)}px`,
    `--row-title-line:${Number(rows.itemTitle.lineHeight)}px`,
    `--row-detail:${Number(rows.itemDescription.fontSize)}px`,
    `--row-detail-line:${Number(rows.itemDescription.lineHeight)}px`,
    ...textDeclarations(theme, touch ? "default" : "compact"),
  ];
}

/**
 * The theme and the surface layout numbers as CSS custom properties. The
 * colours, radii, and fonts come from the library theme. A desktop surface
 * reads the dense metrics and the compact type scale, and a phone surface
 * reads the touch metrics and the default type scale.
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
  ];
  return [
    `:root{${root.join(";")}}`,
    `[data-surface="desktop"]{${surfaceDeclarations(theme, false).join(";")}}`,
    `[data-surface="phone"]{${surfaceDeclarations(theme, true).join(";")}}`,
  ].join("\n");
}
