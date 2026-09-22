/**
 * `View`, `Text` and `Pressable`: their props, instances and component types.
 *
 * Vendored from React Native's public declarations
 * (`Libraries/Components/View/ViewPropTypes.d.ts`, `Libraries/Text/Text.d.ts`
 * and `Libraries/Components/Pressable/Pressable.d.ts`), trimmed to the props
 * this library and its consumers pass, so the web build's declarations never
 * reference the `react-native` package.
 *
 * Each primitive is modelled as a `ForwardRefExoticComponent` over its props
 * plus a `RefAttributes` of its instance type, which is what keeps
 * `useRef<View>()` and `ref.current?.measureInWindow(...)` working.
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates. Licensed under the MIT
 * license found in the LICENSE file of the React Native source tree
 * (https://github.com/facebook/react-native).
 */
import type {
  ForwardRefExoticComponent,
  ReactNode,
  RefAttributes,
} from "react";

import type { AccessibilityProps } from "./accessibility";
import type {
  BlurEvent,
  FocusEvent,
  GestureResponderEvent,
  GestureResponderHandlers,
  LayoutChangeEvent,
  MouseEvent,
  PointerEvents,
  TextLayoutEvent,
  Touchable,
} from "./events";
import type { HostInstance } from "./hostInstance";
import type { ColorValue } from "./layout";
import type { StyleProp, TextStyle, ViewStyle } from "./style";

/** iOS-only `View` props. Accepted everywhere, honoured on iOS. */
export interface ViewPropsIOS {
  /** Renders the view to a bitmap before compositing. */
  shouldRasterizeIOS?: boolean | undefined;
  /** tvOS: whether the view is focusable with the remote. */
  isTVSelectable?: boolean | undefined;
  /** tvOS: whether the focus engine should move focus here. */
  hasTVPreferredFocus?: boolean | undefined;
  tvParallaxShiftDistanceX?: number | undefined;
  tvParallaxShiftDistanceY?: number | undefined;
  tvParallaxTiltAngle?: number | undefined;
  tvParallaxMagnification?: number | undefined;
}

/** Android-only `View` props. Accepted everywhere, honoured on Android. */
export interface ViewPropsAndroid {
  /** Renders the subtree into a single GPU texture. */
  renderToHardwareTextureAndroid?: boolean | undefined;
}

/** Per-edge padding, used by `hitSlop` and pointer retention offsets. */
export interface Insets {
  top?: number | undefined;
  left?: number | undefined;
  bottom?: number | undefined;
  right?: number | undefined;
}

/**
 * Props of a `View`.
 *
 * @see https://reactnative.dev/docs/view#props
 */
export interface ViewProps
  extends
    AccessibilityProps,
    GestureResponderHandlers,
    PointerEvents,
    Touchable,
    ViewPropsIOS,
    ViewPropsAndroid {
  children?: ReactNode | undefined;
  /** Web `data-*` attributes, using camelCase keys. Ignored on native. */
  dataSet?:
    | Record<string, string | number | boolean | null | undefined>
    | undefined;
  /** Distance a touch may start outside the view and still hit it. */
  hitSlop?: null | Insets | number | undefined;
  /** DOM `id` on web; a native view tag otherwise. */
  id?: string | undefined;
  /** Legacy spelling of {@link ViewProps.id}. */
  nativeID?: string | undefined;
  /** Whether the view can take keyboard focus. */
  focusable?: boolean | undefined;
  /** Keyboard tab order: `0` to include the view, `-1` to skip it. */
  tabIndex?: 0 | -1 | undefined;
  /** Fired when the view loses focus. */
  onBlur?: ((event: BlurEvent) => void) | null | undefined;
  /** Fired when the view takes focus. */
  onFocus?: ((event: FocusEvent) => void) | null | undefined;
  /** Fired on mount and whenever the view's box changes. */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
  /** Whether the view and its children can be touch targets. */
  pointerEvents?: "box-none" | "none" | "box-only" | "auto" | undefined;
  /** Drops offscreen children from the view hierarchy; ignored on web. */
  removeClippedSubviews?: boolean | undefined;
  style?: StyleProp<ViewStyle> | undefined;
  /** Test hook; becomes `data-testid` on web. */
  testID?: string | undefined;
  /** Allows the renderer to flatten the view away; ignored on web. */
  collapsable?: boolean | undefined;
  /** Keeps direct children in the view hierarchy; ignored on web. */
  collapsableChildren?: boolean | undefined;
  /** Composites the subtree offscreen to keep alpha exact; ignored on web. */
  needsOffscreenAlphaCompositing?: boolean | undefined;
}

/** A mounted `View`. */
export interface ViewInstance extends HostInstance {}

/** The `View` component. */
export type ViewComponent = ForwardRefExoticComponent<
  ViewProps & RefAttributes<ViewInstance>
>;

/**
 * Props of a `Text`.
 *
 * @see https://reactnative.dev/docs/text#props
 */
