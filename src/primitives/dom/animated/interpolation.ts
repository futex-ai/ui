/**
 * `createInterpolation`: mapping an input range onto an output range.
 *
 * A transcription of React Native's
 * `Animated/nodes/AnimatedInterpolation.js` as `react-native-web` 0.21.2
 * vendors it — the segment search, the three extrapolation modes, the easing
 * hook, and the string branch that interpolates every number inside a template
 * (`"0deg"` → `"360deg"`, `"0%"` → `"100%"`, `rgba(...)`).
 *
 * The one deviation is `colorToRgba`: React Native runs the value through its
 * 150-entry named-colour table, and this covers only the forms
 * `dom/shadowColor.ts` already parses — `black`, `white`, three-, four-, six-
 * and eight-digit hex, and `rgb()` / `rgba()`. Any other colour passes through
 * unchanged, so two output values have to be written in the same notation to
 * interpolate. No component in the library interpolates a colour at all.
 *
 * Pure; `tests/unit/domInterpolation.test.ts` pins it.
 */
import type { InterpolationConfigType } from "../../types";

/** How an interpolation behaves outside its input range. */
type ExtrapolateType = "extend" | "identity" | "clamp";

const linear = (t: number) => t;

/** Matches every number in a template string, including exponents. */
const stringShapeRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

// Channels rather than strings, the same shape `dom/shadowColor.ts` keeps.
const NAMED_CHANNELS: Readonly<Record<string, [number, number, number]>> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
};

function expandHex(digits: string): string {
  return digits.length <= 4
    ? digits
        .split("")
        .map((digit) => digit + digit)
        .join("")
    : digits;
}

/** Normalises the colour forms we parse to `rgba(r, g, b, a)`. */
export function colorToRgba(input: string): string {
  const named = NAMED_CHANNELS[input.toLowerCase()];
  if (named != null) {
    return `rgba(${named[0]}, ${named[1]}, ${named[2]}, 1)`;
  }
  const hex = /^#([0-9a-f]{3,8})$/i.exec(input);
  if (hex && [3, 4, 6, 8].includes(hex[1].length)) {
    const digits = expandHex(hex[1]);
    const channel = (at: number) =>
      Number.parseInt(digits.slice(at * 2, at * 2 + 2), 16);
    const alpha = digits.length === 8 ? channel(3) / 255 : 1;
    return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha})`;
  }
  const rgb = /^rgba?\(([^)]+)\)$/i.exec(input);
  if (rgb) {
    const values = rgb[1].split(/[,/]/).map((part) => part.trim());
    if (values.length >= 3) {
      const alpha = values.length > 3 ? values[3] : "1";
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
    }
  }
  return input;
}

/** The segment of `inputRange` that `input` falls in. */
export function findRange(
  input: number,
  inputRange: readonly number[],
): number {
  let index;
  for (index = 1; index < inputRange.length - 1; ++index) {
    if (inputRange[index] >= input) {
      break;
    }
  }
  return index - 1;
}

function interpolate(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  easing: (input: number) => number,
  extrapolateLeft: ExtrapolateType,
  extrapolateRight: ExtrapolateType,
): number {
  let result = input;

  if (result < inputMin) {
    if (extrapolateLeft === "identity") {
      return result;
    }
    if (extrapolateLeft === "clamp") {
      result = inputMin;
    }
  }
  if (result > inputMax) {
    if (extrapolateRight === "identity") {
      return result;
    }
    if (extrapolateRight === "clamp") {
      result = inputMax;
    }
  }

  if (outputMin === outputMax) {
    return outputMin;
  }
  if (inputMin === inputMax) {
    return input <= inputMin ? outputMin : outputMax;
  }

  if (inputMin === -Infinity) {
    result = -result;
  } else if (inputMax === Infinity) {
    result = result - inputMin;
  } else {
    result = (result - inputMin) / (inputMax - inputMin);
  }

  result = easing(result);

  if (outputMin === -Infinity) {
    result = -result;
  } else if (outputMax === Infinity) {
    result = result + outputMin;
  } else {
    result = result * (outputMax - outputMin) + outputMin;
  }
  return result;
}

function extrapolationFor(
  specific: ExtrapolateType | undefined,
  shared: ExtrapolateType | undefined,
): ExtrapolateType {
  return specific ?? shared ?? "extend";
}

function createNumericInterpolation(
  config: InterpolationConfigType,
): (input: number) => number {
  const outputRange = config.outputRange as number[];
  const { inputRange } = config;
  const easing = config.easing ?? linear;
  const extrapolateLeft = extrapolationFor(
    config.extrapolateLeft,
    config.extrapolate,
  );
  const extrapolateRight = extrapolationFor(
    config.extrapolateRight,
    config.extrapolate,
  );
  return (input: number) => {
    const range = findRange(input, inputRange);
    return interpolate(
      input,
      inputRange[range],
      inputRange[range + 1],
      outputRange[range],
      outputRange[range + 1],
      easing,
      extrapolateLeft,
      extrapolateRight,
    );
  };
}

function checkPattern(values: readonly string[]): void {
  const pattern = values[0].replace(stringShapeRegex, "");
  for (let index = 1; index < values.length; ++index) {
    if (pattern !== values[index].replace(stringShapeRegex, "")) {
      throw new Error(`invalid pattern ${values[0]} and ${values[index]}`);
    }
  }
}

function createStringInterpolation(
  config: InterpolationConfigType,
): (input: number) => string {
  const outputRange = (config.outputRange as string[]).map(colorToRgba);
  if (outputRange.length < 2) {
    throw new Error("Bad output range");
  }
  checkPattern(outputRange);

  // `"rgba(0, 100, 200, 0)"` becomes four numeric ranges, one per number in the
  // template, each interpolated on its own and stitched back into the string.
  const template = outputRange[0].match(stringShapeRegex) ?? [];
  const outputRanges: number[][] = template.map(() => []);
  for (const value of outputRange) {
    (value.match(stringShapeRegex) ?? []).forEach((number, index) => {
      outputRanges[index].push(Number(number));
    });
  }
  const interpolations = template.map((_value, index) =>
    createNumericInterpolation({ ...config, outputRange: outputRanges[index] }),
  );

  // `rgb()` needs integer channels, but not an integer alpha.
  const shouldRound = outputRange[0].startsWith("rgb");

  return (input: number) => {
    let index = 0;
    return outputRange[0].replace(stringShapeRegex, () => {
      let value = interpolations[index++](input);
      if (shouldRound) {
        value = index < 4 ? Math.round(value) : Math.round(value * 1000) / 1000;
      }
      return String(value);
    });
  };
}

/** Builds the mapping function an `interpolate(config)` call describes. */
export function createInterpolation(
  config: InterpolationConfigType,
): (input: number) => number | string {
  if (
    config.outputRange.length > 0 &&
    typeof config.outputRange[0] === "string"
  ) {
    return createStringInterpolation(config);
  }
  return createNumericInterpolation(config);
}
