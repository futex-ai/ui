/**
 * Arc, slice and trapezoid geometry — the radial and tapered forms.
 * Pure, so the angle maths is testable without rendering.
 */

/** A resolved slice of a donut or pie. */
export type PieSlice = {
  id: string;
  value: number;
  /** Share of the total, `0..1`. */
  fraction: number;
  /** Angles in radians, measured clockwise from 12 o'clock. */
  startAngle: number;
  endAngle: number;
};

/**
 * Part-to-whole slices.
 *
 * Negative and non-finite values are dropped rather than folded in: a negative
 * share of a whole is meaningless, and silently taking its absolute value would
 * misstate the total. An all-zero total yields no slices instead of dividing by
 * zero.
 */
export function pieSlices(
  entries: readonly { id: string; value: number | null }[],
  gapAngle = 0,
): PieSlice[] {
  const usable = entries.filter(
    (entry): entry is { id: string; value: number } =>
      entry.value != null && Number.isFinite(entry.value) && entry.value > 0,
  );
  const total = usable.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0) {
    return [];
  }
  const slices: PieSlice[] = [];
  let cursor = 0;
  for (const entry of usable) {
    const fraction = entry.value / total;
    const sweep = fraction * Math.PI * 2;
    slices.push({
      id: entry.id,
      value: entry.value,
      fraction,
      // Half the gap is taken from each side so every slice keeps its centre.
      startAngle: cursor + gapAngle / 2,
      endAngle: cursor + sweep - gapAngle / 2,
    });
    cursor += sweep;
  }
  return slices;
}

/** A point on a circle, with 0 radians at 12 o'clock and angles clockwise. */
export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  // Screen y grows downward, so subtract the cosine component.
  return {
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  };
}

/**
 * An annular sector — the donut slice, or a gauge arc when `innerRadius` is
 * given. A full circle is split into two arcs because a single SVG arc command
 * cannot express 360° (start and end coincide and nothing is drawn).
 */
export function arcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (!Number.isFinite(sweep) || sweep <= 0 || outerRadius <= 0) {
    return "";
  }
  if (sweep >= Math.PI * 2 - 1e-6) {
    return fullRing(cx, cy, innerRadius, outerRadius);
  }
  const largeArc = sweep > Math.PI ? 1 : 0;
  const outerStart = polarPoint(cx, cy, outerRadius, startAngle);
  const outerEnd = polarPoint(cx, cy, outerRadius, endAngle);

  if (innerRadius <= 0) {
    // A solid wedge back to the centre.
    return (
      `M${cx},${cy}L${outerStart.x},${outerStart.y}` +
      `A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}Z`
    );
  }
  const innerEnd = polarPoint(cx, cy, innerRadius, endAngle);
  const innerStart = polarPoint(cx, cy, innerRadius, startAngle);
  return (
    `M${outerStart.x},${outerStart.y}` +
    `A${outerRadius},${outerRadius} 0 ${largeArc} 1 ${outerEnd.x},${outerEnd.y}` +
    `L${innerEnd.x},${innerEnd.y}` +
    `A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerStart.x},${innerStart.y}Z`
  );
}

/** A closed ring, drawn as two half-arcs so 360° actually renders. */
function fullRing(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
): string {
  const ring = (r: number, sweepFlag: number) =>
    `M${cx},${cy - r}` +
    `A${r},${r} 0 1 ${sweepFlag} ${cx},${cy + r}` +
    `A${r},${r} 0 1 ${sweepFlag} ${cx},${cy - r}Z`;
  if (innerRadius <= 0) {
    return ring(outerRadius, 1);
  }
  // Opposite sweep on the inner ring punches the hole via the even-odd rule.
  return `${ring(outerRadius, 1)} ${ring(innerRadius, 0)}`;
}

/**
 * A gauge arc spanning `startAngle` to `endAngle` at a given fill fraction.
 * Defaults to a 270° dial opening at the bottom, which reads as a dial rather
 * than as an incomplete circle.
 */
export const GAUGE_START = -Math.PI * 0.75;
export const GAUGE_SWEEP = Math.PI * 1.5;

export function gaugeAngles(
  fraction: number,
  start = GAUGE_START,
  sweep = GAUGE_SWEEP,
): { startAngle: number; endAngle: number } {
  const clamped = Number.isFinite(fraction)
    ? Math.min(1, Math.max(0, fraction))
    : 0;
  return { startAngle: start, endAngle: start + sweep * clamped };
}

/** One funnel stage: a trapezoid tapering toward the next stage's width. */
export type FunnelStage = {
  id: string;
  value: number;
  /** Share of the first stage, `0..1` — the conversion from the top. */
  fromTop: number;
  /** Share of the previous stage, `0..1` — the step conversion. */
  fromPrevious: number;
  /** Corner points, clockwise from the top-left. */
  points: { x: number; y: number }[];
};

/**
 * Lay funnel stages out as tapering trapezoids.
 *
 * Widths are proportional to value, so the shape itself carries the drop-off.
 * Both conversion rates are reported because they answer different questions:
 * "how many made it this far" and "where did we lose them".
 */
export function funnelStages(
  entries: readonly { id: string; value: number | null }[],
  width: number,
  height: number,
  gap = 2,
): FunnelStage[] {
  const usable = entries.filter(
    (entry): entry is { id: string; value: number } =>
      entry.value != null && Number.isFinite(entry.value) && entry.value >= 0,
  );
  if (usable.length === 0 || width <= 0 || height <= 0) {
    return [];
  }
  const top = usable[0].value;
  const stageHeight = (height - gap * (usable.length - 1)) / usable.length;
  if (stageHeight <= 0) {
    return [];
  }

  return usable.map((entry, index) => {
    const next = usable[index + 1];
    const widthAt = (value: number) =>
      top > 0 ? (value / top) * width : width;
    const upper = widthAt(entry.value);
    // Taper toward the next stage so the slope shows the loss; the last stage
    // is a rectangle because there is nothing after it to taper to.
    const lower = next ? widthAt(next.value) : upper;
    const y = index * (stageHeight + gap);
    return {
      id: entry.id,
      value: entry.value,
      fromTop: top > 0 ? entry.value / top : 0,
      fromPrevious:
        index === 0
          ? 1
          : usable[index - 1].value > 0
            ? entry.value / usable[index - 1].value
            : 0,
      points: [
        { x: (width - upper) / 2, y },
        { x: (width + upper) / 2, y },
        { x: (width + lower) / 2, y: y + stageHeight },
        { x: (width - lower) / 2, y: y + stageHeight },
      ],
    };
  });
}

/** Turn a stage's corner points into an SVG polygon `points` attribute. */
export function polygonPoints(
  points: readonly { x: number; y: number }[],
): string {
  return points.map((p) => `${p.x},${p.y}`).join(" ");
}
