/** Trend over time: multi-series lines with a snapping crosshair. */
import { useMemo, useState } from "react";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

import { announce } from "../announcer";
import { useSharedUiTheme } from "../theme";

import { ChartAxisLabels, ChartGridLines, type AxisTick } from "./ChartAxis";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer, type HitTarget } from "./ChartHitLayer";
import { ChartLegend } from "./ChartLegend";
import { assignSeriesColors } from "./chartPalette";
import { CHART_MARKS } from "./chartMarks";
import { ChartTableView } from "./ChartTableView";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import {
  areaPath,
  linePath,
  projectPoints,
  type LineCurve,
} from "./lineGeometry";
import { bandScale } from "./scale/band";
import { extentOf, linearScale, toEpoch } from "./scale/linear";
import { compactNumber, niceTicks, niceTimeTicks } from "./scale/ticks";
import { normalizeSeries } from "./series/stack";
import { resolveValueFormat, type ChartCommonProps } from "./types";
import { useSeriesVisibility } from "./useSeriesVisibility";

export type ReferenceLine = {
  value: number;
  label?: string;
  color?: string;
};

export type LineChartProps = ChartCommonProps & {
  /** Defaults to `"linear"`. `"monotone"` smooths without overshooting. */
  curve?: LineCurve;
  /** Draw a dot at every vertex. Defaults to `true` for short series. */
  showMarkers?: boolean;
  /** Fill under the line at ~10% opacity — the single-series area variant. */
  area?: boolean;
  /** Horizontal rules for targets and thresholds. */
  referenceLines?: readonly ReferenceLine[];
  /** Start the value axis at the data rather than at zero. */
  includeZero?: boolean;
};

const LEGEND_HEIGHT = 30;
const MARKER_LIMIT = 40;

