/**
 * The two keyboard-shaped primitives, which are inert on web.
 *
 * A browser resizes the viewport itself when a software keyboard opens, so
 * `KeyboardAvoidingView` is a plain `View` with its native-only props dropped,
 * and `InputAccessoryView` — the iOS bar above the keyboard — passes its
 * children through. Both are only reached from files that are native-only or
 * already have a `.web` sibling, so nothing on web renders them today.
 */
import { Fragment, createElement, forwardRef } from "react";

import type {
  InputAccessoryViewComponent,
  InputAccessoryViewProps,
  KeyboardAvoidingViewComponent,
  KeyboardAvoidingViewProps,
  ViewInstance,
  ViewProps,
} from "../types";

import { View } from "./View";

export const KeyboardAvoidingView: KeyboardAvoidingViewComponent = forwardRef<
  ViewInstance,
  KeyboardAvoidingViewProps
>(function KeyboardAvoidingView(props, forwardedRef) {
  const {
    behavior,
    contentContainerStyle,
    enabled,
    keyboardVerticalOffset,
    ...rest
  } = props;
  return <View {...(rest as ViewProps)} ref={forwardedRef} />;
});
KeyboardAvoidingView.displayName = "KeyboardAvoidingView";

export const InputAccessoryView: InputAccessoryViewComponent =
  function InputAccessoryView({ children }: InputAccessoryViewProps) {
    return createElement(Fragment, null, children);
  };
