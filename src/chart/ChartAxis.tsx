/** Axis chrome: hairline gridlines, a baseline, and tick labels. */
import { Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import type { Rect } from "./chartLayout";
import { CHART_MARKS, type ChartStyles } from "./chartStyles";

export type AxisTick = {
  /** Pixel position along the axis, in frame coordinates. */
  position: number;
  label: string;
};

export type ChartGridProps = {
  plot: Rect;
  /** Value-axis ticks, used to place the horizontal gridlines. */
  ticks: readonly AxisTick[];
  /** Draw a heavier rule at this position (the zero baseline), if any. */
  baseline?: number | null;
  orientation?: "vertical" | "horizontal";
};

/**
 * Gridlines and the baseline, painted under the marks.
 *
 * Solid hairlines, one step off the surface. Never dashed: dashing reads as
 * "projection" or "threshold" when it is only a grid, and it adds visual noise
 * to something whose whole job is to recede.
 */
export function ChartGrid({
  plot,
  ticks,
  baseline = null,
  orientation = "vertical",
}: ChartGridProps) {
  const theme = useSharedUiTheme();
  if (plot.width <= 0 || plot.height <= 0) {
    return null;
  }
  return (
    <Svg
      height={plot.height}
      pointerEvents="none"
      style={{ left: plot.x, position: "absolute", top: plot.y }}
      width={plot.width}
    >
      {ticks.map((tick) => {
        const isBaseline =
          baseline != null && Math.abs(tick.position - baseline) < 0.5;
        const common = {
          stroke: isBaseline ? theme.charts.axis : theme.charts.grid,
          strokeWidth: isBaseline ? 1 : CHART_MARKS.gridWidth,
        };
        return orientation === "vertical" ? (
          <Line
            key={`${tick.label}-${tick.position}`}
            x1={0}
            x2={plot.width}
            y1={tick.position}
            y2={tick.position}
            {...common}
          />
        ) : (
          <Line
            key={`${tick.label}-${tick.position}`}
            x1={tick.position}
            x2={tick.position}
            y1={0}
            y2={plot.height}
            {...common}
          />
        );
      })}
    </Svg>
  );
}

export type ChartAxisLabelsProps = {
  rect: Rect;
  ticks: readonly AxisTick[];
  axis: "x" | "y";
  styles: ChartStyles;
  /** Width allotted to each x label before it is allowed to collide. */
  slotWidth?: number;
};

/**
 * Tick labels, rendered as real `Text` rather than SVG text so they inherit
 * font tokens, scale with the OS text size, and stay readable to assistive
 * technology.
 *
 * Labels are absolutely positioned against the plot, and x labels drop to
 * every-other when they would collide — a crowded axis that overlaps is worse
 * than a sparser one, and the values are all in the table view regardless.
 */
export function ChartAxisLabels({
  rect,
  ticks,
  axis,
  styles,
  slotWidth = 48,
}: ChartAxisLabelsProps) {
  if (ticks.length === 0) {
    return null;
  }
  // Thin x labels out until each has room, rather than letting them overlap.
  const stride =
    axis === "x" && ticks.length > 1
      ? Math.max(
          1,
          Math.ceil((ticks.length * slotWidth) / Math.max(1, rect.width)),
        )
      : 1;

  return (
    <View
      pointerEvents="none"
      style={{
        height: rect.height,
        left: rect.x,
        position: "absolute",
        top: rect.y,
        width: rect.width,
      }}
    >
      {ticks.map((tick, index) => {
        if (axis === "x" && index % stride !== 0) {
          return null;
        }
        const positional =
          axis === "x"
            ? {
                left: tick.position - slotWidth / 2,
                top: 4,
                width: slotWidth,
              }
            : {
                // Nudge up by half a line so the label centres on its gridline.
                top: tick.position - 7,
                right: 8,
                width: rect.width - 8,
              };
        return (
          <Text
            key={`${tick.label}-${tick.position}`}
            numberOfLines={1}
            style={[
              styles.axisLabel,
              axis === "x" ? styles.xAxisLabel : styles.yAxisLabel,
              { position: "absolute" },
              positional,
            ]}
          >
            {tick.label}
          </Text>
        );
      })}
    </View>
  );
}
