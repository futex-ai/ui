/**
 * The `charts` slice of the shared theme: data-visualization colour roles and
 * the rules for resolving them from a theme's palette.
 *
 * Kept out of `theme.tsx` so the token documentation there stays readable. The
 * raw validated scale values live in `./chartScales`; this module decides which
 * of them a given theme gets and derives the chart furniture from the theme's
 * own neutrals.
 */
import { CHART_SEQUENTIAL, CHART_STATUS, chartScalesFor } from "./chartScales";
import type { SharedUiColors, SharedUiScheme, SharedUiTheme } from "./theme";

/**
 * Data-visualization colour roles. Each encodes exactly one job, and mixing
 * them is what makes a chart misread: identity (`series`), magnitude
 * (`sequential`), order (`ordinal`), polarity (`diverging`) and state
 * (`status`).
 */
export type SharedUiChartColors = {
  /**
   * Categorical identity, slots 1..8, assigned in order and **never cycled**.
   * A ninth series is never a generated hue — it would be indistinguishable
   * from an existing slot under simulated colour-vision deficiency. The order
   * itself is the safety mechanism; see `./chartScales`.
   */
  series: readonly string[];
  /** Continuous magnitude, light → dark (13 steps of a single hue). */
  sequential: readonly string[];
  /** Discrete ordered marks — funnel stages, tiers, buckets (5 steps). */
  ordinal: readonly string[];
  /**
   * Polarity. Two poles that read as opposite plus a neutral grey midpoint —
   * never a hue at the midpoint, and never two cool poles.
   */
  diverging: { negative: string; neutral: string; positive: string };
  /**
   * Reserved state. The palette never assigns one of these as a series colour,
   * so a status colour can never impersonate a series. "Reserved" constrains
   * the palette, not the brand: these stay overridable like any other token.
   */
  status: { good: string; warning: string; serious: string; critical: string };
  /** Hairline gridline. Defaults to `colors.border`. */
  grid: string;
  /** Baseline / axis rule. Defaults to `colors.border2`. */
  axis: string;
  /** Axis tick and label ink. Defaults to `colors.muted`. */
  label: string;
  /** The plot surface marks sit on. Defaults to `colors.surface`. */
  surface: string;
  /**
   * "Other", and the grey worn by un-emphasised series in an emphasis chart.
   * Defaults to `colors.muted`, which clears 3:1 on every shipped surface.
   */
  deemphasis: string;
};

/**
 * Build the chart scales for a resolved palette. The categorical and ordinal
 * scales are picked by `scheme` (the same eight hues, stepped for the surface
 * they sit on); the diverging poles are slots 8 and 1 of that scale, so
 * negative reads warm and positive cool; the midpoint and every furniture role
 * come from the theme's own neutrals, which is what keeps all four shipped
 * themes in sync with no values maintained by hand. Explicit overrides win.
 */
export function resolveChartColors(
  colors: SharedUiColors,
  scheme: SharedUiScheme,
  overrides: Partial<SharedUiChartColors> | undefined,
): SharedUiChartColors {
  const scales = chartScalesFor(scheme);
  const series = overrides?.series ?? scales.series;
  return {
    series,
    sequential: overrides?.sequential ?? CHART_SEQUENTIAL,
    ordinal: overrides?.ordinal ?? scales.ordinal,
    diverging: overrides?.diverging ?? {
      negative: series[series.length - 1],
      neutral: colors.soft,
      positive: series[0],
    },
    status: overrides?.status ?? CHART_STATUS,
    grid: overrides?.grid ?? colors.border,
    axis: overrides?.axis ?? colors.border2,
    label: overrides?.label ?? colors.muted,
    surface: overrides?.surface ?? colors.surface,
    deemphasis: overrides?.deemphasis ?? colors.muted,
  };
}

/**
 * Merge the chart overrides that should apply when extending `base`.
 *
 * Chart scales are a *function* of `(colors, scheme)`, so extending a theme
 * re-derives them rather than copying the base's — otherwise flipping a theme
 * to `scheme: "dark"` would keep the light series steps. But a base theme that
 * set `charts` values explicitly must not have them silently reset, so those
 * are detected (they differ from what the base's own colours would derive) and
 * carried forward. Values the caller passes directly win over both.
 */
export function chartOverridesFrom(
  base: SharedUiTheme,
  explicit: Partial<SharedUiChartColors> | undefined,
): Partial<SharedUiChartColors> {
  const derived = resolveChartColors(base.colors, base.scheme, undefined);
  const inherited: Partial<SharedUiChartColors> = {};
  for (const key of Object.keys(derived) as (keyof SharedUiChartColors)[]) {
    if (JSON.stringify(base.charts[key]) !== JSON.stringify(derived[key])) {
      Object.assign(inherited, { [key]: base.charts[key] });
    }
  }
  return { ...inherited, ...explicit };
}
