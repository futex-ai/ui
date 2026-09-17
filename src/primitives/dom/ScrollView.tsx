/**
 * `ScrollView`, as an overflow container around a content wrapper.
 *
 * A transcription of `react-native-web` 0.21.2's `exports/ScrollView/index.js`
 * and its `ScrollViewBase`: the outer `View` owns the overflow, the scroll
 * events and the responder handlers, and an inner `View` owns
 * `contentContainerStyle` and — when `onContentSizeChange` is given — the
 * `onLayout` that reports the content's size.
 *
 * Three details the library depends on:
 *
 * - `onScroll` follows that backend's start / tick / end rhythm. The first
 *   scroll of a gesture always reports; later ones only once
 *   `scrollEventThrottle` has elapsed; and 100 ms after the last one a trailing
 *   "end" event reports the resting position. There is no `scrollend` here for
 *   the same reason there was none there.
 * - `onMomentumScrollEnd` is passed through as a plain `View` prop and is
 *   therefore never called on web. `DateWheel` already works around that with
 *   its own settle timer, so firing it now would double-commit its value.
 * - The imperative methods (`scrollTo`, `scrollToEnd`, `getScrollableNode`, …)
 *   are assigned onto the DOM element, as that backend assigned them, so a
 *   `ref` is still the node `dropdownScroll.ts` calls `getBoundingClientRect`
 *   and `scrollBy` on.
 */
import {
  Children,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ForwardedRef,
  type ReactNode,
} from "react";

import type {
  ScrollViewComponent,
  ScrollViewInstance,
  ScrollViewProps,
  ViewProps,
} from "../types";

import type { PropBag } from "./domProps";
import { Keyboard } from "./platform";
import { normalizeScrollEvent, shouldEmitScrollEvent } from "./scrollEvents";
import {
  attachScrollMethods,
  BASE_HORIZONTAL,
  BASE_VERTICAL,
  CONTENT_CENTERED,
  CONTENT_HORIZONTAL,
  PAGING_CHILD,
  PAGING_HORIZONTAL,
  PAGING_VERTICAL,
  SCROLL_DISABLED,
  SCROLL_END_DELAY_MS,
  STICKY_HEADER,
  type AnyHandler,
  type ScrollElement,
} from "./scrollViewHost";
import { createScrollResponderHandlers } from "./scrollViewResponder";
import { attachHostMethods } from "./useLayout";
import { View } from "./View";

/** Wraps the children a sticky or paging scroller needs boxed. */
function wrapStickyChildren(
  children: ReactNode,
  stickyHeaderIndices: number[] | undefined,
  pagingEnabled: boolean,
): ReactNode {
  return Children.map(children, (child, index) => {
    const isSticky = stickyHeaderIndices?.includes(index) === true;
    if (child != null && (isSticky || pagingEnabled)) {
      const wrapperProps = {
        children: child,
        style: [
          isSticky ? STICKY_HEADER : null,
          pagingEnabled ? PAGING_CHILD : null,
        ],
      } as unknown as ViewProps;
      return <View {...wrapperProps} />;
    }
    return child;
  });
}

