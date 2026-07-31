/** Three dots in a row, bouncing in sequence. */
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { dotsGeometry, DOTS_COUNT } from "./loaderGeometry";
import { useLoaderWave, waveInterpolation } from "./loaderWave";
import type { LoaderShapeProps } from "./types";

/** Dimmest and brightest a dot gets as its turn comes round. */
const OPACITY = { from: 0.35, to: 1 };

/**
 * Fraction of the cycle between one dot's peak and the next. Well under
 * `1 / DOTS_COUNT`, so the three bounces cluster into a run followed by a rest
 * rather than spacing themselves evenly around the loop.
 */
const PHASE_STEP = 0.16;

/** Falloff of the highlight — high, so only one dot is really up at a time. */
const SHARPNESS = 4;

/**
 * The familiar chat-typing indicator: each dot lifts and brightens in turn, then
 * settles. All three run off one loop, staggered by phase.
 *
 * Under reduced motion the dots stop lifting and only the brightness relay
 * remains.
 */
export function DotsLoader({ color, duration, size }: LoaderShapeProps) {
  const { dot, gap, lift, width } = dotsGeometry(size);
  const { progress, reducedMotion } = useLoaderWave(duration);
  const styles = useMemo(
    () => createStyles(dot, gap, width),
    [dot, gap, width],
  );

  return (
    <View style={styles.row}>
      {Array.from({ length: DOTS_COUNT }, (_, index) => {
        const phase = index * PHASE_STEP;
        const opacity = waveInterpolation(progress, {
          from: OPACITY.from,
          phase,
          sharpness: SHARPNESS,
          to: OPACITY.to,
        });
        const translateY = waveInterpolation(progress, {
          from: 0,
          phase,
          sharpness: SHARPNESS,
          to: -lift,
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: color, opacity },
              reducedMotion ? null : { transform: [{ translateY }] },
            ]}
          />
        );
      })}
    </View>
  );
}

function createStyles(dot: number, gap: number, width: number) {
  return StyleSheet.create({
    dot: {
      borderRadius: dot / 2,
      height: dot,
      width: dot,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap,
      width,
    },
  });
}
