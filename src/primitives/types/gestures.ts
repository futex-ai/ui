/**
 * `PanResponder`: the gesture recognizer the chart scrubber uses.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Interaction/PanResponder.d.ts`) so the web build's declarations
 * never reference the `react-native` package.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { GestureResponderEvent, GestureResponderHandlers } from "./events";

/** The running gesture summary handed to every `PanResponder` callback. */
export interface PanResponderGestureState {
  /** Identifier of the gesture, stable while a touch remains down. */
  stateID: number;
  /** Screen x of the most recently moved touch. */
  moveX: number;
  /** Screen y of the most recently moved touch. */
  moveY: number;
  /** Screen x where the responder was granted. */
  x0: number;
  /** Screen y where the responder was granted. */
  y0: number;
  /** Accumulated x distance since the touch started. */
  dx: number;
  /** Accumulated y distance since the touch started. */
  dy: number;
  /** Current x velocity. */
  vx: number;
  /** Current y velocity. */
  vy: number;
  /** Touches currently on screen. */
  numberActiveTouches: number;
}

/** A `PanResponder` callback that decides something. */
export type PanResponderPredicate = (
  event: GestureResponderEvent,
  gestureState: PanResponderGestureState,
) => boolean;

/** A `PanResponder` callback that reacts to something. */
export type PanResponderHandler = (
  event: GestureResponderEvent,
  gestureState: PanResponderGestureState,
) => void;

/** Configuration of {@link PanResponderStatic.create}. */
export interface PanResponderCallbacks {
  onStartShouldSetPanResponder?: PanResponderPredicate | undefined;
  onStartShouldSetPanResponderCapture?: PanResponderPredicate | undefined;
  onMoveShouldSetPanResponder?: PanResponderPredicate | undefined;
  onMoveShouldSetPanResponderCapture?: PanResponderPredicate | undefined;
  onPanResponderGrant?: PanResponderHandler | undefined;
  onPanResponderStart?: PanResponderHandler | undefined;
  onPanResponderMove?: PanResponderHandler | undefined;
  onPanResponderEnd?: PanResponderHandler | undefined;
  onPanResponderRelease?: PanResponderHandler | undefined;
  onPanResponderReject?: PanResponderHandler | undefined;
  onPanResponderTerminate?: PanResponderHandler | undefined;
  onPanResponderTerminationRequest?: PanResponderPredicate | undefined;
  onShouldBlockNativeResponder?: PanResponderPredicate | undefined;
}

/** What `PanResponder.create` returns: handlers to spread onto a view. */
export interface PanResponderInstance {
  /** Responder props to spread onto the view that owns the gesture. */
  panHandlers: GestureResponderHandlers;
}

/**
 * The `PanResponder` namespace object.
 *
 * @see https://reactnative.dev/docs/panresponder
 */
export interface PanResponderStatic {
  /** Builds a responder from a set of gesture callbacks. */
  create(config: PanResponderCallbacks): PanResponderInstance;
}
