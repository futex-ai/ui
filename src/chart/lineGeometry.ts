/**
 * Line and area path construction. Pure, so the curve maths and the gap
 * handling are testable without rendering.
 */
import type { LinearScale } from "./scale/linear";

/** A resolved vertex, or `null` where the series has a gap. */
export type LinePoint = { x: number; y: number } | null;

/** How consecutive points are joined. */
export type LineCurve = "linear" | "monotone" | "step";

/**
 * Project a series onto the plot. `null` data stays `null` so gaps survive
 * into the path builder rather than being interpolated over — drawing straight
 * through a missing measurement invents data that was never collected.
 */
export function projectPoints(
  data: readonly (number | null)[],
  positionAt: (index: number) => number,
  value: LinearScale,
): LinePoint[] {
  return data.map((datum, index) =>
    datum == null ? null : { x: positionAt(index), y: value.scale(datum) },
  );
}

/** Split a projected series into runs of consecutive non-null points. */
export function segments(
  points: readonly LinePoint[],
): { x: number; y: number }[][] {
  const runs: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (const point of points) {
    if (point === null) {
      if (current.length > 0) {
        runs.push(current);
        current = [];
      }
      continue;
    }
    current.push(point);
  }
  if (current.length > 0) {
    runs.push(current);
  }
  return runs;
}

/**
 * Build the stroke path for a series, one `M` per run so gaps are real breaks
 * rather than straight lines across missing data.
 */
export function linePath(
  points: readonly LinePoint[],
  curve: LineCurve = "linear",
): string {
  return segments(points)
    .map((run) => runPath(run, curve))
    .filter(Boolean)
    .join(" ");
}

function runPath(run: { x: number; y: number }[], curve: LineCurve): string {
  if (run.length === 0) {
    return "";
  }
  if (run.length === 1) {
    // A lone point has no line to draw; the marker layer renders it instead.
    return "";
  }
  if (curve === "step") {
    let d = `M${run[0].x},${run[0].y}`;
    for (let i = 1; i < run.length; i += 1) {
      // Hold the previous value until the new x, then jump — the shape of a
      // value that changes at a moment rather than drifting between them.
      d += `H${run[i].x}V${run[i].y}`;
    }
    return d;
  }
  if (curve === "monotone") {
    return monotonePath(run);
  }
  return (
    `M${run[0].x},${run[0].y}` +
    run
      .slice(1)
      .map((p) => `L${p.x},${p.y}`)
      .join("")
  );
}

/**
 * A monotone cubic (Fritsch–Carlson) spline.
 *
 * Chosen over a plain cardinal spline because it **cannot overshoot**: a
 * smoothed line that dips below zero between two positive points, or invents a
 * peak higher than any measurement, is showing data that does not exist.
 */
export function monotonePath(
  points: readonly { x: number; y: number }[],
): string {
  const n = points.length;
  if (n < 2) {
    return "";
  }
  if (n === 2) {
    return `M${points[0].x},${points[0].y}L${points[1].x},${points[1].y}`;
  }

  // Secant slopes between consecutive points.
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const h = points[i + 1].x - points[i].x;
    dx.push(h);
    slope.push(h === 0 ? 0 : (points[i + 1].y - points[i].y) / h);
  }

  // Tangents, initialised to the one-sided differences at the ends.
  const tangent: number[] = new Array(n).fill(0);
  tangent[0] = slope[0];
  tangent[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) {
      // A local extremum: flatten the tangent so the curve cannot overshoot.
      tangent[i] = 0;
    } else {
      tangent[i] = (slope[i - 1] + slope[i]) / 2;
    }
  }
  // Fritsch–Carlson limiter keeps each tangent inside three times the
  // neighbouring secant, which is what guarantees monotonicity.
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      tangent[i] = 0;
      tangent[i + 1] = 0;
      continue;
    }
    const a = tangent[i] / slope[i];
    const b = tangent[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = (3 / Math.sqrt(s)) * slope[i];
      tangent[i] = t * a;
      tangent[i + 1] = t * b;
    }
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = dx[i];
    d +=
      `C${points[i].x + h / 3},${points[i].y + (tangent[i] * h) / 3}` +
      ` ${points[i + 1].x - h / 3},${points[i + 1].y - (tangent[i + 1] * h) / 3}` +
      ` ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

/**
 * Close a line into a filled area against a baseline.
 *
 * Each gap run is filled separately, so a break in the data leaves a hole in
 * the fill rather than a wedge bridging it.
 */
export function areaPath(
  points: readonly LinePoint[],
  baselineY: number,
  curve: LineCurve = "linear",
): string {
  return segments(points)
    .map((run) => {
      if (run.length === 0) {
        return "";
      }
      const top = runPath(run, curve) || `M${run[0].x},${run[0].y}`;
      const last = run[run.length - 1];
      return `${top}L${last.x},${baselineY}L${run[0].x},${baselineY}Z`;
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Band path between two stacked edges, used for stacked areas: the upper edge
 * forward, the lower edge back.
 */
export function bandPath(
  upper: readonly LinePoint[],
  lower: readonly LinePoint[],
  curve: LineCurve = "linear",
): string {
  const top = segments(upper);
  const bottom = segments(lower);
  if (top.length === 0) {
    return "";
  }
  return top
    .map((run, i) => {
      const under = bottom[i] ?? [];
      if (under.length === 0) {
        return "";
      }
      const forward = runPath(run, curve);
      const back = [...under]
        .reverse()
        .map((p) => `L${p.x},${p.y}`)
        .join("");
      return `${forward}${back}Z`;
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * The index whose x position is nearest a pointer.
 *
 * This is what lets the crosshair snap: a reader aims at a date, never at a 2px
 * line. Returns `-1` for an empty series.
 */
export function nearestIndexByX(
  positions: readonly number[],
  x: number,
): number {
  if (positions.length === 0) {
    return -1;
  }
  let best = 0;
  let bestDistance = Math.abs(positions[0] - x);
  for (let i = 1; i < positions.length; i += 1) {
    const distance = Math.abs(positions[i] - x);
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}
