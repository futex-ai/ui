/**
 * Tick selection. Axis ticks carry every value the chart did not directly
 * label, so they have to land on numbers a reader recognises — 0 / 1,000 /
 * 2,000, not 0 / 1,167 / 2,334.
 */

/** Round a step up to the nearest 1, 2, 5 or 10 × a power of ten. */
function niceStep(rough: number): number {
  if (rough <= 0 || !Number.isFinite(rough)) {
    return 1;
  }
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  // 1, 2, 5, 10 are the steps people read fluently; 2.5 and 7.5 are not.
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Evenly spaced "nice" ticks covering `[min, max]`.
 *
 * The domain is widened outward to the nearest step so the axis ends on a round
 * number rather than on the data's extreme — otherwise the top gridline sits at
 * 4,873 and reads as noise.
 */
export function niceTicks(
  min: number,
  max: number,
  count = 5,
): { ticks: number[]; domain: [number, number] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { ticks: [0, 1], domain: [0, 1] };
  }
  if (min === max) {
    // A flat series still needs two ticks to render an axis against.
    const pad = Math.abs(min) || 1;
    return {
      ticks: [min - pad, min, min + pad],
      domain: [min - pad, min + pad],
    };
  }
  const target = Math.max(2, Math.floor(count));
  const step = niceStep((max - min) / target);
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  // Accumulate by index rather than repeated addition: += step drifts on
  // floating point and produces ticks like 0.30000000000000004.
  const steps = Math.round((end - start) / step);
  for (let i = 0; i <= steps; i += 1) {
    ticks.push(roundToStep(start + i * step, step));
  }
  return { ticks, domain: [start, end] };
}

/** Trim floating-point noise introduced by multiplying a fractional step. */
function roundToStep(value: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  const factor = 10 ** Math.min(12, decimals);
  return Math.round(value * factor) / factor;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Candidate time intervals, coarsest-last, in milliseconds. */
const TIME_STEPS = [
  MINUTE,
  5 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  WEEK,
  2 * WEEK,
];

/**
 * Ticks for a time axis, on calendar-aware intervals rather than arbitrary
 * millisecond fractions — a reader recognises "1 Mar", not "Mar 3 14:23".
 *
 * Months and years are stepped on real calendar boundaries (they are not a
 * fixed number of milliseconds), which is why they are handled separately from
 * the fixed-width steps.
 */
export function niceTimeTicks(
  minMs: number,
  maxMs: number,
  count = 5,
): number[] {
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || minMs > maxMs) {
    return [];
  }
  if (minMs === maxMs) {
    return [minMs];
  }
  const span = maxMs - minMs;
  const rough = span / Math.max(2, count);

  if (rough > 2 * WEEK) {
    return calendarTicks(minMs, maxMs, rough);
  }
  const step =
    TIME_STEPS.find((s) => s >= rough) ?? TIME_STEPS[TIME_STEPS.length - 1];
  const ticks: number[] = [];
  // Align to the step so hours land on the hour, days on midnight.
  let t = Math.ceil(minMs / step) * step;
  while (t <= maxMs) {
    ticks.push(t);
    t += step;
  }
  return ticks;
}

/** Month- or year-stepped ticks, walked on the calendar. */
function calendarTicks(minMs: number, maxMs: number, rough: number): number[] {
  const MONTH = 30 * DAY;
  const monthsPerStep =
    rough > 12 * MONTH
      ? Math.max(12, Math.round(rough / MONTH / 12) * 12)
      : rough > 3 * MONTH
        ? 6
        : rough > MONTH
          ? 3
          : 1;
  const start = new Date(minMs);
  const cursor = new Date(
    start.getFullYear(),
    Math.ceil(start.getMonth() / monthsPerStep) * monthsPerStep,
    1,
  );
  const ticks: number[] = [];
  while (cursor.getTime() <= maxMs) {
    if (cursor.getTime() >= minMs) {
      ticks.push(cursor.getTime());
    }
    cursor.setMonth(cursor.getMonth() + monthsPerStep);
  }
  return ticks;
}

/**
 * Compact a number for an axis tick or a stat value: 1,284 / 12.9K / $4.2M.
 * Thousands are comma-grouped below the compaction threshold so mid-range
 * values stay exact.
 */
export function compactNumber(value: number, maxFractionDigits = 1): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const abs = Math.abs(value);
  if (abs < 10_000) {
    return groupThousands(value);
  }
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const scaled = value / size;
      // Drop a trailing ".0" so 12.0K reads as 12K.
      const text = scaled.toFixed(
        Math.abs(scaled) >= 100 ? 0 : maxFractionDigits,
      );
      return `${text.replace(/\.0+$/, "")}${suffix}`;
    }
  }
  return groupThousands(value);
}

/** Comma-group the integer part, preserving any decimals. */
export function groupThousands(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const [whole, fraction] = String(value).split(".");
  const sign = whole.startsWith("-") ? "-" : "";
  const digits = sign ? whole.slice(1) : whole;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${sign}${grouped}.${fraction}` : `${sign}${grouped}`;
}
