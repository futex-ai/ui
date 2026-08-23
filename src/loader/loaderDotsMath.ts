/** Pure animation ranges for the three-dot loader. */

import type { InterpolationRange } from "./loaderWaveMath";

/** Fraction of a cycle occupied by one dot's complete rise and fall. */
export const DOT_BOUNCE_WINDOW = 0.18;

/** Quiet lead-in before the first dot starts moving. */
export const DOT_BOUNCE_START = 0.05;

/** Options for {@link buildDotBounceRange}. */
export type DotBounceRangeOptions = {
  /** Value while this dot is resting. */
  from: number;
  /** Zero-based position of the dot in the three-dot sequence. */
  index: number;
  /** Value at the top of this dot's bounce. */
  to: number;
};

/**
 * Build one dot's rise-and-fall keyframes on the shared loader cycle.
 *
 * Consecutive windows touch only at their resting value, so two dots never
 * rise together. The flat range after the third window gives the sequence a
 * visible pause before the next cycle begins.
 */
export function buildDotBounceRange({
  from,
  index,
  to,
}: DotBounceRangeOptions): InterpolationRange {
  const start = DOT_BOUNCE_START + index * DOT_BOUNCE_WINDOW;
  const peak = start + DOT_BOUNCE_WINDOW / 2;
  const end = start + DOT_BOUNCE_WINDOW;

  return {
    inputRange: [0, start, peak, end, 1],
    outputRange: [from, from, to, from, from],
  };
}
