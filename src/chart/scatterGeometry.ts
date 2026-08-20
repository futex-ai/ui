/**
 * Scatter, bubble and waterfall maths. Pure, so the sizing rule and the
 * nearest-point search are testable without rendering.
 */

export type ScatterPoint = {
  x: number;
  y: number;
  /** Bubble magnitude. Encoded as **area**, never radius. */
  size?: number | null;
  label?: string;
};

/**
 * Bubble radius for a magnitude.
 *
 * Area is proportional to value, so radius goes as the square root. Scaling
 * the radius directly is the classic bubble lie: doubling a value would
 * quadruple the ink and overstate it by 4×.
 */
export function bubbleRadius(
  value: number | null | undefined,
  maxValue: number,
  maxRadius: number,
  minRadius = 3,
): number {
  if (value == null || !Number.isFinite(value) || value <= 0 || maxValue <= 0) {
    return minRadius;
  }
  const fraction = Math.min(1, value / maxValue);
  return minRadius + (maxRadius - minRadius) * Math.sqrt(fraction);
}

/**
 * Index of the point nearest a position, or `-1` when nothing is in range.
 *
 * Dense scatter uses this instead of per-point hit targets: an 8px dot is a
 * pinpoint nobody lands on reliably, so the pointer only has to be *closest*
 * rather than dead-centre. `maxDistance` stops a click in empty space
 * selecting something across the plot.
 */
export function nearestPoint(
  points: readonly { x: number; y: number }[],
  x: number,
  y: number,
  maxDistance = Number.POSITIVE_INFINITY,
): number {
  let best = -1;
  let bestSquared = maxDistance * maxDistance;
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i].x - x;
    const dy = points[i].y - y;
    const squared = dx * dx + dy * dy;
    if (squared <= bestSquared) {
      best = i;
      bestSquared = squared;
    }
  }
  return best;
}

/** One waterfall bar: where it starts and ends on the running total. */
export type WaterfallStep = {
  id: string;
  label: string;
  /** The change this step contributes, or the absolute value of a total. */
  value: number;
  /** Running total before this step. */
  start: number;
  /** Running total after it. */
  end: number;
  kind: "increase" | "decrease" | "total";
};

export type WaterfallInput = {
  id: string;
  label?: string;
  value: number;
  /**
   * Mark this entry as a subtotal or final total: it is drawn from the
   * baseline to the running total rather than as a delta bridging from the
   * previous bar.
   */
  isTotal?: boolean;
};

/**
 * Bridge a series of deltas to a total.
 *
 * A total bar restates the running sum rather than adding to it — treating it
 * as another delta would double-count and is the single most common way a
 * waterfall lies.
 */
export function waterfallSteps(
  entries: readonly WaterfallInput[],
): WaterfallStep[] {
  const steps: WaterfallStep[] = [];
  let running = 0;
  for (const entry of entries) {
    if (!Number.isFinite(entry.value)) {
      continue;
    }
    if (entry.isTotal) {
      steps.push({
        id: entry.id,
        label: entry.label ?? entry.id,
        value: running,
        start: 0,
        end: running,
        kind: "total",
      });
      continue;
    }
    const start = running;
    running += entry.value;
    steps.push({
      id: entry.id,
      label: entry.label ?? entry.id,
      value: entry.value,
      start,
      end: running,
      kind: entry.value >= 0 ? "increase" : "decrease",
    });
  }
  return steps;
}

/** The value range a waterfall must cover, including every intermediate total. */
export function waterfallExtent(
  steps: readonly WaterfallStep[],
): [number, number] {
  if (steps.length === 0) {
    return [0, 1];
  }
  const bounds = steps.flatMap((step) => [step.start, step.end]);
  return [Math.min(0, ...bounds), Math.max(0, ...bounds)];
}
