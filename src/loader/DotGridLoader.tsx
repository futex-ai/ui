/** Nine dots on a 3×3 grid, lit by a wave travelling down the diagonal. */
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { dotGridGeometry, DOT_GRID_TRACKS } from "./loaderGeometry";
import { useLoaderWave, waveInterpolation } from "./loaderWave";
import type { LoaderShapeProps } from "./types";

/** Dimmest and brightest a dot gets as the wave passes. */
const OPACITY = { from: 0.16, to: 1 };

/** How far a dot shrinks between highlights. */
const SCALE = { from: 0.55, to: 1 };

/**
 * Falloff of the highlight. Tight enough that a clear diagonal band reads as
 * moving across the grid rather than the whole grid breathing at once.
 */
const SHARPNESS = 2.5;

/**
 * A dot matrix whose highlight sweeps from the top-left corner to the
 * bottom-right. Each cell peaks at a phase set by its diagonal — cells on the
 * same anti-diagonal light together — so the nine dots come off one animation
 * loop and can never drift apart.
 *
 * Under reduced motion the dots hold their full size and only the brightness
 * wave remains, so nothing on screen changes position or scale.
 */
export function DotGridLoader({ color, duration, size }: LoaderShapeProps) {
  const { dot, gap } = dotGridGeometry(size);
  const { progress, reducedMotion } = useLoaderWave(duration);
  const styles = useMemo(() => createStyles(dot, gap), [dot, gap]);

  return (
    <View style={styles.grid}>
      {Array.from({ length: DOT_GRID_TRACKS }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: DOT_GRID_TRACKS }, (_, column) => {
            // The furthest cell sits on the last diagonal, so dividing by the
            // diagonal count keeps every phase inside a single cycle.
            const phase = (row + column) / (DOT_GRID_TRACKS * 2 - 1);
            const opacity = waveInterpolation(progress, {
              from: OPACITY.from,
              phase,
              sharpness: SHARPNESS,
              to: OPACITY.to,
            });
            const scale = waveInterpolation(progress, {
              from: SCALE.from,
              phase,
              sharpness: SHARPNESS,
              to: SCALE.to,
            });
            return (
              <Animated.View
                key={column}
                style={[
                  styles.dot,
                  { backgroundColor: color, opacity },
                  reducedMotion ? null : { transform: [{ scale }] },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function createStyles(dot: number, gap: number) {
  return StyleSheet.create({
    dot: {
      borderRadius: dot / 2,
      height: dot,
      width: dot,
    },
    grid: {
      gap,
    },
    row: {
      flexDirection: "row",
      gap,
    },
  });
}
