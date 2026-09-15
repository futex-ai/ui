/**
 * React Native primitives, web resolution.
 *
 * Delegates to `react-native-web` directly so a web bundler needs no
 * `react-native` alias and a web consumer never installs the `react-native`
 * package. Values come from `react-native-web`; the type surface is borrowed
 * from `react-native`'s declarations (`react-native-web` ships none), which is
 * why `react-native` remains a types-only dependency for strict web consumers.
 *
 * Each class-valued export also gets a same-named type alias so `useRef<View>`
 * style usage keeps working, and `Animated` merges a namespace carrying the
 * `Animated.Value` type. The export list mirrors `reactNative.ts` exactly.
 */
import { Fragment, createElement } from "react";
import type { ComponentProps, ComponentType } from "react";
import type * as ReactNative from "react-native";
import {
  AccessibilityInfo as WebAccessibilityInfo,
  Animated as WebAnimated,
  Easing as WebEasing,
  FlatList as WebFlatList,
  Image as WebImage,
  Keyboard as WebKeyboard,
  KeyboardAvoidingView as WebKeyboardAvoidingView,
  Modal as WebModal,
  PanResponder as WebPanResponder,
  Platform as WebPlatform,
  Pressable as WebPressable,
  ScrollView as WebScrollView,
  StyleSheet as WebStyleSheet,
  Text as WebText,
  TextInput as WebTextInput,
  View as WebView,
  useWindowDimensions as webUseWindowDimensions,
} from "react-native-web";

function WebInputAccessoryView({
  children,
}: ComponentProps<typeof ReactNative.InputAccessoryView>) {
  return createElement(Fragment, null, children);
}

export const AccessibilityInfo: typeof ReactNative.AccessibilityInfo =
  WebAccessibilityInfo;
export const Animated: typeof ReactNative.Animated = WebAnimated;
export declare namespace Animated {
  type Value = ReactNative.Animated.Value;
}
export const Easing: typeof ReactNative.Easing = WebEasing;
export const FlatList: typeof ReactNative.FlatList = WebFlatList;
export type FlatList<ItemT = unknown> = ReactNative.FlatList<ItemT>;
export const Image: typeof ReactNative.Image = WebImage;
export type Image = ReactNative.Image;
// `react-native-web` has no root export for `InputAccessoryView` (its internal
// module is an unimplemented placeholder). The only caller renders it on iOS
// alone, so on web it is a fragment that passes its children through.
export const InputAccessoryView: ComponentType<
  ComponentProps<typeof ReactNative.InputAccessoryView>
> = WebInputAccessoryView;
export const Keyboard: typeof ReactNative.Keyboard = WebKeyboard;
export const KeyboardAvoidingView: typeof ReactNative.KeyboardAvoidingView =
  WebKeyboardAvoidingView;
export const Modal: typeof ReactNative.Modal = WebModal;
export type Modal = ReactNative.Modal;
export const PanResponder: typeof ReactNative.PanResponder = WebPanResponder;
export const Platform: typeof ReactNative.Platform = WebPlatform;
export const Pressable: typeof ReactNative.Pressable = WebPressable;
export const ScrollView: typeof ReactNative.ScrollView = WebScrollView;
export type ScrollView = ReactNative.ScrollView;
export const StyleSheet: typeof ReactNative.StyleSheet = WebStyleSheet;
export const Text: typeof ReactNative.Text = WebText;
export type Text = ReactNative.Text;
export const TextInput: typeof ReactNative.TextInput = WebTextInput;
export type TextInput = ReactNative.TextInput;
export const View: typeof ReactNative.View = WebView;
export type View = ReactNative.View;
export const useWindowDimensions: typeof ReactNative.useWindowDimensions =
  webUseWindowDimensions;

export type {
  AccessibilityRole,
  AccessibilityState,
  ColorValue,
  DimensionValue,
  FocusEvent,
  GestureResponderEvent,
  Insets,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponderInstance,
  StyleProp,
  TextInputContentSizeChangeEventData,
  TextInputProps,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from "react-native";
