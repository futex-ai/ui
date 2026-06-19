/**
 * Content-shaped loading placeholders: a pulsing {@link SkeletonBar} and
 * {@link SkeletonCircle} leaf, a {@link SkeletonGroup} layout helper, and the
 * {@link SkeletonPulseProvider} that lets a whole skeleton breathe off one
 * animation.
 *
 * Use these to mirror the *shape* of content that has not loaded yet — a row of
 * text lines, an avatar, a card — instead of a generic {@link Spinner}, so the
 * layout does not jump when the real content arrives. The placeholder breathes
 * with an opacity pulse (not a gradient sweep) so it renders identically on iOS,
 * Android, and web, and honours `prefers-reduced-motion`.
 */
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Animated,
  DimensionValue,
  Easing,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import {
  createSkeletonStyles,
  resolveSkeletonRadius,
  SkeletonRadius,
  SKELETON_OPACITY_MAX,
  SKELETON_OPACITY_MIN,
  SKELETON_PULSE_DURATION,
  SKELETON_STATIC_OPACITY,
} from "./skeletonStyles";

/**
 * A shared pulse driver supplied by a {@link SkeletonPulseProvider} (or
 * {@link SkeletonGroup}). When present, every descendant placeholder breathes in
 * unison off this one `Animated.Value` instead of each running its own loop.
 * `null` means there is no shared driver — a standalone placeholder animates
 * itself — and is also what the provider supplies under reduced motion.
 */
const SkeletonPulseContext = createContext<Animated.Value | null>(null);

/** Start the looping fade (0 → 1 → 0) that drives the placeholder "breathe". */
function startPulse(progress: Animated.Value) {
  const half = {
    duration: SKELETON_PULSE_DURATION / 2,
    easing: Easing.inOut(Easing.ease),
    // The native driver is unavailable in the web renderer; opacity can run on
    // the native thread on iOS/Android and falls back to the JS driver on web.
    useNativeDriver: Platform.OS !== "web",
  };
  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(progress, { ...half, toValue: 1 }),
      Animated.timing(progress, { ...half, toValue: 0 }),
    ]),
  );
  loop.start();
  return loop;
}

/**
 * Resolve the opacity a placeholder should render with: the shared pulse if a
 * provider supplies one, a static value when motion is reduced, or a self-run
 * local pulse for a standalone placeholder. Only animates locally when there is
 * no shared driver, so a grouped skeleton uses exactly one loop.
 */
function useSkeletonOpacity() {
  const shared = useContext(SkeletonPulseContext);
  const reducedMotion = useReducedMotion();
  const localProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Defer to a shared driver, and never animate under reduced motion.
    if (shared || reducedMotion) {
      return;
    }
    const loop = startPulse(localProgress);
    return () => loop.stop();
  }, [shared, reducedMotion, localProgress]);

  const progress = shared ?? localProgress;
  const opacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [SKELETON_OPACITY_MAX, SKELETON_OPACITY_MIN],
      }),
    [progress],
  );

  // A shared driver only exists when motion is on, so the static branch only
  // applies to a standalone, reduced-motion placeholder.
  return reducedMotion && !shared ? SKELETON_STATIC_OPACITY : opacity;
}

export type SkeletonBarProps = {
  /**
   * Grow factor inside a row {@link SkeletonGroup}, instead of a fixed `width`.
   * Takes precedence over `width`.
   */
  flex?: number;
  /** Bar height in px. Defaults to 12 (about one line of body text). */
  height?: number;
  /** Corner radius: a shared radii token or explicit px. Defaults to `sm`. */
  radius?: SkeletonRadius;
  /** Extra style for the bar. */
  style?: StyleProp<ViewStyle>;
  /** Explicit width — px or a percentage like `"60%"`. Defaults to `"100%"`. */
  width?: DimensionValue;
};

/**
 * A rectangular placeholder standing in for a line of text, a label, or a chip.
 * Pulses on its own when used standalone, or in unison with its siblings inside
 * a {@link SkeletonGroup} / {@link SkeletonPulseProvider}. Decorative on every
 * platform — the loading state is announced by the surrounding container's
 * `aria-busy`, not by the bar.
 */
export function SkeletonBar({
  flex,
  height = 12,
  radius = "sm",
  style,
  width = "100%",
}: SkeletonBarProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSkeletonStyles(theme), [theme]);
  const opacity = useSkeletonOpacity();
  const sizing: ViewStyle =
    flex !== undefined ? { flex, minWidth: 0 } : { width };
  return (
    <Animated.View
      // Purely decorative; keep it off the accessibility tree on web, iOS, and
      // Android so assistive tech never reads a placeholder bar as content.
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.placeholder,
        sizing,
        { borderRadius: resolveSkeletonRadius(theme, radius), height, opacity },
        style,
      ]}
    />
  );
}

export type SkeletonCircleProps = {
  /** Diameter in px (e.g. an avatar's size). */
  diameter: number;
  /** Extra style for the circle. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A circular placeholder standing in for an avatar, icon, or any round element.
 * Shares the pulse and the decorative-on-every-platform treatment of
 * {@link SkeletonBar}.
 */
export function SkeletonCircle({ diameter, style }: SkeletonCircleProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSkeletonStyles(theme), [theme]);
  const opacity = useSkeletonOpacity();
  return (
    <Animated.View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.placeholder,
        {
          borderRadius: diameter / 2,
          height: diameter,
          opacity,
          width: diameter,
        },
        style,
      ]}
    />
  );
}

export type SkeletonPulseProviderProps = {
  children: ReactNode;
};

/**
 * Drives every descendant placeholder from a single pulse loop, so a skeleton
 * built from many bars and circles breathes in unison (and runs one animation,
 * not one per element). Honours reduced motion by supplying no driver, which
 * makes descendants render static. The {@link List} and {@link Table} loading
 * states wrap their placeholder rows in this; reach for it directly when you
 * compose a large custom skeleton.
 */
export function SkeletonPulseProvider({
  children,
}: SkeletonPulseProviderProps) {
  const reducedMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const loop = startPulse(progress);
    return () => loop.stop();
  }, [reducedMotion, progress]);

  // Supply no shared driver under reduced motion so descendants stay static.
  const value = reducedMotion ? null : progress;
  return (
    <SkeletonPulseContext.Provider value={value}>
      {children}
    </SkeletonPulseContext.Provider>
  );
}

export type SkeletonGroupProps = {
  children: ReactNode;
  /** Lay the children out in a `row` (default) or a `column`. */
  direction?: "column" | "row";
  /** Gap between children in px. Defaults to 12. */
  gap?: number;
  /** Extra style for the group container. */
  style?: StyleProp<ViewStyle>;
};

/**
 * A convenience layout wrapper that arranges placeholders in a flex `row`
 * (default) or `column` and shares one pulse across them (it is a
 * {@link SkeletonPulseProvider}). Compose a row of placeholders — e.g. an avatar
 * circle plus a flexing title bar plus a trailing chip — to mirror a piece of
 * content.
 */
export function SkeletonGroup({
  children,
  direction = "row",
  gap = 12,
  style,
}: SkeletonGroupProps) {
  return (
    <SkeletonPulseProvider>
      <View
        style={[
          {
            alignItems: direction === "row" ? "center" : "stretch",
            flexDirection: direction,
            gap,
          },
          style,
        ]}
      >
        {children}
      </View>
    </SkeletonPulseProvider>
  );
}
