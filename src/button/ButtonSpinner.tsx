/** Rotating spinner shown in place of the leading icon while a button is busy. */
import { LoaderCircle } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";

import { useReducedMotion } from "../useReducedMotion";

export type ButtonSpinnerProps = {
  /** Tint, matched to the button's label colour. */
  color: string;
  /** Diameter in px, matched to the leading icon size for the button size. */
  size: number;
};

/**
 * A spinning {@link LoaderCircle} that stands in for the leading icon while the
 * button is busy. The glyph is decorative — the button announces its `busy`
 * state via `aria-busy` — so it is always hidden from assistive technology.
 *
 * The rotation honours `prefers-reduced-motion`: when the user prefers reduced
 * motion the loader is shown static (still a clear "in progress" affordance)
 * rather than animating (best practice, WCAG 2.1 — 2.3.3 AAA).
 */
export function ButtonSpinner({ color, size }: ButtonSpinnerProps) {
  const reducedMotion = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const animation = Animated.loop(
      Animated.timing(spin, {
        duration: 800,
        easing: Easing.linear,
        toValue: 1,
        // `transform` rotation is a non-layout property, so it can run on the
        // native driver; on web RNW falls back to the JS driver transparently.
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      // The spinner is purely decorative; the button's `aria-busy` carries the
      // status, so keep the glyph off the accessibility tree on both platforms.
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ height: size, transform: [{ rotate }], width: size }}
    >
      <LoaderCircle color={color} size={size} />
    </Animated.View>
  );
}
