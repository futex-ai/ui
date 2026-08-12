/**
 * The property vocabulary the {@link Inspector} edits, and the value maths that
 * goes with it. Pure and free of any runtime `react-native` import, so the
 * clamping and formatting rules are unit tested on their own.
 */

/** A numeric property — position, scale, opacity, volume, a blur radius. */
export type InspectorNumberProperty = {
  type: "number";
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  /** Quantum the value snaps to. Default `0.01`. */
  step?: number;
  /** Decimals shown. Default inferred from `step`. */
  precision?: number;
  /** Trailing unit, e.g. `"%"`, `"px"`, `"dB"`. */
  unit?: string;
  /** The value a reset returns to. */
  defaultValue?: number;
  disabled?: boolean;
};

/** An on/off property. */
export type InspectorToggleProperty = {
  type: "toggle";
  id: string;
  label: string;
  value: boolean;
  defaultValue?: boolean;
  disabled?: boolean;
};

/** A one-of-several property — a blend mode, a fit, a preset. */
export type InspectorSelectProperty = {
  type: "select";
  id: string;
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  defaultValue?: string;
  disabled?: boolean;
};

/** A free-text property. */
export type InspectorTextProperty = {
  type: "text";
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
};

/** A colour chosen from a fixed set of swatches. */
export type InspectorColorProperty = {
  type: "color";
  id: string;
  label: string;
  value: string;
  swatches: readonly string[];
  defaultValue?: string;
  disabled?: boolean;
};

export type InspectorProperty =
  | InspectorColorProperty
  | InspectorNumberProperty
  | InspectorSelectProperty
  | InspectorTextProperty
  | InspectorToggleProperty;

/** Whatever a property's value can be. */
export type InspectorValue = boolean | number | string;

/** A titled run of properties. */
export type InspectorSection = {
  id: string;
  title: string;
  properties: readonly InspectorProperty[];
  /** Collapsed sections render their heading only. */
  collapsed?: boolean;
};

/** Bounds and quantum for a numeric value. */
export type NumberRange = { max?: number; min?: number; step?: number };

/**
 * Snaps a value to its step and clamps it into range. Snapping happens first so
 * the bounds are always exactly representable — clamping a stepped value to
 * `max` could otherwise leave it off the grid.
 */
export function clampToRange(value: number, range: NumberRange): number {
  const step = range.step && range.step > 0 ? range.step : 0;
  let next = step > 0 ? Math.round(value / step) * step : value;
  // Rounding by a fractional step reintroduces float noise (0.1 * 3), so the
  // result is re-rounded to the step's own decimal places.
  if (step > 0) {
    next = Number(next.toFixed(decimalsFor(step)));
  }
  if (range.min !== undefined) {
    next = Math.max(next, range.min);
  }
  if (range.max !== undefined) {
    next = Math.min(next, range.max);
  }
  return next;
}

/** How many decimals a step implies — `0.01` means two, `1` means none. */
export function decimalsFor(step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return 0;
  }
  const text = String(step);
  // A small enough step stringifies in exponential form ("1e-11"), which has no
  // decimal point to count — reading the exponent keeps such a step from being
  // treated as a whole number and rounding every value to an integer.
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) {
    return Math.min(6, Number(exponent[1]));
  }
  const point = text.indexOf(".");
  if (point < 0) {
    return 0;
  }
  return Math.min(6, text.length - point - 1);
}

/** The text shown in a numeric field: fixed decimals, no unit suffix. */
export function formatPropertyValue(
  value: number,
  options: { precision?: number; step?: number; unit?: string } = {},
): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const decimals = options.precision ?? decimalsFor(options.step ?? 0.01);
  return value.toFixed(decimals);
}

/**
 * The spoken value of a property, so a screen-reader user hears the same thing
 * a sighted user reads — including the unit, which is drawn as separate text.
 */
export function describeProperty(property: InspectorProperty): string {
  switch (property.type) {
    case "number":
      return `${property.label}, ${formatPropertyValue(property.value, property)}${
        property.unit ? ` ${property.unit}` : ""
      }`;
    case "toggle":
      return `${property.label}, ${property.value ? "on" : "off"}`;
    case "select": {
      const option = property.options.find(
        (entry) => entry.value === property.value,
      );
      return `${property.label}, ${option?.label ?? property.value}`;
    }
    default:
      return `${property.label}, ${String(property.value)}`;
  }
}

/** Whether a property differs from its default, so a reset is worth offering. */
export function isPropertyModified(property: InspectorProperty): boolean {
  return (
    property.defaultValue !== undefined &&
    property.value !== property.defaultValue
  );
}
