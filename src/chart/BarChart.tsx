/** Bars and columns: grouped, stacked, 100% stacked, and diverging. */
import { useMemo, useState } from "react";
import Svg, { Path } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import {
  barPath,
  groupedBars,
  stackedBars,
  type BarMode,
  type BarOrientation,
  type BarRect,
} from "./barGeometry";
import { ChartAxisLabels, ChartGrid, type AxisTick } from "./ChartAxis";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer, type HitTarget } from "./ChartHitLayer";
import { ChartLegend } from "./ChartLegend";
import { assignSeriesColors, OTHER_SERIES_ID } from "./chartPalette";
import { CHART_BANDS, usesPerMarkHitTargets } from "./chartLayout";
import { ChartTableView } from "./ChartTableView";
import { ChartTooltip, type TooltipRow } from "./ChartTooltip";
import { bandScale } from "./scale/band";
import { extentOf, linearScale } from "./scale/linear";
import { compactNumber, niceTicks } from "./scale/ticks";
import {
  foldToOther,
  normalizeSeries,
  percentStack,
  stackSeries,
} from "./series/stack";
import { resolveValueFormat, type ChartCommonProps } from "./types";
import { useSeriesVisibility } from "./useSeriesVisibility";

export type BarChartProps = ChartCommonProps & {
  /** Defaults to `"grouped"`. */
  mode?: BarMode;
  /** Columns (`"vertical"`, the default) or horizontal bars. */
  orientation?: BarOrientation;
  /** Baseline for `mode="diverging"`. Defaults to `0`. */
  baseline?: number;
};

const LEGEND_HEIGHT = 30;

