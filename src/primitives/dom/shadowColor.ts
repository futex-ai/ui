/**
 * Applying `shadowOpacity` to a `shadowColor`.
 *
 * `react-native-web` runs the colour through React Native's full parser
 * (`compiler/normalizeColor.js` → `processColor`) and emits
 * `rgba(r,g,b,(alpha * opacity).toFixed(2))`, so the opacity multiplies whatever
 * alpha the colour already carried. This covers the forms a style can realistically
 * name — the `black` default, `white`, three-, four-, six- and eight-digit hex,
 * `rgb()` / `rgba()`, and `hsl()` / `hsla()` — and, unlike that backend, passes
 * **any other named colour through unchanged rather than resolving it**, because
 * shipping the 150-entry CSS colour table to every consumer to support a prop no
 * component uses is not worth the bytes. `currentColor`, `inherit` and `var(...)`
 * pass through, as they do there.
 */

/** Colour keywords that have no numeric value to multiply. */
function isWebColor(color: string): boolean {
  return (
    color === "currentcolor" ||
    color === "currentColor" ||
    color === "inherit" ||
    color.startsWith("var(")
  );
}

const NAMED_CHANNELS: Readonly<Record<string, [number, number, number]>> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
};

/** `(alpha * opacity)` in the two-decimal form that backend wrote. */
function alpha(existing: number, opacity: number): string {
  return (existing * opacity).toFixed(2);
}

function expandHex(digits: string): string {
  return digits.length <= 4
    ? digits
        .split("")
        .map((digit) => digit + digit)
        .join("")
    : digits;
}

function parts(value: string): string[] {
  return value.split(/[,/]/).map((part) => part.trim());
}

function existingAlpha(values: string[], at: number): number {
  const parsed = Number.parseFloat(values[at] ?? "");
  return Number.isFinite(parsed) ? parsed : 1;
}

/**
 * Multiplies a colour's alpha by `opacity`, or returns it unchanged when there
 * is no opacity to apply or the colour is not one of the forms above.
 */
export function withOpacity(color: string, opacity: unknown): string {
  if (typeof opacity !== "number" || isWebColor(color)) {
    return color;
  }

  const named = NAMED_CHANNELS[color.toLowerCase()];
  if (named) {
    return `rgba(${named.join(",")},${alpha(1, opacity)})`;
  }

  const hex = /^#([0-9a-f]{3,8})$/i.exec(color);
  if (hex && [3, 4, 6, 8].includes(hex[1].length)) {
    const digits = expandHex(hex[1]);
    const channel = (at: number) =>
      Number.parseInt(digits.slice(at * 2, at * 2 + 2), 16);
    const existing = digits.length === 8 ? channel(3) / 255 : 1;
    return `rgba(${channel(0)},${channel(1)},${channel(2)},${alpha(
      existing,
      opacity,
    )})`;
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(color);
  if (rgb) {
    const values = parts(rgb[1]);
    return `rgba(${values.slice(0, 3).join(",")},${alpha(
      existingAlpha(values, 3),
      opacity,
    )})`;
  }

  const hsl = /^hsla?\(([^)]+)\)$/i.exec(color);
  if (hsl) {
    const values = parts(hsl[1]);
    return `hsla(${values.slice(0, 3).join(",")},${alpha(
      existingAlpha(values, 3),
      opacity,
    )})`;
  }

  return color;
}
