/**
 * Frame layout: turn a measured container size into the rect the marks paint
 * into, after the axis, legend and title bands have taken their share.
 *
 * The rule this module exists to enforce: **`height` is the total frame
 * height**, and every band is subtracted from it. Sizing the plot instead and
 * letting the bands grow outward makes the frame's real height unpredictable
 * to surrounding layout, which is what produces a card with a tiny nested
 * scrollbar cutting off the x-axis labels.
 */

/** A rectangle in the frame's coordinate space. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ChartLayoutInput = {
  /** Measured container width, or the `defaultWidth` before measurement. */
  width: number;
  /** Total frame height, inclusive of every band. */
  height: number;
  /** Height of the title/caption block, `0` when absent. */
  titleHeight?: number;
  /** Height of the legend row, `0` when absent. */
  legendHeight?: number;
  /** Height of the x-axis band (tick labels), `0` when the axis is hidden. */
  xAxisHeight?: number;
  /** Width of the y-axis gutter (tick labels), `0` when the axis is hidden. */
  yAxisWidth?: number;
  /** Breathing room around the plot. */
  padding?: Partial<Rect> & {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
};

export type ChartLayout = {
  /** Where the marks paint. Never negative, even in a collapsed container. */
  plot: Rect;
  /** The strip holding x tick labels, directly below the plot. */
  xAxis: Rect;
  /** The gutter holding y tick labels, directly left of the plot. */
  yAxis: Rect;
  /** Whether the container is big enough to paint anything meaningful. */
  usable: boolean;
};

/** Default band sizes, in px. Deliberately modest — chrome should recede. */
export const CHART_BANDS = {
  xAxisHeight: 22,
  yAxisWidth: 44,
  legendHeight: 24,
  padding: { top: 8, right: 12, bottom: 0, left: 0 },
} as const;

/**
 * Compute the plot rect.
 *
 * A container that has not been measured yet (width `0`) or is too small for
 * its own chrome yields a zero-size plot and `usable: false`, so callers can
 * hold the marks back rather than painting marks at negative dimensions.
 */
export function chartLayout(input: ChartLayoutInput): ChartLayout {
  const {
    width,
    height,
    titleHeight = 0,
    legendHeight = 0,
    xAxisHeight = CHART_BANDS.xAxisHeight,
    yAxisWidth = CHART_BANDS.yAxisWidth,
    padding,
  } = input;

  const pad = {
    top: padding?.top ?? CHART_BANDS.padding.top,
    right: padding?.right ?? CHART_BANDS.padding.right,
    bottom: padding?.bottom ?? CHART_BANDS.padding.bottom,
    left: padding?.left ?? CHART_BANDS.padding.left,
  };

  const plotLeft = pad.left + yAxisWidth;
  const plotTop = pad.top + titleHeight;
  const plotWidth = Math.max(0, width - plotLeft - pad.right);
  const plotHeight = Math.max(
    0,
    height - plotTop - xAxisHeight - legendHeight - pad.bottom,
  );

  return {
    plot: { x: plotLeft, y: plotTop, width: plotWidth, height: plotHeight },
    xAxis: {
      x: plotLeft,
      y: plotTop + plotHeight,
      width: plotWidth,
      height: xAxisHeight,
    },
    yAxis: { x: pad.left, y: plotTop, width: yAxisWidth, height: plotHeight },
    usable: plotWidth > 0 && plotHeight > 0,
  };
}

/**
 * Whether a band is wide enough to carry its own hit target.
 *
 * Below this, per-mark `Pressable`s would overlap and the last sibling would
 * silently win every tap, so the chart switches to a nearest-x hit layer
 * instead — the same trick dense scatter uses.
 */
export const MIN_HIT_TARGET = 24;

export function usesPerMarkHitTargets(bandStep: number): boolean {
  return bandStep >= MIN_HIT_TARGET;
}

/**
 * Whether the category count is small enough for one keyboard stop per
 * category. Past this, roving focus becomes unusable (a thousand tab stops)
 * and the chart switches to coarse stops.
 */
export const MAX_ROVING_STOPS = 60;

export function rovingStopIndices(count: number): number[] {
  if (count <= MAX_ROVING_STOPS) {
    return Array.from({ length: count }, (_, i) => i);
  }
  // Sample evenly, always keeping the first and last so the ends stay reachable.
  const stride = Math.ceil(count / MAX_ROVING_STOPS);
  const out: number[] = [];
  for (let i = 0; i < count; i += stride) {
    out.push(i);
  }
  if (out[out.length - 1] !== count - 1) {
    out.push(count - 1);
  }
  return out;
}
