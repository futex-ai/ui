/** Determinate circular progress: an arc filling clockwise from 12 o'clock. */
import { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { ControlSize } from "../controlSize";
import { resolveSpinnerSize } from "../spinner/spinnerStyles";
import { useSharedUiTheme } from "../theme";

import { createLoaderStyles } from "./loaderStyles";
import { clampFraction, progressAccessibility } from "./progressValue";

export type ProgressRingProps = {
  /** Accessible name announced for the progress. Defaults to "Progress". */
  accessibilityLabel?: string;
  /** Arc color. Defaults to the theme primary. */
  color?: string;
  /** Diameter: the shared `sm` / `md` / `lg` scale, or an explicit pixel size. */
  size?: ControlSize | number;
  /** Extra style for the ring container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Stroke width in pixels. Defaults to about an eighth of the diameter. */
  thickness?: number;
  /** Color of the unfilled track. Defaults to the theme `border2`. */
  trackColor?: string;
  /** Progress as a fraction from 0 to 1, clamped. */
  value: number;
};

/**
 * A circular progress meter for work whose total is known — the determinate
 * counterpart to the {@link Spinner} ring and to `<Loader variant="ring" />`.
 * The arc starts at 12 o'clock and fills clockwise.
 *
 * It shares the {@link Spinner} geometry, so a screen can swap an indeterminate
 * spinner for a progress ring of the same `size` without the layout moving. The
 * ring is static: it redraws when `value` changes rather than animating, so
 * there is no motion to reduce and nothing to stop on unmount.
 *
 * The percentage is published through `aria-valuenow` on the 0–100 ARIA default
 * range, so screen readers announce "42%" rather than "0.42".
 */
export function ProgressRing({
  accessibilityLabel = "Progress",
  color,
  size = "md",
  style,
  testID,
  thickness,
  trackColor,
  value,
}: ProgressRingProps) {
  const theme = useSharedUiTheme();
  const preset = resolveSpinnerSize(size);
  const diameter = preset.diameter;
  const stroke = thickness ?? preset.thickness;
  const styles = useMemo(() => createLoaderStyles(diameter), [diameter]);
  const accent = color ?? theme.colors.primary;
  const track = trackColor ?? theme.colors.border2;

  // The stroke is centered on the radius, so inset it by half the thickness to
  // keep the whole ring inside the SVG box.
  const center = diameter / 2;
  const radius = (diameter - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = clampFraction(value);
  const arc = circumference * fraction;
  const progress = progressAccessibility(fraction);

  return (
    <View
      {...progress.webProps}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={progress.accessibilityValue}
      style={[styles.container, { width: diameter }, style]}
      testID={testID}
    >
      <Svg
        aria-hidden
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        width={diameter}
      >
        <Circle
          cx={center}
          cy={center}
          fill="none"
          r={radius}
          stroke={track}
          strokeWidth={stroke}
        />
        {arc > 0 ? (
          <Circle
            cx={center}
            cy={center}
            fill="none"
            // SVG arcs start at 3 o'clock; turn the ring a quarter-turn back so
            // the fill begins at the top, where a progress meter is read from.
            originX={center}
            originY={center}
            r={radius}
            rotation={-90}
            stroke={accent}
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeLinecap="round"
            strokeWidth={stroke}
          />
        ) : null}
      </Svg>
    </View>
  );
}
