/**
 * `View`, as a DOM element.
 *
 * A `div` unless the accessibility role names a better element, carrying
 * `react-native-web`'s element reset as a class (so every inline style still
 * wins over it) and the translated `style` prop inline. `onLayout`, the
 * responder handlers and the imperative `ref` methods behave as they did on
 * that backend; see `resolveStyle.ts`, `domProps.ts` and `useLayout.ts` for the
 * three tables this is assembled from.
 */
import { forwardRef, useContext, useRef } from "react";

import type { ViewComponent, ViewInstance, ViewProps } from "../types";

import { createHostElement } from "./createHostElement";
import {
  POINTER_EVENTS_ATTRIBUTE,
  VIEW_CLASS,
  VIEW_INLINE_CLASS,
  useDomBackendCss,
} from "./css";
import { createDomProps, pointerEventsFor, type PropBag } from "./domProps";
import { useHostRef } from "./hostRef";
import { resolveStyle } from "./resolveStyle";
import { responderConfig, useResponderEvents } from "./responderEvents";
import { TextAncestorContext } from "./TextAncestorContext";
import { useElementLayout } from "./useLayout";

export const View: ViewComponent = forwardRef<ViewInstance, ViewProps>(
  function View(props, forwardedRef) {
    useDomBackendCss();
    const hasTextAncestor = useContext(TextAncestorContext);
    const hostRef = useRef<HTMLElement | null>(null);
    useElementLayout(hostRef, props.onLayout);
    useResponderEvents(hostRef, responderConfig(props as PropBag));
    const setRef = useHostRef(hostRef, forwardedRef);

    const { element, props: domProps } = createDomProps(props as PropBag, {
      defaultElement: "div",
      forwardScrollHandlers: true,
    });
    const style = resolveStyle(props.style);
    const pointerEvents = pointerEventsFor(
      props as PropBag,
      style.pointerEvents,
    );
    delete style.pointerEvents;

    domProps.className = hasTextAncestor
      ? `${VIEW_CLASS} ${VIEW_INLINE_CLASS}`
      : VIEW_CLASS;
    domProps.style = style;
    domProps.ref = setRef;
    domProps.children = props.children;
    if (pointerEvents != null) {
      domProps[POINTER_EVENTS_ATTRIBUTE] = pointerEvents;
    }

    return createHostElement(element, domProps);
  },
);
View.displayName = "View";
