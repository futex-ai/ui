/**
 * The band scale — one slot per category, used by every category-indexed chart
 * (bars, columns, and the band-mode x axis of lines and areas).
 */

/** A discrete mapping from category index to a pixel band. */
export type BandScale = {
  /** Number of categories the scale was built for. */
  readonly count: number;
  readonly range: readonly [number, number];
  /** Distance between the starts of consecutive bands. */
  readonly step: number;
  /** Painted width of a single band, after padding. */
  readonly bandwidth: number;
  /** Left (or top) edge of a category's band. */
  start(index: number): number;
  /** Centre of a category's band — where a line vertex or tick sits. */
  center(index: number): number;
  /** Nearest category index to a pixel position — the hover/scrub direction. */
  nearestIndex(position: number): number;
};

export type BandScaleOptions = {
  /**
   * Share of each step given up as space *between* bands, `0..1`. The default
   * leaves the band's leftover as air rather than filling the slot: a chart
   * whose bars touch reads as one solid block.
   */
  paddingInner?: number;
  /** Share of a step held back at each end of the range, `0..1`. */
  paddingOuter?: number;
};

/**
 * Build a band scale over `count` categories.
 *
 * An empty domain yields a zero bandwidth rather than `NaN`, so an empty chart
 * still lays out (and shows its empty state) instead of crashing the axis.
 */
export function bandScale(
  count: number,
  range: readonly [number, number],
  options: BandScaleOptions = {},
): BandScale {
  const { paddingInner = 0.2, paddingOuter = 0.1 } = options;
  const [r0, r1] = range;
  const width = r1 - r0;
  const safeCount = Math.max(0, Math.floor(count));

  // step * (count - paddingInner + 2 * paddingOuter) == width
  const divisor = safeCount - paddingInner + 2 * paddingOuter;
  const step = safeCount > 0 && divisor > 0 ? width / divisor : 0;
  const bandwidth = Math.max(0, step * (1 - paddingInner));
  const origin = r0 + step * paddingOuter;

  return {
    count: safeCount,
    range,
    step,
    bandwidth,
    start(index) {
      return origin + index * step;
    },
    center(index) {
      return origin + index * step + bandwidth / 2;
    },
    nearestIndex(position) {
      if (safeCount === 0) {
        return -1;
      }
      if (step === 0) {
        return 0;
      }
      // Round to the closest band centre, so the pointer only has to be
      // nearest rather than inside the painted mark.
      const raw = Math.round((position - origin - bandwidth / 2) / step);
      return Math.min(safeCount - 1, Math.max(0, raw));
    },
  };
}

/**
 * Split a band into `groups` sub-bands, for grouped bars. The gap between the
 * groups within a band is deliberately smaller than the gap between bands, so
 * a group still reads as one cluster.
 */
export function groupedBands(
  band: BandScale,
  index: number,
  groups: number,
  innerPadding = 0.08,
): { start: number; width: number }[] {
  if (groups <= 0) {
    return [];
  }
  const left = band.start(index);
  const slot = band.bandwidth / groups;
  const gap = slot * innerPadding;
  const width = Math.max(0, slot - gap);
  return Array.from({ length: groups }, (_, i) => ({
    start: left + i * slot + gap / 2,
    width,
  }));
}
