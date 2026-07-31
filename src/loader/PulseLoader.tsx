/** Concentric rings expanding outward and fading, like a ripple. */
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { pulseGeometry, PULSE_RINGS } from "./loaderGeometry";
import {
  sawtoothInterpolation,
  useLoaderWave,
  waveInterpolation,
} from "./loaderWave";
import type { LoaderShapeProps } from "./types";

/** How far a ring travels: from a tight core out to the full box. */
const SCALE = { from: 0.3, to: 1 };

/**
 * A ring's opacity across its travel. It must reach 0 at the rim: the shared
 * driver restarts each cycle, and fading fully out is what hides that reset.
 */
const OPACITY = { from: 0.85, to: 0 };

/**
 * Where a ring parks under reduced motion: evenly spread across the same travel
 * the animation covers, so the outermost lands on the rim. Derived from
 * {@link PULSE_RINGS} rather than listed, so the two cannot drift apart.
 */
function staticScale(index: number): number {
  return SCALE.from + ((SCALE.to - SCALE.from) * (index + 1)) / PULSE_RINGS;
}

/** Dimmest and brightest a static ring gets as the brightness wave passes. */
const STATIC_OPACITY = { from: 0.18, to: 0.9 };

/** Falloff of the brightness wave used under reduced motion. */
const STATIC_SHARPNESS = 2;

/**
 * Three rings chasing each other outward from the centre. Each ring rides the
 * same 0 → 1 driver offset by a third of a cycle, so one is always leaving the
 * centre as another reaches the rim.
 *
 * Under reduced motion the rings stop travelling and sit at fixed radii, with
 * the outward motion suggested by a brightness wave passing through them
 * instead. The ring stroke is scaled along with the ring while animating, so an
 * expanding ring thickens slightly as it grows.
 */
export function PulseLoader({ color, duration, size }: LoaderShapeProps) {
  const { thickness } = pulseGeometry(size);
  const { progress, reducedMotion } = useLoaderWave(duration);
  const styles = useMemo(
    () => createStyles(size, thickness),
    [size, thickness],
  );

  return (
    <View style={styles.field}>
      {Array.from({ length: PULSE_RINGS }, (_, index) => {
        if (reducedMotion) {
          const opacity = waveInterpolation(progress, {
            from: STATIC_OPACITY.from,
            phase: index / PULSE_RINGS,
            sharpness: STATIC_SHARPNESS,
            to: STATIC_OPACITY.to,
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.ring,
                {
                  borderColor: color,
                  opacity,
                  transform: [{ scale: staticScale(index) }],
                },
              ]}
            />
          );
        }
        const offset = index / PULSE_RINGS;
        const opacity = sawtoothInterpolation(progress, {
          from: OPACITY.from,
          offset,
          to: OPACITY.to,
        });
        const scale = sawtoothInterpolation(progress, {
          from: SCALE.from,
          offset,
          to: SCALE.to,
        });
        return (
          <Animated.View
            key={index}
            style={[
              styles.ring,
              { borderColor: color, opacity, transform: [{ scale }] },
            ]}
          />
        );
      })}
    </View>
  );
}

function createStyles(size: number, thickness: number) {
  return StyleSheet.create({
    field: {
      height: size,
      width: size,
    },
    ring: {
      borderRadius: size / 2,
      borderWidth: thickness,
      height: size,
      left: 0,
      position: "absolute",
      top: 0,
      width: size,
    },
  });
}
