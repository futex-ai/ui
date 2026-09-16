/**
 * The occasional primitives: `Modal`, `Image`, `KeyboardAvoidingView` and
 * `InputAccessoryView`.
 *
 * Vendored from React Native's public declarations (`Libraries/Modal`,
 * `Libraries/Image`, `Libraries/Components/Keyboard`) and trimmed to the props
 * this library passes, so the web build's declarations never reference the
 * `react-native` package.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type {
  ComponentType,
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from "react";

import type { AccessibilityProps } from "./accessibility";
import type { ViewProps } from "./components";
import type { NativeSyntheticEvent } from "./events";
import type { HostInstance } from "./hostInstance";
import type { ColorValue } from "./layout";
import type { ImageStyle, StyleProp, ViewStyle } from "./style";

/**
 * Props of a `Modal`.
 *
 * @see https://reactnative.dev/docs/modal#props
 */
export interface ModalProps extends AccessibilityProps {
  children?: ReactNode | undefined;
  /** How the modal enters and leaves. */
  animationType?: "none" | "slide" | "fade" | undefined;
  /** Whether the modal's own background is see-through. */
  transparent?: boolean | undefined;
  /** Whether the modal is on screen. */
  visible?: boolean | undefined;
  /** Whether the modal draws under a translucent status bar (Android). */
  statusBarTranslucent?: boolean | undefined;
  /** Whether the modal is rendered in a detached native window (Android). */
  hardwareAccelerated?: boolean | undefined;
  /** Fired on the Android back button and the web Escape key. */
  onRequestClose?: (() => void) | undefined;
  /** Fired once the modal is on screen. */
  onShow?: ((event: NativeSyntheticEvent<unknown>) => void) | undefined;
  /** Fired once the modal has left the screen (iOS). */
  onDismiss?: (() => void) | undefined;
  /** Test hook; becomes `data-testid` on web. */
  testID?: string | undefined;
}

/** A mounted `Modal`. */
export interface ModalInstance extends HostInstance {}

/** The `Modal` component. */
export type ModalComponent = ForwardRefExoticComponent<
  ModalProps & RefAttributes<ModalInstance>
>;

/** A remote or local image address. */
export interface ImageURISource {
  uri?: string | undefined;
  bundle?: string | undefined;
  method?: string | undefined;
  headers?: { [key: string]: string } | undefined;
  body?: string | undefined;
  cache?: "default" | "reload" | "force-cache" | "only-if-cached" | undefined;
  width?: number | undefined;
  height?: number | undefined;
  scale?: number | undefined;
}

/** Everything an `Image`'s `source` accepts. */
export type ImageSourcePropType = ImageURISource | ImageURISource[] | number;

/**
 * Props of an `Image`.
 *
 * @see https://reactnative.dev/docs/image#props
 */
export interface ImageProps extends AccessibilityProps {
  /** Where the image comes from. */
  source?: ImageSourcePropType | undefined;
  /** Alternative text; becomes `alt` on web. */
  alt?: string | undefined;
  /** How the image fills its frame. */
  resizeMode?: ImageStyle["resizeMode"] | undefined;
  style?: StyleProp<ImageStyle> | undefined;
  /** Fired once the image has loaded. */
  onLoad?: ((event: NativeSyntheticEvent<unknown>) => void) | undefined;
  /** Fired when the image fails to load. */
  onError?: ((event: NativeSyntheticEvent<unknown>) => void) | undefined;
  /** Test hook; becomes `data-testid` on web. */
  testID?: string | undefined;
}

/** A mounted `Image`. */
export interface ImageInstance extends HostInstance {}

/** The `Image` component. */
export type ImageComponent = ForwardRefExoticComponent<
  ImageProps & RefAttributes<ImageInstance>
>;

/**
 * Props of a `KeyboardAvoidingView`.
 *
 * @see https://reactnative.dev/docs/keyboardavoidingview#props
 */
export interface KeyboardAvoidingViewProps extends ViewProps {
  /** How the view gets out of the keyboard's way. */
  behavior?: "height" | "position" | "padding" | undefined;
  /** Style of the inner container when `behavior` is `position`. */
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;
  /** Distance between the top of the view and the keyboard. */
  keyboardVerticalOffset?: number | undefined;
  /** Whether the avoidance is active. */
  enabled?: boolean | undefined;
}

/** The `KeyboardAvoidingView` component. */
export type KeyboardAvoidingViewComponent = ForwardRefExoticComponent<
  KeyboardAvoidingViewProps & RefAttributes<HostInstance>
>;

/**
 * Props of an `InputAccessoryView`, the iOS bar above the keyboard.
 *
 * @see https://reactnative.dev/docs/inputaccessoryview#props
 */
export interface InputAccessoryViewProps {
  children?: ReactNode | undefined;
  /** Fill colour of the bar. */
  backgroundColor?: ColorValue | undefined;
  /** Id a `TextInput` points its `inputAccessoryViewID` at. */
  nativeID?: string | undefined;
  style?: StyleProp<ViewStyle> | undefined;
}

/**
 * The `InputAccessoryView` component. A plain component type rather than a
 * forward-ref one: the web seam substitutes a fragment, which takes no ref.
 */
export type InputAccessoryViewComponent =
  ComponentType<InputAccessoryViewProps>;
