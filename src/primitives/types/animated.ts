/**
 * The `Animated` runtime's type surface, plus `Easing`.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Animated/Animated.d.ts` and `Easing.d.ts`), trimmed to the driver
 * this library uses — `Value`, `timing`, `loop`, `interpolate`,
 * `createAnimatedComponent`, `Animated.View` — so the web build's declarations
 * never reference the `react-native` package. The node types themselves live
 * in `animatedValue.ts` because style values depend on them.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { ComponentPropsWithRef, ElementType, FC } from "react";

import type {
  AnimatedInterpolation,
  AnimatedValue,
  AnimatedValueConstructor,
} from "./animatedValue";
import type { TextComponent, ViewComponent } from "./components";

/** A timing curve: maps progress in `[0, 1]` to eased progress. */
export type EasingFunction = (value: number) => number;

/** Result of an animation run. */
export type EndResult = { finished: boolean };

/** Called when an animation finishes or is stopped. */
export type EndCallback = (result: EndResult) => void;

/** A started, stoppable animation. */
export interface CompositeAnimation {
  /** Runs the animation, calling back when it settles. */
  start: (callback?: EndCallback) => void;
  /** Stops the animation where it is. */
  stop: () => void;
  /** Stops the animation and restores the original value. */
  reset: () => void;
}

/** Shared configuration of every animation. */
export interface AnimationConfig {
  /** Whether the animation registers with the interaction manager. */
  isInteraction?: boolean | undefined;
  /** Whether the animation runs off the JS thread; ignored on web. */
  useNativeDriver: boolean;
}

/** Configuration of {@link AnimatedStatic.timing}. */
export interface TimingAnimationConfig extends AnimationConfig {
  toValue: number | AnimatedValue | AnimatedInterpolation<number>;
  easing?: EasingFunction | undefined;
  duration?: number | undefined;
  delay?: number | undefined;
}

/** Configuration of {@link AnimatedStatic.loop}. */
export interface LoopAnimationConfig {
  /** Repeat count; `-1` (the default) loops forever. */
  iterations?: number | undefined;
  /** Whether each iteration restarts from the original value. */
  resetBeforeIteration?: boolean | undefined;
}

type Nullable = undefined | null;
type Primitive = string | number | boolean | symbol;
type Builtin = Function | Date | Error | RegExp;

interface WithAnimatedArray<P> extends Array<WithAnimatedValue<P>> {}

type WithAnimatedObject<T> = {
  [K in keyof T]: WithAnimatedValue<T[K]>;
};

/** Widens a prop value so an animated node can stand in for it. */
// prettier-ignore
export type WithAnimatedValue<T> = T extends Builtin | Nullable
  ? T
  : T extends Primitive
    ? T | AnimatedValue | AnimatedInterpolation<number | string>
    : T extends Array<infer P>
      ? WithAnimatedArray<P>
      : T extends object
        ? WithAnimatedObject<T>
        : T;

/** Props of an animated component: every value may be an animated node. */
export type AnimatedProps<T> = {
  [K in keyof T]: K extends "key" | "ref" ? T[K] : WithAnimatedValue<T[K]>;
};

/** Any component `createAnimatedComponent` accepts. */
export type AnimatableComponent = ElementType;

/** A component whose props accept animated nodes. */
export type AnimatedComponent<T extends AnimatableComponent> = FC<
  AnimatedProps<ComponentPropsWithRef<T>>
>;

/** Options of {@link AnimatedStatic.createAnimatedComponent}. */
export type AnimatedComponentOptions = {
  collapsable?: boolean | undefined;
};

/**
 * The `Animated` namespace object.
 *
 * @see https://reactnative.dev/docs/animated
 */
export interface AnimatedStatic {
  /** The scalar that drives animations. */
  Value: AnimatedValueConstructor;
  /** A `View` whose props accept animated nodes. */
  View: AnimatedComponent<ViewComponent>;
  /** A `Text` whose props accept animated nodes. */
  Text: AnimatedComponent<TextComponent>;
  /** Animates a value along a timing curve. */
  timing(
    value: AnimatedValue,
    config: TimingAnimationConfig,
  ): CompositeAnimation;
  /** Repeats an animation. */
  loop(
    animation: CompositeAnimation,
    config?: LoopAnimationConfig,
  ): CompositeAnimation;
  /** Runs animations one after another. */
  sequence(animations: Array<CompositeAnimation>): CompositeAnimation;
  /** Runs animations at the same time. */
  parallel(
    animations: Array<CompositeAnimation>,
    config?: { stopTogether?: boolean | undefined },
  ): CompositeAnimation;
  /** An animation that does nothing for `time` milliseconds. */
  delay(time: number): CompositeAnimation;
  /** Wraps a component so its props accept animated nodes. */
  createAnimatedComponent<T extends AnimatableComponent>(
    component: T,
    options?: AnimatedComponentOptions,
  ): AnimatedComponent<T>;
}

/**
 * The `Easing` namespace object.
 *
 * @see https://reactnative.dev/docs/easing
 */
export interface EasingStatic {
  /** No easing: progress passes straight through. */
  linear: EasingFunction;
  /** The default material curve. */
  ease: EasingFunction;
  /** Constant rate of change. */
  step0: EasingFunction;
  step1: EasingFunction;
  quad: EasingFunction;
  cubic: EasingFunction;
  poly(n: number): EasingFunction;
  sin: EasingFunction;
  circle: EasingFunction;
  exp: EasingFunction;
  elastic(bounciness?: number): EasingFunction;
  back(s?: number): EasingFunction;
  bounce: EasingFunction;
  /** A cubic bézier curve. */
  bezier(x1: number, y1: number, x2: number, y2: number): EasingFunction;
  /** Runs `easing` forwards. */
  in(easing: EasingFunction): EasingFunction;
  /** Runs `easing` backwards. */
  out(easing: EasingFunction): EasingFunction;
  /** Runs `easing` forwards for half the duration, then backwards. */
  inOut(easing: EasingFunction): EasingFunction;
}
