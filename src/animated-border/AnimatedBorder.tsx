/** Continuously animated comet-trail border that traces a rounded rectangle. */
import {
  forwardRef,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Rect } from "react-native-svg";

import { devWarn } from "../devWarn";
import { useSharedUiTheme } from "../theme";
import { useReducedMotion } from "../useReducedMotion";

import {
  createAnimatedBorderTrail,
  resolveAnimatedBorderGeometry,
  type AnimatedBorderShape,
} from "./animatedBorderGeometry";
import { animatedBorderStyles } from "./animatedBorderStyles";

/** Milliseconds for one full lap of the perimeter. */
const DEFAULT_DURATION_MS = 1600;
/** Stroke thickness of the trail. */
const DEFAULT_BORDER_WIDTH = 1.2;
/** Number of fading trail segments behind the bright head. */
const DEFAULT_TRAIL_COUNT = 8;
/** Perimeter gap, in px, between successive trail segments. */
const DEFAULT_TRAIL_SPACING = 3;

type RectProps = ComponentProps<typeof Rect>;

/**
 * React Native's `Animated` wrapper forwards a `collapsable` prop to its
 * animated host child; `react-native-svg`'s `Rect` does not accept it, so strip
 * it before it reaches the SVG node (and, on web, leaks onto the DOM element).
 */
const DomSafeRect = forwardRef<unknown, RectProps & { collapsable?: boolean }>(
  function DomSafeRect(props, ref) {
    const { collapsable: _collapsable, ...rest } = props as RectProps & {
      collapsable?: boolean;
    };
    void _collapsable;
    return <Rect ref={ref as never} {...rest} />;
  },
);
DomSafeRect.displayName = "DomSafeRect";

function createAnimatedRect() {
  return Animated.createAnimatedComponent(DomSafeRect);
}

// `Animated.createAnimatedComponent` only exists once React Native's Animated
// runtime is loaded, which is not the case when the package is merely imported
// under Node (the package-export smoke test imports every subpath without
// rendering). Build the animated rect lazily on first render — and only once —
// so importing the module never touches it and the component identity stays
// stable across renders (a fresh identity every render would remount the trail).
let cachedAnimatedRect: ReturnType<typeof createAnimatedRect> | null = null;

function getAnimatedRect(): ReturnType<typeof createAnimatedRect> {
  if (cachedAnimatedRect === null) {
    cachedAnimatedRect = createAnimatedRect();
  }
  return cachedAnimatedRect;
}

type DecorativeAccessibilityProps =
  | { "aria-hidden": true }
  | { accessibilityElementsHidden: true; importantForAccessibility: "no" };

export type AnimatedBorderProps = {
  /** Corner radius of the traced border, matching the wrapped element. Default 0. */
  borderRadius?: number;
  /** Stroke thickness of the trail in px. Default 1.2. */
  borderWidth?: number;
  /** Content the border is drawn over; omit to render the border on its own. */
  children?: ReactNode;
  /** Trail color. Defaults to the theme `primary`. */
  color?: string;
  /** Milliseconds for one full lap of the perimeter. Default 1600. */
  duration?: number;
  /** Height of the bordered box in px; omit to use the square `size`. Default 0. */
  height?: number;
  /**
   * How much the trail rounds the box: it follows `borderRadius`
   * (`"rounded-rect"`, the default) or fully rounds the box (`"circle"`). Use
   * `"circle"` to frame a circular avatar/icon or a pill; it ignores
   * `borderRadius` and traces a true circle for a square box or an elongated
   * stadium ("pill") for a non-square one. Default `"rounded-rect"`.
   */
  shape?: AnimatedBorderShape;
  /**
   * Square shorthand for `width` and `height`: each falls back to `size` when it
   * is not given. Sizing comes from these props, not from `style`. Default 0.
   */
  size?: number;
  /**
   * Extra style for the outermost element this renders — the border box itself
   * when standalone, or the wrapper around `children` when wrapping. Sizing is
   * owned by `width` / `height` / `size`, so use this for placement (for example
   * `position: "absolute"` over an existing box), not dimensions.
   */
  style?: StyleProp<ViewStyle>;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /** Number of fading trail segments behind the bright head. Default 8. */
  trailCount?: number;
  /** Perimeter gap in px between successive trail segments. Default 3. */
  trailSpacing?: number;
  /** Width of the bordered box in px; omit to use the square `size`. Default 0. */
  width?: number;
};

