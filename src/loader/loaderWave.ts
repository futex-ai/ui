/**
 * The animation driver shared by every loader shape.
 *
 * One `Animated.loop` of a linear 0 → 1 progress runs per loader; the curves in
 * {@link ./loaderWaveMath} turn that single driver into each element's staggered
 * motion. See that module for why the stagger is done by interpolation rather
 * than by parallel loops.
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";

import { useReducedMotion } from "../useReducedMotion";

import {
  buildSawtoothRange,
  buildWaveRange,
  type SawtoothRangeOptions,
  type WaveRangeOptions,
} from "./loaderWaveMath";

/**
 * The cycle length every loader falls back to once "reduce motion" is on. The
 * animation is not removed — a frozen loader reads as a hung screen — but it is
 * slowed right down, and each shape drops to animating brightness alone.
 */
export const LOADER_REDUCED_MOTION_DURATION = 2400;

/**
 * Start the shared 0 → 1 loop for one loader and report whether the caller
 * should drop movement.
 *
 * The loop restarts from 0 on every iteration, so a shape is only seamless if
 * its interpolated output matches at 0 and 1 — which both range builders
 * guarantee. Under reduced motion the loop keeps running at
 * {@link LOADER_REDUCED_MOTION_DURATION} and `reducedMotion` tells each shape to
 * animate opacity alone. The loop stops when the component unmounts.
 */
export function useLoaderWave(duration: number): {
  progress: Animated.Value;
  reducedMotion: boolean;
} {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const cycle = reducedMotion ? LOADER_REDUCED_MOTION_DURATION : duration;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        duration: cycle,
        easing: Easing.linear,
        toValue: 1,
        // The native driver is not available in the web renderer; keep the JS
        // driver there and drive natively on iOS/Android.
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [cycle, progress]);

  return { progress, reducedMotion };
}

/** Interpolate `progress` along a travelling highlight. See {@link buildWaveRange}. */
export function waveInterpolation(
  progress: Animated.Value,
  options: WaveRangeOptions,
) {
  return progress.interpolate(buildWaveRange(options));
}

/** Interpolate `progress` along a repeating ramp. See {@link buildSawtoothRange}. */
export function sawtoothInterpolation(
  progress: Animated.Value,
  options: SawtoothRangeOptions,
) {
  return progress.interpolate(buildSawtoothRange(options));
}
