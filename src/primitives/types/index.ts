/**
 * The library's own copy of React Native's public type surface.
 *
 * `reactNative.web.ts` types every value it re-exports from `./dom` with these
 * declarations instead of borrowing them from `react-native`, which is what
 * keeps `dist/node/**` — the declarations every consumer resolves — free of any
 * `react-native` reference. The files are
 * vendored from React Native's own `.d.ts` files (MIT, Meta) and trimmed to
 * what the seam exports plus what those types transitively need; each file
 * carries the attribution.
 *
 * Two deliberate departures from React Native's shape, both web-only and both
 * already honoured by the current backend: the CSS keys in
 * `style.ts`'s `WebOnlyStyle`, and the extra `position` / `cursor` values in
 * `layout.ts`.
 */
export type * from "./accessibility";
export type * from "./animated";
export type * from "./animatedValue";
export type * from "./components";
export type * from "./events";
export type * from "./gestures";
export type * from "./hostElement";
export type * from "./hostInstance";
export type * from "./layout";
export type * from "./lists";
export type * from "./overlays";
export type * from "./platform";
export type * from "./style";
export type * from "./textInput";
export type * from "./textInputOptions";
