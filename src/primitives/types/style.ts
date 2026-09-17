/**
 * `ViewStyle`, `TextStyle`, `ImageStyle` and the `StyleProp` wrapper.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/StyleSheet/StyleSheet.d.ts` and `StyleSheetTypes.d.ts`), trimmed
 * to the props this library and its consumers use, so the web build's emitted
 * declarations never reference the `react-native` package.
 *
 * Two deliberate additions to React Native's shape, both web-only and both
 * already passed through by the current backend: the CSS keys under
 * {@link WebOnlyStyle}, and the extra `position` / `cursor` values in
 * `layout.ts`. They are typed here so the library stops casting them in with
 * `as unknown as ViewStyle`.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type {
  AnimatableNumericValue,
  ColorValue,
  CursorValue,
  FilterFunction,
  FlexStyle,
  ShadowStyleIOS,
  TransformsStyle,
  BoxShadowValue,
} from "./layout";

/** Values that mean "no style" wherever a style is accepted. */
export type Falsy = undefined | null | false | "";

/** An arbitrarily nested array of styles. */
export interface RecursiveArray<T> extends Array<
  T | ReadonlyArray<T> | RecursiveArray<T>
> {}

/** A style prop: one style, a (nested) array of them, or nothing. */
export type StyleProp<T> = T | RecursiveArray<T | Falsy> | Falsy;

/**
 * CSS properties the DOM backend forwards verbatim. React Native has no
 * equivalent, so they are only meaningful on web; a native build ignores them.
 */
export interface WebOnlyStyle {
  /** CSS `background-image`, e.g. the workflow canvas' dot grid. */
  backgroundImage?: string | undefined;
  /** CSS `background-size`, paired with {@link WebOnlyStyle.backgroundImage}. */
  backgroundSize?: string | undefined;
  /** CSS `transition` shorthand. */
  transition?: string | undefined;
  /** CSS `transition-delay`. */
  transitionDelay?: string | undefined;
  /** CSS `transition-duration`. */
  transitionDuration?: string | undefined;
  /** CSS `transition-property`. */
  transitionProperty?: string | undefined;
  /** CSS `transition-timing-function`. */
  transitionTimingFunction?: string | undefined;
}

/**
 * Style props of a `View`.
 *
 * @see https://reactnative.dev/docs/view-style-props
 */
export interface ViewStyle
  extends FlexStyle, ShadowStyleIOS, TransformsStyle, WebOnlyStyle {
  backfaceVisibility?: "visible" | "hidden" | undefined;
  backgroundColor?: ColorValue | undefined;
  borderBlockColor?: ColorValue | undefined;
  borderBlockEndColor?: ColorValue | undefined;
  borderBlockStartColor?: ColorValue | undefined;
  borderBottomColor?: ColorValue | undefined;
  borderBottomEndRadius?: AnimatableNumericValue | string | undefined;
  borderBottomLeftRadius?: AnimatableNumericValue | string | undefined;
  borderBottomRightRadius?: AnimatableNumericValue | string | undefined;
  borderBottomStartRadius?: AnimatableNumericValue | string | undefined;
  borderColor?: ColorValue | undefined;
  /** iOS 13+ corner curve; ignored elsewhere. */
  borderCurve?: "circular" | "continuous" | undefined;
  borderEndColor?: ColorValue | undefined;
  borderEndEndRadius?: AnimatableNumericValue | string | undefined;
  borderEndStartRadius?: AnimatableNumericValue | string | undefined;
  borderLeftColor?: ColorValue | undefined;
  borderRadius?: AnimatableNumericValue | string | undefined;
  borderRightColor?: ColorValue | undefined;
  borderStartColor?: ColorValue | undefined;
  borderStartEndRadius?: AnimatableNumericValue | string | undefined;
  borderStartStartRadius?: AnimatableNumericValue | string | undefined;
  borderStyle?: "solid" | "dotted" | "dashed" | undefined;
  borderTopColor?: ColorValue | undefined;
  borderTopEndRadius?: AnimatableNumericValue | string | undefined;
  borderTopLeftRadius?: AnimatableNumericValue | string | undefined;
  borderTopRightRadius?: AnimatableNumericValue | string | undefined;
  borderTopStartRadius?: AnimatableNumericValue | string | undefined;
  boxShadow?: ReadonlyArray<BoxShadowValue> | string | undefined;
  cursor?: CursorValue | undefined;
  /** Android z-order and drop shadow; dropped on web. */
  elevation?: number | undefined;
  filter?: ReadonlyArray<FilterFunction> | string | undefined;
  opacity?: AnimatableNumericValue | undefined;
  outlineColor?: ColorValue | undefined;
  outlineOffset?: AnimatableNumericValue | undefined;
  /** `none` is the web-only value used to suppress the UA focus ring. */
  outlineStyle?: "solid" | "dotted" | "dashed" | "none" | undefined;
  outlineWidth?: AnimatableNumericValue | undefined;
  /** Whether the view can be the target of pointer events. */
  pointerEvents?: "box-none" | "none" | "box-only" | "auto" | undefined;
  /** Whether the user can select the view's text. */
  userSelect?: "auto" | "none" | "text" | "contain" | "all" | undefined;
}

