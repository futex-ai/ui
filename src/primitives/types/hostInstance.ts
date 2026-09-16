/**
 * The host instance a rendered primitive exposes through a `ref`.
 *
 * Vendored from React Native's public declarations
 * (`types/public/ReactNativeTypes.d.ts`) and trimmed to the imperative surface
 * this library calls (`focus`, `measureInWindow`), so the web build's emitted
 * declarations never reference the `react-native` package. React Native's own
 * `HostInstance` carries a full read-only DOM element on top of these methods;
 * keeping ours smaller means an instance typed by React Native still satisfies
 * it, which is what lets a native consumer's ref flow into our props.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */

/** Callback for {@link NativeMethods.measure}. */
export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

/** Callback for {@link NativeMethods.measureInWindow}. */
export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

/** Callback for {@link NativeMethods.measureLayout}. */
export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/** Imperative methods every host component exposes on its instance. */
export interface NativeMethods {
  /** Measures the view on screen, reporting `x, y, width, height, pageX, pageY`. */
  measure(callback: MeasureOnSuccessCallback): void;
  /** Measures the view in window coordinates, reporting `x, y, width, height`. */
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void;
  /** Measures the view relative to an ancestor instance. */
  measureLayout(
    relativeToNativeComponentRef: HostInstance | number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail?: () => void,
  ): void;
  /** Applies props straight to the host node, bypassing the next render. */
  setNativeProps(nativeProps: object): void;
  /** Requests focus for the host node. */
  focus(): void;
  /** Removes focus from the host node. */
  blur(): void;
}

/** A mounted host node, as handed to a `ref`. */
export interface HostInstance extends NativeMethods {}
