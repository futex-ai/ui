/**
 * A link, as a DOM anchor.
 *
 * It is a `View` with an `href`, so the anchor keeps the element reset, the
 * layout and `ref` methods, the `dataSet` focus markers, and the base-shadow
 * rewrite that `View` gives every host. It carries no `role`: an `a` with an
 * `href` is a link already, and the browser keeps every link behaviour, such
 * as a new tab from a modified click, the address preview, and the context
 * menu.
 *
 * The interaction state reaches a function-valued `style` and `children`, as
 * it does for `Pressable`. The press machine only tracks the pressed look. It
 * gets no `onPress`, because the click handler below decides the navigation,
 * and a link must not stop the propagation of its click the way a press does.
 */
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import { navigatesInApp } from "../linkActivation";
import type { LinkHostProps } from "../linkTypes";
import type {
  FocusEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewInstance,
  ViewProps,
  ViewStyle,
} from "../types";

import { useHostRef } from "./hostRef";
import { useHover } from "./useHover";
import { usePress } from "./usePress";
import { View } from "./View";

/** The props of the DOM link host. */
export type DomLinkProps = LinkHostProps<
  StyleProp<ViewStyle>,
  FocusEvent,
  LayoutChangeEvent
>;

/** A new-tab anchor gives the opened page no access to this one. */
const NEW_TAB_ATTRS = { rel: "noopener noreferrer", target: "_blank" } as const;

function targetOf(event: unknown): unknown {
  return (event as { nativeEvent?: { target?: unknown } }).nativeEvent?.target;
}

export const Link = forwardRef<ViewInstance, DomLinkProps>(
  function Link(props, forwardedRef) {
    const {
      accessibilityLabel,
      children,
      current = false,
      dataSet,
      href,
      newTab = false,
      onBlur,
      onFocus,
      onLayout,
      onNavigate,
      style,
      testID,
    } = props;
    const [focused, setFocused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [pressed, setPressed] = useState(false);
    const hostRef = useRef<HTMLElement | null>(null);
    const setRef = useHostRef(hostRef, forwardedRef);
    const pressHandlers = usePress(
      useMemo(() => ({ onPressChange: setPressed }), []),
    );
    useHover(hostRef, { onHoverChange: setHovered });

    // Focus and blur only count when they are the anchor's own, not a child's.
    const handleBlur = useCallback(
      (event: FocusEvent) => {
        if (targetOf(event) === hostRef.current) {
          setFocused(false);
          onBlur?.(event);
        }
      },
      [onBlur],
    );
    const handleFocus = useCallback(
      (event: FocusEvent) => {
        if (targetOf(event) === hostRef.current) {
          setFocused(true);
          onFocus?.(event);
        }
      },
      [onFocus],
    );
    // The app navigates only on a plain primary click or Enter. Every other
    // click keeps the browser default, and nothing stops its propagation.
    const handleClick = useCallback(
      (event: MouseEvent<HTMLElement>) => {
        if (
          navigatesInApp(
            { hasAction: onNavigate != null, newTab },
            event.nativeEvent,
          )
        ) {
          event.preventDefault();
          onNavigate?.();
        }
      },
      [newTab, onNavigate],
    );

    const state = { focused, hovered, pressed };
    const viewProps = {
      accessibilityLabel,
      "aria-current": current ? "page" : undefined,
      children: typeof children === "function" ? children(state) : children,
      dataSet,
      href,
      hrefAttrs: newTab ? NEW_TAB_ATTRS : undefined,
      onBlur: handleBlur,
      onClick: handleClick,
      onFocus: handleFocus,
      onKeyDown: pressHandlers.onKeyDown,
      onLayout,
      onPointerDown: pressHandlers.onPointerDown,
      ref: setRef,
      style: typeof style === "function" ? style(state) : style,
      testID,
    } as unknown as ViewProps;

    return <View {...viewProps} />;
  },
);
Link.displayName = "Link";
