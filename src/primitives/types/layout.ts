/**
 * Colour, dimension, layout and transform style types.
 *
 * The layer `ViewStyle` / `TextStyle` / `ImageStyle` (see `style.ts`) build on.
 * Vendored from React Native's public declarations
 * (`Libraries/StyleSheet/StyleSheet.d.ts` and `StyleSheetTypes.d.ts`) so the
 * web build's declarations never reference the `react-native` package, with
 * the web-only values this library relies on folded in (see `CursorValue` and
 * the intrinsic sizes in `DimensionValue`).
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type { AnimatedNode } from "./animatedValue";

/** Platform colour handle; opaque so it can only come from a colour API. */
export type OpaqueColorValue = symbol & { __TYPE__: "Color" };

/** Any colour a style accepts: a CSS string or a platform colour handle. */
export type ColorValue = string | OpaqueColorValue;

/**
 * A length: a number of points, a percentage, an intrinsic size keyword, or an
 * animated node. The intrinsic sizes (`max-content` and friends) are web-only
 * additions to React Native's list.
 */
export type DimensionValue =
  | number
  | "auto"
  | `${number}%`
  | "max-content"
  | "min-content"
  | "fit-content"
  | AnimatedNode
  | null;

/** A number that an animation can drive. */
export type AnimatableNumericValue = number | AnimatedNode;

/** A string that an animation can drive. */
export type AnimatableStringValue = string | AnimatedNode;

/**
 * Pointer shape. React Native only models `auto` and `pointer`; the rest are
 * the CSS cursors this library uses on web (resize handles, drag affordances).
 */
export type CursorValue =
  | "auto"
  | "default"
  | "pointer"
  | "text"
  | "move"
  | "grab"
  | "grabbing"
  | "col-resize"
  | "row-resize"
  | "ew-resize"
  | "ns-resize"
  | "not-allowed"
  | "crosshair"
  | "wait"
  | "help"
  | "none";

/** Cross-axis alignment keywords. */
export type FlexAlignType =
  | "flex-start"
  | "flex-end"
  | "center"
  | "stretch"
  | "baseline";

/**
 * Flexbox and box-model props.
 *
 * @see https://reactnative.dev/docs/layout-props
 */
export interface FlexStyle {
  alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "stretch"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | undefined;
  alignItems?: FlexAlignType | undefined;
  alignSelf?: "auto" | FlexAlignType | undefined;
  aspectRatio?: number | string | undefined;
  borderBottomWidth?: number | undefined;
  borderEndWidth?: number | undefined;
  borderLeftWidth?: number | undefined;
  borderRightWidth?: number | undefined;
  borderStartWidth?: number | undefined;
  borderTopWidth?: number | undefined;
  borderWidth?: number | undefined;
  bottom?: DimensionValue | undefined;
  boxSizing?: "border-box" | "content-box" | undefined;
  columnGap?: number | string | undefined;
  direction?: "inherit" | "ltr" | "rtl" | undefined;
  display?: "none" | "flex" | "contents" | undefined;
  end?: DimensionValue | undefined;
  flex?: number | undefined;
  flexBasis?: DimensionValue | undefined;
  flexDirection?:
    | "row"
    | "column"
    | "row-reverse"
    | "column-reverse"
    | undefined;
  flexGrow?: number | undefined;
  flexShrink?: number | undefined;
  flexWrap?: "wrap" | "nowrap" | "wrap-reverse" | undefined;
  gap?: number | string | undefined;
  height?: DimensionValue | undefined;
  /** Equivalent to `top`, `bottom`, `right` and `left`. */
  inset?: DimensionValue | undefined;
  /** Equivalent to `top` and `bottom`. */
  insetBlock?: DimensionValue | undefined;
  insetBlockEnd?: DimensionValue | undefined;
  insetBlockStart?: DimensionValue | undefined;
  /** Equivalent to `right` and `left`. */
  insetInline?: DimensionValue | undefined;
  insetInlineEnd?: DimensionValue | undefined;
  insetInlineStart?: DimensionValue | undefined;
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
    | undefined;
  left?: DimensionValue | undefined;
  margin?: DimensionValue | undefined;
  /** Equivalent to `marginVertical`. */
  marginBlock?: DimensionValue | undefined;
  marginBlockEnd?: DimensionValue | undefined;
  marginBlockStart?: DimensionValue | undefined;
  marginBottom?: DimensionValue | undefined;
  marginEnd?: DimensionValue | undefined;
  marginHorizontal?: DimensionValue | undefined;
  /** Equivalent to `marginHorizontal`. */
  marginInline?: DimensionValue | undefined;
  marginInlineEnd?: DimensionValue | undefined;
  marginInlineStart?: DimensionValue | undefined;
  marginLeft?: DimensionValue | undefined;
  marginRight?: DimensionValue | undefined;
  marginStart?: DimensionValue | undefined;
  marginTop?: DimensionValue | undefined;
  marginVertical?: DimensionValue | undefined;
  maxHeight?: DimensionValue | undefined;
  maxWidth?: DimensionValue | undefined;
  minHeight?: DimensionValue | undefined;
  minWidth?: DimensionValue | undefined;
  overflow?: "visible" | "hidden" | "scroll" | undefined;
  padding?: DimensionValue | undefined;
  /** Equivalent to `paddingVertical`. */
  paddingBlock?: DimensionValue | undefined;
  paddingBlockEnd?: DimensionValue | undefined;
  paddingBlockStart?: DimensionValue | undefined;
  paddingBottom?: DimensionValue | undefined;
  paddingEnd?: DimensionValue | undefined;
  paddingHorizontal?: DimensionValue | undefined;
  /** Equivalent to `paddingHorizontal`. */
  paddingInline?: DimensionValue | undefined;
  paddingInlineEnd?: DimensionValue | undefined;
  paddingInlineStart?: DimensionValue | undefined;
  paddingLeft?: DimensionValue | undefined;
  paddingRight?: DimensionValue | undefined;
  paddingStart?: DimensionValue | undefined;
  paddingTop?: DimensionValue | undefined;
  paddingVertical?: DimensionValue | undefined;
  /**
   * Positioning scheme. `fixed` and `sticky` are web-only additions to React
   * Native's list, used by the portalled overlays and the pinned grid gutter.
   */
  position?:
    | "absolute"
    | "relative"
    | "static"
    | "fixed"
    | "sticky"
    | undefined;
  right?: DimensionValue | undefined;
  rowGap?: number | string | undefined;
  start?: DimensionValue | undefined;
  top?: DimensionValue | undefined;
  width?: DimensionValue | undefined;
  zIndex?: number | undefined;
}

