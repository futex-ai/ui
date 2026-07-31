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
import { useReducedMotion } from "../useReducedMotion";

import { createSpinnerStyles, resolveSpinnerSize } from "./spinnerStyles";

/** Fraction of the ring drawn as the moving leading arc. */
const ARC_FRACTION = 0.25;

/**
 * One fade cycle under reduced motion. Much slower than a rotation: the ring
 * keeps signalling that work is in flight without anything moving on screen.
 */
const REDUCED_MOTION_DURATION = 2400;

/** How far the arc dims at the bottom of a reduced-motion fade. */
const REDUCED_MOTION_MIN_OPACITY = 0.3;

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
 *
 * When the user has asked for reduced motion the ring stops turning and slowly
 * fades its arc instead — the loading state stays legible without any movement,
 * where freezing the spinner outright would read as a hung screen.
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
  const reducedMotion = useReducedMotion();
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

  // One linear 0 -> 1 loop drives the ring: normally as rotation, and as an
  // opacity fade once the user has asked for reduced motion.
  const progress = useRef(new Animated.Value(0)).current;
  const cycle = reducedMotion ? REDUCED_MOTION_DURATION : duration;
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(progress, {
        duration: cycle,
        easing: Easing.linear,
        toValue: 1,
        // The native driver is not available in the web renderer; keep the JS
        // driver there and drive natively on iOS/Android.
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [cycle, progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  // A triangle fade that returns to full brightness at both ends of the cycle,
  // so the loop's reset is invisible.
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, REDUCED_MOTION_MIN_OPACITY, 1],
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
      <Animated.View
        aria-hidden
        style={reducedMotion ? { opacity } : { transform: [{ rotate }] }}
      >
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
