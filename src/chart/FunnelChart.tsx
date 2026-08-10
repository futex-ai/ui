/** Stages of a process, on the ordinal ramp — order is the meaning. */
import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Polygon } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { funnelStages, polygonPoints } from "./arcGeometry";
import { ChartFrame } from "./ChartFrame";
import { ChartHitLayer } from "./ChartHitLayer";
import { ChartTableView } from "./ChartTableView";
import { rampColor } from "./chartPalette";
import { normalizeSeries } from "./series/stack";
import { resolveValueFormat } from "./types";

export type FunnelDatum = {
  id: string;
  label?: string;
  value: number | null;
};

export type FunnelChartProps = {
  data: readonly FunnelDatum[];
  title?: string;
  caption?: string;
  height?: number;
  defaultWidth?: number;
  loading?: boolean;
  valueFormat?: (value: number) => string;
  showTableView?: boolean;
  accessibilityLabel?: string;
  disableFocusRing?: boolean;
  onDatumPress?: (ref: {
    seriesId: string;
    index: number;
    value: number | null;
  }) => void;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
  testID?: string;
};

/**
 * A funnel.
 *
 * Stages are **ordinal**, not categorical: swapping two of them changes the
 * meaning, so they take a single-hue ramp whose darkening carries the order.
 * Giving each stage its own identity hue would say they are interchangeable.
 */
export function FunnelChart({
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
  onDatumPress,
  style,
  testID,
}: FunnelChartProps) {
  const theme = useSharedUiTheme();
  const format = resolveValueFormat(valueFormat);
  const [active, setActive] = useState<number | null>(null);
  const isEmpty = data.length === 0 || data.every((d) => (d.value ?? 0) <= 0);

  const labelOf = (id: string) => data.find((d) => d.id === id)?.label ?? id;

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
            categories={["Reached"]}
            categoryLabel="Stage"
            series={normalizeSeries(
              data.map((d) => ({
                id: d.id,
                label: d.label ?? d.id,
                data: [d.value],
              })),
              1,
            )}
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
        const stages = funnelStages(data, plot.width, plot.height);

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
              {stages.map((stage, index) => (
                <Polygon
                  fill={rampColor(
                    stages.length <= 1 ? 0 : index / (stages.length - 1),
                    theme.charts.ordinal,
                  )}
                  key={stage.id}
                  opacity={active == null || active === index ? 1 : 0.65}
                  points={polygonPoints(stage.points)}
                />
              ))}
            </Svg>
            {stages.map((stage, index) => {
              const top = stage.points[0].y;
              const rowHeight = stage.points[3].y - top;
              return (
                <View
                  aria-hidden
                  key={stage.id}
                  pointerEvents="none"
                  style={{
                    alignItems: "center",
                    height: rowHeight,
                    justifyContent: "center",
                    position: "absolute",
                    top,
                    width: plot.width,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.onSolid,
                      fontFamily: theme.fonts.sans,
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {labelOf(stage.id)} · {format(stage.value)}
                  </Text>
                </View>
              );
            })}
            <ChartHitLayer
              accessibilityLabel={accessibilityLabel}
              activeIndex={active}
              disableFocusRing={disableFocusRing}
              onActivate={(index) => {
                setActive(index);
                const stage = stages[index];
                onDatumPress?.({
                  seriesId: stage?.id ?? "",
                  index,
                  value: stage?.value ?? null,
                });
              }}
              onHover={setActive}
              plot={{ x: 0, y: 0, width: plot.width, height: plot.height }}
              targets={stages.map((stage, index) => ({
                index,
                // Both conversions are spoken: "how many reached here" and
                // "where we lost them" are different questions, and the shape
                // only answers the first.
                label:
                  `${labelOf(stage.id)}: ${format(stage.value)}, ` +
                  `${Math.round(stage.fromTop * 100)}% of the first stage` +
                  (index === 0
                    ? ""
                    : `, ${Math.round(stage.fromPrevious * 100)}% of the previous`),
                x: 0,
                y: stage.points[0].y,
                width: plot.width,
                height: stage.points[3].y - stage.points[0].y,
              }))}
            />
          </View>
        );
      }}
    </ChartFrame>
  );
}