export function LineChart({
  categories,
  xScale = "band",
  series,
  curve = "linear",
  showMarkers,
  area = false,
  referenceLines = [],
  includeZero = false,
  title,
  caption,
  height = 260,
  defaultWidth,
  loading,
  emptyState,
  showLegend,
  hiddenSeriesIds,
  onHiddenSeriesIdsChange,
  activeIndex: controlledActive,
  onActiveIndexChange,
  onDatumPress,
  valueFormat,
  emphasisId,
  showTableView = true,
  accessibilityLabel,
  disableFocusRing,
  style,
  testID,
}: LineChartProps) {
  const theme = useSharedUiTheme();
  const format = resolveValueFormat(valueFormat);
  const visibility = useSeriesVisibility({
    hiddenSeriesIds,
    onHiddenSeriesIdsChange,
  });
  const [internalActive, setInternalActive] = useState<number | null>(null);
  const active =
    controlledActive !== undefined ? controlledActive : internalActive;

  const normalized = useMemo(
    () => normalizeSeries(series, categories.length),
    [series, categories.length],
  );
  const { colorById } = useMemo(
    () =>
      assignSeriesColors(normalized, theme.charts, {
        emphasisId,
        overflow: "deemphasize",
        chartName: "LineChart",
      }),
    [normalized, theme.charts, emphasisId],
  );

  const visible = normalized.filter((entry) => !visibility.isHidden(entry.id));
  const isEmpty = categories.length === 0 || visible.length === 0;
  const legendVisible = showLegend ?? series.length >= 2;

  const setActive = (index: number | null) => {
    if (controlledActive === undefined) {
      setInternalActive(index);
    }
    onActiveIndexChange?.(index);
    // Movement is announced politely so a screen-reader user scrubbing with the
    // keyboard hears the readout, not just sees it.
    if (index != null && categories[index] != null) {
      announce(
        `${String(categories[index])}. ` +
          visible
            .map(
              (entry) =>
                `${entry.label}: ${
                  entry.data[index] == null
                    ? "no data"
                    : format(entry.data[index] as number)
                }`,
            )
            .join(". "),
      );
    }
  };

  return (
    <ChartFrame
      accessibilityLabel={accessibilityLabel}
      caption={caption}
      defaultWidth={defaultWidth}
      emptyState={emptyState}
      height={height}
      isEmpty={isEmpty}
      legend={
        legendVisible ? (
          <ChartLegend
            disableFocusRing={disableFocusRing}
            entries={normalized.map((entry) => ({
              id: entry.id,
              label: entry.label,
              color: colorById.get(entry.id) ?? theme.charts.deemphasis,
            }))}
            hidden={visibility.hidden}
            keyShape="line"
            onToggle={visibility.toggle}
          />
        ) : null
      }
      legendHeight={legendVisible ? LEGEND_HEIGHT : 0}
      loading={loading}
      style={style}
      tableView={
        showTableView ? (
          <ChartTableView
            accessibilityLabel={
              accessibilityLabel
                ? `${accessibilityLabel}, as a table`
                : undefined
            }
            categories={categories}
            series={normalized}
            valueFormat={format}
          />
        ) : undefined
      }
      testID={testID}
      title={title}
    >
      {(layout, styles) => {
        const { plot } = layout;
        if (!layout.usable) {
          return null;
        }

        // Band spacing puts every category in an equal slot; time and linear
        // space by value, which is what an irregular series needs.
        const xPositions = resolveXPositions(categories, xScale, plot.width);

        const flat = visible.flatMap((entry) => entry.data);
        const refValues = referenceLines.map((r) => r.value);
        const [min, max] = extentOf([...flat, ...refValues], { includeZero });
        const { ticks, domain } = niceTicks(min, max, 5);
        const value = linearScale(domain, [plot.height, 0]);

        const valueTicks: AxisTick[] = ticks.map((tick) => ({
          position: value.scale(tick),
          label: compactNumber(tick),
        }));
        const categoryTicks: AxisTick[] = xTicks(
          categories,
          xScale,
          xPositions,
        );

        const markers = showMarkers ?? categories.length <= MARKER_LIMIT;

        const targets: HitTarget[] = categories.map((label, index) => {
          const half =
            (index === 0
              ? (xPositions[1] ?? plot.width) - xPositions[0]
              : xPositions[index] - xPositions[index - 1]) / 2;
          return {
            index,
            label: describe(labelOf(label, xScale), visible, index, format),
            x: Math.max(0, xPositions[index] - half),
            y: 0,
            width: Math.max(1, half * 2),
            height: plot.height,
          };
        });

        const tooltipRows: TooltipRow[] =
          active == null
            ? []
            : visible.map((entry) => ({
                seriesId: entry.id,
                label: entry.label,
                color: colorById.get(entry.id) ?? theme.charts.deemphasis,
                value:
                  entry.data[active] == null
                    ? "—"
                    : format(entry.data[active] as number),
              }));

        return (
          <>
            <ChartGridLines plot={plot} ticks={valueTicks} />
            <Svg
              height={plot.height}
              pointerEvents="none"
              style={{ left: plot.x, position: "absolute", top: plot.y }}
              width={plot.width}
            >
              {referenceLines.map((reference, i) => (
                <Line
                  key={`ref-${i}`}
                  stroke={reference.color ?? theme.charts.status.warning}
                  strokeWidth={1}
                  x1={0}
                  x2={plot.width}
                  y1={value.scale(reference.value)}
                  y2={value.scale(reference.value)}
                />
              ))}
              {visible.map((entry) => {
                const points = projectPoints(
                  entry.data,
                  (i) => xPositions[i],
                  value,
                );
                const color =
                  colorById.get(entry.id) ?? theme.charts.deemphasis;
                return (
                  <G key={entry.id}>
                    {area ? (
                      <Path
                        d={areaPath(points, plot.height, curve)}
                        fill={color}
                        opacity={CHART_MARKS.areaOpacity}
                      />
                    ) : null}
                    <Path
                      d={linePath(points, curve)}
                      fill="none"
                      stroke={color}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={CHART_MARKS.lineWidth}
                    />
                    {markers
                      ? points.map((point, i) =>
                          point ? (
                            <Circle
                              cx={point.x}
                              cy={point.y}
                              fill={color}
                              key={`${entry.id}-${i}`}
                              r={CHART_MARKS.markerRadius}
                              // A ring in the surface colour keeps overlapping
                              // markers legible where series cross.
                              stroke={theme.charts.surface}
                              strokeWidth={CHART_MARKS.surfaceRing}
                            />
                          ) : null,
                        )
                      : null}
                  </G>
                );
              })}
              {active != null ? (
                <Line
                  stroke={theme.charts.axis}
                  strokeWidth={1}
                  x1={xPositions[active]}
                  x2={xPositions[active]}
                  y1={0}
                  y2={plot.height}
                />
              ) : null}
            </Svg>
            <ChartAxisLabels
              axis="y"
              rect={layout.yAxis}
              styles={styles}
              ticks={valueTicks}
            />
            <ChartAxisLabels
              axis="x"
              rect={layout.xAxis}
              styles={styles}
              ticks={categoryTicks}
            />
            <ChartHitLayer
              activeIndex={active}
              disableFocusRing={disableFocusRing}
              onActivate={(index) => {
                setActive(index);
                if (onDatumPress) {
                  const first = visible[0];
                  onDatumPress({
                    seriesId: first?.id ?? "",
                    index,
                    value: first?.data[index] ?? null,
                  });
                }
              }}
              onHover={setActive}
              plot={plot}
              targets={targets}
            />
            {active != null && tooltipRows.length > 0 ? (
              <ChartTooltip
                plot={plot}
                rows={tooltipRows}
                title={labelOf(categories[active], xScale)}
                x={xPositions[active]}
                y={plot.height / 2}
              />
            ) : null}
          </>
        );
      }}
    </ChartFrame>
  );
}

