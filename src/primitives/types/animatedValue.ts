/**
 * The `Animated` node types that style values depend on.
 *
 * Split out from `animated.ts` so `style.ts` can accept an animated node in a
 * `DimensionValue` without the two modules importing each other.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Animated/Animated.d.ts`) and trimmed to the driving API this
 * library uses: `new Value(n)`, `setValue`, `interpolate`, and the listener
 * pair. Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the
 * MIT license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */

/** How an interpolation behaves outside its input range. */
export type ExtrapolateType = "extend" | "identity" | "clamp";

/** Configuration for {@link AnimatedValue.interpolate}. */
export type InterpolationConfigType = {
  inputRange: number[];
  outputRange: number[] | string[];
  easing?: ((input: number) => number) | undefined;
  extrapolate?: ExtrapolateType | undefined;
  extrapolateLeft?: ExtrapolateType | undefined;
  extrapolateRight?: ExtrapolateType | undefined;
};

/** Options accepted when constructing an {@link AnimatedValue}. */
export type AnimatedConfig = {
  useNativeDriver?: boolean | undefined;
};

/**
 * Any node in the animation graph. Style props accept one wherever they accept
 * the corresponding plain number or string.
 *
 * The member list matches React Native's `Animated.AnimatedNode` exactly, so a
 * value driven by a consumer's React Native `Animated` still satisfies a style
 * typed here, and vice versa.
 */
export interface AnimatedNode {
  /** Observes updates; returns an id for {@link AnimatedNode.removeListener}. */
  addListener(callback: (value: unknown) => unknown): string;
  /** Removes the listener registered under `id`. */
  removeListener(id: string): void;
  /** Removes every listener registered on this node. */
  removeAllListeners(): void;
  /** Whether any listener is attached. */
  hasListeners(): boolean;
}

/** The result of interpolating an animated value. */
export interface AnimatedInterpolation<
  OutputT extends number | string,
> extends AnimatedNode {
  /** Chains another interpolation onto this one. */
  interpolate(config: InterpolationConfigType): AnimatedInterpolation<OutputT>;
}

/** Listener invoked with each new value while an animation runs. */
export type ValueListenerCallback = (state: { value: number }) => void;

/** The standard scalar that drives animations. */
export interface AnimatedValue extends AnimatedNode {
  /** Sets the value directly, stopping any running animation on it. */
  setValue(value: number): void;
  /** Sets an offset applied on top of whatever value is set. */
  setOffset(offset: number): void;
  /** Merges the offset into the base value and resets the offset to zero. */
  flattenOffset(): void;
  /** Moves the base value into the offset, leaving the output unchanged. */
  extractOffset(): void;
  /** Observes updates; returns an id for {@link AnimatedValue.removeListener}. */
  addListener(callback: ValueListenerCallback): string;
  /** Removes the listener registered under `id`. */
  removeListener(id: string): void;
  /** Stops any running animation, reporting the final value. */
  stopAnimation(callback?: (value: number) => void): void;
  /** Stops any animation and resets the value to its original. */
  resetAnimation(callback?: (value: number) => void): void;
  /** Maps this value through an input/output range. */
  interpolate<OutputT extends number | string>(
    config: InterpolationConfigType,
  ): AnimatedInterpolation<OutputT>;
}

/** Constructor side of {@link AnimatedValue}. */
export interface AnimatedValueConstructor {
  new (value: number, config?: AnimatedConfig | null): AnimatedValue;
}
