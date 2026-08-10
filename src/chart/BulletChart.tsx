/** Value against a target, over qualitative bands. */
import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { CHART_MARKS } from "./chartMarks";
import { linearScale } from "./scale/linear";

export type BulletRow = {
  id: string;
  label: string;
  value: number;
  target?: number;
  /** Ascending upper bounds for the qualitative background bands. */
  bands?: readonly number[];
};

export type BulletChartProps = {
  rows: readonly BulletRow[];
  /** Defaults to the largest of every value, target and band. */
  max?: number;
  min?: number;
  valueFormat?: (value: number) => string;
  accessibilityLabel?: string;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
  testID?: string;
};

const ROW_HEIGHT = 34;
const BAR_HEIGHT = 10;

/**
 * A bullet chart: a thin measure bar over graded background bands, with the
 * target as a perpendicular tick.
 *
 * It answers "are we on track" in the space of a table row, which is why it
 * beats a gauge for a list of KPIs — gauges cost a whole card each.
 */
export function BulletChart({
  rows,
  max,
  min = 0,
  valueFormat,
  accessibilityLabel,
  style,
  testID,
}: BulletChartProps) {
  const format = valueFormat ?? ((v: number) => String(v));

  const resolvedMax =
    max ??
    Math.max(
      ...rows.flatMap((row) => [
        row.value,
        row.target ?? Number.NEGATIVE_INFINITY,
        ...(row.bands ?? []),
      ]),
      1,
    );

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      role={accessibilityLabel ? "group" : undefined}
      style={[{ gap: 4, width: "100%" }, style]}
      testID={testID}
    >
      {rows.map((row) => (
        <BulletRowView
          format={format}
          key={row.id}
          max={resolvedMax}
          min={min}
          row={row}
        />
      ))}
    </View>
  );
}

function BulletRowView({
  format,
  max,
  min,
  row,
}: {
  format: (value: number) => string;
  max: number;
  min: number;
  row: BulletRow;
}) {
  const theme = useSharedUiTheme();
  const [width, setWidth] = useState(0);
  const scale = linearScale([min, max], [0, width]);
  const bands = row.bands ?? [];

  const met = row.target == null ? null : row.value >= row.target;
  // The target verdict is spoken, not left to the eye: whether a bar clears a
  // tick is exactly the judgement a screen-reader user cannot make.
  const spoken =
    `${row.label}: ${format(row.value)}` +
    (row.target == null
      ? ""
      : `, target ${format(row.target)}, ${met ? "met" : "not met"}`);

  return (
    <View
      accessibilityLabel={spoken}
      accessible
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: 2, paddingVertical: 4 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text
          style={{
            color: theme.colors.ink,
            fontFamily: theme.fonts.sans,
            fontSize: 12,
          }}
        >
          {row.label}
        </Text>
        <Text
          style={{
            color: theme.colors.muted,
            fontFamily: theme.fonts.sans,
            fontSize: 12,
            fontVariant: ["tabular-nums"],
          }}
        >
          {format(row.value)}
        </Text>
      </View>
      {width > 0 ? (
        <Svg height={ROW_HEIGHT / 2} width={width}>
          {/* Qualitative bands, lightest first, so the measure reads against a
              graded backdrop rather than a flat track. */}
          {bands.map((bound, index) => {
            const start = index === 0 ? min : bands[index - 1];
            return (
              <Rect
                fill={theme.charts.sequential[Math.max(0, 2 - index)]}
                height={BAR_HEIGHT + 6}
                key={bound}
                x={scale.scale(start)}
                width={Math.max(0, scale.scale(bound) - scale.scale(start))}
                y={0}
              />
            );
          })}
          {bands.length === 0 ? (
            <Rect
              fill={theme.colors.soft}
              height={BAR_HEIGHT + 6}
              width={width}
              x={0}
              y={0}
            />
          ) : null}
          <Rect
            fill={theme.charts.series[0]}
            height={BAR_HEIGHT}
            rx={2}
            width={Math.max(0, scale.scale(row.value))}
            x={0}
            y={3}
          />
          {row.target != null ? (
            <Line
              stroke={theme.colors.ink}
              strokeWidth={CHART_MARKS.lineWidth}
              x1={scale.scale(row.target)}
              x2={scale.scale(row.target)}
              y1={0}
              y2={BAR_HEIGHT + 6}
            />
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
