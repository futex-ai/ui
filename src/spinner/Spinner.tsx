/** Indeterminate spinning loading indicator. */
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import type { ControlSize } from "../controlSize";
import { useSharedUiTheme } from "../theme";

import { createSpinnerStyles, resolveSpinnerSize } from "./spinnerStyles";

/** Fraction of the ring drawn as the moving leading arc. */
const ARC_FRACTION = 0.25;

export type SpinnerProps = {
  /** Accessible name announced for the loading state. Defaults to "Loading". */
  accessibilityLabel?: string;
  /** Accent color of the leading arc. Defaults to the theme primary. */
  color?: string;
  /** Milliseconds for one full rotation. Defaults to 800. */
  duration?: number;
  /** Diameter: the shared `sm` / `md` / `lg` scale, or an explicit pixel size. */
  size?: ControlSize | number;
  /** Extra style for the spinner container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Color of the trailing ring track. Defaults to the theme `border2`. */
  trackColor?: string;
};

/**
 * A continuously spinning ring used as an indeterminate loading indicator. A
 * leading accent arc (`color`, the theme primary by default) turns over a
 * fainter full-circle track (`trackColor`, the theme `border2`). The ring is
 * drawn with `react-native-svg` so the moving arc renders identically on iOS,
 * Android, and web — unlike a single-edge CSS border, which iOS collapses to a
 * uniform color on a circle. `size` takes the shared {@link ControlSize} scale
 * (`sm` / `md` / `lg`) or an explicit pixel diameter; the stroke thickness
 * scales with the diameter. The rotation runs through React Native's `Animated`
 * API and the loop stops when the component unmounts. Only the inner ring
 * rotates; the labelled container keeps a stable box for layout and assistive
 * technology.
 */
export function Spinner({
  accessibilityLabel = "Loading",
  color,
  duration = 800,
  size = "md",
  style,
  testID,
  trackColor,
}: SpinnerProps) {
  const theme = useSharedUiTheme();
  const { diameter, thickness } = resolveSpinnerSize(size);
  const accent = color ?? theme.colors.primary;
  const track = trackColor ?? theme.colors.border2;
  const styles = useMemo(() => createSpinnerStyles(diameter), [diameter]);

  // The stroke is centered on the radius, so inset it by half the thickness to
  // keep the whole ring inside the SVG box.
  const center = diameter / 2;
  const radius = (diameter - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * ARC_FRACTION;

  const rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        duration,
        easing: Easing.linear,
        toValue: 1,
        // The native driver is not available in the web renderer; keep the JS
        // driver there and drive natively on iOS/Android.
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [duration, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      aria-busy
      style={[styles.container, style]}
      testID={testID}
    >
      <Animated.View aria-hidden style={{ transform: [{ rotate }] }}>
        <Svg
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
            strokeWidth={thickness}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={accent}
            strokeDasharray={`${arc} ${circumference - arc}`}
            strokeLinecap="round"
            strokeWidth={thickness}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
