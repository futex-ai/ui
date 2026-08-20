/** Correlation between two measures, with optional bubble magnitude. */
import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Polygon, Rect } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { ChartAxisLabels, ChartGridLines, type AxisTick } from "./ChartAxis";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer, type HitTarget } from "./ChartHitLayer";
import { ChartLegend } from "./ChartLegend";
import { CHART_MARKS } from "./chartMarks";
import {
  ALL_PAIRS_CLEAN_CAP,
  ALL_PAIRS_SERIES_CAP,
  assignSeriesColors,
} from "./chartPalette";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import { bubbleRadius, type ScatterPoint } from "./scatterGeometry";
import { extentOf, linearScale } from "./scale/linear";
import { compactNumber, niceTicks } from "./scale/ticks";
import { useSeriesVisibility } from "./useSeriesVisibility";

export type ScatterSeries = {
  id: string;
  label?: string;
  color?: string;
  points: readonly ScatterPoint[];
};

/**
 * Marker shapes, used as the secondary encoding an all-pairs form needs at
 * four series — colour alone lands in the colour-vision floor band there.
 */
export type ScatterShape = "circle" | "square" | "triangle" | "diamond";
const SHAPES: ScatterShape[] = ["circle", "square", "triangle", "diamond"];

export type ScatterChartProps = {
  series: readonly ScatterSeries[];
  title?: string;
  caption?: string;
  height?: number;
  defaultWidth?: number;
  loading?: boolean;
  xLabel?: string;
  yLabel?: string;
  valueFormat?: (value: number) => string;
  /** Encode magnitude as bubble area. */
  bubble?: boolean;
  showLegend?: boolean;
  hiddenSeriesIds?: readonly string[];
  onHiddenSeriesIdsChange?: (ids: string[]) => void;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
  testID?: string;
};

