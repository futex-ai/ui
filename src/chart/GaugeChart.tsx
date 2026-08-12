/** A dial: one ratio against its limit. */
import { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useSharedUiTheme } from "../theme";

import { arcPath, GAUGE_START, GAUGE_SWEEP, gaugeAngles } from "./arcGeometry";
import { ChartFrame } from "./ChartFrame";
import { rampColor } from "./chartPalette";

export type GaugeBand = {
  /** Upper bound of this band as a fraction of the range, `0..1`. */
  upTo: number;
  color: string;
};

export type GaugeChartProps = {
  value: number;
  /** Defaults to `0`. */
  min?: number;
  /** Defaults to `100`. */
  max?: number;
  title?: string;
  caption?: string;
  height?: number;
  defaultWidth?: number;
  /** Formats the centre readout. */
  valueFormat?: (value: number) => string;
  /**
   * Severity bands, ascending by `upTo`. The fill takes the band its value
   * falls in, so a gauge reads good/warning/critical without a legend.
   */
  bands?: readonly GaugeBand[];
  loading?: boolean;
  accessibilityLabel?: string;
  style?: import("react-native").StyleProp<import("react-native").ViewStyle>;
  testID?: string;
};

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  title,
  caption,
  height = 200,
  defaultWidth,
  valueFormat,
  bands,
  loading,
  accessibilityLabel,
  style,
  testID,
}: GaugeChartProps) {
  const theme = useSharedUiTheme();
  const span = max - min;
  const fraction =
    span === 0 || !Number.isFinite(value)
      ? 0
      : Math.min(1, Math.max(0, (value - min) / span));

  const fill = useMemo(() => {
    if (!bands || bands.length === 0) {
      // No bands: the fill is a step of the sequential ramp, so a fuller dial
      // reads darker as well as longer.
      return rampColor(fraction, theme.charts.sequential.slice(4));
    }
    const band = [...bands]
      .sort((a, b) => a.upTo - b.upTo)
      .find((b) => fraction <= b.upTo);
    return band?.color ?? bands[bands.length - 1].color;
  }, [bands, fraction, theme.charts.sequential]);

  const readout = valueFormat
    ? valueFormat(value)
    : `${Math.round(fraction * 100)}%`;

  return (
    <ChartFrame
      accessibilityLabel={
        accessibilityLabel ?? `${title ?? "Gauge"}: ${readout}`
      }
      caption={caption}
      defaultWidth={defaultWidth}
      height={height}
      hideTableToggle
      loading={loading}
      style={style}
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
        const cy = plot.height / 2 + size * 0.08;
        const outer = size / 2 - 4;
        const inner = outer * 0.74;
        const { startAngle, endAngle } = gaugeAngles(fraction);

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
              {/* The unfilled track is a light step of the *same* ramp, so the
                  state reads across the whole dial rather than only where the
                  fill reaches. */}
              <Path
                d={arcPath(
                  cx,
                  cy,
                  inner,
                  outer,
                  GAUGE_START,
                  GAUGE_START + GAUGE_SWEEP,
                )}
                fill={theme.charts.sequential[1]}
              />
              <Path
                d={arcPath(cx, cy, inner, outer, startAngle, endAngle)}
                fill={fill}
              />
            </Svg>
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
                  fontSize: 24,
                  fontWeight: "600",
                }}
              >
                {readout}
              </Text>
            </View>
          </View>
        );
      }}
    </ChartFrame>
  );
}
