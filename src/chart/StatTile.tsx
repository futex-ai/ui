/**
 * The honest answer to most single-number requests.
 *
 * A one-bar bar chart and a two-slice pie both say less than this does, in more
 * space. When the data is a current value plus maybe a trend, the number *is*
 * the chart.
 */
import { useMemo, type ReactNode } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";

import { useSharedUiTheme } from "../theme";

import { Sparkline } from "./Sparkline";
import {
  describeDelta,
  deltaTone,
  formatDelta,
  formatStatValue,
  type DeltaDirection,
  type StatDelta,
} from "./statValue";

export type StatTileProps = {
  /** Sentence case, no trailing colon. */
  label: string;
  value: number;
  /** Overrides the default compaction (1,284 / 12.9K / $4.2M). */
  valueFormat?: (value: number) => string;
  delta?: StatDelta;
  /** Whether a rise is good for this metric. Defaults to `"up-is-good"`. */
  deltaDirection?: DeltaDirection;
  /** A short trend behind the number. */
  trend?: readonly (number | null)[];
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function StatTile({
  label,
  value,
  valueFormat,
  delta,
  deltaDirection = "up-is-good",
  trend,
  style,
  testID,
}: StatTileProps) {
  const theme = useSharedUiTheme();
  const tone = delta ? deltaTone(delta.value, deltaDirection) : "neutral";

  const styles = useMemo(
    () => ({
      root: { gap: 4, minWidth: 120 },
      label: {
        color: theme.colors.muted,
        fontFamily: theme.fonts.sans,
        fontSize: 12,
      },
      value: {
        color: theme.colors.ink,
        fontFamily: theme.fonts.sans,
        fontSize: 26,
        fontWeight: "600" as const,
        // Proportional figures on purpose: `tabular-nums` gives every digit
        // the width of a zero, which makes a number like 121 look loose at
        // display sizes. Tabular is for columns that must align.
      },
      row: {
        alignItems: "center" as const,
        flexDirection: "row" as const,
        gap: 6,
      },
      delta: {
        fontFamily: theme.fonts.sans,
        fontSize: 12,
        fontWeight: "500" as const,
      },
      period: {
        color: theme.colors.muted,
        fontFamily: theme.fonts.sans,
        fontSize: 12,
      },
    }),
    [theme],
  );

  // Text-grade tokens, not the status marks: `status.good` is validated at the
  // 3:1 *mark* floor and measures 3.35:1 on a light surface, which fails the
  // 4.5:1 text floor (WCAG 2.1 - 1.4.3, AA).
  const deltaColor =
    tone === "good"
      ? theme.charts.deltaPositive
      : tone === "bad"
        ? theme.charts.deltaNegative
        : theme.colors.muted;

  // The tile announces as one unit: a screen reader should hear
  // "Revenue, 42.1K, up 12.4% vs last month, an improvement" rather than three
  // disconnected fragments.
  //
  // Direction and tone are separate facts and must not be conflated: churn
  // falling is *down* and *an improvement* at once. Saying "up" because the
  // tone is good would simply misreport the number. The tone is spelled out
  // too, so the good/bad signal the colour carries is not colour-only.
  const spoken = [
    label,
    formatStatValue(value, valueFormat),
    delta ? describeDelta(delta, tone) : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View
      accessibilityLabel={spoken}
      accessible
      style={[styles.root, style]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{formatStatValue(value, valueFormat)}</Text>
      {delta || trend ? (
        <View style={styles.row}>
          {delta ? (
            <>
              <Text style={[styles.delta, { color: deltaColor }]}>
                {formatDelta(delta)}
              </Text>
              {delta.period ? (
                <Text style={styles.period}>{delta.period}</Text>
              ) : null}
            </>
          ) : null}
          {trend ? (
            <Sparkline
              // The sparkline's accent is a mark, so the status steps are
              // correct here even though the label above needs text-grade ones.
              accentColor={
                tone === "good"
                  ? theme.charts.status.good
                  : tone === "bad"
                    ? theme.charts.status.critical
                    : theme.charts.series[0]
              }
              // The trend recedes into the de-emphasis grey with only the
              // current period accented: the number is the headline, the
              // sparkline is context.
              color={theme.charts.deemphasis}
              data={trend}
              height={20}
              width={72}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export type StatTileRowProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** A KPI row: several headline numbers reading as one band. */
export function StatTileRow({ children, style, testID }: StatTileRowProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 28,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
}