/**
 * OpenType feature settings a `TextStyle` can request. React Native's full
 * list, so a React Native style still assigns into this one.
 */
export type FontVariant =
  | "small-caps"
  | "oldstyle-nums"
  | "lining-nums"
  | "tabular-nums"
  | "common-ligatures"
  | "no-common-ligatures"
  | "discretionary-ligatures"
  | "no-discretionary-ligatures"
  | "historical-ligatures"
  | "no-historical-ligatures"
  | "contextual"
  | "no-contextual"
  | "proportional-nums"
  | "stylistic-one"
  | "stylistic-two"
  | "stylistic-three"
  | "stylistic-four"
  | "stylistic-five"
  | "stylistic-six"
  | "stylistic-seven"
  | "stylistic-eight"
  | "stylistic-nine"
  | "stylistic-ten"
  | "stylistic-eleven"
  | "stylistic-twelve"
  | "stylistic-thirteen"
  | "stylistic-fourteen"
  | "stylistic-fifteen"
  | "stylistic-sixteen"
  | "stylistic-seventeen"
  | "stylistic-eighteen"
  | "stylistic-nineteen"
  | "stylistic-twenty";

/** Numeric and keyword font weights. */
export type FontWeight =
  | "normal"
  | "bold"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900
  | "ultralight"
  | "thin"
  | "light"
  | "medium"
  | "regular"
  | "semibold"
  | "condensedBold"
  | "condensed"
  | "heavy"
  | "black";

/**
 * Style props of a `Text`, a superset of {@link ViewStyle}.
 *
 * @see https://reactnative.dev/docs/text-style-props
 */
export interface TextStyle extends ViewStyle {
  color?: ColorValue | undefined;
  fontFamily?: string | undefined;
  fontSize?: number | undefined;
  fontStyle?: "normal" | "italic" | undefined;
  fontVariant?: FontVariant[] | undefined;
  fontWeight?: FontWeight | undefined;
  /** Android only; ignored on web. */
  includeFontPadding?: boolean | undefined;
  letterSpacing?: number | undefined;
  lineHeight?: number | undefined;
  textAlign?: "auto" | "left" | "right" | "center" | "justify" | undefined;
  /** Android only; ignored on web. */
  textAlignVertical?: "auto" | "top" | "bottom" | "center" | undefined;
  textDecorationColor?: ColorValue | undefined;
  textDecorationLine?:
    | "none"
    | "underline"
    | "line-through"
    | "underline line-through"
    | undefined;
  textDecorationStyle?: "solid" | "double" | "dotted" | "dashed" | undefined;
  textShadowColor?: ColorValue | undefined;
  textShadowOffset?: { width: number; height: number } | undefined;
  textShadowRadius?: number | undefined;
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | undefined;
  verticalAlign?: "auto" | "top" | "bottom" | "middle" | undefined;
  writingDirection?: "auto" | "ltr" | "rtl" | undefined;
}

/** How an image fills its frame. */
export type ImageResizeMode =
  | "cover"
  | "contain"
  | "stretch"
  | "repeat"
  | "center"
  | "none";

/**
 * Style props of an `Image`.
 *
 * @see https://reactnative.dev/docs/image-style-props
 */
export interface ImageStyle
  extends FlexStyle, ShadowStyleIOS, TransformsStyle, WebOnlyStyle {
  backfaceVisibility?: "visible" | "hidden" | undefined;
  backgroundColor?: ColorValue | undefined;
  borderBottomLeftRadius?: AnimatableNumericValue | string | undefined;
  borderBottomRightRadius?: AnimatableNumericValue | string | undefined;
  borderColor?: ColorValue | undefined;
  borderRadius?: AnimatableNumericValue | string | undefined;
  borderTopLeftRadius?: AnimatableNumericValue | string | undefined;
  borderTopRightRadius?: AnimatableNumericValue | string | undefined;
  cursor?: CursorValue | undefined;
  objectFit?: "cover" | "contain" | "fill" | "scale-down" | "none" | undefined;
  opacity?: AnimatableNumericValue | undefined;
  overflow?: "visible" | "hidden" | undefined;
  overlayColor?: ColorValue | undefined;
  resizeMode?: ImageResizeMode | undefined;
  tintColor?: ColorValue | undefined;
}
