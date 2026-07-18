/**
 * Content-shaped loading placeholders: a shimmering {@link SkeletonBar} and
 * {@link SkeletonCircle} leaf, a {@link SkeletonGroup} layout helper, and the
 * {@link SkeletonPulseProvider} that lets a whole skeleton sweep off one
 * animation.
 *
 * Use these to mirror the *shape* of content that has not loaded yet — a row of
 * text lines, an avatar, a card — instead of a generic {@link Spinner}, so the
 * layout does not jump when the real content arrives. A faint base fill carries
 * a translucent white sheen that sweeps left-to-right; the sweep is drawn with
 * `react-native-svg` and driven by an `Animated` transform, so it renders
 * identically on iOS, Android, and web (the same approach the `Spinner` uses for
 * its arc), and honours `prefers-reduced-motion`.
 */
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  DimensionValue,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import {
  createSkeletonStyles,
  resolveSkeletonRadius,
  SkeletonRadius,
  SKELETON_SHEEN_OPACITY,
  SKELETON_SWEEP_DURATION,
} from "./skeletonStyles";

/**
 * A shared sweep driver supplied by a {@link SkeletonPulseProvider} (or
 * {@link SkeletonGroup}). When present, every descendant placeholder sweeps in
 * unison off this one `Animated.Value` (a 0 → 1 progress) instead of each running
 * its own loop. `null` means there is no shared driver — a standalone placeholder
 * animates itself — and is also what the provider supplies under reduced motion.
 */
const SkeletonPulseContext = createContext<Animated.Value | null>(null);

/**
 * Start the looping 0 → 1 progress that drives the sheen sweep. It resets to 0
 * each iteration (a sawtooth); the sheen sits fully off either edge at 0 and 1,
 * so the reset is invisible.
 */
function startSweep(progress: Animated.Value) {
  const loop = Animated.loop(
    Animated.timing(progress, {
      duration: SKELETON_SWEEP_DURATION,
      easing: Easing.inOut(Easing.ease),
      toValue: 1,
      // `transform` is a non-layout property, so it can run on the native driver
      // on iOS/Android; the web renderer falls back to the JS driver.
      useNativeDriver: Platform.OS !== "web",
    }),
  );
  loop.start();
  return loop;
}

/**
 * Resolve the sweep driver a placeholder should use: the shared progress if a
 * provider supplies one, otherwise a self-run local progress. Only animates
 * locally when there is no shared driver (so a grouped skeleton uses one loop)
 * and never under reduced motion.
 */
function useSkeletonSweep() {
  const shared = useContext(SkeletonPulseContext);
  const reducedMotion = useReducedMotion();
  const localProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Defer to a shared driver, and never animate under reduced motion.
    if (shared || reducedMotion) {
      return;
    }
    const loop = startSweep(localProgress);
    return () => loop.stop();
  }, [shared, reducedMotion, localProgress]);

  return { animate: !reducedMotion, progress: shared ?? localProgress };
}

/**
 * The shared placeholder body: a faint base fill, clipped to its rounded shape,
 * with a white sheen that sweeps across while animating. Decorative on every
 * platform — the loading state is announced by the surrounding container's
 * `aria-busy`, not by the placeholder.
 */
function Placeholder({
  shape,
  testID,
}: {
  shape: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createSkeletonStyles(theme), [theme]);
  const { animate, progress } = useSkeletonSweep();
  // Measured in px so the sheen translates by the real width and the SVG gets
  // explicit dimensions — percentage SVG sizing is unreliable on iOS/Android.
  const [size, setSize] = useState({ height: 0, width: 0 });
  // A stable, collision-free gradient id (sanitised of `useId`'s colons so it is
  // a valid `url(#…)` reference on web).
  const gradientId = `skeleton-sheen-${useId().replace(/:/g, "")}`;

  const translateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-size.width, size.width],
      }),
    [progress, size.width],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { height, width },
    );
  };

  return (
    <View
      // Purely decorative; keep it off the accessibility tree on web, iOS, and
      // Android so assistive tech never reads a placeholder as content.
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={onLayout}
      style={[styles.placeholder, shape]}
      testID={testID}
    >
      {animate && size.width > 0 ? (
        <Animated.View
          aria-hidden
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
        >
          <Svg height={size.height} width={size.width}>
            <Defs>
              <LinearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
                <Stop offset={0} stopColor="#ffffff" stopOpacity={0} />
                <Stop
                  offset={0.5}
                  stopColor="#ffffff"
                  stopOpacity={SKELETON_SHEEN_OPACITY}
                />
                <Stop offset={1} stopColor="#ffffff" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect
              fill={`url(#${gradientId})`}
              height={size.height}
              width={size.width}
            />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Explicit width — px or a percentage like `"60%"`. Defaults to `"100%"`. */
  width?: DimensionValue;
};

/**
 * A rectangular placeholder standing in for a line of text, a label, or a chip.
 * Sweeps on its own when used standalone, or in unison with its siblings inside
 * a {@link SkeletonGroup} / {@link SkeletonPulseProvider}.
 */
export function SkeletonBar({
  flex,
  height = 12,
  radius = "sm",
  style,
  testID,
  width = "100%",
}: SkeletonBarProps) {
  const theme = useSharedUiTheme();
  const sizing: ViewStyle =
    flex !== undefined ? { flex, minWidth: 0 } : { width };
  return (
    <Placeholder
      shape={[
        sizing,
        { borderRadius: resolveSkeletonRadius(theme, radius), height },
        style,
      ]}
      testID={testID}
    />
  );
}

export type SkeletonCircleProps = {
  /** Diameter in px (e.g. an avatar's size). */
  diameter: number;
  /** Extra style for the circle. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * A circular placeholder standing in for an avatar, icon, or any round element.
 * Shares the sheen sweep and the decorative-on-every-platform treatment of
 * {@link SkeletonBar}.
 */
export function SkeletonCircle({
  diameter,
  style,
  testID,
}: SkeletonCircleProps) {
  return (
    <Placeholder
      shape={[
        { borderRadius: diameter / 2, height: diameter, width: diameter },
        style,
      ]}
      testID={testID}
    />
  );
}

export type SkeletonPulseProviderProps = {
  children: ReactNode;
};

/**
 * Drives every descendant placeholder from a single sweep loop, so a skeleton
 * built from many bars and circles shimmers in unison (and runs one animation,
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
    const loop = startSweep(progress);
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
};

/**
 * A convenience layout wrapper that arranges placeholders in a flex `row`
 * (default) or `column` and shares one sweep across them (it is a
 * {@link SkeletonPulseProvider}). Compose a row of placeholders — e.g. an avatar
 * circle plus a flexing title bar plus a trailing chip — to mirror a piece of
 * content.
 */
export function SkeletonGroup({
  children,
  direction = "row",
  gap = 12,
  style,
  testID,
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
        testID={testID}
      >
        {children}
      </View>
    </SkeletonPulseProvider>
  );
}
