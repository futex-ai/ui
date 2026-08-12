/**
 * Mark specs, fixed across every chart in the family.
 *
 * Deliberately free of any React Native import so the geometry modules that
 * consume them stay pure and unit-testable — importing `StyleSheet` here would
 * drag the whole RN runtime into every geometry test.
 */

/** Hairline width. Matches `StyleSheet.hairlineWidth` on the platforms we ship. */
const HAIRLINE = 0.5;

export const CHART_MARKS = {
  /** Bars never fill their slot — the leftover band is air, not ink. */
  maxBarThickness: 24,
  /** Rounded at the data end, square at the baseline. */
  barRadius: 4,
  lineWidth: 2,
  /** Markers are hit targets as well as marks, so they have a floor. */
  markerRadius: 4,
  /** Area fills are a wash, never a saturated block. */
  areaOpacity: 0.1,
  /** White doing the separating: between stacked segments and touching bars. */
  surfaceGap: 2,
  /** Ring in the surface colour so overlapping dots stay legible. */
  surfaceRing: 2,
  gridWidth: HAIRLINE,
} as const;

/**
 * Opacity applied to the previous render while new data loads.
 *
 * Holding the frame at reduced opacity beats a skeleton: no layout jump, no
 * flash, and the reader keeps their place while the numbers refresh.
 */
export const CHART_LOADING_OPACITY = 0.45;
