/**
 * The non-component primitives: `Platform`, `StyleSheet`, `AccessibilityInfo`,
 * `Keyboard` and `useWindowDimensions`.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Utilities/Platform`, `Libraries/StyleSheet/StyleSheet.d.ts`,
 * `Libraries/Components/AccessibilityInfo`, `Libraries/Components/Keyboard`,
 * `Libraries/Utilities/Dimensions.d.ts`), trimmed to the members this library
 * calls, so the web build's declarations never reference the `react-native`
 * package.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { ImageStyle, StyleProp, TextStyle, ViewStyle } from "./style";

/** The platforms React Native reports. */
export type PlatformOSType =
  | "ios"
  | "android"
  | "macos"
  | "windows"
  | "web"
  | "native";

/**
 * The `Platform` namespace object.
 *
 * @see https://reactnative.dev/docs/platform
 */
export interface PlatformStatic {
  /** Which platform the code is running on. */
  OS: PlatformOSType;
  /** Whether the app runs on a TV device. */
  isTV: boolean;
  /** Whether the app runs under a test runner. */
  isTesting: boolean;
  /** The OS version. */
  Version: number | string;
  /** Picks the value matching the current platform, else `default`. */
  select<T>(
    specifics:
      | ({ [platform in PlatformOSType]?: T } & { default: T })
      | { [platform in PlatformOSType]: T },
  ): T;
  select<T>(specifics: { [platform in PlatformOSType]?: T }): T | undefined;
}

/** A style sheet's entries, before `StyleSheet.create` narrows them. */
export type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/** Any style sheet shape; the index signature is what catches typos. */
export type AnyNamedStyles = Record<string, ViewStyle | TextStyle | ImageStyle>;

/** The `position: absolute` inset-zero style `absoluteFill` resolves to. */
export interface AbsoluteFillStyle {
  position: "absolute";
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

/**
 * The `StyleSheet` namespace object.
 *
 * @see https://reactnative.dev/docs/stylesheet
 */
export interface StyleSheetStatic {
  /** Registers a style sheet; an identity function as far as types go. */
  create<T extends NamedStyles<T> | AnyNamedStyles>(
    styles: T & AnyNamedStyles,
  ): T;
  /** Collapses a style prop into one object. */
  flatten<T>(style?: StyleProp<T>): T extends (infer U)[] ? U : T;
  /** Combines two styles, the second overriding the first. */
  compose<
    T extends ViewStyle | TextStyle | ImageStyle,
    U extends T,
    V extends T,
  >(
    style1: StyleProp<U> | Array<StyleProp<U>>,
    style2: StyleProp<V> | Array<StyleProp<V>>,
  ): StyleProp<T>;
  /** The thinnest line the platform can draw crisply. */
  hairlineWidth: number;
  /** Shorthand for an inset-zero absolutely positioned overlay. */
  absoluteFill: AbsoluteFillStyle;
  /** The same style as a plain object, for spreading into another style. */
  absoluteFillObject: AbsoluteFillStyle;
}

/** What an `addEventListener` call returns, so the caller can detach. */
export interface EmitterSubscription {
  /** Detaches the listener. */
  remove(): void;
}

/**
 * The `AccessibilityInfo` namespace object.
 *
 * @see https://reactnative.dev/docs/accessibilityinfo
 */
export interface AccessibilityInfoStatic {
  /** Whether the user asked the OS to reduce motion. */
  isReduceMotionEnabled(): Promise<boolean>;
  /** Whether a screen reader is running. */
  isScreenReaderEnabled(): Promise<boolean>;
  /** Speaks `announcement` without moving focus. */
  announceForAccessibility(announcement: string): void;
  /** Subscribes to an accessibility setting change. */
  addEventListener(
    eventName: "reduceMotionChanged" | "screenReaderChanged",
    handler: (value: boolean) => void,
  ): EmitterSubscription;
}

/**
 * The `Keyboard` namespace object.
 *
 * @see https://reactnative.dev/docs/keyboard
 */
export interface KeyboardStatic {
  /** Dismisses the on-screen keyboard. */
  dismiss(): void;
  /** Subscribes to a keyboard lifecycle event. */
  addListener(
    eventName: string,
    listener: (event: unknown) => void,
  ): EmitterSubscription;
}

/** The window's measured size and scale factors. */
export interface ScaledSize {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/** Subscribes a component to the window size. */
export type UseWindowDimensions = () => ScaledSize;
