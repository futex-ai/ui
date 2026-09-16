/**
 * The value builders `resolveStyle.ts` stringifies React Native styles with.
 *
 * Transcribed from `react-native-web` 0.21.2's
 * `exports/StyleSheet/preprocess.js` and
 * `exports/StyleSheet/compiler/normalizeValueWithProperty.js`, so a shadow, a
 * transform list or a bare number becomes the same CSS text it did before.
 */
import { withOpacity } from "./shadowColor";
import { UNITLESS_NUMBERS } from "./styleTables";

/** A plain style object, before translation. */
export type StyleObject = Record<string, unknown>;

export function isStyleObject(value: unknown): value is StyleObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

/** `shadow*` props folded into one `box-shadow` value. */
export function createBoxShadowValue(style: StyleObject): string {
  const offset = isStyleObject(style.shadowOffset) ? style.shadowOffset : {};
  const offsetX = normalizeValue(numberOrZero(offset.width));
  const offsetY = normalizeValue(numberOrZero(offset.height));
  const blur = normalizeValue(numberOrZero(style.shadowRadius));
  // `shadowOpacity` defaults to 1, as `normalizeColor`'s own parameter does, so
  // a shadow with no opacity still resolves to the same `rgba()` text.
  const color = withOpacity(
    typeof style.shadowColor === "string" ? style.shadowColor : "black",
    typeof style.shadowOpacity === "number" ? style.shadowOpacity : 1,
  );
  return `${offsetX} ${offsetY} ${blur} ${color}`;
}

/** `textShadow*` props folded into one `text-shadow` value, or nothing. */
export function createTextShadowValue(style: StyleObject): string | undefined {
  const offset = isStyleObject(style.textShadowOffset)
    ? style.textShadowOffset
    : {};
  const width = numberOrZero(offset.width);
  const height = numberOrZero(offset.height);
  const radius = numberOrZero(style.textShadowRadius);
  if (
    typeof style.textShadowColor !== "string" ||
    (width === 0 && height === 0 && radius === 0)
  ) {
    return undefined;
  }
  return `${normalizeValue(width)} ${normalizeValue(height)} ${normalizeValue(
    radius,
  )} ${style.textShadowColor}`;
}

/** `{ translateX: 10 }` to `translateX(10px)`; `matrix` joins its values. */
export function createTransformValue(value: readonly unknown[]): string {
  return value
    .map((entry) => {
      if (!isStyleObject(entry)) {
        return "";
      }
      const type = Object.keys(entry)[0];
      const inner = entry[type];
      if (type === "matrix" || type === "matrix3d") {
        return `${type}(${(inner as unknown[]).join(",")})`;
      }
      return `${type}(${normalizeValue(inner, type)})`;
    })
    .filter(Boolean)
    .join(" ");
}

/** Numbers gain a `px` suffix unless the property is one of the unitless ones. */
export function normalizeValue(value: unknown, property?: string): unknown {
  if (
    typeof value === "number" &&
    (property == null || !UNITLESS_NUMBERS.has(property))
  ) {
    return `${value}px`;
  }
  return value;
}

/** `[{ offsetX, offsetY, … }]` to a `box-shadow` list. */
export function createBoxShadowArrayValue(value: readonly unknown[]): string {
  return value
    .map((shadow) => {
      if (typeof shadow === "string") {
        return shadow;
      }
      if (!isStyleObject(shadow)) {
        return "";
      }
      const parts = [
        normalizeValue(shadow.offsetX) ?? 0,
        normalizeValue(shadow.offsetY) ?? 0,
        normalizeValue(shadow.blurRadius) ?? 0,
        normalizeValue(shadow.spreadDistance) ?? 0,
        shadow.color ?? "black",
      ];
      return `${shadow.inset ? "inset " : ""}${parts.join(" ")}`;
    })
    .join(", ");
}