/** X pixel position per category, by scale kind. */
function resolveXPositions(
  categories: readonly (string | number)[],
  xScale: ChartCommonProps["xScale"],
  width: number,
): number[] {
  if (xScale === "band" || categories.length === 0) {
    const band = bandScale(categories.length, [0, width], {
      paddingInner: 0,
      paddingOuter: 0,
    });
    return categories.map((_, index) => band.center(index));
  }
  const values = categories.map((c) =>
    xScale === "time" ? toEpoch(c as string | number) : Number(c),
  );
  const scale = linearScale(
    [Math.min(...values), Math.max(...values)],
    [0, width],
  );
  return values.map((v) => scale.scale(v));
}

function labelOf(
  category: string | number | undefined,
  xScale: ChartCommonProps["xScale"],
): string {
  if (category == null) {
    return "";
  }
  if (xScale === "time") {
    const date = new Date(toEpoch(category));
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  }
  return String(category);
}

function xTicks(
  categories: readonly (string | number)[],
  xScale: ChartCommonProps["xScale"],
  positions: readonly number[],
): AxisTick[] {
  if (xScale !== "time") {
    return categories.map((label, index) => ({
      position: positions[index],
      label: String(label),
    }));
  }
  // A time axis gets calendar-aware ticks rather than one per datum, so an
  // irregular series does not produce a crowded, arbitrary axis.
  const epochs = categories.map((c) => toEpoch(c as string | number));
  const min = Math.min(...epochs);
  const max = Math.max(...epochs);
  const scale = linearScale(
    [min, max],
    [positions[0] ?? 0, positions[positions.length - 1] ?? 0],
  );
  return niceTimeTicks(min, max, 5).map((epoch) => ({
    position: scale.scale(epoch),
    label: new Date(epoch).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    }),
  }));
}

/**
 * The per-x accessible label: every visible series at this position.
 *
 * The crosshair tooltip shows all series at once, so the focused stop has to
 * carry the same content — otherwise keyboard and screen-reader users get a
 * strictly poorer readout than pointer users.
 */
function describe(
  category: string,
  series: readonly { label: string; data: (number | null)[] }[],
  index: number,
  format: (value: number) => string,
): string {
  const parts = series.map(
    (entry) =>
      `${entry.label}: ${
        entry.data[index] == null
          ? "no data"
          : format(entry.data[index] as number)
      }`,
  );
  return `${category}. ${parts.join(". ")}`;
}