/**
 * A continuously animated "comet trail" that traces the perimeter of a rounded
 * rectangle — the moving accent border Juno draws around an active tool icon,
 * generalised into a standalone primitive. A short, bright head leads a fan of
 * progressively fainter, longer tail segments, and they chase each other around
 * the path by animating `strokeDashoffset` on stacked `react-native-svg` rects.
 * Drawing the trail as real rounded-rect geometry means it follows the actual
 * corner radius on iOS, Android, and web — a CSS gradient border cannot bend
 * around a corner, and a single rotated dash only reads as motion on a circle.
 *
 * Give it the `width` / `height` (or a square `size`) and `borderRadius` of the
 * element it frames — or pass `shape="circle"` to fully round the box (a true
 * circle when square, an elongated stadium/"pill" when not) for a circular
 * avatar, icon, or pill. With `children` it wraps them and overlays the border;
 * without children it renders the border on its own for you to position (for
 * example absolutely, over an existing box). The loop runs on the JS-driven
 * `Animated` API — an SVG attribute cannot use the native driver — and stops on
 * unmount. The border is purely decorative, so it is hidden from assistive
 * technology, and it settles into a static outline when the user prefers
 * reduced motion.
 */
export function AnimatedBorder({
  borderRadius = 0,
  borderWidth = DEFAULT_BORDER_WIDTH,
  children,
  color,
  duration = DEFAULT_DURATION_MS,
  height,
  shape = "rounded-rect",
  size,
  style,
  testID,
  trailCount = DEFAULT_TRAIL_COUNT,
  trailSpacing = DEFAULT_TRAIL_SPACING,
  width,
}: AnimatedBorderProps) {
  const theme = useSharedUiTheme();
  const reduceMotion = useReducedMotion();
  const resolvedWidth = width ?? size ?? 0;
  const resolvedHeight = height ?? size ?? 0;
  const stroke = color ?? theme.colors.primary;

  // `shape="circle"` fully rounds the box (a true circle when square, a stadium
  // when not); `"rounded-rect"` follows `borderRadius`. Either way the result is
  // a stroked rounded rect whose `perimeter` is the unit the dashed trail
  // segments and their offsets are measured in.
  const { origin, perimeter, radius, rectHeight, rectWidth } =
    resolveAnimatedBorderGeometry({
      borderRadius,
      borderWidth,
      height: resolvedHeight,
      shape,
      width: resolvedWidth,
    });

  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (resolvedWidth <= 0 || resolvedHeight <= 0) {
      devWarn(
        "AnimatedBorder: pass `width` and `height` (or a square `size`) so the border has a box to trace.",
      );
    }
    if (reduceMotion) {
      // Honour the reduced-motion preference: hold the trail still rather than
      // looping it around the perimeter.
      progress.setValue(0);
      return;
    }
    // Re-running this effect (a size, duration, or reduced-motion change) stops
    // the previous loop wherever it happened to be; reset to 0 so the restarted
    // lap always runs a full 0 → 1 over `duration` rather than racing the
    // remainder at a faster apparent speed.
    progress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(progress, {
        duration,
        easing: Easing.linear,
        toValue: 1,
        // An SVG `strokeDashoffset` cannot run on the native driver, so the
        // trail is JS-driven on every platform.
        useNativeDriver: false,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [duration, progress, reduceMotion, resolvedHeight, resolvedWidth]);

  const decorative = decorativeAccessibilityProps();
  const trail = createAnimatedBorderTrail(trailCount, trailSpacing);
  const AnimatedRect = getAnimatedRect();

  const svg = (
    <Svg {...decorative} height={resolvedHeight} width={resolvedWidth}>
      {reduceMotion ? (
        // A calm, static outline for users who opt out of motion.
        <Rect
          fill="none"
          height={rectHeight}
          rx={radius}
          stroke={stroke}
          strokeWidth={borderWidth}
          width={rectWidth}
          x={origin}
          y={origin}
        />
      ) : (
        trail.map((layer) => (
          <AnimatedRect
            fill="none"
            height={rectHeight}
            key={layer.key}
            rx={radius}
            stroke={stroke}
            strokeDasharray={[layer.dash, perimeter - layer.dash]}
            strokeDashoffset={progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layer.lag, layer.lag - perimeter],
            })}
            strokeLinecap="round"
            strokeOpacity={layer.opacity}
            strokeWidth={borderWidth}
            width={rectWidth}
            x={origin}
            y={origin}
          />
        ))
      )}
    </Svg>
  );

  if (children == null) {
    return (
      <View
        {...decorative}
        pointerEvents="none"
        style={[{ height: resolvedHeight, width: resolvedWidth }, style]}
        testID={testID ?? "animated-border"}
      >
        {svg}
      </View>
    );
  }

  return (
    <View style={[animatedBorderStyles.frame, style]} testID={testID}>
      {children}
      <View
        {...decorative}
        pointerEvents="none"
        style={[
          animatedBorderStyles.overlay,
          { height: resolvedHeight, width: resolvedWidth },
        ]}
        testID="animated-border"
      >
        {svg}
      </View>
    </View>
  );
}

function decorativeAccessibilityProps(): DecorativeAccessibilityProps {
  if (Platform.OS === "web") {
    return { "aria-hidden": true };
  }

  return {
    accessibilityElementsHidden: true,
    importantForAccessibility: "no",
  };
}
