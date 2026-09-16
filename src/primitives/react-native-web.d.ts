/**
 * `react-native-web` ships no type declarations.
 *
 * Its public surface tracks `react-native`'s, which is what the library's own
 * vendored types in `./types` describe, so the values the web seam imports are
 * declared with those. That keeps the type-check honest without pulling
 * `react-native` in: this file is never emitted, and `reactNative.web.ts`
 * re-annotates every export from `./types` anyway, so a consumer's
 * declarations reference neither package.
 *
 * Only the names `reactNative.web.ts` imports are declared. Add one here in the
 * same change that adds it to the seam.
 */
declare module "react-native-web" {
  export const AccessibilityInfo: import("./types").AccessibilityInfoStatic;
  export const Animated: import("./types").AnimatedStatic;
  export const Easing: import("./types").EasingStatic;
  export const FlatList: import("./types").FlatListComponent;
  export const Image: import("./types").ImageComponent;
  export const Keyboard: import("./types").KeyboardStatic;
  export const KeyboardAvoidingView: import("./types").KeyboardAvoidingViewComponent;
  export const Modal: import("./types").ModalComponent;
  export const PanResponder: import("./types").PanResponderStatic;
  export const Platform: import("./types").PlatformStatic;
  export const Pressable: import("./types").PressableComponent;
  export const ScrollView: import("./types").ScrollViewComponent;
  export const StyleSheet: import("./types").StyleSheetStatic;
  export const Text: import("./types").TextComponent;
  export const TextInput: import("./types").TextInputComponent;
  export const View: import("./types").ViewComponent;
  export const useWindowDimensions: import("./types").UseWindowDimensions;
}
