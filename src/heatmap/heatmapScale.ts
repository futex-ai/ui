/**
 * Pure value-to-color helpers for the calendar heatmap. A day's value is mapped
 * to an index into an ordered intensity ramp (lowest → highest) via ascending
 * lower-bound thresholds. Consumers can pass explicit thresholds for an absolute
 * scale, or let {@link resolveThresholds} derive even bands from the data's max
 * value for a relative scale. No React, no theme — colors are supplied by the
 * caller.
 */

/**
 * Derive ascending lower-bound thresholds for a `levels`-color ramp by splitting
 * `(0, max]` into even bands. `thresholds[i]` is the smallest value that reaches
 * ramp color `i`; index 0 is always `1`, so the least-intense color starts at
 * the first positive value. The result is strictly ascending.
 */
export function resolveThresholds(levels: number, max: number): number[] {
  const count = Math.max(Math.floor(levels), 1);
  const top = Math.max(Math.floor(max), 1);
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const band = i === 0 ? 1 : Math.round((i / count) * top);
    const previous = i === 0 ? 0 : out[i - 1];
    // Keep the ramp strictly ascending even when `max` is small enough that two
    // even bands would otherwise round to the same lower bound.
    out.push(Math.max(band, previous + 1));
  }
  return out;
}

/**
 * Intensity ramp index for a value given ascending `thresholds`. Returns `-1`
 * for "empty" — an absent value or a non-positive one. A positive value below
 * the first threshold still maps to the lowest ramp color (`0`); otherwise it
 * maps to the highest threshold it reaches.
 */
export function levelForValue(
  value: number | undefined | null,
  thresholds: readonly number[],
): number {
  // `NaN <= 0` is false, so guard it explicitly — invalid data is "empty",
  // consistent with `null`/`undefined`/non-positive values.
  if (
    value == null ||
    Number.isNaN(value) ||
    value <= 0 ||
    thresholds.length === 0
  ) {
    return -1;
  }
  let index = -1;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (value >= thresholds[i]) {
      index = i;
    } else {
      // Ascending thresholds — nothing further can match.
      break;
    }
  }
  return index < 0 ? 0 : index;
}

/**
 * Resolve a cell's fill color: `emptyColor` when {@link levelForValue} is empty,
 * otherwise the ramp color for that level (clamped to the ramp's last entry when
 * fewer colors than thresholds are supplied).
 */
export function colorForValue(
  value: number | undefined | null,
  colors: readonly string[],
  thresholds: readonly number[],
  emptyColor: string,
): string {
  const level = levelForValue(value, thresholds);
  if (level < 0 || colors.length === 0) {
    return emptyColor;
  }
  return colors[Math.min(level, colors.length - 1)];
}
