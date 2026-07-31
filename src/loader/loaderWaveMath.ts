/**
 * The pure maths behind the loader animations: builders that turn one linear
 * 0 → 1 cycle into the staggered per-element curve each shape needs.
 *
 * Each loader runs exactly one animation loop and derives every element's motion
 * from it by interpolating at a phase offset, rather than running N parallel
 * loops. Elements then cannot drift out of step, only one animation has to be
 * scheduled, and — because opacity and transform are all that come out of these
 * curves — the whole loader stays on the native driver on iOS and Android.
 *
 * Keeping the builders free of React and React Native lets their shape be
 * asserted directly in unit tests.
 */

/**
 * How many points are sampled across the cycle when approximating the wave.
 * Animated interpolation is linear between neighbouring points, so this trades
 * array size against how faithfully the eased curve is reproduced; 24 is smooth
 * at every loader size the library ships.
 */
export const WAVE_SAMPLES = 24;

/**
 * The nudge that fakes the sawtooth's instantaneous wrap. Interpolation demands
 * a strictly increasing `inputRange`, so the reset is squeezed into this much of
 * the cycle instead of being a true discontinuity.
 */
export const SAWTOOTH_EPSILON = 0.001;

/** An `inputRange`/`outputRange` pair ready for `Animated.Value.interpolate`. */
export type InterpolationRange = {
  inputRange: number[];
  outputRange: number[];
};

/** Options for {@link buildWaveRange}. */
export type WaveRangeOptions = {
  /** Value at the trough, half a cycle away from `phase`. */
  from: number;
  /** Cycle position, in `[0, 1)`, where this element peaks. */
  phase: number;
  /**
   * Falloff exponent. `1` is a plain triangle wave — every element is part-lit
   * at all times; higher values tighten the highlight so it reads as a
   * travelling pulse rather than a general shimmer.
   */
  sharpness?: number;
  /** Value at the peak, when the cycle reaches `phase`. */
  to: number;
};

/** Options for {@link buildSawtoothRange}. */
export type SawtoothRangeOptions = {
  /** Value the ramp starts from after each wrap. */
  from: number;
  /** Cycle position, in `[0, 1)`, this element is shifted forward by. */
  offset: number;
  /** Value the ramp reaches just before it wraps. */
  to: number;
};

/**
 * How lit an element is at cycle position `t`, given where it peaks.
 *
 * Distance is measured the short way around the cycle, so an element whose phase
 * sits near the end of the cycle is still lit by a highlight arriving at the
 * start. The result is 1 at the phase and 0 half a cycle away, which also makes
 * the curve identical at `t = 0` and `t = 1` and therefore seamless across the
 * loop's reset.
 */
export function waveIntensity(
  t: number,
  phase: number,
  sharpness: number,
): number {
  const direct = Math.abs(t - phase);
  const distance = Math.min(direct, 1 - direct) * 2;
  return Math.pow(1 - distance, sharpness);
}

/**
 * Build the range for a travelling highlight: a value that peaks at `phase` and
 * eases back down to `from` half a cycle away, wrapping smoothly.
 *
 * Use it for anything that should brighten and swell as the wave passes — dot
 * opacity and scale, bar height, blade brightness.
 */
export function buildWaveRange({
  from,
  phase,
  sharpness = 3,
  to,
}: WaveRangeOptions): InterpolationRange {
  const wrapped = wrapCyclePosition(phase);
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let index = 0; index <= WAVE_SAMPLES; index += 1) {
    const t = index / WAVE_SAMPLES;
    inputRange.push(t);
    outputRange.push(from + (to - from) * waveIntensity(t, wrapped, sharpness));
  }
  return { inputRange, outputRange };
}

/**
 * Build the range for a one-way ramp that restarts each cycle: `from` climbing
 * to `to`, shifted forward by `offset` so several elements can chase each other
 * off the one driver.
 *
 * Use it for the expanding rings of a ripple, where each ring travels outward
 * and then reappears at the centre. The wrap is a near-instant step rather than
 * a true jump; callers hide it by fading the element to nothing at `to`.
 */
export function buildSawtoothRange({
  from,
  offset,
  to,
}: SawtoothRangeOptions): InterpolationRange {
  const wrapped = wrapCyclePosition(offset);
  const wrap = 1 - wrapped;
  // An unshifted ramp — or one shifted so far that the wrap lands on a cycle
  // edge — is just a straight climb, with no reset to hide mid-cycle.
  if (wrapped <= SAWTOOTH_EPSILON || wrap <= SAWTOOTH_EPSILON) {
    return { inputRange: [0, 1], outputRange: [from, to] };
  }
  const atCycleEdge = from + (to - from) * wrapped;
  return {
    inputRange: [0, wrap - SAWTOOTH_EPSILON, wrap, 1],
    outputRange: [atCycleEdge, to, from, atCycleEdge],
  };
}

/** Fold any phase or offset into `[0, 1)`, including negative values. */
function wrapCyclePosition(position: number): number {
  return ((position % 1) + 1) % 1;
}
