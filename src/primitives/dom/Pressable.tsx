/**
 * `Pressable`, as a `View` plus the press machine.
 *
 * The interaction state (`pressed`, `hovered`, `focused`) reaches the
 * function-valued `style` and `children`, as it did on `react-native-web`, and
 * the same two style layers sit under the caller's: a pointer cursor and
 * `touch-action: manipulation` while enabled, `pointerEvents: "box-none"` while
 * disabled. `hitSlop` is accepted and ignored (plan Decision 6): the previous
 * backend ignored it too, and `HitSlopExpander` is what makes slop real on web.
 */
import {
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from "react";

import type {
  PressableComponent,
  PressableProps,
  ViewInstance,
  ViewProps,
} from "../types";

import { useHostRef } from "./hostRef";
import { useHover } from "./useHover";
import { usePress } from "./usePress";
import { View } from "./View";

const ACTIVE_STYLE = { cursor: "pointer", touchAction: "manipulation" };
const DISABLED_STYLE = { pointerEvents: "box-none" };

type Handler = ((event: never) => void) | null | undefined;

/** Runs the press machine's handler, then the caller's own. */
function compose(first: Handler, second: Handler) {
  return (event: never) => {
    first?.(event);
    second?.(event);
  };
}

function targetOf(event: unknown): unknown {
  return (event as { nativeEvent?: { target?: unknown } }).nativeEvent?.target;
}

function PressableImpl(
  props: PressableProps,
  forwardedRef: ForwardedRef<ViewInstance>,
) {
  const {
    children,
    delayLongPress,
    disabled,
    onBlur,
    onContextMenu,
    onFocus,
    onHoverIn,
    onHoverOut,
    onKeyDown,
    onLongPress,
    onPress,
    onPressIn,
    onPressMove,
    onPressOut,
    onPointerDown,
    style,
    tabIndex,
    ...rest
  } = props as PressableProps & {
    onContextMenu?: Handler;
    onKeyDown?: Handler;
    onPointerDown?: Handler;
  };
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState(false);
  const hostRef = useRef<HTMLElement | null>(null);
  const setRef = useHostRef(hostRef, forwardedRef);

  const pressHandlers = usePress(
    useMemo(
      () => ({
        delayLongPress,
        disabled,
        onLongPress,
        onPress,
        onPressChange: setPressed,
        onPressEnd: onPressOut,
        onPressMove,
        onPressStart: onPressIn,
      }),
      [
        delayLongPress,
        disabled,
        onLongPress,
        onPress,
        onPressIn,
        onPressMove,
        onPressOut,
      ],
    ),
  );

  const onHoverChange = useCallback((next: boolean) => setHovered(next), []);
  useHover(hostRef, {
    disabled,
    onHoverChange,
    onHoverEnd: onHoverOut as never,
    onHoverStart: onHoverIn as never,
  });

  const interactionState = { focused, hovered, pressed };

  // Focus and blur only count when they are the host's own, not a child's.
  const handleBlur = useCallback(
    (event: never) => {
      if (targetOf(event) === hostRef.current) {
        setFocused(false);
        (onBlur as Handler)?.(event);
      }
    },
    [onBlur],
  );
  const handleFocus = useCallback(
    (event: never) => {
      if (targetOf(event) === hostRef.current) {
        setFocused(true);
        (onFocus as Handler)?.(event);
      }
    },
    [onFocus],
  );

  const viewProps = {
    ...rest,
    "aria-disabled": disabled,
    children:
      typeof children === "function" ? children(interactionState) : children,
    onBlur: handleBlur,
    onClick: pressHandlers.onClick,
    onContextMenu: compose(
      pressHandlers.onContextMenu as Handler,
      onContextMenu,
    ),
    onFocus: handleFocus,
    onKeyDown: compose(pressHandlers.onKeyDown as Handler, onKeyDown),
    onPointerDown: compose(
      pressHandlers.onPointerDown as Handler,
      onPointerDown,
    ),
    ref: setRef,
    style: [
      disabled === true ? DISABLED_STYLE : ACTIVE_STYLE,
      typeof style === "function" ? style(interactionState) : style,
    ],
    tabIndex: tabIndex === undefined ? (disabled === true ? -1 : 0) : tabIndex,
  } as unknown as ViewProps;

  return <View {...viewProps} />;
}

export const Pressable: PressableComponent = memo(
  forwardRef<ViewInstance, PressableProps>(PressableImpl),
) as unknown as PressableComponent;
Pressable.displayName = "Pressable";
