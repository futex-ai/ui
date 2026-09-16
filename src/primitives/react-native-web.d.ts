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
 * Only the names the seam still imports are declared. M2 of
 * `plans/pure-react-dom-backend.md` moved the rest to `./dom`; M3 takes these
 * six and deletes this file.
 */
declare module "react-native-web" {
  export const Animated: import("./types").AnimatedStatic;
  export const Easing: import("./types").EasingStatic;
  export const FlatList: import("./types").FlatListComponent;
  export const PanResponder: import("./types").PanResponderStatic;
  export const ScrollView: import("./types").ScrollViewComponent;
  export const TextInput: import("./types").TextInputComponent;
}

/**
 * The gesture responder system, which `dom/View.tsx` borrows until M3.
 *
 * `PanResponder`'s handlers are spread onto a `View`, and the gesture state it
 * reports is computed from the `touchHistory` this module maintains, so the two
 * have to stay together; `dom/responderEvents.ts` is the only importer.
 */
declare module "react-native-web/dist/modules/useResponderEvents/index.js" {
  const useResponderEvents: (
    hostRef: { current: HTMLElement | null },
    config: Record<string, unknown>,
  ) => void;
  export default useResponderEvents;
}
