/**
 * React Native primitives, web resolution.
 *
 * Delegates to `react-native-web` directly so a web bundler needs no
 * `react-native` alias and a web consumer never installs the `react-native`
 * package. Values come from `react-native-web`; the type surface is the
 * library's own (`./types`), vendored from React Native's declarations, so the
 * emitted `dist/node` declarations — the ones every consumer resolves — never
 * mention `react-native` either.
 *
 * Each class-valued export also gets a same-named type alias so `useRef<View>`
 * style usage keeps working, and `Animated` merges a namespace carrying the
 * `Animated.Value` type. The export list mirrors `reactNative.ts` exactly; a
 * unit test diffs the two.
 */
import { Fragment, createElement } from "react";
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

import type {
  AccessibilityInfoStatic,
  AnimatedStatic,
  AnimatedValue,
  EasingStatic,
  FlatListComponent,
  FlatListInstance,
  ImageComponent,
  ImageInstance,
  InputAccessoryViewComponent,
  InputAccessoryViewProps,
  KeyboardAvoidingViewComponent,
  KeyboardStatic,
  ModalComponent,
  ModalInstance,
  PanResponderStatic,
  PlatformStatic,
  PressableComponent,
  ScrollViewComponent,
  ScrollViewInstance,
  StyleSheetStatic,
  TextComponent,
  TextInputComponent,
  TextInputInstance,
  TextInstance,
  UseWindowDimensions,
  ViewComponent,
  ViewInstance,
} from "./types";

function WebInputAccessoryView({ children }: InputAccessoryViewProps) {
  return createElement(Fragment, null, children);
}

export const AccessibilityInfo: AccessibilityInfoStatic = WebAccessibilityInfo;
export const Animated: AnimatedStatic = WebAnimated;
export declare namespace Animated {
  type Value = AnimatedValue;
}
export const Easing: EasingStatic = WebEasing;
export const FlatList: FlatListComponent = WebFlatList;
export type FlatList<ItemT = unknown> = FlatListInstance<ItemT>;
export const Image: ImageComponent = WebImage;
export type Image = ImageInstance;
// `react-native-web` has no root export for `InputAccessoryView` (its internal
// module is an unimplemented placeholder). The only caller renders it on iOS
// alone, so on web it is a fragment that passes its children through.
export const InputAccessoryView: InputAccessoryViewComponent =
  WebInputAccessoryView;
export const Keyboard: KeyboardStatic = WebKeyboard;
export const KeyboardAvoidingView: KeyboardAvoidingViewComponent =
  WebKeyboardAvoidingView;
export const Modal: ModalComponent = WebModal;
export type Modal = ModalInstance;
export const PanResponder: PanResponderStatic = WebPanResponder;
export const Platform: PlatformStatic = WebPlatform;
export const Pressable: PressableComponent = WebPressable;
export const ScrollView: ScrollViewComponent = WebScrollView;
export type ScrollView = ScrollViewInstance;
export const StyleSheet: StyleSheetStatic = WebStyleSheet;
export const Text: TextComponent = WebText;
export type Text = TextInstance;
export const TextInput: TextInputComponent = WebTextInput;
export type TextInput = TextInputInstance;
export const View: ViewComponent = WebView;
export type View = ViewInstance;
export const useWindowDimensions: UseWindowDimensions = webUseWindowDimensions;

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
} from "./types";
