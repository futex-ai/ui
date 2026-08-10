/**
 * Bar geometry — where every rectangle sits, and how wide.
 *
 * Pure so the mark specs are testable without rendering: bars are capped rather
 * than filling their slot, they round only at the data end, and touching fills
 * are separated by a gap in the surface colour rather than by a stroke. A
 * border drawn around a mark adds ink that is not data.
 */
import { CHART_MARKS } from "./chartMarks";
import type { BandScale } from "./scale/band";
import { groupedBands } from "./scale/band";
import type { LinearScale } from "./scale/linear";
import type { NormalizedSeries, StackSegment } from "./series/stack";

/** How a bar chart arranges multiple series. */
export type BarMode = "grouped" | "stacked" | "percent" | "diverging";

export type BarOrientation = "vertical" | "horizontal";

/** One painted rectangle, in plot coordinates. */
export type BarRect = {
  seriesId: string;
  index: number;
  /** The datum this rect represents; `null` rects are never emitted. */
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner radius applied only at the data end. */
  radius: number;
  /** Which edge is the data end, for the rounded-corner path. */
  dataEnd: "top" | "bottom" | "left" | "right";
};

/**
 * Cap a band's bar thickness and centre it in the slot.
 *
 * Bars never fill their band: the leftover is air. A chart whose bars touch
 * reads as one solid block rather than as separate measurements.
 */
export function barThickness(bandwidth: number, groups = 1): number {
  const slot = groups > 1 ? bandwidth / groups : bandwidth;
  return Math.max(0, Math.min(CHART_MARKS.maxBarThickness, slot));
}

/**
 * Rects for a grouped bar chart: one bar per series, side by side in the band.
 */
export function groupedBars(
  series: readonly NormalizedSeries[],
  band: BandScale,
  value: LinearScale,
  orientation: BarOrientation,
): BarRect[] {
  const rects: BarRect[] = [];
  const zero = value.scale(0);
  for (let index = 0; index < band.count; index += 1) {
    const slots = groupedBands(band, index, series.length);
    series.forEach((entry, s) => {
      const datum = entry.data[index];
      if (datum == null) {
        return;
      }
      const slot = slots[s];
      const thickness = Math.min(CHART_MARKS.maxBarThickness, slot.width);
      // Centre the capped bar inside its slot so groups stay visually even.
      const offset = slot.start + (slot.width - thickness) / 2;
      const end = value.scale(datum);
      rects.push(
        orientation === "vertical"
          ? {
              seriesId: entry.id,
              index,
              value: datum,
              x: offset,
              y: Math.min(end, zero),
              width: thickness,
              height: Math.abs(zero - end),
              radius: CHART_MARKS.barRadius,
              dataEnd: datum >= 0 ? "top" : "bottom",
            }
          : {
              seriesId: entry.id,
              index,
              value: datum,
              x: Math.min(end, zero),
              y: offset,
              width: Math.abs(end - zero),
              height: thickness,
              radius: CHART_MARKS.barRadius,
              dataEnd: datum >= 0 ? "right" : "left",
            },
      );
    });
  }
  return rects;
}

/**
 * Rects for a stacked bar chart.
 *
 * Every segment gives up {@link CHART_MARKS.surfaceGap} at its leading edge so
 * neighbours read as distinct through white space rather than a stroke. Only
 * the outermost segment of each stack rounds — an interior segment with rounded
 * corners would imply it ends there.
 */
