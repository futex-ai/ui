/**
 * Series shaping — normalizing input, stacking, percent-stacking, splitting
 * about a baseline and binning. Pure functions over plain arrays, so every rule
 * here is unit-testable without rendering anything.
 *
 * One invariant runs through all of it: **`null` is a gap, never a zero.** A
 * missing measurement and a measured zero are different facts, and collapsing
 * them silently invents data.
 */
import type { ColorableSeries } from "../chartPalette";

/** A chart series as callers supply it. */
export type ChartSeries = ColorableSeries & {
  /** Legend, tooltip and table-view label. Defaults to `id`. */
  label?: string;
  /** One value per category; `null` is a gap. */
  data: readonly (number | null)[];
};

/** A series padded to the category count, with its resolved label. */
export type NormalizedSeries = {
  id: string;
  label: string;
  color?: string;
  data: (number | null)[];
};

/**
 * Pad or trim every series to `length`, and resolve labels. Short series are
 * padded with `null` (a gap) rather than `0`, so a series that starts late
 * leaves empty space instead of a false floor.
 */
export function normalizeSeries(
  series: readonly ChartSeries[],
  length: number,
): NormalizedSeries[] {
  return series.map((entry) => {
    const data: (number | null)[] = [];
    for (let i = 0; i < length; i += 1) {
      const value = entry.data[i];
      data.push(value == null || !Number.isFinite(value) ? null : value);
    }
    return {
      id: entry.id,
      label: entry.label ?? entry.id,
      color: entry.color,
      data,
    };
  });
}

/** One stacked segment: where it starts and ends on the value axis. */
export type StackSegment = {
  seriesId: string;
  index: number;
  /** `null` when the series has no value at this category. */
  value: number | null;
  start: number;
  end: number;
};

/**
 * Stack series cumulatively per category.
 *
 * Negative values stack downward from zero and positive upward, so a stack
 * containing both does not fold back over itself. Gaps contribute nothing and
 * do not break the running total for the series above them.
 */
export function stackSeries(
  series: readonly NormalizedSeries[],
  length: number,
): StackSegment[] {
  const segments: StackSegment[] = [];
  for (let index = 0; index < length; index += 1) {
    let positive = 0;
    let negative = 0;
    for (const entry of series) {
      const value = entry.data[index];
      if (value == null) {
        segments.push({
          seriesId: entry.id,
          index,
          value: null,
          start: 0,
          end: 0,
        });
        continue;
      }
      if (value >= 0) {
        segments.push({
          seriesId: entry.id,
          index,
          value,
          start: positive,
          end: positive + value,
        });
        positive += value;
      } else {
        segments.push({
          seriesId: entry.id,
          index,
          value,
          start: negative + value,
          end: negative,
        });
        negative += value;
      }
    }
  }
  return segments;
}

/**
 * Stack to 100% per category. Categories whose total is zero (or entirely
 * gaps) produce gaps rather than dividing by zero — a column with no data
 * should be empty, not full.
 */
export function percentStack(
  series: readonly NormalizedSeries[],
  length: number,
): StackSegment[] {
  const segments: StackSegment[] = [];
  for (let index = 0; index < length; index += 1) {
    let total = 0;
    for (const entry of series) {
      const value = entry.data[index];
      if (value != null) {
        total += Math.abs(value);
      }
    }
    let cursor = 0;
    for (const entry of series) {
      const value = entry.data[index];
      if (value == null || total === 0) {
        segments.push({
          seriesId: entry.id,
          index,
          value: null,
          start: 0,
          end: 0,
        });
        continue;
      }
      const share = Math.abs(value) / total;
      segments.push({
        seriesId: entry.id,
        index,
        value: share,
        start: cursor,
        end: cursor + share,
      });
      cursor += share;
    }
  }
  return segments;
}

/** The sum of every series at a category, ignoring gaps. */
export function totalAt(
  series: readonly NormalizedSeries[],
  index: number,
): number {
  let total = 0;
  for (const entry of series) {
    const value = entry.data[index];
    if (value != null) {
      total += value;
    }
  }
  return total;
}

/**
 * Split values about a baseline for a diverging bar chart: how far each value
 * sits above or below it, and which side it falls on.
 */
export function divergingSplit(
  values: readonly (number | null)[],
  baseline = 0,
): {
  index: number;
  delta: number | null;
  side: "positive" | "negative" | "zero";
}[] {
  return values.map((value, index) => {
    if (value == null) {
      return { index, delta: null, side: "zero" as const };
    }
    const delta = value - baseline;
    return {
      index,
      delta,
      side:
        delta > 0
          ? ("positive" as const)
          : delta < 0
            ? ("negative" as const)
            : ("zero" as const),
    };
  });
}

/** A histogram bin: a half-open interval `[start, end)` and its count. */
export type Bin = { start: number; end: number; count: number };

/**
 * Bin values into equal-width buckets for a histogram.
 *
 * The final bin is closed at both ends so the maximum value is counted rather
 * than falling off the end — an off-by-one that silently loses the largest
 * observation.
 */
export function binValues(
  values: readonly (number | null)[],
  binCount = 10,
): Bin[] {
  const finite = values.filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
  if (finite.length === 0 || binCount < 1) {
    return [];
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) {
    // Every observation identical: one bin holding all of them.
    return [{ start: min, end: min, count: finite.length }];
  }
  const count = Math.floor(binCount);
  const width = (max - min) / count;
  const bins: Bin[] = Array.from({ length: count }, (_, i) => ({
    start: min + i * width,
    end: min + (i + 1) * width,
    count: 0,
  }));
  for (const value of finite) {
    const raw = Math.floor((value - min) / width);
    bins[Math.min(count - 1, Math.max(0, raw))].count += 1;
  }
  return bins;
}

/**
 * Fold series past `slots` into a single summed "Other".
 *
 * Only honest where the total means something — stacked bars, stacked and
 * percent areas. A summed "Other" line can dwarf every real series, and for
 * grouped bars it means nothing at all, so those forms use the de-emphasis
 * policy in `chartPalette` instead of calling this.
 */
export function foldToOther(
  series: readonly NormalizedSeries[],
  slots: number,
  otherId: string,
  otherLabel = "Other",
): NormalizedSeries[] {
  if (series.length <= slots) {
    return [...series];
  }
  const kept = series.slice(0, slots);
  const tail = series.slice(slots);
  const length = series[0]?.data.length ?? 0;
  const data: (number | null)[] = [];
  for (let index = 0; index < length; index += 1) {
    let sum: number | null = null;
    for (const entry of tail) {
      const value = entry.data[index];
      if (value != null) {
        sum = (sum ?? 0) + value;
      }
    }
    // All-gap across the tail stays a gap rather than becoming a zero.
    data.push(sum);
  }
  return [...kept, { id: otherId, label: otherLabel, data }];
}
