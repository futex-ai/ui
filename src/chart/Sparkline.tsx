/** A micro chart: no axes, no legend, no chrome — just the shape. */
import { useMemo, useState } from "react";
import {
  type LayoutChangeEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { CHART_MARKS } from "./chartMarks";
import { linePath, projectPoints } from "./lineGeometry";
import { bandScale } from "./scale/band";
import { extentOf, linearScale } from "./scale/linear";
import { winLoss } from "./statValue";

export type SparklineVariant = "line" | "bar" | "win-loss";

export type SparklineProps = {
  data: readonly (number | null)[];
  variant?: SparklineVariant;
  /** Defaults to the first categorical slot. */
  color?: string;
  /** Colour for the last point, so "now" reads against the trend. */
  accentColor?: string;
  /** Mark the final point with a dot. Defaults to `true` on the line variant. */
  showEndDot?: boolean;
  width?: number;
  height?: number;
  /**
   * A sparkline carries no axes, so it needs a name of its own. Without one it
   * is decorative and hidden from assistive technology — which is correct when
   * it sits inside a `StatTile` that already announces the number.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * A 12-point-ish trend line small enough to sit inside a stat tile or a table
 * row. Deliberately minimal: axes, gridlines and a legend would each cost more
 * space than the mark itself and turn a glance into a read.
 */
export function Sparkline({
  data,
  variant = "line",
  color,
  accentColor,
  showEndDot,
  width = 96,
  height = 28,
  accessibilityLabel,
  style,
  testID,
}: SparklineProps) {
  const theme = useSharedUiTheme();
  const [measured, setMeasured] = useState(width);
  const stroke = color ?? theme.charts.series[0];
  const accent = accentColor ?? stroke;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    if (next > 0 && Math.abs(next - measured) > 0.5) {
      setMeasured(next);
    }
  };

  const body = useMemo(() => {
    const w = measured;
    const [min, max] = extentOf(data, { includeZero: variant !== "line" });
    const value = linearScale([min, max], [height - 2, 2]);

    if (variant === "line") {
      const band = bandScale(data.length, [1, w - 1], {
        paddingInner: 0,
        paddingOuter: 0,
      });
      const points = projectPoints(data, (i) => band.center(i), value);
      const last = [...points].reverse().find((p) => p !== null);
      return (
        <>
          <Path
            d={linePath(points)}
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={CHART_MARKS.lineWidth}
          />
          {(showEndDot ?? true) && last ? (
            <Circle cx={last.x} cy={last.y} fill={accent} r={2.5} />
          ) : null}
        </>
      );
    }

    const marks = variant === "win-loss" ? winLoss(data) : data;
    const band = bandScale(marks.length, [0, w], { paddingOuter: 0 });
    const zero =
      variant === "win-loss" ? height / 2 : value.scale(Math.max(0, min));

    return (
      <>
        {marks.map((datum, index) => {
          if (datum == null) {
            return null;
          }
          const isLast = index === marks.length - 1;
          if (variant === "win-loss") {
            // Magnitude is discarded on purpose: the streak is the story.
            const up = datum > 0;
            const size = Math.max(2, height / 2 - 2);
            return datum === 0 ? null : (
              <Rect
                fill={isLast ? accent : stroke}
                height={size}
                key={index}
                rx={1}
                width={Math.max(1, band.bandwidth)}
                x={band.start(index)}
                y={up ? zero - size : zero}
              />
            );
          }
          const top = value.scale(datum as number);
          return (
            <Rect
              fill={isLast ? accent : stroke}
              height={Math.max(1, Math.abs(zero - top))}
              key={index}
              rx={1}
              width={Math.max(1, band.bandwidth)}
              x={band.start(index)}
              y={Math.min(top, zero)}
            />
          );
        })}
      </>
    );
  }, [data, variant, measured, height, stroke, accent, showEndDot]);

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      // Without a name it is decorative — correct inside a StatTile, whose
      // value and delta already carry the information.
      aria-hidden={accessibilityLabel ? undefined : true}
      onLayout={onLayout}
      role={accessibilityLabel ? "img" : undefined}
      style={[{ height, width: width === undefined ? "100%" : width }, style]}
      testID={testID}
    >
      <Svg height={height} width={measured}>
        {body}
      </Svg>
    </View>
  );
}