export function stackedBars(
  segments: readonly StackSegment[],
  band: BandScale,
  value: LinearScale,
  orientation: BarOrientation,
): BarRect[] {
  const rects: BarRect[] = [];
  const thickness = barThickness(band.bandwidth);
  // The topmost non-gap segment per category is the only one that rounds.
  const outermost = new Map<number, string>();
  for (const segment of segments) {
    if (segment.value != null && segment.value !== 0) {
      outermost.set(segment.index, segment.seriesId);
    }
  }

  for (const segment of segments) {
    if (segment.value == null || segment.value === 0) {
      continue;
    }
    const offset = band.start(segment.index) + (band.bandwidth - thickness) / 2;
    const a = value.scale(segment.start);
    const b = value.scale(segment.end);
    const near = Math.min(a, b);
    const span = Math.abs(b - a);
    // Shrink by the gap, but never below zero — a hairline segment should
    // vanish rather than invert.
    const painted = Math.max(0, span - CHART_MARKS.surfaceGap);
    const rounds = outermost.get(segment.index) === segment.seriesId;
    rects.push(
      orientation === "vertical"
        ? {
            seriesId: segment.seriesId,
            index: segment.index,
            value: segment.value,
            x: offset,
            y: near,
            width: thickness,
            height: painted,
            radius: rounds ? CHART_MARKS.barRadius : 0,
            dataEnd: "top",
          }
        : {
            seriesId: segment.seriesId,
            index: segment.index,
            value: segment.value,
            x: near + (span - painted),
            y: offset,
            width: painted,
            height: thickness,
            radius: rounds ? CHART_MARKS.barRadius : 0,
            dataEnd: "right",
          },
    );
  }
  return rects;
}

/**
 * An SVG path for a rectangle rounded on one edge only.
 *
 * The data end rounds; the baseline end stays square, so a bar visibly grows
 * *from* its baseline rather than floating as a lozenge.
 */
export function barPath(rect: BarRect): string {
  const { x, y, width: w, height: h, dataEnd } = rect;
  if (w <= 0 || h <= 0) {
    return "";
  }
  // Never round more than half the short side, or the corners self-intersect.
  const r = Math.max(0, Math.min(rect.radius, w / 2, h / 2));
  if (r === 0) {
    return `M${x},${y}h${w}v${h}h${-w}Z`;
  }
  switch (dataEnd) {
    case "top":
      return `M${x},${y + h}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h}Z`;
    case "bottom":
      return `M${x},${y}V${y + h - r}A${r},${r} 0 0 0 ${x + r},${y + h}H${x + w - r}A${r},${r} 0 0 0 ${x + w},${y + h - r}V${y}Z`;
    case "right":
      return `M${x},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x}Z`;
    case "left":
    default:
      return `M${x + w},${y}H${x + r}A${r},${r} 0 0 0 ${x},${y + r}V${y + h - r}A${r},${r} 0 0 0 ${x + r},${y + h}H${x + w}Z`;
  }
}

/**
 * Where a bar's direct label goes, or `null` when it should drop to the
 * tooltip.
 *
 * A label is only placed *inside* a bar when the rendered text fits with
 * padding on both sides. Otherwise it moves outside the data end; if there is
 * no room there either, it is dropped entirely — never clipped, and never
 * hidden with `overflow`, which crops the first or last characters and reads
 * worse than no label at all. The value stays in the table view regardless.
 */
export function barLabelPlacement(
  rect: BarRect,
  textWidth: number,
  textHeight: number,
  plot: { width: number; height: number },
  padding = 6,
): { x: number; y: number; inside: boolean } | null {
  const horizontal = rect.dataEnd === "left" || rect.dataEnd === "right";
  const along = horizontal ? rect.width : rect.height;
  const across = horizontal ? rect.height : rect.width;
  const need = horizontal ? textWidth : textHeight;
  const acrossNeed = horizontal ? textHeight : textWidth;

  // Inside requires room along the bar *and* across it.
  if (along >= need + padding * 2 && across >= acrossNeed) {
    return horizontal
      ? {
          x: rect.x + rect.width - padding - textWidth,
          y: rect.y + rect.height / 2 - textHeight / 2,
          inside: true,
        }
      : {
          x: rect.x + rect.width / 2 - textWidth / 2,
          y: rect.y + padding,
          inside: true,
        };
  }

  // Outside the data end, if the plot has room for it.
  if (horizontal) {
    const x =
      rect.dataEnd === "right"
        ? rect.x + rect.width + padding
        : rect.x - padding - textWidth;
    if (x >= 0 && x + textWidth <= plot.width) {
      return { x, y: rect.y + rect.height / 2 - textHeight / 2, inside: false };
    }
    return null;
  }
  const y =
    rect.dataEnd === "top"
      ? rect.y - padding - textHeight
      : rect.y + rect.height + padding;
  if (y >= 0 && y + textHeight <= plot.height) {
    return { x: rect.x + rect.width / 2 - textWidth / 2, y, inside: false };
  }
  return null;
}
