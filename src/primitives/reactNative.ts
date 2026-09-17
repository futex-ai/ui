/**
 * React Native primitives, native resolution.
 *
 * Every component imports React Native through this module rather than from
 * `react-native` directly, so the platform backend is decided in exactly one
 * place. Metro resolves this file on iOS and Android; the `.web` sibling
 * resolves on web (Metro web, the `dist/node` build, and Storybook) and
 * delegates to the library's own DOM backend (`./dom`), so a web consumer
 * installs neither `react-native` nor `react-native-web` and aliases nothing.
 *
 * The export list is an explicit allowlist mirrored by `reactNative.web.ts`; a
 * unit test keeps the two in sync. Add a name here only when a component needs
 * it, and add it to the web module in the same change.
 */
export {
  AccessibilityInfo,
  Animated,
  Easing,
  FlatList,
  Image,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
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
