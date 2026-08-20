/** Deltas bridging to a total — where a number came from, step by step. */
import { useMemo, useState } from "react";
import Svg, { Line, Path } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { barPath, type BarRect } from "./barGeometry";
import { ChartAxisLabels, ChartGridLines, type AxisTick } from "./ChartAxis";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer, type HitTarget } from "./ChartHitLayer";
import { CHART_MARKS } from "./chartMarks";
import { ChartTableView } from "./ChartTableView";
import { ChartTooltip } from "./ChartTooltip";
import { bandScale } from "./scale/band";
import { linearScale } from "./scale/linear";
import { compactNumber, niceTicks } from "./scale/ticks";
import { normalizeSeries } from "./series/stack";
import {
  waterfallExtent,
  waterfallSteps,
  type WaterfallInput,
} from "./scatterGeometry";
import { resolveValueFormat } from "./types";

export type WaterfallChartProps = {
  data: readonly WaterfallInput[];
  title?: string;
  caption?: string;
  height?: number;
  defaultWidth?: number;
  loading?: boolean;
  valueFormat?: (value: number) => string;
  showTableView?: boolean;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
  testID?: string;
};

/**
 * A waterfall.
 *
 * Increases and decreases take the **diverging** pair rather than identity
 * hues: the sign is the whole point, and a categorical palette would say the
 * bars are different things rather than the same thing pointing two ways.
 * Totals wear a neutral ink so they read as restatements, not contributions.
 */
export function WaterfallChart({
  data,
  title,
  caption,
  height = 300,
  defaultWidth,
  loading,
  valueFormat,
  showTableView = true,
  accessibilityLabel,
  disableFocusRing,
  style,
  testID,
}: WaterfallChartProps) {
  const theme = useSharedUiTheme();
  const format = resolveValueFormat(valueFormat);
  const [active, setActive] = useState<number | null>(null);

  const steps = useMemo(() => waterfallSteps(data), [data]);
  const isEmpty = steps.length === 0;

  return (
    <ChartFrame
      accessibilityLabel={accessibilityLabel}
      caption={caption}
      defaultWidth={defaultWidth}
      height={height}
      isEmpty={isEmpty}
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
            categories={steps.map((step) => step.label)}
            categoryLabel="Step"
            series={normalizeSeries(
              [
                {
                  id: "change",
                  label: "Change",
                  data: steps.map((step) =>
                    step.kind === "total" ? step.end : step.value,
                  ),
                },
                {
                  id: "running",
                  label: "Running total",
                  data: steps.map((step) => step.end),
                },
              ],
              steps.length,
            )}
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
        const [min, max] = waterfallExtent(steps);
        const { ticks, domain } = niceTicks(min, max, 5);
        const value = linearScale(domain, [plot.height, 0]);
        const band = bandScale(steps.length, [0, plot.width]);
        const thickness = Math.min(CHART_MARKS.maxBarThickness, band.bandwidth);

        const rects: BarRect[] = steps.map((step, index) => {
          const a = value.scale(step.start);
          const b = value.scale(step.end);
          return {
            seriesId: step.id,
            index,
            value: step.value,
            x: band.start(index) + (band.bandwidth - thickness) / 2,
            y: Math.min(a, b),
            width: thickness,
            height: Math.max(1, Math.abs(b - a)),
            radius: CHART_MARKS.barRadius,
            dataEnd: step.end >= step.start ? "top" : "bottom",
          };
        });

        const fillFor = (kind: (typeof steps)[number]["kind"]) =>
          kind === "total"
            ? theme.colors.ink2
            : kind === "increase"
              ? theme.charts.diverging.positive
              : theme.charts.diverging.negative;

        const valueTicks: AxisTick[] = ticks.map((tick) => ({
          position: value.scale(tick),
          label: compactNumber(tick),
        }));
        const categoryTicks: AxisTick[] = steps.map((step, index) => ({
          position: band.center(index),
          label: step.label,
        }));

        const targets: HitTarget[] = steps.map((step, index) => ({
          index,
          label:
            step.kind === "total"
              ? `${step.label}: total ${format(step.end)}`
              : `${step.label}: ${step.value >= 0 ? "up" : "down"} ${format(
                  Math.abs(step.value),
                )}, running total ${format(step.end)}`,
          x: band.start(index),
          y: 0,
          width: band.bandwidth,
          height: plot.height,
        }));

        return (
          <>
            <ChartGridLines
              baseline={value.scale(0)}
              plot={plot}
              ticks={valueTicks}
            />
            <Svg
              height={plot.height}
              pointerEvents="none"
              style={{ left: plot.x, position: "absolute", top: plot.y }}
              width={plot.width}
            >
              {rects.map((rect, index) => (
                <Path
                  d={barPath(rect)}
                  fill={fillFor(steps[index].kind)}
                  key={rect.seriesId}
                  opacity={active == null || active === index ? 1 : 0.55}
                />
              ))}
              {/* Connectors make the bridge readable: without them the bars
                  float and the running total is invisible. */}
              {rects
                .slice(0, -1)
                .map((rect, index) =>
                  steps[index + 1]?.kind === "total" ? null : (
                    <Line
                      key={`link-${rect.seriesId}`}
                      stroke={theme.charts.axis}
                      strokeWidth={1}
                      x1={rect.x + rect.width}
                      x2={rects[index + 1].x}
                      y1={value.scale(steps[index].end)}
                      y2={value.scale(steps[index].end)}
                    />
                  ),
                )}
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
              slotWidth={Math.max(24, band.step)}
              styles={styles}
              ticks={categoryTicks}
            />
            <ChartHitLayer
              activeIndex={active}
              disableFocusRing={disableFocusRing}
              onActivate={setActive}
              onHover={setActive}
              plot={plot}
              targets={targets}
            />
            {active != null && steps[active] ? (
              <ChartTooltip
                plot={plot}
                rows={[
                  {
                    seriesId: steps[active].id,
                    label:
                      steps[active].kind === "total"
                        ? "Total"
                        : "Running total",
                    color: fillFor(steps[active].kind),
                    value: format(steps[active].end),
                  },
                ]}
                title={steps[active].label}
                x={band.center(active)}
                y={plot.height / 2}
              />
            ) : null}
          </>
        );
      }}
    </ChartFrame>
  );
}
