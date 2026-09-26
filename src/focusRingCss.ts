/** CSS custom property carrying the composed web focus-glow color. */
export const FOCUS_RING_COLOR_VARIABLE = "--firna-focus-ring-color";

/** CSS custom property carrying the web focus-glow spread width. */
export const FOCUS_RING_WIDTH_VARIABLE = "--firna-focus-ring-width";

/** Default focus-glow alpha. */
export const DEFAULT_FOCUS_RING_ALPHA = 0.35;

/** Default focus-glow width in CSS pixels. */
export const DEFAULT_FOCUS_RING_WIDTH = 4;

/** Default focus-glow color outside a theme provider. */
export const DEFAULT_FOCUS_RING_COLOR = "#4f7864";

/** The two CSS variables consumed by the DOM backend focus rules. */
export type FocusRingCssVariables = {
  [FOCUS_RING_COLOR_VARIABLE]: string;
  [FOCUS_RING_WIDTH_VARIABLE]: string;
};

/**
 * Parses a `#rgb`/`#rrggbb` color into an `"r, g, b"` channel triplet.
 * Returns `null` for other CSS color notations.
 */
export function rgbChannels(hex: string): string | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  let body = match[1];
  if (body.length === 3) {
    body = body[0] + body[0] + body[1] + body[1] + body[2] + body[2];
  }
  const int = parseInt(body, 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}

/** Composes the translucent focus color used by CSS and inline fallback rings. */
export function focusRingColorFor(
  color: string,
  alpha = DEFAULT_FOCUS_RING_ALPHA,
): string {
  const channels = rgbChannels(color);
  return channels ? `rgba(${channels}, ${alpha})` : color;
}

/** Resolves the custom properties a themed focus-ring host serializes. */
export function focusRingCssVariablesFor(
  color: string,
  width = DEFAULT_FOCUS_RING_WIDTH,
  alpha = DEFAULT_FOCUS_RING_ALPHA,
): FocusRingCssVariables {
  return {
    [FOCUS_RING_COLOR_VARIABLE]: focusRingColorFor(color, alpha),
    [FOCUS_RING_WIDTH_VARIABLE]: `${width}px`,
  };
}
