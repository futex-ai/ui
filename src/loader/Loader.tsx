/** Indeterminate loading indicator with a switchable shape. */
import { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import { Spinner } from "../spinner";
import { useSharedUiTheme } from "../theme";

import { BarsLoader } from "./BarsLoader";
import { BladesLoader } from "./BladesLoader";
import { DotGridLoader } from "./DotGridLoader";
import { DotsLoader } from "./DotsLoader";
import {
  createLoaderStyles,
  LOADER_DURATIONS,
  resolveLoaderSize,
} from "./loaderStyles";
import { PulseLoader } from "./PulseLoader";
import type { LoaderShapeProps, LoaderVariant } from "./types";

export type LoaderProps = {
  /** Accessible name announced for the loading state. Defaults to "Loading". */
  accessibilityLabel?: string;
  /** Accent color of the animated elements. Defaults to the theme primary. */
  color?: string;
  /**
   * Milliseconds for one full animation cycle. Defaults per variant — see
   * {@link LOADER_DURATIONS} — because a nine-dot wave needs longer to read than
   * a three-dot bounce.
   */
  duration?: number;
  /** Box height: the shared `sm` / `md` / `lg` scale, or an explicit pixel size. */
  size?: ControlSize | number;
  /** Extra style for the loader container. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Color of the ring's trailing track. `ring` only; defaults to the theme `border2`. */
  trackColor?: string;
  /** Which shape to draw. Defaults to `ring`, matching {@link Spinner}. */
  variant?: LoaderVariant;
};

/**
 * An indeterminate loading indicator that can take any of six shapes: the
 * {@link Spinner} `ring`, a `dot-grid`, bouncing `dots`, equalizer `bars`,
 * activity-indicator `blades`, or an expanding `pulse`. Every variant occupies
 * the same box height — the shared {@link ControlSize} scale (`sm` / `md` /
 * `lg`) or an explicit pixel size — so swapping one for another never shifts the
 * surrounding layout. `dots` and `bars` are wider than they are tall; the rest
 * are square.
 *
 * `variant="ring"` renders {@link Spinner} directly rather than reimplementing
 * it, so there is exactly one ring in the library and `<Loader />` and
 * `<Spinner />` are interchangeable.
 *
 * Every shape runs off a single `Animated` loop that stops on unmount, animates
 * only opacity and transform (so it stays on the native driver on iOS and
 * Android), and honours the user's "reduce motion" setting by slowing down and
 * dropping to a brightness-only animation. The container carries `progressbar`
 * semantics with a busy state and an accessible name; the shape itself is
 * decorative.
 */
export function Loader({
  accessibilityLabel = "Loading",
  color,
  duration,
  size = "md",
  style,
  testID,
  trackColor,
  variant = "ring",
}: LoaderProps) {
  // The ring path must come before any hook so the two branches never disagree
  // about hook order when a caller switches variants.
  if (variant === "ring") {
    return (
      <Spinner
        accessibilityLabel={accessibilityLabel}
        color={color}
        duration={duration ?? LOADER_DURATIONS.ring}
        size={size}
        style={style}
        testID={testID}
        trackColor={trackColor}
      />
    );
  }

  return (
    <LoaderSurface
      accessibilityLabel={accessibilityLabel}
      color={color}
      duration={duration ?? LOADER_DURATIONS[variant]}
      size={size}
      style={style}
      testID={testID}
      variant={variant}
    />
  );
}

/**
 * The labelled, fixed-size container for every non-ring shape. It resolves the
 * theme accent and the pixel box once, then hands both to the shape, which stays
 * purely decorative.
 */
function LoaderSurface({
  accessibilityLabel,
  color,
  duration,
  size,
  style,
  testID,
  variant,
}: {
  accessibilityLabel: string;
  color?: string;
  duration: number;
  size: ControlSize | number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  variant: Exclude<LoaderVariant, "ring">;
}) {
  const theme = useSharedUiTheme();
  const box = resolveLoaderSize(size);
  const styles = useMemo(() => createLoaderStyles(box), [box]);
  const shape: LoaderShapeProps = {
    color: color ?? theme.colors.primary,
    duration,
    size: box,
  };

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      aria-busy
      style={[styles.container, style]}
      testID={testID}
    >
      <View aria-hidden>
        <LoaderShape shape={shape} variant={variant} />
      </View>
    </View>
  );
}

/** Pick the shape renderer for a variant. */
function LoaderShape({
  shape,
  variant,
}: {
  shape: LoaderShapeProps;
  variant: Exclude<LoaderVariant, "ring">;
}) {
  switch (variant) {
    case "bars":
      return <BarsLoader {...shape} />;
    case "blades":
      return <BladesLoader {...shape} />;
    case "dot-grid":
      return <DotGridLoader {...shape} />;
    case "dots":
      return <DotsLoader {...shape} />;
    case "pulse":
      return <PulseLoader {...shape} />;
  }
}
