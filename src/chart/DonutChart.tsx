/** Part-to-whole at a glance. Six slices maximum — past that, a bar. */
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { devWarn } from "../devWarn";
import { useSharedUiTheme } from "../theme";

import { arcPath, pieSlices, polarPoint } from "./arcGeometry";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer } from "./ChartHitLayer";
import { MIN_HIT_TARGET } from "./chartLayout";
import { ChartLegend } from "./ChartLegend";
import { assignSeriesColors } from "./chartPalette";
import { ChartTableView } from "./ChartTableView";
import { normalizeSeries } from "./series/stack";
import { resolveValueFormat } from "./types";
import type { ChartCommonProps } from "./types";
import { useSeriesVisibility } from "./useSeriesVisibility";

/** Past this, adjacent wedges are too similar in angle to compare. */
export const DONUT_SLICE_CAP = 6;

export type DonutDatum = {
  id: string;
  label?: string;
  value: number | null;
  color?: string;
};

export type DonutChartProps = Omit<
  ChartCommonProps,
  "categories" | "series" | "xScale" | "activeIndex" | "onActiveIndexChange"
> & {
  data: readonly DonutDatum[];
  /** `0` for a pie. Defaults to `0.62` of the outer radius. */
  innerRadiusRatio?: number;
  /** Show the total in the middle. Ignored when `innerRadiusRatio` is 0. */
  centerLabel?: string;
};

export function DonutChart({
  data,
  innerRadiusRatio = 0.62,
  centerLabel,
  title,
  caption,
  height = 260,
  defaultWidth,
  loading,
  emptyState,
  showLegend,
  hiddenSeriesIds,
  onHiddenSeriesIdsChange,
  onDatumPress,
  valueFormat,
  emphasisId,
  showTableView = true,
  accessibilityLabel,
  disableFocusRing,
  style,
  testID,
}: DonutChartProps) {
  const theme = useSharedUiTheme();
  const format = resolveValueFormat(valueFormat);
  const visibility = useSeriesVisibility({
    hiddenSeriesIds,
    onHiddenSeriesIdsChange,
  });
  const [active, setActive] = useState<string | null>(null);

  if (data.length > DONUT_SLICE_CAP) {
    devWarn(
      `DonutChart: ${data.length} slices but part-to-whole reads at a glance ` +
        `only up to ${DONUT_SLICE_CAP}. Past that, adjacent wedges differ by ` +
        `too little angle to compare — use a bar chart, or fold the tail.`,
    );
  }

  const entries = useMemo(
    () =>
      data.map((d) => ({ id: d.id, label: d.label ?? d.id, color: d.color })),
    [data],
  );
  const { colorById } = useMemo(
    () =>
      assignSeriesColors(entries, theme.charts, {
        emphasisId,
        chartName: "DonutChart",
      }),
    [entries, theme.charts, emphasisId],
  );

  const visibleData = data.filter((d) => !visibility.isHidden(d.id));
  const total = visibleData.reduce((sum, d) => sum + (d.value ?? 0), 0);
  const isEmpty = total <= 0;

  const legendVisible = showLegend ?? data.length >= 2;
  // A donut has no axis, so the table twin is the only place the exact numbers
  // live — angles are famously hard to compare by eye.
  const tableSeries = useMemo(
    () =>
      normalizeSeries(
        data.map((d) => ({
          id: d.id,
          label: d.label ?? d.id,
          data: [d.value],
        })),
        1,
      ),
    [data],
  );

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
            entries={entries.map((entry) => ({
              id: entry.id,
              label: entry.label,
              color: colorById.get(entry.id) ?? theme.charts.deemphasis,
            }))}
            hidden={visibility.hidden}
            onToggle={visibility.toggle}
          />
        ) : null
      }
      legendHeight={legendVisible ? 30 : 0}
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
            categories={["Value"]}
            categoryLabel="Segment"
            series={tableSeries}
            valueFormat={format}
          />
        ) : undefined
      }
      testID={testID}
      title={title}
      xAxisHeight={0}
      yAxisWidth={0}
    >
      {(layout) => {
        const { plot } = layout;
        if (!layout.usable) {
          return null;
        }
        const size = Math.min(plot.width, plot.height);
        const cx = plot.width / 2;
        const cy = plot.height / 2;
        const outer = size / 2 - 2;
        const inner = outer * Math.min(0.95, Math.max(0, innerRadiusRatio));
        // A 2px surface gap between wedges, expressed as an angle at the
        // outer edge — white doing the separating, not a stroke.
        const gapAngle = outer > 0 ? 2 / outer : 0;
        const slices = pieSlices(
          visibleData.map((d) => ({ id: d.id, value: d.value })),
          gapAngle,
        );

        return (
          <View
            style={{
              height: plot.height,
              left: plot.x,
              position: "absolute",
              top: plot.y,
              width: plot.width,
            }}
          >
            <Svg height={plot.height} width={plot.width}>
              {slices.map((slice) => (
                <Path
                  d={arcPath(
                    cx,
                    cy,
                    inner,
                    outer,
                    slice.startAngle,
                    slice.endAngle,
                  )}
                  fill={colorById.get(slice.id) ?? theme.charts.deemphasis}
                  key={slice.id}
                  opacity={active == null || active === slice.id ? 1 : 0.55}
                />
              ))}
            </Svg>
            {inner > 0 ? (
              <View
                aria-hidden
                pointerEvents="none"
                style={{
                  alignItems: "center",
                  height: plot.height,
                  justifyContent: "center",
                  position: "absolute",
                  width: plot.width,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.ink,
                    fontFamily: theme.fonts.sans,
                    fontSize: 20,
                    fontWeight: "600",
                  }}
                >
                  {format(total)}
                </Text>
                {centerLabel ? (
                  <Text
                    style={{
                      color: theme.colors.muted,
                      fontFamily: theme.fonts.sans,
                      fontSize: 12,
                    }}
                  >
                    {centerLabel}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <ChartHitLayer
              activeIndex={
                active == null ? null : slices.findIndex((s) => s.id === active)
              }
              disableFocusRing={disableFocusRing}
              onActivate={(index) => {
                const slice = slices[index];
                if (!slice) {
                  return;
                }
                setActive(slice.id);
                onDatumPress?.({
                  seriesId: slice.id,
                  index: data.findIndex((d) => d.id === slice.id),
                  value: slice.value,
                });
              }}
              onHover={(index) =>
                setActive(index == null ? null : (slices[index]?.id ?? null))
              }
              plot={{ x: 0, y: 0, width: plot.width, height: plot.height }}
              targets={slices.map((slice, index) => {
                // A wedge is an awkward pointer target and an impossible
                // keyboard one, so the target is a comfortable box centred on
                // the slice's mid-angle at mid-radius — the same "the target
                // is not the painted pixels" rule the other charts follow.
                const mid = (slice.startAngle + slice.endAngle) / 2;
                const centre = polarPoint(cx, cy, (inner + outer) / 2, mid);
                const box = Math.max(
                  MIN_HIT_TARGET,
                  Math.min(44, outer - inner || MIN_HIT_TARGET),
                );
                const label =
                  entries.find((e) => e.id === slice.id)?.label ?? slice.id;
                return {
                  index,
                  label: `${label}: ${format(slice.value)}, ${Math.round(
                    slice.fraction * 100,
                  )}% of ${format(total)}`,
                  x: centre.x - box / 2,
                  y: centre.y - box / 2,
                  width: box,
                  height: box,
                };
              })}
            />
          </View>
        );
      }}
    </ChartFrame>
  );
}
