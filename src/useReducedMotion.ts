import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * Tracks the user's "reduce motion" preference.
 *
 * Honouring `prefers-reduced-motion` (web) / `isReduceMotionEnabled` (native)
 * lets animated controls — the switch knob slide, the date sheet/wheel — drop or
 * shorten their transitions for users who are sensitive to motion. This is best
 * practice (it satisfies the AAA criterion 2.3.3 Animation from Interactions);
 * it is not required for Level AA, so callers should treat motion as the default
 * and only soften it when this returns `true`.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.matchMedia) {
        return;
      }
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const update = () => {
        if (active) {
          setReduced(query.matches);
        }
      };
      update();
      query.addEventListener("change", update);
      return () => {
        active = false;
        query.removeEventListener("change", update);
      };
    }

    AccessibilityInfo.isReduceMotionEnabled?.()?.then((value) => {
      if (active) {
        setReduced(Boolean(value));
      }
    });
    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (value: boolean) => {
        if (active) {
          setReduced(Boolean(value));
        }
      },
    );
    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
