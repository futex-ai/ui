/**
 * Event payloads the primitives hand to their callbacks.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Types/CoreEventTypes.d.ts`, plus the responder handlers from
 * `types/public/ReactNativeRenderer.d.ts` and `Components/Touchable`), trimmed
 * to the events this library listens to, so the web build's declarations never
 * reference the `react-native` package.
 *
 * `NativeSyntheticEvent` is spelled out rather than extending React's
 * `BaseSyntheticEvent` so the shape stays pinned to what React Native
 * documents. Its member list, and the `HostElement` its targets carry, match
 * React Native's exactly in both directions: a consumer's React Native event
 * satisfies ours, and — because handler props are contravariant in their
 * parameter — a handler typed with React Native's event is still assignable to
 * one of our props.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { HostElement } from "./hostElement";

/** Wrapper every primitive event arrives in. */
export interface NativeSyntheticEvent<T> {
  /** The platform payload; the only part components normally read. */
  nativeEvent: T;
  /** The node the handler is attached to. */
  currentTarget: HostElement;
  /** The node the event originated from. */
  target: HostElement;
  bubbles: boolean;
  cancelable: boolean;
  defaultPrevented: boolean;
  eventPhase: number;
  isTrusted: boolean;
  timeStamp: number;
  type: string;
  preventDefault(): void;
  isDefaultPrevented(): boolean;
  stopPropagation(): void;
  isPropagationStopped(): boolean;
  persist(): void;
}

/** The measured box reported by `onLayout`. */
export interface LayoutRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Fired on mount and whenever a view's box changes. */
export type LayoutChangeEvent = NativeSyntheticEvent<{
  layout: LayoutRectangle;
}>;

/** A single touch point. */
export interface NativeTouchEvent {
  /** Touches that changed since the previous event. */
  changedTouches: NativeTouchEvent[];
  /** Identifier of this touch. */
  identifier: string;
  /** X position relative to the element. */
  locationX: number;
  /** Y position relative to the element. */
  locationY: number;
  /** X position relative to the screen. */
  pageX: number;
  /** Y position relative to the screen. */
  pageY: number;
  /** Node id of the element receiving the touch. */
  target: string;
  /** Time identifier, useful for velocity calculations. */
  timestamp: number;
  /** All touches currently on screen. */
  touches: NativeTouchEvent[];
  /** iOS 3D Touch force. */
  force?: number | undefined;
}

/** One laid-out line reported by `onTextLayout`. */
export interface TextLayoutLine {
  ascender: number;
  capHeight: number;
  descender: number;
  height: number;
  text: string;
  width: number;
  x: number;
  xHeight: number;
  y: number;
}

/** Payload of `onTextLayout`. */
export interface TextLayoutEventData extends TargetedEvent {
  lines: TextLayoutLine[];
}

/** Fired once a `Text` has measured its lines. */
export type TextLayoutEvent = NativeSyntheticEvent<TextLayoutEventData>;

/** A touch or press event delivered to a responder. */
export interface GestureResponderEvent extends NativeSyntheticEvent<NativeTouchEvent> {}

/** Payload of the focus/blur events, which only carry their target. */
export interface TargetedEvent {
  target: number;
}

/** Fired when a view or input takes focus. */
export type FocusEvent = NativeSyntheticEvent<TargetedEvent>;

/** Fired when a view or input loses focus. */
export type BlurEvent = NativeSyntheticEvent<TargetedEvent>;

/** Base of the mouse and pointer payloads. */
export interface NativeUIEvent {
  readonly detail: number;
}

/**
 * Mouse payload.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
 */
export interface NativeMouseEvent extends NativeUIEvent {
  readonly screenX: number;
  readonly screenY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly x: number;
  readonly y: number;
  readonly ctrlKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly metaKey: boolean;
  readonly button: number;
  readonly buttons: number;
  readonly relatedTarget: null | number | HostElement;
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Pointer payload.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent
 */
export interface NativePointerEvent extends NativeMouseEvent {
  readonly pointerId: number;
  readonly width: number;
  readonly height: number;
  readonly pressure: number;
  readonly tangentialPressure: number;
  readonly tiltX: number;
  readonly tiltY: number;
  readonly twist: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;
}

/** A hover / mouse event delivered to a primitive. */
export interface MouseEvent extends NativeSyntheticEvent<NativeMouseEvent> {}

/** A pointer event delivered to a primitive. */
export type PointerEvent = NativeSyntheticEvent<NativePointerEvent>;

/** The pointer handlers every view accepts. */
export interface PointerEvents {
  onPointerEnter?: ((event: PointerEvent) => void) | undefined;
  onPointerEnterCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerLeave?: ((event: PointerEvent) => void) | undefined;
  onPointerLeaveCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerMove?: ((event: PointerEvent) => void) | undefined;
  onPointerMoveCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerCancel?: ((event: PointerEvent) => void) | undefined;
  onPointerCancelCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerDown?: ((event: PointerEvent) => void) | undefined;
  onPointerDownCapture?: ((event: PointerEvent) => void) | undefined;
  onPointerUp?: ((event: PointerEvent) => void) | undefined;
  onPointerUpCapture?: ((event: PointerEvent) => void) | undefined;
}

/** The raw touch handlers every view accepts. */
export interface Touchable {
  onTouchStart?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchMove?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchEnd?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchCancel?: ((event: GestureResponderEvent) => void) | undefined;
  onTouchEndCapture?: ((event: GestureResponderEvent) => void) | undefined;
}

/**
 * The gesture responder negotiation handlers.
 *
 * @see https://reactnative.dev/docs/gesture-responder-system
 */
export interface GestureResponderHandlers {
  /** Claim the responder on touch start. */
  onStartShouldSetResponder?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
  /** Claim the responder on touch move. */
  onMoveShouldSetResponder?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
  /** Capture-phase counterpart of `onStartShouldSetResponder`. */
  onStartShouldSetResponderCapture?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
  /** Capture-phase counterpart of `onMoveShouldSetResponder`. */
  onMoveShouldSetResponderCapture?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
  /** The view is now the responder. */
  onResponderGrant?: ((event: GestureResponderEvent) => void) | undefined;
  /** Another view kept the responder. */
  onResponderReject?: ((event: GestureResponderEvent) => void) | undefined;
  onResponderStart?: ((event: GestureResponderEvent) => void) | undefined;
  /** The gesture moved. */
  onResponderMove?: ((event: GestureResponderEvent) => void) | undefined;
  onResponderEnd?: ((event: GestureResponderEvent) => void) | undefined;
  /** The gesture ended. */
  onResponderRelease?: ((event: GestureResponderEvent) => void) | undefined;
  /** Should the responder be handed over? */
  onResponderTerminationRequest?:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
  /** The responder was taken away. */
  onResponderTerminate?: ((event: GestureResponderEvent) => void) | undefined;
}
