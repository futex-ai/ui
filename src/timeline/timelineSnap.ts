/**
 * Snapping for timeline edits.
 *
 * Tolerance is expressed in **pixels** and converted to seconds at the current
 * zoom, so snapping feels the same whether the ruler shows frames or minutes —
 * a fixed tolerance in seconds would be unusably sticky when zoomed out and
 * unreachable when zoomed in.
 */
import {
  clipEnd,
  type TimelineClipData,
  type TimelineMarker,
} from "./timelineTypes";

export type SnapCandidateOptions = {
  clips: readonly TimelineClipData[];
  /** The project end, included so clips can snap flush to it. */
  duration?: number;
  /** Clips being dragged: their own edges must not attract them. */
  excludeClipIds?: readonly string[];
  markers?: readonly TimelineMarker[];
  /** Include the playhead. Omit to leave it out. */
  playheadTime?: number;
  /** Include zero. Default `true`. */
  includeZero?: boolean;
};

/**
 * Every time an edit can snap to, ascending and de-duplicated: both edges of
 * every other clip, the markers, the playhead, zero, and the project end.
 */
export function snapCandidates(options: SnapCandidateOptions): number[] {
  const excluded = new Set(options.excludeClipIds ?? []);
  const times = new Set<number>();
  if (options.includeZero ?? true) {
    times.add(0);
  }
  for (const clip of options.clips) {
    if (excluded.has(clip.id)) {
      continue;
    }
    times.add(clip.start);
    times.add(clipEnd(clip));
  }
  for (const marker of options.markers ?? []) {
    times.add(marker.time);
  }
  if (options.playheadTime !== undefined) {
    times.add(options.playheadTime);
  }
  if (options.duration !== undefined) {
    times.add(options.duration);
  }
  return [...times].sort((a, b) => a - b);
}

/** How many seconds `tolerancePx` covers at the current zoom. */
export function snapToleranceSeconds(
  pixelsPerSecond: number,
  tolerancePx = 8,
): number {
  return pixelsPerSecond > 0 ? tolerancePx / pixelsPerSecond : 0;
}

export type TimelineSnapResult = {
  /** Whether a candidate was within tolerance. */
  snapped: boolean;
  /** The candidate that attracted the time, for drawing the snap indicator. */
  target: number | null;
  /** The resolved time — the candidate when snapped, the input otherwise. */
  time: number;
};

/** Pulls `time` to the nearest candidate within `tolerance`. */
export function snapTime(
  time: number,
  candidates: readonly number[],
  tolerance: number,
): TimelineSnapResult {
  if (tolerance <= 0 || candidates.length === 0) {
    return { snapped: false, target: null, time };
  }
  let best: number | null = null;
  let bestDistance = tolerance;
  for (const candidate of candidates) {
    const distance = Math.abs(candidate - time);
    if (distance <= bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best === null
    ? { snapped: false, target: null, time }
    : { snapped: true, target: best, time: best };
}

export type TimelineSnapOffset = {
  /** Amount to add to every dragged edge, `0` when nothing snapped. */
  delta: number;
  /** The candidate that attracted the drag, for the snap indicator. */
  target: number | null;
};

/**
 * Resolves a snap for a *group* drag: any of the moving edges may catch a
 * candidate, and whichever is closest wins for all of them. This is what makes
 * a multi-clip selection snap by its leading edge in one direction and its
 * trailing edge in the other, the way a single clip does.
 */
export function snapOffset(
  edges: readonly number[],
  candidates: readonly number[],
  tolerance: number,
): TimelineSnapOffset {
  if (tolerance <= 0 || edges.length === 0 || candidates.length === 0) {
    return { delta: 0, target: null };
  }
  let delta = 0;
  let target: number | null = null;
  let bestDistance = tolerance;
  for (const edge of edges) {
    for (const candidate of candidates) {
      const distance = Math.abs(candidate - edge);
      if (distance < bestDistance) {
        bestDistance = distance;
        delta = candidate - edge;
        target = candidate;
      }
    }
  }
  return { delta, target };
}
