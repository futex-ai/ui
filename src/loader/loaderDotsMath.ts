/** Pure animation ranges for the three-dot loader. */

import type { InterpolationRange } from "./loaderWaveMath";

/** Fraction of a cycle occupied by one dot's complete rise and fall. */
export const DOT_BOUNCE_WINDOW = 0.3;

/** Fraction of a cycle between the start of neighboring dot bounces. */
export const DOT_BOUNCE_STEP = 0.18;

/** Quiet lead-in before the first dot starts moving. */
export const DOT_BOUNCE_START = 0.05;

/** Linear interpolation segments used to approximate the eased bounce. */
export const DOT_BOUNCE_SAMPLES = 16;

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
 * A sine-squared curve leaves and reaches rest with zero velocity, and rounds
 * smoothly over the apex. Neighboring windows overlap for a fluid handoff, but
 * the first window ends before the third starts, so all three dots can never
 * rise together. The flat range after the third window gives the sequence a
 * visible pause before the next cycle begins.
 */
export function buildDotBounceRange({
  from,
  index,
  to,
}: DotBounceRangeOptions): InterpolationRange {
  const start = DOT_BOUNCE_START + index * DOT_BOUNCE_STEP;
  const inputRange = [0];
  const outputRange = [from];

  for (let sample = 0; sample <= DOT_BOUNCE_SAMPLES; sample += 1) {
    const fraction = sample / DOT_BOUNCE_SAMPLES;
    const sine = Math.sin(Math.PI * fraction);
    const intensity =
      sample === 0 || sample === DOT_BOUNCE_SAMPLES ? 0 : sine * sine;
    inputRange.push(start + DOT_BOUNCE_WINDOW * fraction);
    outputRange.push(from + (to - from) * intensity);
  }

  inputRange.push(1);
  outputRange.push(from);

  return { inputRange, outputRange };
}
