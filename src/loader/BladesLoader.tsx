/** Ten spokes around a circle, brightening in turn. */
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { bladesGeometry, BLADES_COUNT } from "./loaderGeometry";
import { useLoaderWave, waveInterpolation } from "./loaderWave";
import type { LoaderShapeProps } from "./types";

/** Dimmest and brightest a spoke gets as the highlight comes round. */
const OPACITY = { from: 0.15, to: 1 };

/** Falloff of the highlight — loose, so it trails across two or three spokes. */
const SHARPNESS = 2;

/**
 * The platform activity indicator: a ring of rounded spokes where brightness
 * chases clockwise around the circle. Nothing physically moves — the illusion of
 * rotation is pure opacity — so this is the one shape that looks identical with
 * and without reduced motion, and it is a safe default anywhere motion is a
 * concern.
 *
 * Each spoke is laid out at the box centre and then rotated and pushed outward:
 * `rotate` first turns the spoke's own axes, so the following `translateY` moves
 * it along that rotated axis and out to the rim.
 */
export function BladesLoader({ color, duration, size }: LoaderShapeProps) {
  const { height, offset, width } = bladesGeometry(size);
  const { progress } = useLoaderWave(duration);
  const styles = useMemo(
    () => createStyles(height, size, width),
    [height, size, width],
  );

  return (
    <View style={styles.dial}>
      {Array.from({ length: BLADES_COUNT }, (_, index) => {
        const phase = index / BLADES_COUNT;
        const opacity = waveInterpolation(progress, {
          from: OPACITY.from,
          phase,
          sharpness: SHARPNESS,
          to: OPACITY.to,
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.blade,
              {
                backgroundColor: color,
                opacity,
                transform: [
                  { rotate: `${(index * 360) / BLADES_COUNT}deg` },
                  { translateY: -offset },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function createStyles(height: number, size: number, width: number) {
  return StyleSheet.create({
    blade: {
      borderRadius: width / 2,
      height,
      // Centred in the box first, so `rotate` turns each spoke about the dial's
      // centre rather than about its own resting corner.
      left: (size - width) / 2,
      position: "absolute",
      top: (size - height) / 2,
      width,
    },
    dial: {
      height: size,
      width: size,
    },
  });
}
