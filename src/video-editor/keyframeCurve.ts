/**
 * Keyframe interpolation for {@link KeyframeEditor}.
 *
 * A keyframed property is a sparse list of `(time, value)` points plus a rule
 * for what happens between them. The rule is per-segment and lives on the
 * keyframe the segment *leaves*, which is how every animation tool models it —
 * so easing out of one keyframe does not force the same easing into the next.
 *
 * Pure and free of any runtime `react-native` import, so the maths is unit
 * tested on its own.
 */

/** How a segment leaving a keyframe reaches the next one. */
export type KeyframeInterpolation = "bezier" | "hold" | "linear";

/** A bezier handle, as an offset from its keyframe. */
export type KeyframeHandle = {
  /** Time offset in seconds. */
  dx: number;
  /** Value offset, in the property's own units. */
  dy: number;
};

export type Keyframe = {
  id: string;
  /** Position in seconds. */
  time: number;
  value: number;
  /** How the segment *leaving* this keyframe behaves. Default `"linear"`. */
  interpolation?: KeyframeInterpolation;
  /** Outgoing control handle. Defaults to a flat ease. */
  outHandle?: KeyframeHandle;
  /** Incoming control handle. Defaults to a flat ease. */
  inHandle?: KeyframeHandle;
};

/** One animated property's keyframes. */
export type KeyframeTrack = {
  id: string;
  /** The inspector property this animates. */
  propertyId: string;
  label: string;
  keyframes: readonly Keyframe[];
  /** Value range, for plotting. Derived from the data when omitted. */
  min?: number;
  max?: number;
  unit?: string;
};

/** Keyframes in time order. Never mutates the input. */
export function sortKeyframes(keyframes: readonly Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time);
}

/**
 * The value at `time`.
 *
 * Before the first keyframe and after the last, the value holds flat — an
 * animation does not extrapolate off the ends. Returns `null` only when there
 * are no keyframes at all.
 */
export function valueAt(
  keyframes: readonly Keyframe[],
  time: number,
): number | null {
  const ordered = sortKeyframes(keyframes);
  if (ordered.length === 0) {
    return null;
  }
  if (time <= ordered[0].time) {
    return ordered[0].value;
  }
  const last = ordered[ordered.length - 1];
  if (time >= last.time) {
    return last.value;
  }
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const from = ordered[index];
    const to = ordered[index + 1];
    if (time >= from.time && time <= to.time) {
      return segmentValue(from, to, time);
    }
  }
  return last.value;
}

/** The value inside one segment. */
function segmentValue(from: Keyframe, to: Keyframe, time: number): number {
  const span = to.time - from.time;
  if (span <= 0) {
    return to.value;
  }
  if (from.interpolation === "hold") {
    return from.value;
  }
  const progress = (time - from.time) / span;
  if (from.interpolation !== "bezier") {
    return from.value + (to.value - from.value) * progress;
  }
  const out = from.outHandle ?? { dx: span / 3, dy: 0 };
  const incoming = to.inHandle ?? { dx: -span / 3, dy: 0 };
  return bezierValueAt(
    { time: from.time, value: from.value },
    { time: from.time + out.dx, value: from.value + out.dy },
    { time: to.time + incoming.dx, value: to.value + incoming.dy },
    { time: to.time, value: to.value },
    time,
  );
}

type Point = { time: number; value: number };

function cubic(a: number, b: number, c: number, d: number, t: number): number {
  const inverse = 1 - t;
  return (
    inverse * inverse * inverse * a +
    3 * inverse * inverse * t * b +
    3 * inverse * t * t * c +
    t * t * t * d
  );
}

/**
 * Evaluates a cubic bezier at a given *time*.
 *
 * The curve is parametric, so the parameter is not the time — it has to be
 * solved for. Bisection is used rather than Newton's method: it cannot diverge
 * on the S-curves a hand-dragged handle produces, and 40 halvings resolve well
 * past a frame at any practical duration.
 */
export function bezierValueAt(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  time: number,
): number {
  let low = 0;
  let high = 1;
  for (let step = 0; step < 40; step += 1) {
    const mid = (low + high) / 2;
    if (cubic(p0.time, p1.time, p2.time, p3.time, mid) < time) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const t = (low + high) / 2;
  return cubic(p0.value, p1.value, p2.value, p3.value, t);
}

/** The keyframe nearest `time`, within `tolerance` seconds. */
export function keyframeAtTime(
  keyframes: readonly Keyframe[],
  time: number,
  tolerance: number,
): Keyframe | null {
  let best: Keyframe | null = null;
  let bestDistance = tolerance;
  for (const keyframe of keyframes) {
    const distance = Math.abs(keyframe.time - time);
    if (distance <= bestDistance) {
      best = keyframe;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Adds a keyframe, replacing any that already sits at the same time — two
 * keyframes at one instant have no meaning and would make the curve ambiguous.
 */
export function insertKeyframe(
  keyframes: readonly Keyframe[],
  keyframe: Keyframe,
): Keyframe[] {
  const kept = keyframes.filter(
    (entry) => Math.abs(entry.time - keyframe.time) > 1e-6,
  );
  return sortKeyframes([...kept, keyframe]);
}

/** Moves a keyframe in time and value. */
export function moveKeyframe(
  keyframes: readonly Keyframe[],
  id: string,
  time: number,
  value: number,
): Keyframe[] {
  return sortKeyframes(
    keyframes.map((keyframe) =>
      keyframe.id === id ? { ...keyframe, time, value } : keyframe,
    ),
  );
}

/** Removes a keyframe by id. */
export function removeKeyframe(
  keyframes: readonly Keyframe[],
  id: string,
): Keyframe[] {
  return keyframes.filter((keyframe) => keyframe.id !== id);
}

/** The value range a track plots over, derived from its data when unstated. */
export function trackRange(track: KeyframeTrack): { max: number; min: number } {
  if (track.min !== undefined && track.max !== undefined) {
    return { max: track.max, min: track.min };
  }
  const values = track.keyframes.map((keyframe) => keyframe.value);
  const low = track.min ?? (values.length > 0 ? Math.min(...values) : 0);
  const high = track.max ?? (values.length > 0 ? Math.max(...values) : 1);
  // A flat property would divide by zero when normalised; give it a unit span.
  return high > low ? { max: high, min: low } : { max: low + 1, min: low };
}

/** A value as a `0..1` fraction of its range, clamped. */
export function normaliseValue(
  value: number,
  range: { max: number; min: number },
): number {
  const span = range.max - range.min;
  if (span <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, (value - range.min) / span));
}

/** A sampled point on a plotted curve. */
export type CurveSample = { time: number; value: number };

/**
 * Samples a track's curve evenly across a window, for drawing. Sampling rather
 * than emitting bezier path segments keeps the drawing code identical for all
 * three interpolations — and a hold step plots correctly for free.
 */
export function curveSamples(
  keyframes: readonly Keyframe[],
  from: number,
  to: number,
  count: number,
): CurveSample[] {
  if (keyframes.length === 0 || count < 2 || to <= from) {
    return [];
  }
  const samples: CurveSample[] = [];
  for (let index = 0; index < count; index += 1) {
    const time = from + ((to - from) * index) / (count - 1);
    const value = valueAt(keyframes, time);
    if (value !== null) {
      samples.push({ time, value });
    }
  }
  return samples;
}
