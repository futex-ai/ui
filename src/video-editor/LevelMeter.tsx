/**
 * A dBFS level meter.
 *
 * Chrome only: levels arrive as numbers the consumer measures, and peak holds
 * arrive the same way, so the component never owns a timer and renders
 * identically every time it is given the same input — which is what makes it
 * testable and what keeps the Storybook build deterministic.
 *
 * Each channel publishes its level as an ARIA `meter`, so the reading is
 * available to a screen reader instead of existing only as a coloured bar
 * (WCAG 2.1 — 1.4.1 Use of Colour, A; 4.1.2 Name, Role, Value, A).
 */
import { useMemo } from "react";
import {
  Platform,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import {
  describeLevel,
  dbToFraction,
  METER_MIN_DB,
  METER_SCALE_TICKS,
  meterBands,
  type MeterZone,
} from "./levelMeterScale";
import { percent, videoEditorSizing } from "./videoEditorSizing";
import { createVideoEditorStyles } from "./videoEditorStyles";

export type LevelMeterProps = {
  /** Current level per channel, in dBFS. `-Infinity` is silence. */
  values: readonly number[];
  /** Peak-hold level per channel, in dBFS. Omit for no hold markers. */
  peakHolds?: readonly number[];
  /** Quietest level shown. Default `-60`. */
  minDb?: number;
  /** Channel names, folded into each channel's accessible label. */
  channelLabels?: readonly string[];
  /** Draw the dB scale beneath the channels. Default `false`. */
  showScale?: boolean;
  /** Overall length in px. Defaults to filling the parent. */
  length?: number;
  /** Density. Defaults to `md`. */
  size?: ControlSize;
  /** Names the meter as a group for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/** Default channel names for the common mono and stereo cases. */
const DEFAULT_LABELS = ["Left", "Right", "Centre", "LFE"] as const;

export function LevelMeter({
  accessibilityLabel = "Audio levels",
  channelLabels,
  length,
  minDb = METER_MIN_DB,
  peakHolds,
  showScale = false,
  size = "md",
  style,
  testID,
  values,
}: LevelMeterProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createVideoEditorStyles(theme), [theme]);
  const metrics = videoEditorSizing[size];
  const web = Platform.OS === "web";

  const zoneColor: Record<MeterZone, string> = {
    peak: theme.colors.rose,
    safe: theme.colors.primary,
    warn: theme.colors.amber,
  };

  return (
    <View
      aria-label={accessibilityLabel}
      role="group"
      style={[{ gap: 2, width: length }, style]}
      testID={testID}
    >
      {values.map((db, index) => {
        const channel =
          channelLabels?.[index] ??
          DEFAULT_LABELS[index] ??
          `Channel ${index + 1}`;
        const bands = meterBands(db, minDb);
        const hold = peakHolds?.[index];
        const label = describeLevel(channel, db);
        return (
          <View
            accessibilityLabel={label}
            aria-label={label}
            key={index}
            style={[styles.meterChannel, { height: metrics.meterThickness }]}
            // `meter` is a web ARIA role missing from React Native's `Role`
            // union; react-native-web forwards the literal, and native keeps the
            // accessible label instead.
            {...(web
              ? ({
                  "aria-valuemax": 0,
                  "aria-valuemin": minDb,
                  "aria-valuenow": Number.isFinite(db)
                    ? Math.round(db * 10) / 10
                    : minDb,
                  "aria-valuetext": label,
                  role: "meter",
                } as unknown as { role?: undefined })
              : {})}
          >
            {bands.map((band) => (
              <View
                key={band.zone}
                style={[
                  styles.meterFill,
                  {
                    backgroundColor: zoneColor[band.zone],
                    left: percent(band.start),
                    width: percent(band.end - band.start),
                  },
                ]}
              />
            ))}
            {hold !== undefined && Number.isFinite(hold) ? (
              <View
                aria-hidden
                style={[
                  styles.meterHold,
                  {
                    backgroundColor: theme.colors.ink,
                    bottom: 0,
                    left: percent(dbToFraction(hold, minDb)),
                    top: 0,
                  },
                ]}
              />
            ) : null}
          </View>
        );
      })}
      {showScale ? (
        // Ticks sit at their true position on the curve rather than being
        // spread evenly, or the scale would misreport where the bar's colours
        // change.
        <View aria-hidden style={{ height: 12 }}>
          {METER_SCALE_TICKS.map((tick) => (
            <Text
              key={tick}
              style={[
                styles.meterScaleText,
                {
                  left: percent(dbToFraction(tick, minDb)),
                  position: "absolute",
                  transform: [{ translateX: tick === minDb ? 0 : -8 }],
                },
              ]}
            >
              {tick}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
