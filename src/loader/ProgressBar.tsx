/** Horizontal progress track: determinate when given a value, sweeping when not. */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { useReducedMotion } from "../useReducedMotion";
import { useSharedUiTheme } from "../theme";

import { useLoaderWave, waveInterpolation } from "./loaderWave";
import { clampFraction, progressAccessibility } from "./progressValue";

/** Default track thickness in pixels. */
const DEFAULT_HEIGHT = 6;

/** Default milliseconds for one indeterminate sweep across the track. */
const DEFAULT_DURATION = 1400;

/** Width of the sweeping segment, as a fraction of the track. */
const SEGMENT_FRACTION = 0.35;

/** Milliseconds a determinate fill takes to ease to a new value. */
const FILL_DURATION = 240;

/** Dimmest the reduced-motion bar fades to between pulses. */
const REDUCED_MOTION_MIN_OPACITY = 0.3;

export type ProgressBarProps = {
  /** Accessible name announced for the progress. Defaults to "Loading". */
  accessibilityLabel?: string;
  /** Fill color. Defaults to the theme primary. */
  color?: string;
  /** Milliseconds for one indeterminate sweep. Ignored when `value` is set. */
  duration?: number;
  /** Track thickness in pixels. Defaults to 6. */
  height?: number;
  /** Extra style for the track. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Track color behind the fill. Defaults to the theme `border2`. */
  trackColor?: string;
  /**
   * Progress as a fraction from 0 to 1, clamped. Omit it for the indeterminate
   * sweep used when the total amount of work is unknown.
   */
  value?: number;
};

/**
 * A full-width progress track with two modes. Pass `value` (0–1) for
 * determinate progress and the fill eases to each new value; omit it and a
 * segment sweeps across the track instead, the right choice whenever the total
 * work is unknown.
 *
 * The track reports `progressbar` semantics either way. Determinate bars expose
 * the percentage through `aria-valuenow` (0–100, the ARIA default range) so
 * screen readers announce "42%"; indeterminate bars publish a busy state and no
 * value, which is what ARIA specifies for unknown progress.
 *
 * Under reduced motion the sweep is replaced by a slow full-width brightness
 * pulse, and determinate fills jump straight to their new value instead of
 * easing.
 */
export function ProgressBar({
  accessibilityLabel = "Loading",
  color,
  duration = DEFAULT_DURATION,
  height = DEFAULT_HEIGHT,
  style,
  testID,
  trackColor,
  value,
}: ProgressBarProps) {
  const theme = useSharedUiTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const styles = useMemo(() => createStyles(height), [height]);
  const accent = color ?? theme.colors.primary;
  const track = trackColor ?? theme.colors.border2;
  const determinate = value !== undefined;
  const fraction = determinate ? clampFraction(value) : 0;
  // An indeterminate bar publishes no value at all, which is what ARIA
  // specifies when the total amount of work is unknown.
  const progress = determinate ? progressAccessibility(fraction) : null;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth((previous) => (previous === width ? previous : width));
  };

  return (
    <View
      {...(progress?.webProps ?? {})}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: !determinate }}
      accessibilityValue={progress?.accessibilityValue}
      aria-busy={!determinate}
      onLayout={onLayout}
      style={[styles.track, { backgroundColor: track }, style]}
      testID={testID}
    >
      {determinate ? (
        <DeterminateFill color={accent} fraction={fraction} height={height} />
      ) : (
        <SweepingFill
          color={accent}
          duration={duration}
          height={height}
          trackWidth={trackWidth}
        />
      )}
    </View>
  );
}

/** The fill for a known value: a bar that eases to each new width. */
function DeterminateFill({
  color,
  fraction,
  height,
}: {
  color: string;
  fraction: number;
  height: number;
}) {
  const reducedMotion = useReducedMotion();
  const styles = useMemo(() => createStyles(height), [height]);
  const filled = useRef(new Animated.Value(fraction)).current;

  useEffect(() => {
    if (reducedMotion) {
      filled.setValue(fraction);
      return;
    }
    const ease = Animated.timing(filled, {
      duration: FILL_DURATION,
      easing: Easing.out(Easing.quad),
      toValue: fraction,
      // `width` is a layout property, so it cannot run on the native driver.
      useNativeDriver: false,
    });
    ease.start();
    return () => ease.stop();
  }, [filled, fraction, reducedMotion]);

  const width = filled.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      aria-hidden
      style={[styles.fill, { backgroundColor: color, width }]}
    />
  );
}

/**
 * The fill for unknown progress: a segment travelling from just off the left
 * edge to just off the right. The travel is measured in pixels from the laid-out
 * track, so nothing renders until the first layout pass reports a width.
 *
 * Under reduced motion the segment is replaced by a full-width bar that pulses
 * in brightness, so the bar still reads as working without anything moving.
 */
function SweepingFill({
  color,
  duration,
  height,
  trackWidth,
}: {
  color: string;
  duration: number;
  height: number;
  trackWidth: number;
}) {
  const { progress, reducedMotion } = useLoaderWave(duration);
  const styles = useMemo(() => createStyles(height), [height]);

  if (reducedMotion) {
    const opacity = waveInterpolation(progress, {
      from: REDUCED_MOTION_MIN_OPACITY,
      phase: 0,
      sharpness: 1,
      to: 1,
    });
    return (
      <Animated.View
        aria-hidden
        style={[
          styles.fill,
          { backgroundColor: color, opacity, width: "100%" },
        ]}
      />
    );
  }

  if (trackWidth === 0) {
    return null;
  }

  const segment = Math.round(trackWidth * SEGMENT_FRACTION);
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-segment, trackWidth],
  });

  return (
    <Animated.View
      aria-hidden
      style={[
        styles.fill,
        {
          backgroundColor: color,
          transform: [{ translateX }],
          width: segment,
        },
      ]}
    />
  );
}

function createStyles(height: number) {
  return StyleSheet.create({
    fill: {
      borderRadius: height / 2,
      bottom: 0,
      left: 0,
      position: "absolute",
      top: 0,
    },
    track: {
      borderRadius: height / 2,
      height,
      // Clip the sweeping segment to the rounded track as it enters and leaves.
      overflow: "hidden",
      width: "100%",
    },
  });
}