export function ScatterChart({
  series,
  title,
  caption,
  height = 300,
  defaultWidth,
  loading,
  xLabel,
  yLabel,
  valueFormat,
  bubble = false,
  showLegend,
  hiddenSeriesIds,
  onHiddenSeriesIdsChange,
  accessibilityLabel,
  disableFocusRing,
  style,
  testID,
}: ScatterChartProps) {
  const theme = useSharedUiTheme();
  const format = valueFormat ?? compactNumber;
  const visibility = useSeriesVisibility({
    hiddenSeriesIds,
    onHiddenSeriesIdsChange,
  });
  const [active, setActive] = useState<number | null>(null);

  // Scatter is an all-pairs form: any two marks can end up side by side, so
  // the palette validates far fewer slots here than it does for bars.
  const { colorById } = useMemo(
    () =>
      assignSeriesColors(series, theme.charts, {
        allPairs: true,
        chartName: "ScatterChart",
      }),
    [series, theme.charts],
  );

  const visible = series.filter((s) => !visibility.isHidden(s.id));
  const isEmpty = visible.every((s) => s.points.length === 0);
  const legendVisible = showLegend ?? series.length >= 2;
  // Past the clean cap, colour alone is not enough, so every series also takes
  // a distinct marker shape.
  const needsShapes = series.length > ALL_PAIRS_CLEAN_CAP;

  return (
    <ChartFrame
      accessibilityLabel={accessibilityLabel}
      caption={caption}
      defaultWidth={defaultWidth}
      height={height}
      isEmpty={isEmpty}
      legend={
        legendVisible ? (
          <ChartLegend
            disableFocusRing={disableFocusRing}
            entries={series.map((s) => ({
              id: s.id,
              label: s.label ?? s.id,
              color: colorById.get(s.id) ?? theme.charts.deemphasis,
            }))}
            hidden={visibility.hidden}
            onToggle={visibility.toggle}
          />
        ) : null
      }
      legendHeight={legendVisible ? 30 : 0}
      loading={loading}
      // Dense scatter trades per-point labels for usable hit targets, so the
      // table view is its primary screen-reader channel rather than a twin.
      hideTableToggle
      style={style}
      testID={testID}
      title={title}
    >
      {(layout, styles) => {
        const { plot } = layout;
        if (!layout.usable) {
          return null;
        }
        const all = visible.flatMap((s) => s.points);
        const xs = extentOf(
          all.map((p) => p.x),
          { includeZero: false },
        );
        const ys = extentOf(
          all.map((p) => p.y),
          { includeZero: false },
        );
        const xTicksInfo = niceTicks(xs[0], xs[1], 5);
        const yTicksInfo = niceTicks(ys[0], ys[1], 5);
        const xScale = linearScale(xTicksInfo.domain, [0, plot.width]);
        const yScale = linearScale(yTicksInfo.domain, [plot.height, 0]);

        const maxSize = Math.max(
          1,
          ...all.map((p) => (p.size == null ? 0 : p.size)),
        );
        const maxRadius = Math.min(22, Math.max(6, plot.width / 24));

        const placed = visible.flatMap((s, seriesIndex) =>
          s.points.map((point) => ({
            seriesId: s.id,
            seriesLabel: s.label ?? s.id,
            shape: SHAPES[seriesIndex % SHAPES.length],
            point,
            cx: xScale.scale(point.x),
            cy: yScale.scale(point.y),
            r: bubble
              ? bubbleRadius(point.size, maxSize, maxRadius)
              : CHART_MARKS.markerRadius,
          })),
        );

        const xTicks: AxisTick[] = xTicksInfo.ticks.map((tick) => ({
          position: xScale.scale(tick),
          label: compactNumber(tick),
        }));
        const yTicks: AxisTick[] = yTicksInfo.ticks.map((tick) => ({
          position: yScale.scale(tick),
          label: compactNumber(tick),
        }));

        const targets: HitTarget[] = placed.map((mark, index) => {
          // The hit box is generous by design: an 8px dot is a pinpoint nobody
          // lands on reliably, so the target is at least 24px regardless of
          // how small the mark is.
          const box = Math.max(24, mark.r * 2 + 8);
          return {
            index,
            label:
              `${mark.seriesLabel}${mark.point.label ? `, ${mark.point.label}` : ""}: ` +
              `${xLabel ?? "x"} ${format(mark.point.x)}, ${yLabel ?? "y"} ${format(mark.point.y)}` +
              (bubble && mark.point.size != null
                ? `, size ${format(mark.point.size)}`
                : ""),
            x: mark.cx - box / 2,
            y: mark.cy - box / 2,
            width: box,
            height: box,
          };
        });

        const tooltipRows: TooltipRow[] =
          active == null || !placed[active]
            ? []
            : [
                {
                  seriesId: placed[active].seriesId,
                  label: placed[active].seriesLabel,
                  color:
                    colorById.get(placed[active].seriesId) ??
                    theme.charts.deemphasis,
                  value: `${format(placed[active].point.x)}, ${format(placed[active].point.y)}`,
                },
              ];

        return (
          <>
            <ChartGridLines plot={plot} ticks={yTicks} />
            <ChartGridLines
              orientation="horizontal"
              plot={plot}
              ticks={xTicks}
            />
            <Svg
              height={plot.height}
              pointerEvents="none"
              style={{ left: plot.x, position: "absolute", top: plot.y }}
              width={plot.width}
            >
              {placed.map((mark, index) => (
                <ScatterMark
                  color={
                    colorById.get(mark.seriesId) ?? theme.charts.deemphasis
                  }
                  cx={mark.cx}
                  cy={mark.cy}
                  dimmed={active != null && active !== index}
                  key={`${mark.seriesId}-${index}`}
                  r={mark.r}
                  ringColor={theme.charts.surface}
                  shape={needsShapes ? mark.shape : "circle"}
                />
              ))}
            </Svg>
            <ChartAxisLabels
              axis="y"
              rect={layout.yAxis}
              styles={styles}
              ticks={yTicks}
            />
            <ChartAxisLabels
              axis="x"
              rect={layout.xAxis}
              styles={styles}
              ticks={xTicks}
            />
            <ChartHitLayer
              activeIndex={active}
              disableFocusRing={disableFocusRing}
              onActivate={setActive}
              onHover={setActive}
              plot={plot}
              targets={targets}
            />
            {active != null && tooltipRows.length > 0 ? (
              <ChartTooltip
                plot={plot}
                rows={tooltipRows}
                title={placed[active].point.label ?? placed[active].seriesLabel}
                x={placed[active].cx}
                y={placed[active].cy}
              />
            ) : null}
          </>
        );
      }}
    </ChartFrame>
  );
}

/** A marker. Shape is the secondary encoding when colour alone is not enough. */
function ScatterMark({
  color,
  cx,
  cy,
  dimmed,
  r,
  ringColor,
  shape,
}: {
  color: string;
  cx: number;
  cy: number;
  dimmed: boolean;
  r: number;
  ringColor: string;
  shape: ScatterShape;
}) {
  const common = {
    fill: color,
    opacity: dimmed ? 0.45 : 0.85,
    // A ring in the surface colour keeps overlapping points legible — the
    // usual reason a dense scatter turns into a single blob.
    stroke: ringColor,
    strokeWidth: CHART_MARKS.surfaceRing,
  };
  if (shape === "circle") {
    return <Circle cx={cx} cy={cy} r={r} {...common} />;
  }
  return <ShapeMark cx={cx} cy={cy} r={r} shape={shape} {...common} />;
}

export const ALL_PAIRS_CAPS = {
  clean: ALL_PAIRS_CLEAN_CAP,
  max: ALL_PAIRS_SERIES_CAP,
} as const;

function ShapeMark({
  cx,
  cy,
  r,
  shape,
  ...rest
}: {
  cx: number;
  cy: number;
  r: number;
  shape: ScatterShape;
} & Record<string, unknown>) {
  if (shape === "square") {
    return (
      <Rect height={r * 2} width={r * 2} x={cx - r} y={cy - r} {...rest} />
    );
  }
  const points =
    shape === "triangle"
      ? `${cx},${cy - r} ${cx + r},${cy + r} ${cx - r},${cy + r}`
      : `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
  return <Polygon points={points} {...rest} />;
}