function ScrollViewImpl(
  props: ScrollViewProps,
  forwardedRef: ForwardedRef<ScrollViewInstance>,
) {
  const {
    centerContent,
    children,
    contentContainerStyle,
    horizontal,
    keyboardDismissMode,
    onContentSizeChange,
    onScroll,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    onWheel,
    pagingEnabled,
    scrollEnabled = true,
    scrollEventThrottle = 0,
    showsHorizontalScrollIndicator,
    showsVerticalScrollIndicator,
    stickyHeaderIndices,
    style,
    ...rest
  } = props as ScrollViewProps & {
    centerContent?: boolean;
    onTouchEnd?: AnyHandler;
    onTouchMove?: AnyHandler;
    onTouchStart?: AnyHandler;
    onWheel?: AnyHandler;
  };

  const scrollRef = useRef<ScrollElement | null>(null);
  const innerRef = useRef<HTMLElement | null>(null);
  const scrollState = useRef({ isScrolling: false, scrollLastTick: 0 });
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouching = useRef(false);
  // `ScrollResponder`'s own bookkeeping. `becameResponderWhileAnimating` can
  // only ever be false here: it reads `scrollResponderIsAnimating`, which is
  // computed from the momentum timestamps, and the momentum callbacks that set
  // those are plain `View` props that never fire on web.
  const responderState = useRef({
    becameResponderWhileAnimating: false,
    observedScrollSinceBecomingResponder: false,
  });
  const isHorizontal = horizontal === true;

  // Read through a ref so the DOM handlers stay stable across renders while
  // still calling the current callbacks.
  const latest = useRef(props);
  latest.current = props;

  const emit = useCallback(() => {
    const node = scrollRef.current;
    const current = latest.current;
    if (node == null) {
      return;
    }
    // That backend dismissed the keyboard from the scroll itself, not the drag.
    if (current.keyboardDismissMode === "on-drag") {
      Keyboard.dismiss();
    }
    // A scroll while holding the lock is what makes the scroller refuse to give
    // it up, and what stops a release from closing the keyboard.
    responderState.current.observedScrollSinceBecomingResponder = true;
    current.onScroll?.(normalizeScrollEvent(node));
  }, []);

  const handleScroll = useCallback(
    (event: { stopPropagation: () => void; target: unknown }) => {
      event.stopPropagation();
      if (event.target !== scrollRef.current) {
        return;
      }
      if (scrollTimeout.current != null) {
        clearTimeout(scrollTimeout.current);
      }
      scrollTimeout.current = setTimeout(() => {
        scrollState.current.isScrolling = false;
        emit();
      }, SCROLL_END_DELAY_MS);

      if (!scrollState.current.isScrolling) {
        scrollState.current.isScrolling = true;
        scrollState.current.scrollLastTick = Date.now();
        emit();
        return;
      }
      if (
        shouldEmitScrollEvent(
          scrollState.current.scrollLastTick,
          latest.current.scrollEventThrottle ?? 0,
        )
      ) {
        scrollState.current.scrollLastTick = Date.now();
        emit();
      }
    },
    [emit],
  );

  const handleContentLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      const { height, width } = event.nativeEvent.layout;
      onContentSizeChange?.(width, height);
    },
    [onContentSizeChange],
  );

  const setInnerRef = useCallback((node: HTMLElement | null) => {
    innerRef.current = node;
  }, []);

  const setScrollRef = useCallback(
    (node: HTMLElement | null) => {
      scrollRef.current = node as ScrollElement | null;
      attachHostMethods(node);
      if (node != null) {
        attachScrollMethods(
          node as ScrollElement,
          () => innerRef.current,
          isHorizontal,
        );
      }
      if (typeof forwardedRef === "function") {
        forwardedRef(node as unknown as ScrollViewInstance);
      } else if (forwardedRef != null) {
        forwardedRef.current = node as unknown as ScrollViewInstance;
      }
    },
    [forwardedRef, isHorizontal],
  );

  // A disabled scroller still receives the events; it just ignores them.
  const guard = useCallback(
    (handler: AnyHandler) => (event: never) => {
      if (scrollEnabled) {
        handler?.(event);
      }
    },
    [scrollEnabled],
  );

  const responderHandlers = useMemo(
    () => createScrollResponderHandlers(isTouching, responderState, latest),
    [],
  );

  const hideScrollbar =
    showsHorizontalScrollIndicator === false ||
    showsVerticalScrollIndicator === false;

  const hasStickyHeaders = !isHorizontal && Array.isArray(stickyHeaderIndices);
  const content =
    hasStickyHeaders || pagingEnabled === true
      ? wrapStickyChildren(
          children,
          stickyHeaderIndices,
          pagingEnabled === true,
        )
      : children;

  const contentProps = {
    children: content,
    onLayout: onContentSizeChange != null ? handleContentLayout : undefined,
    ref: setInnerRef,
    style: [
      isHorizontal ? CONTENT_HORIZONTAL : null,
      centerContent === true ? CONTENT_CENTERED : null,
      contentContainerStyle,
    ],
  } as unknown as ViewProps;

  const pagingStyle =
    pagingEnabled === true
      ? isHorizontal
        ? PAGING_HORIZONTAL
        : PAGING_VERTICAL
      : null;

  const viewProps = {
    ...(rest as PropBag),
    ...responderHandlers,
    // `dataSet` is how a `View` writes a `data-*` attribute; the rule behind
    // `data-hide-scrollbar` lives in `css.ts`.
    ...(hideScrollbar ? { dataSet: { hideScrollbar: true } } : null),
    children: <View {...contentProps} />,
    onScroll: handleScroll,
    onTouchMove: guard(onTouchMove),
    onWheel: guard(onWheel),
    ref: setScrollRef,
    style: [
      isHorizontal ? BASE_HORIZONTAL : BASE_VERTICAL,
      pagingStyle,
      style,
      scrollEnabled === false ? SCROLL_DISABLED : null,
    ],
  } as unknown as ViewProps;

  return <View {...viewProps} />;
}

export const ScrollView: ScrollViewComponent = forwardRef<
  ScrollViewInstance,
  ScrollViewProps
>(ScrollViewImpl);
ScrollView.displayName = "ScrollView";
