/**
 * The live-state halo: a translucent ring that swells out of a status dot and
 * fades, like a radar ping. Shared by {@link StatusDot} and the {@link Badge}
 * dot so no surface hand-rolls a heartbeat.
 *
 * This is a component rather than a hook because the pulse is an extra element,
 * not a style a dot can wear: the halo has to paint *behind* the dot and grow
 * past its bounds. It reproduces the design system's `mcpulse` keyframes, which
 * animate a `box-shadow` spread — unavailable to React Native's `Animated`, and
 * unavailable to the native driver even on web. A scaling, fading circle behind
 * the dot is the cross-platform equivalent, and it animates on the native driver
 * (transform and opacity only), the same trade the {@link PulseLoader} makes.
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";
import type { ColorValue } from "react-native";

import { useReducedMotion } from "../useReducedMotion";

/** Milliseconds for one full ping, including the rest before the next. */
const PULSE_DURATION = 1600;

/** The halo's opacity at the dot's edge, before it swells out and fades. */
const HALO_OPACITY = 0.5;

/**
 * How far the halo swells, as a multiple of the dot. The design system spreads a
 * 6px dot's shadow by 7px, so the ping ends 3⅓× the dot across. Expressed as a
 * ratio rather than the source's fixed 7px so the halo tracks the dot's size
 * across the `ControlSize` scale.
 */
const HALO_SCALE = 20 / 6;

/**
 * The fraction of the cycle the swell occupies. The halo is fully faded for the
 * remainder, which both spaces the pings apart and hides the loop's reset.
 */
const SWELL = 0.7;

export type PulseHaloProps = {
  /** The halo's color — normally the dot's own fill, which it fades out from. */
  color: ColorValue;
};

/**
 * A single looping ping sized to its parent. Renders nothing at all when the
 * user prefers reduced motion, leaving a plain solid dot (the AAA criterion
 * 2.3.3 Animation from Interactions).
 */
export function PulseHalo({ color }: PulseHaloProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    loop.start();
    return () => {
      loop.stop();
      progress.setValue(0);
    };
  }, [progress, reduceMotion]);

  if (reduceMotion) {
    return null;
  }

  return (
    <Animated.View
      aria-hidden
      style={[
        styles.halo,
        {
          backgroundColor: color,
          opacity: progress.interpolate({
            inputRange: [0, SWELL, 1],
            outputRange: [HALO_OPACITY, 0, 0],
          }),
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, SWELL, 1],
                outputRange: [1, HALO_SCALE, HALO_SCALE],
              }),
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  // Sized to the dot it sits behind, and taken out of flow so the swell can
  // overflow the dot (and any pill around it) without moving anything.
  halo: {
    borderRadius: 999,
    height: "100%",
    left: 0,
    position: "absolute",
    top: 0,
    width: "100%",
  },
});
