/**
 * `react-native-web` ships no type declarations. Its public surface tracks
 * `react-native`'s, so type it as such for the library's own type-check. This
 * file is not emitted, and the web primitives module annotates every export
 * with the `react-native` type explicitly, so consumers' declarations never
 * reference `react-native-web` types.
 */
declare module "react-native-web" {
  export * from "react-native";
}