export interface TextProps
  extends AccessibilityProps, TextPropsIOS, TextPropsAndroid {
  /** Whether the font respects the OS text-size setting. */
  allowFontScaling?: boolean | undefined;
  children?: ReactNode | undefined;
  /** How text is truncated once `numberOfLines` is reached. */
  ellipsizeMode?: "head" | "middle" | "tail" | "clip" | undefined;
  /** DOM `id` on web. */
  id?: string | undefined;
  /** Legacy spelling of {@link TextProps.id}. */
  nativeID?: string | undefined;
  /** How the text is broken across lines. Works with `numberOfLines`. */
  lineBreakMode?: "head" | "middle" | "tail" | "clip" | undefined;
  /** Highest font scale applied when `allowFontScaling` is on. */
  maxFontSizeMultiplier?: number | null | undefined;
  /** Smallest scale `adjustsFontSizeToFit` may shrink to. */
  minimumFontScale?: number | undefined;
  /** Clamps the rendered text to this many lines. */
  numberOfLines?: number | undefined;
  /** Fired on mount and whenever the text's box changes. */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;
  /** Fired once the text has been laid out, with per-line metrics. */
  onTextLayout?: ((event: TextLayoutEvent) => void) | undefined;
  /** How far a touch may drift before the press is cancelled. */
  pressRetentionOffset?:
    | { top: number; left: number; bottom: number; right: number }
    | undefined;
  /** Fired when the text is pressed. */
  onPress?: ((event: GestureResponderEvent) => void) | undefined;
  onPressIn?: ((event: GestureResponderEvent) => void) | undefined;
  onPressOut?: ((event: GestureResponderEvent) => void) | undefined;
  /** Fired when the text is long-pressed. */
  onLongPress?: ((event: GestureResponderEvent) => void) | undefined;
  /** Whether the text and its children can be touch targets. */
  pointerEvents?: ViewStyle["pointerEvents"] | undefined;
  /** Whether the user can select the text. */
  selectable?: boolean | undefined;
  /** Highlight colour of a selection. */
  selectionColor?: ColorValue | undefined;
  style?: StyleProp<TextStyle> | undefined;
  /** Test hook; becomes `data-testid` on web. */
  testID?: string | undefined;
}

/** iOS-only `Text` props. Accepted everywhere, honoured on iOS. */
export interface TextPropsIOS {
  /** Shrinks the font until the text fits its box. */
  adjustsFontSizeToFit?: boolean | undefined;
  /** The Dynamic Type ramp to apply. */
  dynamicTypeRamp?:
    | "caption2"
    | "caption1"
    | "footnote"
    | "subheadline"
    | "callout"
    | "body"
    | "headline"
    | "title3"
    | "title2"
    | "title1"
    | "largeTitle"
    | undefined;
  /** Removes the grey highlight shown while pressed text is held. */
  suppressHighlighting?: boolean | undefined;
  /** Line-break strategy. */
  lineBreakStrategyIOS?:
    | "none"
    | "standard"
    | "hangul-word"
    | "push-out"
    | undefined;
}

/** Android-only `Text` props. Accepted everywhere, honoured on Android. */
export interface TextPropsAndroid {
  /** Marks the text view disabled, for testing. */
  disabled?: boolean | undefined;
  /** Text-break strategy. */
  textBreakStrategy?: "simple" | "highQuality" | "balanced" | undefined;
  /** Which data types become tappable links. */
  dataDetectorType?:
    | null
    | "phoneNumber"
    | "link"
    | "email"
    | "none"
    | "all"
    | undefined;
  /** Hyphenation strategy. */
  android_hyphenationFrequency?: "normal" | "none" | "full" | undefined;
}

/** A mounted `Text`. */
export interface TextInstance extends HostInstance {}

/** The `Text` component. */
export type TextComponent = ForwardRefExoticComponent<
  TextProps & RefAttributes<TextInstance>
>;

/**
 * The interaction state a `Pressable` hands to its `style` and `children`
 * callbacks. `hovered` and `focused` are web additions React Native itself
 * does not report.
 */
export interface PressableStateCallbackType {
  readonly pressed: boolean;
  readonly hovered?: boolean;
  readonly focused?: boolean;
}

/**
 * Props of a `Pressable`.
 *
 * @see https://reactnative.dev/docs/pressable
 */
export interface PressableProps extends Omit<
  ViewProps,
  "children" | "style" | "hitSlop"
> {
  children?:
    | ReactNode
    | ((state: PressableStateCallbackType) => ReactNode)
    | undefined;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>)
    | undefined;
  /** Whether a parent gesture (a scroll) may interrupt the press. */
  cancelable?: null | boolean | undefined;
  /** Milliseconds from `onPressIn` before `onLongPress` fires. */
  delayLongPress?: null | number | undefined;
  /** Turns the press behaviour off. */
  disabled?: null | boolean | undefined;
  /** Distance a touch may start outside the view and still hit it. */
  hitSlop?: null | Insets | number | undefined;
  /** Distance the pointer may drift before the press is cancelled. */
  pressRetentionOffset?: null | Insets | number | undefined;
  /** Fired when the pointer enters. */
  onHoverIn?: null | ((event: MouseEvent) => void) | undefined;
  /** Fired when the pointer leaves. */
  onHoverOut?: null | ((event: MouseEvent) => void) | undefined;
  /** Fired on a completed press. */
  onPress?: null | ((event: GestureResponderEvent) => void) | undefined;
  /** Fired as soon as the press begins. */
  onPressIn?: null | ((event: GestureResponderEvent) => void) | undefined;
  /** Fired while the press moves. */
  onPressMove?: null | ((event: GestureResponderEvent) => void) | undefined;
  /** Fired when the press is released or cancelled. */
  onPressOut?: null | ((event: GestureResponderEvent) => void) | undefined;
  /** Fired once `delayLongPress` elapses. */
  onLongPress?: null | ((event: GestureResponderEvent) => void) | undefined;
  /** Milliseconds to wait after press down before `onPressIn` fires. */
  unstable_pressDelay?: number | undefined;
}

/** The `Pressable` component. */
export type PressableComponent = ForwardRefExoticComponent<
  PressableProps & RefAttributes<ViewInstance>
>;
