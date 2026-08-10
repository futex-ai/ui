/** Stacked and percent-stacked areas: composition over time. */
import { useMemo, useState } from "react";
import Svg, { G, Path } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { ChartAxisLabels, ChartGrid, type AxisTick } from "./ChartAxis";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer, type HitTarget } from "./ChartHitLayer";
import { ChartLegend } from "./ChartLegend";
import { CHART_MARKS } from "./chartMarks";
import { assignSeriesColors, OTHER_SERIES_ID } from "./chartPalette";
import { ChartTableView } from "./ChartTableView";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import {
  bandPath,
  linePath,
  type LineCurve,
  type LinePoint,
} from "./lineGeometry";
import { bandScale } from "./scale/band";
import { linearScale } from "./scale/linear";
import { compactNumber, niceTicks } from "./scale/ticks";
import {
  foldToOther,
  normalizeSeries,
  percentStack,
  stackSeries,
  type StackSegment,
} from "./series/stack";
import { resolveValueFormat, type ChartCommonProps } from "./types";
import { useSeriesVisibility } from "./useSeriesVisibility";

export type AreaChartProps = ChartCommonProps & {
  /** `"stacked"` (default) or `"percent"` for a 100% composition. */
  mode?: "stacked" | "percent";
  curve?: LineCurve;
};

const LEGEND_HEIGHT = 30;

export function AreaChart({
  categories,
  series,
  mode = "stacked",
  curve = "linear",
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
}: AreaChartProps) {
  const theme = useSharedUiTheme();
  const format = resolveValueFormat(valueFormat);
  const visibility = useSeriesVisibility({
    hiddenSeriesIds,
    onHiddenSeriesIdsChange,
  });
  const [internalActive, setInternalActive] = useState<number | null>(null);
  const active =
    controlledActive !== undefined ? controlledActive : internalActive;

  const setActive = (index: number | null) => {
    if (controlledActive === undefined) {
      setInternalActive(index);
    }
    onActiveIndexChange?.(index);
  };

  // A stacked area's total is meaningful, so folding the tail into a summed
  // "Other" is honest here — unlike on a line chart.
  const normalized = useMemo(
    () =>
      foldToOther(
        normalizeSeries(series, categories.length),
        theme.charts.series.length,
        OTHER_SERIES_ID,
      ),
    [series, categories.length, theme.charts.series.length],
  );

  const { colorById } = useMemo(
    () =>
      assignSeriesColors(normalized, theme.charts, {
        emphasisId,
        overflow: "fold",
        chartName: "AreaChart",
      }),
    [normalized, theme.charts, emphasisId],
  );

  const visible = normalized.filter((entry) => !visibility.isHidden(entry.id));
  const isEmpty = categories.length === 0 || visible.length === 0;
  const legendVisible = showLegend ?? series.length >= 2;

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
            keyShape="rect"
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
        const band = bandScale(categories.length, [0, plot.width], {
          paddingInner: 0,
          paddingOuter: 0,
        });
        const xAt = (index: number) => band.center(index);

        const segs =
          mode === "percent"
            ? percentStack(visible, categories.length)
            : stackSeries(visible, categories.length);

        const top = topOfStack(segs, categories.length);
        const { ticks, domain } =
          mode === "percent"
            ? {
                ticks: [0, 0.25, 0.5, 0.75, 1],
                domain: [0, 1] as [number, number],
              }
            : niceTicks(0, Math.max(...top, 0), 5);
        const value = linearScale(domain, [plot.height, 0]);

        const valueTicks: AxisTick[] = ticks.map((tick) => ({
          position: value.scale(tick),
          label:
            mode === "percent"
              ? `${Math.round(tick * 100)}%`
              : compactNumber(tick),
        }));
        const categoryTicks: AxisTick[] = categories.map((label, index) => ({
          position: xAt(index),
          label: String(label),
        }));

        const targets: HitTarget[] = categories.map((label, index) => ({
          index,
          label: describe(String(label), visible, index, format),
          x: Math.max(0, xAt(index) - band.step / 2),
          y: 0,
          width: Math.max(1, band.step),
          height: plot.height,
        }));

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
            <ChartGrid plot={plot} ticks={valueTicks} />
            <Svg
              height={plot.height}
              pointerEvents="none"
              style={{ left: plot.x, position: "absolute", top: plot.y }}
              width={plot.width}
            >
              {visible.map((entry) => {
                const own = segs.filter((s) => s.seriesId === entry.id);
                const upper: LinePoint[] = own.map((s) =>
                  s.value == null
                    ? null
                    : { x: xAt(s.index), y: value.scale(s.end) },
                );
                const lower: LinePoint[] = own.map((s) =>
                  s.value == null
                    ? null
                    : { x: xAt(s.index), y: value.scale(s.start) },
                );
                const color =
                  colorById.get(entry.id) ?? theme.charts.deemphasis;
                return (
                  <G key={entry.id}>
                    <Path
                      d={bandPath(upper, lower, curve)}
                      fill={color}
                      // A wash, never a saturated block: the band edge carries
                      // the shape, the fill only groups it.
                      opacity={0.85}
                    />
                    <Path
                      d={linePath(upper, curve)}
                      fill="none"
                      stroke={theme.charts.surface}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      // The band edge is drawn in the surface colour so touching
                      // areas separate through white space, matching the 2px
                      // surface gap the stacked bars use.
                      strokeWidth={CHART_MARKS.surfaceGap}
                    />
                  </G>
                );
              })}
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
              accessibilityLabel={accessibilityLabel}
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
                title={String(categories[active] ?? "")}
                x={xAt(active)}
                y={plot.height / 2}
              />
            ) : null}
          </>
        );
      }}
    </ChartFrame>
  );
}

/** The running total at each category — the top edge of the stack. */
function topOfStack(
  segments: readonly StackSegment[],
  length: number,
): number[] {
  const tops = new Array(length).fill(0);
  for (const segment of segments) {
    if (segment.value != null) {
      tops[segment.index] = Math.max(tops[segment.index], segment.end);
    }
  }
  return tops;
}

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
