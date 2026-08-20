/**
 * Series colour assignment — the one place a chart decides which hue a series
 * wears. Pure and framework-free so the rules are unit-testable.
 */
import { devWarn } from "../devWarn";
import type { SharedUiChartColors } from "../chartTheme";

/** The minimum a chart series must expose for colour assignment. */
export type ColorableSeries = {
  /** Stable identity. Drives the slot — never the array index after filtering. */
  id: string;
  /** Explicit override, for emphasis and status charts. */
  color?: string;
};

/**
 * What a chart form does when handed more series than the palette has slots.
 *
 * Never generate a ninth hue: it would be indistinguishable from an existing
 * slot under simulated colour-vision deficiency, and it breaks the ordering
 * that makes the palette safe.
 */
export type SeriesOverflowPolicy =
  /**
   * Merge the tail into a single summed "Other" series. Honest only where the
   * total is meaningful — stacked bars, stacked and percent areas.
   */
  | "fold"
  /**
   * Keep every series but paint the tail in the de-emphasis grey. The right
   * choice for lines, grouped bars and scatter, where a summed "Other" would
   * either dwarf the real series or mean nothing at all.
   */
  | "deemphasize";

/**
 * Chart forms where any two marks can end up side by side (scatter, bubble,
 * small multiples). The palette validates only its first four slots under that
 * harder all-pairs test, and the fourth needs secondary encoding in dark mode,
 * so these forms carry a hard cap the category-indexed forms do not.
 */
export const ALL_PAIRS_SERIES_CAP = 4;

/** Slots that validate all-pairs cleanly in both modes, with no caveat. */
export const ALL_PAIRS_CLEAN_CAP = 3;

/** The identity given to the merged tail when the policy is `"fold"`. */
export const OTHER_SERIES_ID = "__other__";

export type SeriesColorOptions = {
  /**
   * Highlight one series and grey the rest — the emphasis form. Often the
   * honest answer to "make this chart clearer": the story is one series, not
   * eight identities.
   */
  emphasisId?: string;
  /**
   * Map a series to a reserved status role. Use only when the series *means*
   * good/bad (error rate, pass/fail); a series that is merely "the fourth one"
   * wears a categorical slot. Status marks must ship an icon and a label too,
   * since two of the four status colours sit below 3:1 on a light surface.
   */
  statusOf?: (id: string) => keyof SharedUiChartColors["status"] | undefined;
  /** Defaults to `"deemphasize"`, the policy that never invents a total. */
  overflow?: SeriesOverflowPolicy;
  /** Apply the stricter all-pairs cap (scatter, bubble, small multiples). */
  allPairs?: boolean;
  /** Names the chart in overflow warnings. */
  chartName?: string;
};

export type SeriesColorAssignment = {
  /** Resolved colour per series id, in the order the series were given. */
  colorById: ReadonlyMap<string, string>;
  /** Ids beyond the palette's slots, in order. Empty when nothing overflowed. */
  overflowIds: readonly string[];
  /** Whether the overflow tail should be summed into one "Other" series. */
  fold: boolean;
};

/**
 * Assign a colour to every series.
 *
 * Slots follow the position of a series in the **full** list it was given, not
 * its position among the currently visible ones, so hiding a series through a
 * legend never repaints the survivors — a reader who learned "Acme is blue"
 * stays right. Consumers that filter series upstream should keep passing the
 * whole list and hide through `hiddenSeriesIds` instead.
 */
export function assignSeriesColors(
  series: readonly ColorableSeries[],
  charts: SharedUiChartColors,
  options: SeriesColorOptions = {},
): SeriesColorAssignment {
  const {
    emphasisId,
    statusOf,
    overflow = "deemphasize",
    allPairs = false,
    chartName = "Chart",
  } = options;

  const slots = allPairs
    ? Math.min(ALL_PAIRS_SERIES_CAP, charts.series.length)
    : charts.series.length;
  const colorById = new Map<string, string>();
  const overflowIds: string[] = [];

  series.forEach((entry, index) => {
    if (index >= slots) {
      overflowIds.push(entry.id);
    }
    colorById.set(
      entry.id,
      resolveOne(entry, index, slots, charts, { emphasisId, statusOf }),
    );
  });

  if (overflowIds.length > 0) {
    warnOverflow(chartName, series.length, slots, overflow, allPairs);
  }
  if (allPairs && series.length > ALL_PAIRS_CLEAN_CAP) {
    devWarn(
      `${chartName}: ${series.length} series in an all-pairs form. Only the ` +
        `first ${ALL_PAIRS_CLEAN_CAP} slots separate cleanly in both light and ` +
        `dark; slot ${ALL_PAIRS_CLEAN_CAP + 1} sits in the colour-vision floor ` +
        `band in dark mode, so it needs secondary encoding (marker shape or ` +
        `direct labels).`,
    );
  }

  return { colorById, overflowIds, fold: overflow === "fold" };
}

/** Resolve a single series' colour, applying the overrides in priority order. */
function resolveOne(
  entry: ColorableSeries,
  index: number,
  slots: number,
  charts: SharedUiChartColors,
  options: Pick<SeriesColorOptions, "emphasisId" | "statusOf">,
): string {
  // An explicit per-series colour always wins: it is the caller's escape hatch.
  if (entry.color) {
    return entry.color;
  }
  // Status next — a series that *means* good/bad must not also wear identity.
  const status = options.statusOf?.(entry.id);
  if (status) {
    return charts.status[status];
  }
  // Emphasis: exactly one series keeps a hue, everything else recedes.
  if (options.emphasisId !== undefined) {
    return entry.id === options.emphasisId
      ? charts.series[0]
      : charts.deemphasis;
  }
  // Past the last slot, recede rather than cycle back to slot 1.
  return index < slots ? charts.series[index] : charts.deemphasis;
}

function warnOverflow(
  chartName: string,
  count: number,
  slots: number,
  overflow: SeriesOverflowPolicy,
  allPairs: boolean,
): void {
  const remedy =
    overflow === "fold"
      ? `The tail is folded into one "Other" series.`
      : `The tail renders in the de-emphasis grey; fold it yourself or facet ` +
        `into small multiples.`;
  const why = allPairs
    ? `this form caps at ${slots} because any two marks can sit side by side`
    : `the palette has ${slots} slots and never cycles`;
  devWarn(`${chartName}: ${count} series but ${why}. ${remedy}`);
}

/**
 * Pick a colour from an ordered ramp for a value's position in `[0, 1]`.
 * Used by the sequential (continuous magnitude) and ordinal (discrete ordered
 * marks) scales alike — the difference is which ramp is passed in.
 */
export function rampColor(fraction: number, ramp: readonly string[]): string {
  if (ramp.length === 0) {
    throw new Error("rampColor: ramp is empty");
  }
  if (!Number.isFinite(fraction)) {
    return ramp[0];
  }
  const clamped = Math.min(1, Math.max(0, fraction));
  const index = Math.round(clamped * (ramp.length - 1));
  return ramp[index];
}

/**
 * Split a signed value across the diverging pair. The neutral midpoint is
 * returned for zero so "no change" reads as nothing rather than as a weak
 * version of one pole.
 */
export function divergingColor(
  value: number,
  diverging: SharedUiChartColors["diverging"],
): string {
  if (!Number.isFinite(value) || value === 0) {
    return diverging.neutral;
  }
  return value > 0 ? diverging.positive : diverging.negative;
}
