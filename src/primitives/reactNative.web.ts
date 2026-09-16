/**
 * React Native primitives, web resolution.
 *
 * `View`, `Text`, `Pressable`, `Image`, `Modal`, `StyleSheet`, `Platform`,
 * `useWindowDimensions`, `AccessibilityInfo`, `Keyboard`,
 * `KeyboardAvoidingView` and `InputAccessoryView` come from the library's own
 * DOM backend in `./dom`, which renders plain React elements and needs no
 * `react-native-web` at all. `ScrollView`, `TextInput`, `FlatList`, `Animated`,
 * `Easing` and `PanResponder` still delegate to `react-native-web` until M3 of
 * `plans/pure-react-dom-backend.md` ports them.
 *
 * The type surface is the library's own (`./types`), vendored from React
 * Native's declarations, so the emitted `dist/node` declarations — the ones
 * every consumer resolves — never mention `react-native` either.
 *
 * Each class-valued export also gets a same-named type alias so `useRef<View>`
 * style usage keeps working, and `Animated` merges a namespace carrying the
 * `Animated.Value` type. The export list mirrors `reactNative.ts` exactly; a
 * unit test diffs the two.
 */
import {
  Animated as WebAnimated,
  Easing as WebEasing,
  FlatList as WebFlatList,
  PanResponder as WebPanResponder,
  ScrollView as WebScrollView,
  TextInput as WebTextInput,
} from "react-native-web";

import {
  AccessibilityInfo as DomAccessibilityInfo,
  Image as DomImage,
  InputAccessoryView as DomInputAccessoryView,
  Keyboard as DomKeyboard,
  KeyboardAvoidingView as DomKeyboardAvoidingView,
  Modal as DomModal,
  Platform as DomPlatform,
  Pressable as DomPressable,
  StyleSheet as DomStyleSheet,
  Text as DomText,
  View as DomView,
  useWindowDimensions as domUseWindowDimensions,
} from "./dom";
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

export const AccessibilityInfo: AccessibilityInfoStatic = DomAccessibilityInfo;
export const Animated: AnimatedStatic = WebAnimated;
export declare namespace Animated {
  type Value = AnimatedValue;
}
export const Easing: EasingStatic = WebEasing;
export const FlatList: FlatListComponent = WebFlatList;
export type FlatList<ItemT = unknown> = FlatListInstance<ItemT>;
export const Image: ImageComponent = DomImage;
export type Image = ImageInstance;
export const InputAccessoryView: InputAccessoryViewComponent =
  DomInputAccessoryView;
export const Keyboard: KeyboardStatic = DomKeyboard;
export const KeyboardAvoidingView: KeyboardAvoidingViewComponent =
  DomKeyboardAvoidingView;
export const Modal: ModalComponent = DomModal;
export type Modal = ModalInstance;
export const PanResponder: PanResponderStatic = WebPanResponder;
export const Platform: PlatformStatic = DomPlatform;
export const Pressable: PressableComponent = DomPressable;
export const ScrollView: ScrollViewComponent = WebScrollView;
export type ScrollView = ScrollViewInstance;
export const StyleSheet: StyleSheetStatic = DomStyleSheet;
export const Text: TextComponent = DomText;
export type Text = TextInstance;
export const TextInput: TextInputComponent = WebTextInput;
export type TextInput = TextInputInstance;
export const View: ViewComponent = DomView;
export type View = ViewInstance;
export const useWindowDimensions: UseWindowDimensions = domUseWindowDimensions;

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
