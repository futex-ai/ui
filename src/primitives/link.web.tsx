/**
 * The link host, web resolution: a real anchor on the seam's own `View`.
 *
 * One host serves both web renderers. The library's DOM backend and
 * `react-native-web` both render a `View` with an `href` as an `a`, add the
 * `rel` and `target` of `hrefAttrs`, and forward `aria-current`, `dataSet`,
 * `onClick`, and the pointer, key, and focus handlers. So the anchor keeps the
 * element reset, the layout and `ref` methods, and the focus markers of the
 * `View` of either renderer, and this module imports nothing from `dom/`.
 *
 * The anchor carries its `href` in static and server-rendered HTML. It has no
 * `role`: an `a` with an `href` is a link already, and the browser keeps every
 * link behaviour, such as a new tab from a modified click, the address
 * preview, and the context menu. Only a plain primary click or Enter runs the
 * app's `onNavigate`, which then replaces the page load. `newTab` sets
 * `target="_blank"` with `rel="noopener noreferrer"`.
 *
 * The interaction state reaches a function-valued `style` and `children`, as
 * it does for `Pressable`. The press hooks only track the pressed look. They
 * get no `onPress`, because the click handler below decides the navigation,
 * and a link must not stop the propagation of its click the way a press does.
 * For the same reason the host is not a `Pressable`: the `Pressable` of
 * `react-native-web` stops every click and runs `onPress` on a Ctrl, Meta, or
 * Shift click.
 *
 * The export list mirrors `link.tsx`; a unit test diffs the two.
 */
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type RefAttributes,
} from "react";

import { navigatesInApp } from "./linkActivation";
import type { LinkHostProps, LinkInteractionState } from "./linkTypes";
import { View } from "./reactNative";
import type {
  FocusEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewInstance,
  ViewProps,
  ViewStyle,
} from "./types";
import { useHover } from "./webPress/useHover";
import { usePress, type PressHandlers } from "./webPress/usePress";

export type { LinkInteractionState } from "./linkTypes";

/** The props of a link: its destination, its state, and its look. */
export type LinkProps = LinkHostProps<
  StyleProp<ViewStyle>,
  FocusEvent,
  LayoutChangeEvent
>;

/** A new-tab anchor gives the opened page no access to this one. */
const NEW_TAB_ATTRS = { rel: "noopener noreferrer", target: "_blank" } as const;

/**
 * The anchor props that the `View` of both web renderers takes and the
 * vendored `ViewProps` does not declare, or declares with a React Native
 * event. The handlers get the React DOM events of the anchor.
 */
type AnchorProps = {
  "aria-current"?: "page";
  href: string;
  hrefAttrs?: { rel: string; target: string };
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: PressHandlers["onKeyDown"];
  onPointerDown: PressHandlers["onPointerDown"];
};

/**
 * The seam's `View`, typed with the anchor props. On both renderers its `ref`
 * is the anchor element, with the `View` methods on it.
 */
const AnchorView = View as unknown as ForwardRefExoticComponent<
  Omit<ViewProps, keyof AnchorProps> &
    AnchorProps &
    RefAttributes<HTMLElement & ViewInstance>
>;

export const Link: ForwardRefExoticComponent<
  LinkProps & RefAttributes<ViewInstance>
> = forwardRef<ViewInstance, LinkProps>(function Link(props, forwardedRef) {
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
  const setRef = useCallback(
    (node: (HTMLElement & ViewInstance) | null) => {
      hostRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef != null) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef],
  );
  const pressHandlers = usePress(
    useMemo(() => ({ onPressChange: setPressed }), []),
  );
  useHover(hostRef, { onHoverChange: setHovered });

  // Focus and blur only count when they are the anchor's own, not a child's.
  const handleBlur = useCallback(
    (event: FocusEvent) => {
      if (event.target === event.currentTarget) {
        setFocused(false);
        onBlur?.(event);
      }
    },
    [onBlur],
  );
  const handleFocus = useCallback(
    (event: FocusEvent) => {
      if (event.target === event.currentTarget) {
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

  const state: LinkInteractionState = { focused, hovered, pressed };
  return (
    <AnchorView
      accessibilityLabel={accessibilityLabel}
      aria-current={current ? "page" : undefined}
      dataSet={dataSet}
      href={href}
      hrefAttrs={newTab ? NEW_TAB_ATTRS : undefined}
      onBlur={handleBlur}
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={pressHandlers.onKeyDown}
      onLayout={onLayout}
      onPointerDown={pressHandlers.onPointerDown}
      ref={setRef}
      style={typeof style === "function" ? style(state) : style}
      testID={testID}
    >
      {typeof children === "function" ? children(state) : children}
    </AnchorView>
  );
});
Link.displayName = "Link";
