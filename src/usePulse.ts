/**
 * The shared "gently pulsing" opacity loop — the live/in-progress signal behind
 * {@link StatusDot} and the {@link Badge} dot.
 *
 * The animation is shared rather than the element, because the two dots differ
 * in everything but the pulse: the badge's is an inline circle tinted to its
 * label color, the status dot's is a standalone tone-colored one. What they must
 * agree on is the rhythm, the reduced-motion behaviour, and the teardown, and
 * that is exactly what lives here.
 */
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";

import { useReducedMotion } from "./useReducedMotion";

/** Milliseconds for one leg of the pulse — dim, then back to full. */
const PULSE_DURATION = 800;

/** How far the pulse dims before returning. Low enough to read as a heartbeat. */
const PULSE_MIN_OPACITY = 0.35;

/** The animated style a pulsing element layers on top of its own styles. */
export type PulseStyle = { opacity: Animated.Value };

/**
 * Drive a looping opacity pulse while `active`.
 *
 * Returns the animated style to spread onto an `Animated.View`, or `null` when
 * the element should rest — either because the caller turned the pulse off or
 * because the user prefers reduced motion (the AAA criterion 2.3.3 Animation
 * from Interactions). Returning `null` rather than a value pinned at 1 keeps a
 * resting element free of an animated style entirely.
 *
 * The loop runs on the native driver everywhere but web (where it is
 * unsupported for the JS-driven style path), matching the {@link Spinner}, and
 * stops on unmount.
 */
export function usePulse(active: boolean): PulseStyle | null {
  const opacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();
  const animate = active && !reduceMotion;

  useEffect(() => {
    if (!animate) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          duration: PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          toValue: PULSE_MIN_OPACITY,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          duration: PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, opacity]);

  return animate ? { opacity } : null;
}
