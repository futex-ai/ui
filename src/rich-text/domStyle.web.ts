/** Raw style application for the imperative RichTextEditor web renderer. */
import type { SharedUiTheme } from "../theme";

/** A resolved text style flattened into raw DOM-assignable values. */
export type TextDomStyle = {
  color?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  lineHeight?: number | string;
};

/** Typography and color values used by the raw DOM renderer. */
export type RichTextDomRenderTheme = {
  body: TextDomStyle;
  code: TextDomStyle;
  h1: TextDomStyle;
  h2: TextDomStyle;
  h3: TextDomStyle;
  theme: SharedUiTheme;
};

/** Apply a flattened text style to an element's inline style. */
export function applyTextStyle(
  element: HTMLElement,
  style: TextDomStyle,
): void {
  if (style.color) {
    element.style.color = style.color;
  }
  if (style.fontFamily) {
    element.style.fontFamily = style.fontFamily;
  }
  if (style.fontSize !== undefined) {
    element.style.fontSize = cssLength(style.fontSize);
  }
  if (style.fontWeight !== undefined) {
    element.style.fontWeight = String(style.fontWeight);
  }
  if (style.lineHeight !== undefined) {
    element.style.lineHeight = cssLength(style.lineHeight);
  }
}

/** Style a `ul`/`ol`/checklist wrapper. */
export function applyListStyle(
  element: HTMLElement,
  renderTheme: RichTextDomRenderTheme,
): void {
  element.style.margin = "0 0 8px";
  // One shared text column for every list kind: bullet/number markers hang
  // inside a 24px pad, and checklist rows reach the same column with a 16px
  // box + 8px gap instead of a pad.
  if (element.dataset.rt === "checklist") {
    element.style.listStyleType = "none";
    element.style.paddingLeft = "0";
  } else {
    element.style.paddingLeft = "24px";
  }
  applyTextStyle(element, renderTheme.body);
}

/** Style a checklist item's toggle box. */
export function applyCheckboxStyle(
  element: HTMLElement,
  checked: boolean,
  renderTheme: RichTextDomRenderTheme,
): void {
  element.style.alignItems = "center";
  element.style.backgroundColor = checked
    ? renderTheme.theme.colors.primary
    : renderTheme.theme.colors.surface;
  element.style.border = `1px solid ${checked ? renderTheme.theme.colors.primaryDeep : renderTheme.theme.colors.controlBorder}`;
  element.style.borderRadius = `${renderTheme.theme.radii.sm}px`;
  element.style.boxSizing = "border-box";
  element.style.color = renderTheme.theme.colors.onSolid;
  element.style.display = "inline-flex";
  element.style.fontFamily = renderTheme.theme.fonts.sans;
  element.style.fontSize = "10px";
  element.style.fontWeight = "800";
  element.style.height = "16px";
  element.style.justifyContent = "center";
  element.style.flexShrink = "0";
  element.style.lineHeight = "14px";
  element.style.marginRight = "8px";
  // Center the 16px box on the first text line instead of eyeballing a
  // translate: (body line height − box height) / 2.
  const lineHeight = bodyLineHeight(renderTheme);
  element.style.marginTop = `${Math.max(0, Math.round((lineHeight - 16) / 2))}px`;
  element.style.width = "16px";
}

/** Numeric body line height, falling back to the editor's 22px default. */
export function bodyLineHeight(renderTheme: RichTextDomRenderTheme): number {
  return typeof renderTheme.body.lineHeight === "number"
    ? renderTheme.body.lineHeight
    : 22;
}

function cssLength(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}
