/**
 * The link host, native resolution: a `Pressable` with the link role.
 *
 * An activation runs the app's `onNavigate`, a new-tab link included, because
 * the new tab is a browser behaviour. Without an `onNavigate`, the platform's
 * link handling opens the destination through `Linking.openURL`. The current
 * link carries the selected state.
 *
 * The export list mirrors `link.web.tsx`; a unit test diffs the two.
 */
import { forwardRef, useState } from "react";
import {
  Linking,
  Pressable,
  type FocusEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";

import { devWarn } from "../devWarn";

import { navigatesInApp } from "./linkActivation";
import type { LinkHostProps, LinkInteractionState } from "./linkTypes";

export type { LinkInteractionState } from "./linkTypes";

/** The props of a link: its destination, its state, and its look. */
export type LinkProps = LinkHostProps<
  StyleProp<ViewStyle>,
  FocusEvent,
  LayoutChangeEvent
>;

export const Link = forwardRef<View, LinkProps>(function Link(
  {
    accessibilityHint,
    accessibilityLabel,
    children,
    current = false,
    href,
    newTab = false,
    onBlur,
    onFocus,
    onLayout,
    onNavigate,
    style,
    testID,
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  // Native reports no hover, as the `Pressable` style state does not.
  const stateOf = (pressed: boolean): LinkInteractionState => ({
    focused,
    hovered: false,
    pressed,
  });
  const activate = () => {
    if (navigatesInApp({ hasAction: onNavigate != null, newTab })) {
      onNavigate?.();
      return;
    }
    Linking.openURL(href).catch(() => {
      devWarn(`Link: no app on this device can open "${href}".`);
    });
  };
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="link"
      accessibilityState={current ? { selected: true } : undefined}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onLayout={onLayout}
      onPress={activate}
      ref={ref}
      style={
        typeof style === "function"
          ? ({ pressed }) => style(stateOf(pressed))
          : style
      }
      testID={testID}
    >
      {typeof children === "function"
        ? ({ pressed }) => children(stateOf(pressed))
        : children}
    </Pressable>
  );
});
Link.displayName = "Link";