export function BarChart({
  categories,
  series,
  mode = "grouped",
  orientation = "vertical",
  baseline = 0,
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
}: BarChartProps) {
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

  // Stacked forms may fold their tail into a summed "Other"; grouped may not —
  // a summed group means nothing. That policy split lives in chartPalette.
  const stacks = mode === "stacked" || mode === "percent";
  const normalized = useMemo(() => {
    const base = normalizeSeries(series, categories.length);
    return stacks
      ? foldToOther(base, theme.charts.series.length, OTHER_SERIES_ID)
      : base;
  }, [series, categories.length, stacks, theme.charts.series.length]);

  const { colorById } = useMemo(
    () =>
      assignSeriesColors(normalized, theme.charts, {
        emphasisId,
        overflow: stacks ? "fold" : "deemphasize",
        chartName: "BarChart",
      }),
    [normalized, theme.charts, emphasisId, stacks],
  );

  const visible = normalized.filter((entry) => !visibility.isHidden(entry.id));
  const isEmpty = categories.length === 0 || visible.length === 0;

  const legendEntries = normalized.map((entry) => ({
    id: entry.id,
    label: entry.label,
    color: colorById.get(entry.id) ?? theme.charts.deemphasis,
  }));
  // Keyed off the provided count, so isolate can never strand the reader.
  const legendVisible = showLegend ?? series.length >= 2;

  return (
    <ChartFrame
      accessibilityLabel={accessibilityLabel}
      caption={caption}
      defaultWidth={defaultWidth}
      height={height}
      isEmpty={isEmpty}
      emptyState={emptyState}
      legend={
        legendVisible ? (
          <ChartLegend
            disableFocusRing={disableFocusRing}
            entries={legendEntries}
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
      yAxisWidth={orientation === "horizontal" ? 72 : CHART_BANDS.yAxisWidth}
    >
      {(layout, styles) => {
        const { plot } = layout;
        if (!layout.usable) {
          return null;
        }
        const horizontal = orientation === "horizontal";
        // The band runs along the category axis, which swaps with orientation.
        const bandLength = horizontal ? plot.height : plot.width;
        const valueLength = horizontal ? plot.width : plot.height;
        const band = bandScale(categories.length, [0, bandLength]);

        const flat = visible.flatMap((entry) => entry.data);
        const domain =
          mode === "percent"
            ? ([0, 1] as [number, number])
            : mode === "stacked"
              ? stackedDomain(visible, categories.length)
              : extentOf(flat, { includeZero: true });

        const { ticks, domain: niceDomain } = niceTicks(
          domain[0],
          domain[1],
          5,
        );
        const value = linearScale(
          mode === "percent" ? [0, 1] : niceDomain,
          horizontal ? [0, valueLength] : [valueLength, 0],
        );

        const rects: BarRect[] =
          mode === "grouped" || mode === "diverging"
            ? groupedBars(visible, band, value, orientation)
            : stackedBars(
                mode === "percent"
                  ? percentStack(visible, categories.length)
                  : stackSeries(visible, categories.length),
                band,
                value,
                orientation,
              );

        const valueTicks: AxisTick[] = ticks
          .filter((t) => mode !== "percent" || (t >= 0 && t <= 1))
          .map((tick) => ({
            position: value.scale(tick),
            label:
              mode === "percent"
                ? `${Math.round(tick * 100)}%`
                : compactNumber(tick),
          }));
        const categoryTicks: AxisTick[] = categories.map((label, index) => ({
          position: band.center(index),
          label: String(label),
        }));

        // Per-band targets while the band affords a 24px target; the band is
        // the target either way, so this only decides how many there are.
        const perMark = usesPerMarkHitTargets(band.step);
        const targets: HitTarget[] = categories.map((label, index) => {
          const along = perMark ? band.bandwidth : band.step;
          const start = perMark
            ? band.start(index)
            : band.start(index) - (band.step - band.bandwidth) / 2;
          return {
            index,
            label: describe(String(label), visible, index, format),
            ...(horizontal
              ? { x: 0, y: start, width: plot.width, height: along }
              : { x: start, y: 0, width: along, height: plot.height }),
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
            <ChartGrid
              baseline={mode === "percent" ? null : value.scale(baseline)}
              orientation={horizontal ? "horizontal" : "vertical"}
              plot={plot}
              ticks={valueTicks}
            />
            <Svg
              height={plot.height}
              pointerEvents="none"
              style={{ left: plot.x, position: "absolute", top: plot.y }}
              width={plot.width}
            >
              {rects.map((rect, i) => {
                const d = barPath(
                  horizontal ? rect : { ...rect, x: rect.x, y: rect.y },
                );
                if (!d) {
                  return null;
                }
                return (
                  <Path
                    d={d}
                    fill={
                      colorById.get(rect.seriesId) ?? theme.charts.deemphasis
                    }
                    key={`${rect.seriesId}-${rect.index}-${i}`}
                    opacity={active == null || active === rect.index ? 1 : 0.55}
                  />
                );
              })}
            </Svg>
            <ChartAxisLabels
              axis={horizontal ? "x" : "y"}
              rect={horizontal ? layout.xAxis : layout.yAxis}
              styles={styles}
              ticks={valueTicks}
            />
            <ChartAxisLabels
              axis={horizontal ? "y" : "x"}
              rect={horizontal ? layout.yAxis : layout.xAxis}
              slotWidth={Math.max(24, band.step)}
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
                x={horizontal ? plot.width / 2 : band.center(active)}
                y={horizontal ? band.center(active) : plot.height / 2}
              />
            ) : null}
          </>
        );
      }}
    </ChartFrame>
  );
}

/** Domain of a stacked chart: the running totals, not the individual values. */
function stackedDomain(
  series: readonly { data: (number | null)[] }[],
  length: number,
): [number, number] {
  let min = 0;
  let max = 0;
  for (let index = 0; index < length; index += 1) {
    let positive = 0;
    let negative = 0;
    for (const entry of series) {
      const v = entry.data[index];
      if (v == null) {
        continue;
      }
      if (v >= 0) {
        positive += v;
      } else {
        negative += v;
      }
    }
    max = Math.max(max, positive);
    min = Math.min(min, negative);
  }
  return [min, max];
}

/**
 * The per-band accessible label.
 *
 * It enumerates **every visible series** at this category, so a screen-reader
 * user gets exactly what the tooltip shows. The tooltip is decorative; this is
 * the real channel.
 */
function describe(
  category: string,
  series: readonly { id: string; label: string; data: (number | null)[] }[],
  index: number,
  format: (value: number) => string,
): string {
  const parts = series.map((entry) => {
    const value = entry.data[index];
    return `${entry.label}: ${value == null ? "no data" : format(value)}`;
  });
  return `${category}. ${parts.join(". ")}`;
}
