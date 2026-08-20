/**
 * Continuous scales — the value axis of every chart, and the x axis of the
 * time and linear forms. Pure and dependency-free.
 */

/** A continuous mapping from data space to pixel space, and back. */
export type LinearScale = {
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  /** Map a data value to a pixel position, extrapolating past the domain. */
  scale(value: number): number;
  /** Map a pixel position back to a data value — the hover/scrub direction. */
  invert(position: number): number;
};

/**
 * Build a continuous scale.
 *
 * A zero-width domain (every value identical, or a single point) would divide
 * by zero, so it collapses to the midpoint of the range instead of producing
 * `Infinity` — a flat series renders as a flat line through the middle rather
 * than disappearing.
 */
export function linearScale(
  domain: readonly [number, number],
  range: readonly [number, number],
): LinearScale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  const degenerate = span === 0 || !Number.isFinite(span);
  const mid = (r0 + r1) / 2;
  return {
    domain,
    range,
    scale(value) {
      if (!Number.isFinite(value)) {
        return Number.NaN;
      }
      return degenerate ? mid : r0 + ((value - d0) / span) * (r1 - r0);
    },
    invert(position) {
      if (degenerate || r1 === r0) {
        return d0;
      }
      return d0 + ((position - r0) / (r1 - r0)) * span;
    },
  };
}

/**
 * A time scale is a continuous scale over epoch milliseconds. It exists as its
 * own constructor so callers pass `Date`s (or ISO strings) without converting,
 * and so the tick generator can pick calendar-aware intervals.
 */
export function timeScale(
  domain: readonly [Date | number | string, Date | number | string],
  range: readonly [number, number],
): LinearScale {
  return linearScale([toEpoch(domain[0]), toEpoch(domain[1])], range);
}

/** Coerce a `Date`, epoch number or ISO string to epoch milliseconds. */
export function toEpoch(value: Date | number | string): number {
  if (typeof value === "number") {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  return new Date(value).getTime();
}

/**
 * Derive a value-axis domain from data.
 *
 * Defaults to including zero, because a bar whose baseline is not zero
 * misstates magnitude — the classic truncated-axis distortion. Line charts
 * that genuinely need a zoomed domain opt out with `includeZero: false`.
 * `null` holes are ignored rather than read as zero.
 */
export function extentOf(
  values: readonly (number | null | undefined)[],
  options: { includeZero?: boolean; padding?: number } = {},
): [number, number] {
  const { includeZero = true, padding = 0 } = options;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (value == null || !Number.isFinite(value)) {
      continue;
    }
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (min === Number.POSITIVE_INFINITY) {
    // No finite data at all — a unit domain keeps the axis renderable.
    return includeZero ? [0, 1] : [0, 1];
  }
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    // A single distinct value still needs a non-zero span to scale against.
    return min === 0 ? [0, 1] : [Math.min(0, min), Math.max(0, max || 1)];
  }
  if (padding > 0) {
    const pad = (max - min) * padding;
    return [min - pad, max + pad];
  }
  return [min, max];
}

/** Clamp a value into a domain, tolerating a reversed domain. */
export function clampDomain(
  value: number,
  domain: readonly [number, number],
): number {
  const lo = Math.min(domain[0], domain[1]);
  const hi = Math.max(domain[0], domain[1]);
  return Math.min(hi, Math.max(lo, value));
}
