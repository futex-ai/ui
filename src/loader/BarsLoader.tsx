/** Four vertical bars rising and falling like an equalizer. */
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { barsGeometry, BARS_COUNT } from "./loaderGeometry";
import { useLoaderWave, waveInterpolation } from "./loaderWave";
import type { LoaderShapeProps } from "./types";

/** Dimmest and brightest a bar gets as the wave passes. */
const OPACITY = { from: 0.4, to: 1 };

/** Shortest and tallest a bar gets, as a fraction of the box height. */
const SCALE = { from: 0.3, to: 1 };

/** Fraction of the cycle between one bar's peak and the next. */
const PHASE_STEP = 0.14;

/** Falloff of the highlight. */
const SHARPNESS = 3;

/**
 * Bars that grow and shrink in a left-to-right run.
 *
 * The height is driven by `scaleY` rather than an animated `height` so the whole
 * loader can stay on the native driver. `scaleY` scales a bar about its own
 * centre, which would leave it floating, so each bar is pushed back down by half
 * the height it lost — `height × (1 - scale) / 2` — pinning its base to the
 * bottom of the box. Both halves come off the same wave, so they stay in step by
 * construction.
 *
 * Under reduced motion the bars hold full height and only the brightness wave
 * remains.
 */
export function BarsLoader({ color, duration, size }: LoaderShapeProps) {
  const { bar, gap, width } = barsGeometry(size);
  const { progress, reducedMotion } = useLoaderWave(duration);
  const styles = useMemo(
    () => createStyles(bar, gap, size, width),
    [bar, gap, size, width],
  );

  return (
    <View style={styles.row}>
      {Array.from({ length: BARS_COUNT }, (_, index) => {
        const phase = index * PHASE_STEP;
        const opacity = waveInterpolation(progress, {
          from: OPACITY.from,
          phase,
          sharpness: SHARPNESS,
          to: OPACITY.to,
        });
        const scaleY = waveInterpolation(progress, {
          from: SCALE.from,
          phase,
          sharpness: SHARPNESS,
          to: SCALE.to,
        });
        const translateY = waveInterpolation(progress, {
          from: (size * (1 - SCALE.from)) / 2,
          phase,
          sharpness: SHARPNESS,
          to: (size * (1 - SCALE.to)) / 2,
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              { backgroundColor: color, opacity },
              reducedMotion
                ? null
                : { transform: [{ translateY }, { scaleY }] },
            ]}
          />
        );
      })}
    </View>
  );
}

function createStyles(bar: number, gap: number, size: number, width: number) {
  return StyleSheet.create({
    bar: {
      borderRadius: bar / 2,
      height: size,
      width: bar,
    },
    row: {
      flexDirection: "row",
      gap,
      height: size,
      width,
    },
  });
}
