/** Three dots in a row, bouncing in sequence. */
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { buildDotBounceRange } from "./loaderDotsMath";
import { dotsGeometry, DOTS_COUNT } from "./loaderGeometry";
import { useLoaderWave } from "./loaderWave";
import type { LoaderShapeProps } from "./types";

/** Dimmest and brightest a dot gets as its turn comes round. */
const OPACITY = { from: 0.35, to: 1 };

/**
 * The familiar chat-typing indicator: each dot lifts and brightens in turn, then
 * settles. All three run off one loop in non-overlapping bounce windows, so no
 * scheduling delay can make them rise together.
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
        const opacity = progress.interpolate(
          buildDotBounceRange({
            from: OPACITY.from,
            index,
            to: OPACITY.to,
          }),
        );
        const translateY = progress.interpolate(
          buildDotBounceRange({ from: 0, index, to: -lift }),
        );
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