/** Drop shadow, iOS-flavoured but honoured on web through `box-shadow`. */
export interface ShadowStyleIOS {
  shadowColor?: ColorValue | undefined;
  shadowOffset?: Readonly<{ width: number; height: number }> | undefined;
  shadowOpacity?: AnimatableNumericValue | undefined;
  shadowRadius?: number | undefined;
}

interface PerspectiveTransform {
  perspective: AnimatableNumericValue;
}
interface RotateTransform {
  rotate: AnimatableStringValue;
}
interface RotateXTransform {
  rotateX: AnimatableStringValue;
}
interface RotateYTransform {
  rotateY: AnimatableStringValue;
}
interface RotateZTransform {
  rotateZ: AnimatableStringValue;
}
interface ScaleTransform {
  scale: AnimatableNumericValue;
}
interface ScaleXTransform {
  scaleX: AnimatableNumericValue;
}
interface ScaleYTransform {
  scaleY: AnimatableNumericValue;
}
interface TranslateXTransform {
  translateX: AnimatableNumericValue | `${number}%`;
}
interface TranslateYTransform {
  translateY: AnimatableNumericValue | `${number}%`;
}
interface SkewXTransform {
  skewX: AnimatableStringValue;
}
interface SkewYTransform {
  skewY: AnimatableStringValue;
}
interface MatrixTransform {
  matrix: AnimatableNumericValue[];
}

type MaximumOneOf<T, K extends keyof T = keyof T> = K extends keyof T
  ? { [P in K]: T[K] } & { [P in Exclude<keyof T, K>]?: never }
  : never;

/** One entry of a `transform` array: exactly one of the transform functions. */
export type TransformFunction = MaximumOneOf<
  PerspectiveTransform &
    RotateTransform &
    RotateXTransform &
    RotateYTransform &
    RotateZTransform &
    ScaleTransform &
    ScaleXTransform &
    ScaleYTransform &
    TranslateXTransform &
    TranslateYTransform &
    SkewXTransform &
    SkewYTransform &
    MatrixTransform
>;

/** Transform props shared by every style kind. */
export interface TransformsStyle {
  transform?: Readonly<TransformFunction[]> | string | undefined;
  transformOrigin?: Array<string | number> | string | undefined;
}

/** One shadow of a `boxShadow` list. */
export type BoxShadowValue = {
  offsetX: number | string;
  offsetY: number | string;
  color?: ColorValue | undefined;
  blurRadius?: string | number | undefined;
  spreadDistance?: number | string | undefined;
  inset?: boolean | undefined;
};

/** Offsets and colour of a `dropShadow` filter. */
export type DropShadowValue = {
  offsetX: number | string;
  offsetY: number | string;
  standardDeviation?: number | string | undefined;
  color?: ColorValue | number | undefined;
};

/** One entry of a `filter` list. */
export type FilterFunction =
  | { brightness: number | string }
  | { blur: number | string }
  | { contrast: number | string }
  | { grayscale: number | string }
  | { hueRotate: number | string }
  | { invert: number | string }
  | { opacity: number | string }
  | { saturate: number | string }
  | { sepia: number | string }
  | { dropShadow: DropShadowValue | string };
