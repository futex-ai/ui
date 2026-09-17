/**
 * `Text`, as a DOM element.
 *
 * A root `Text` is a `div` with `dir="auto"` that provides the text-ancestor
 * context; a nested one is a `span` that inherits its colour, font, alignment
 * and wrapping. `numberOfLines` clamps to one line with an ellipsis or to `n`
 * lines with `-webkit-line-clamp`, and `selectable` / `onPress` add the same
 * styles `react-native-web` layered on top of the caller's, in the same order.
 */
import { forwardRef, useCallback, useContext, useRef } from "react";

import type { TextComponent, TextInstance, TextProps } from "../types";

import { createHostElement } from "./createHostElement";
import {
  POINTER_EVENTS_ATTRIBUTE,
  TEXT_CLASS,
  TEXT_NESTED_CLASS,
  useDomBackendCss,
} from "./css";
import { createDomProps, pointerEventsFor, type PropBag } from "./domProps";
import { useHostRef } from "./hostRef";
import { resolveStyle, type StyleInput } from "./resolveStyle";
import { responderConfig, useResponderEvents } from "./responder";
import { TextAncestorContext } from "./TextAncestorContext";
import { useElementLayout } from "./useLayout";

const ONE_LINE = {
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  wordWrap: "normal",
};

const MULTI_LINE = {
  display: "-webkit-box",
  maxWidth: "100%",
  overflow: "clip",
  textOverflow: "ellipsis",
  WebkitBoxOrient: "vertical",
};

/** Mirrors the style array `react-native-web`'s `Text` builds, in its order. */
function textStyles(props: TextProps): StyleInput {
  const { numberOfLines, onPress, selectable, style } = props;
  const clamped = numberOfLines != null && numberOfLines > 1;
  return [
    clamped ? { WebkitLineClamp: numberOfLines } : null,
    numberOfLines === 1 ? ONE_LINE : null,
    clamped ? MULTI_LINE : null,
    style,
    selectable === true ? { userSelect: "text" } : null,
    selectable === false ? { userSelect: "none" } : null,
    onPress != null ? { cursor: "pointer" } : null,
  ];
}

export const Text: TextComponent = forwardRef<TextInstance, TextProps>(
  function Text(props, forwardedRef) {
    useDomBackendCss();
    const hasTextAncestor = useContext(TextAncestorContext);
    const hostRef = useRef<HTMLElement | null>(null);
    useElementLayout(hostRef, props.onLayout);
    useResponderEvents(hostRef, responderConfig(props as PropBag));
    const setRef = useHostRef(hostRef, forwardedRef);

    const { onPress } = props;
    const onClick = (props as PropBag).onClick as
      | ((event: unknown) => void)
      | undefined;
    const handleClick = useCallback(
      (event: { stopPropagation: () => void }) => {
        if (onClick != null) {
          onClick(event);
        } else if (onPress != null) {
          event.stopPropagation();
          onPress(event as never);
        }
      },
      [onClick, onPress],
    );

    const { element, props: domProps } = createDomProps(props as PropBag, {
      defaultElement: hasTextAncestor ? "span" : "div",
    });
    const style = resolveStyle(textStyles(props));
    const pointerEvents = pointerEventsFor(
      props as PropBag,
      style.pointerEvents,
    );
    delete style.pointerEvents;

    domProps.className = hasTextAncestor ? TEXT_NESTED_CLASS : TEXT_CLASS;
    domProps.style = style;
    domProps.ref = setRef;
    domProps.children = props.children;
    // A root text lets the browser infer its writing direction from content.
    if (!hasTextAncestor) {
      domProps.dir = (props as PropBag).dir ?? "auto";
    }
    if (onClick != null || onPress != null) {
      domProps.onClick = handleClick;
    }
    if (pointerEvents != null) {
      domProps[POINTER_EVENTS_ATTRIBUTE] = pointerEvents;
    }

    const rendered = createHostElement(element, domProps);
    return hasTextAncestor ? (
      rendered
    ) : (
      <TextAncestorContext.Provider value={true}>
        {rendered}
      </TextAncestorContext.Provider>
    );
  },
);
Text.displayName = "Text";
