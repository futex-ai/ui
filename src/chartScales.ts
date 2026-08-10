/**
 * Validated data-visualization colour scales.
 *
 * Every value here was produced by running the six-checks palette validator
 * against this library's three real chart surfaces (`#ffffff` for both light
 * presets, `#212522` for the dark preset, `#1e1c25` for Juno dark) — not
 * eyeballed, and not copied from another system's surfaces. The measured
 * results are pinned by `tests/unit/chartPalette.test.ts` and reproducible via
 * `scripts/validate-chart-palette.mjs`.
 *
 * See `plans/charts-design.md` for the derivation and the trade-offs it makes.
 */

/**
 * Categorical series identity, slots 1..8, in the order they are assigned.
 *
 * The **order is the colourblind-safety mechanism**, not a cosmetic choice: all
 * 40,320 orderings of these eight hues were enumerated and validated, 1,684
 * clear the adjacent gates, and 264 of those also validate four leading slots
 * under the harder all-pairs test. This order is one of the four among them
 * with the best worst-case adjacent separation *and* two high-contrast leading
 * slots. Re-ordering without re-validating will silently break CVD safety.
 *
 * Worst adjacent CVD ΔE 9.1 (light) / 8.4 (dark) against the ≥ 8 target;
 * worst adjacent normal-vision ΔE 19.6 / 19.3 against the ≥ 15 floor.
 */
export const LIGHT_CHART_SERIES = [
  "#2a78d6", // 1 blue    — 4.42:1
  "#008300", // 2 green   — 4.95:1
  "#e87ba4", // 3 magenta — 2.69:1, relief rule applies
  "#eda100", // 4 yellow  — 2.17:1, relief rule applies
  "#1baf7a", // 5 aqua    — 2.82:1, relief rule applies
  "#eb6834", // 6 orange  — 3.20:1
  "#4a3aa7", // 7 violet  — 8.56:1
  "#e34948", // 8 red     — 3.95:1
] as const;

/** The same eight hues, stepped for the dark surfaces. All clear 3:1 there. */
export const DARK_CHART_SERIES = [
  "#3987e5", // 1 blue
  "#008300", // 2 green
  "#d55181", // 3 magenta
  "#c98500", // 4 yellow
  "#199e70", // 5 aqua
  "#d95926", // 6 orange
  "#9085e9", // 7 violet
  "#e66767", // 8 red
] as const;

/**
 * Continuous magnitude — one hue, light → dark, steps 100…700. Continuous
 * encoding is the one place the lightest step may recede toward the surface,
 * so this ramp is deliberately not held to the ordinal 2:1 floor.
 */
export const CHART_SEQUENTIAL = [
  "#cde2fb", // 100
  "#b7d3f6", // 150
  "#9ec5f4", // 200
  "#86b6ef", // 250
  "#6da7ec", // 300
  "#5598e7", // 350
  "#3987e5", // 400
  "#2a78d6", // 450
  "#256abf", // 500
  "#1c5cab", // 550
  "#184f95", // 600
  "#104281", // 650
  "#0d366b", // 700
] as const;

/**
 * Discrete ordered marks — funnel stages, tiers, age bands. Five steps of the
 * sequential hue, validated with the ordinal checks: monotone lightness,
 * adjacent ΔL ≥ 0.06, and the step nearest the surface still ≥ 2:1 against it.
 */
export const LIGHT_CHART_ORDINAL = [
  "#86b6ef", // 250 — light end, 2.11:1 on #ffffff
  "#5598e7", // 350
  "#2a78d6", // 450
  "#1c5cab", // 550
  "#104281", // 650
] as const;

/**
 * The dark ordinal ramp stops at step 550 rather than 600: step 600 measures
 * 1.92:1 on the default dark surface and fails the 2:1 floor.
 */
export const DARK_CHART_ORDINAL = [
  "#1c5cab", // 550 — light end, 2.34:1 on #212522
  "#2a78d6", // 450
  "#5598e7", // 350
  "#86b6ef", // 250
  "#b7d3f6", // 150
] as const;

/**
 * Reserved state colours. The palette never hands one of these out as a series
 * identity, so a status colour can never impersonate a series. On the light
 * surface `warning` (1.83:1) and `serious` (2.64:1) sit below 3:1 by design —
 * status always ships with an icon *and* a label, so the colour never carries
 * meaning alone (WCAG 2.1 — 1.4.1 Use of Color, A).
 */
export const CHART_STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
} as const;

/** Which side of the light/dark divide a set of chart scales belongs to. */
export type ChartScaleScheme = "light" | "dark";

/** The scheme-dependent scales, before theme-derived furniture is folded in. */
export function chartScalesFor(scheme: ChartScaleScheme) {
  return scheme === "dark"
    ? { series: DARK_CHART_SERIES, ordinal: DARK_CHART_ORDINAL }
    : { series: LIGHT_CHART_SERIES, ordinal: LIGHT_CHART_ORDINAL };
}
