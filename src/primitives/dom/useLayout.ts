/**
 * `onLayout` and the imperative measuring methods a host `ref` exposes.
 *
 * One `ResizeObserver` serves every mounted primitive, as `react-native-web`'s
 * `useElementLayout` does, and the measurement maths is its `UIManager`'s:
 * `x` / `y` are relative to the parent node, `width` / `height` come from the
 * offset box, and `left` / `top` are page coordinates. The methods are assigned
 * onto the DOM element itself rather than wrapped in an object, so a `ref` both
 * answers `measureInWindow(...)` and stays the element the library reads
 * `clientWidth`, `scrollWidth` and `getBoundingClientRect()` from.
 */
import { useLayoutEffect, type RefObject } from "react";

import type { LayoutChangeEvent } from "../types";

type LayoutHandler = (event: LayoutChangeEvent) => void;

type Rect = { width: number; height: number; top: number; left: number };

const layoutHandlers = new WeakMap<Element, LayoutHandler>();

let sharedObserver: ResizeObserver | null = null;

/** Page box of a node, accumulated through its offset parents. */
function getRect(node: HTMLElement): Rect {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let left = node.offsetLeft;
  let top = node.offsetTop;
  let parent = node.offsetParent as HTMLElement | null;
  while (parent != null && parent.nodeType === 1) {
    left += parent.offsetLeft + parent.clientLeft - parent.scrollLeft;
    top += parent.offsetTop + parent.clientTop - parent.scrollTop;
    parent = parent.offsetParent as HTMLElement | null;
  }
  return {
    height,
    left: left - window.scrollX,
    top: top - window.scrollY,
    width,
  };
}

type MeasureCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

/** `x` / `y` relative to `relativeTo` (the parent node when omitted). */
export function measureLayout(
  node: HTMLElement | null,
  relativeTo: HTMLElement | null,
  callback: MeasureCallback,
): void {
  const relativeNode = relativeTo ?? (node?.parentNode as HTMLElement | null);
  if (node == null || relativeNode == null) {
    return;
  }
  // Deferred so a measurement taken during render reads a laid-out box, which
  // is the timing every existing caller was written against.
  setTimeout(() => {
    if (!node.isConnected || !relativeNode.isConnected) {
      return;
    }
    const relative = getRect(relativeNode);
    const { height, left, top, width } = getRect(node);
    callback(
      left - relative.left,
      top - relative.top,
      width,
      height,
      left,
      top,
    );
  }, 0);
}

function layoutEventFor(
  node: Element,
  x: number,
  y: number,
  width: number,
  height: number,
  left: number,
  top: number,
): LayoutChangeEvent {
  const nativeEvent = { layout: { height, left, top, width, x, y } };
  Object.defineProperty(nativeEvent, "target", {
    enumerable: true,
    get: () => node,
  });
  return { nativeEvent, timeStamp: Date.now() } as unknown as LayoutChangeEvent;
}

function getSharedObserver(): ResizeObserver | null {
  if (typeof window === "undefined" || window.ResizeObserver == null) {
    return null;
  }
  sharedObserver ??= new window.ResizeObserver((entries) => {
    for (const entry of entries) {
      const handler = layoutHandlers.get(entry.target);
      if (handler == null) {
        continue;
      }
      // Re-measured rather than read off the entry, because an entry reports no
      // border-box in every engine — and deferred, which keeps a callback that
      // resizes its own subtree from looping the observer.
      measureLayout(entry.target as HTMLElement, null, (...box) => {
        handler(layoutEventFor(entry.target, ...box));
      });
    }
  });
  return sharedObserver;
}

/** Reports the element's box on mount and on every resize. */
export function useElementLayout(
  ref: RefObject<HTMLElement | null>,
  onLayout: LayoutHandler | undefined,
): void {
  const observer = getSharedObserver();

  useLayoutEffect(() => {
    const node = ref.current;
    if (node == null) {
      return;
    }
    if (onLayout == null) {
      layoutHandlers.delete(node);
    } else {
      layoutHandlers.set(node, onLayout);
    }
  }, [onLayout, ref]);

  // Observing is a separate effect so a new `onLayout` identity does not
  // re-observe the node (and re-fire the initial callback).
  useLayoutEffect(() => {
    const node = ref.current;
    if (node == null || observer == null) {
      return;
    }
    if (layoutHandlers.has(node)) {
      observer.observe(node);
    } else {
      observer.unobserve(node);
    }
    return () => {
      observer.unobserve(node);
      layoutHandlers.delete(node);
    };
  }, [observer, ref]);
}

type NativePropsBag = Record<string, unknown>;

function applyNativeProps(node: HTMLElement, nativeProps: NativePropsBag) {
  for (const [prop, value] of Object.entries(nativeProps)) {
    if (prop === "style" && value != null && typeof value === "object") {
      Object.assign(node.style, value);
    } else if (prop === "class" || prop === "className") {
      node.setAttribute("class", String(value));
    } else if (prop === "text" || prop === "value") {
      (node as HTMLInputElement).value = String(value);
    } else if (value != null) {
      node.setAttribute(prop, String(value));
    }
  }
}

/**
 * Adds React Native's imperative host methods to a DOM element.
 *
 * `focus` and `blur` are the element's own; the rest are the ones React Native
 * components call on a `ref` and have no DOM equivalent.
 */
export function attachHostMethods(node: HTMLElement | null): void {
  if (node == null) {
    return;
  }
  const host = node as HTMLElement & Record<string, unknown>;
  host.measure = (callback: MeasureCallback) =>
    measureLayout(node, null, callback);
  host.measureLayout = (
    relativeTo: HTMLElement,
    onSuccess: (
      left: number,
      top: number,
      width: number,
      height: number,
    ) => void,
  ) => measureLayout(node, relativeTo, onSuccess);
  host.measureInWindow = (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => {
    setTimeout(() => {
      const { height, left, top, width } = node.getBoundingClientRect();
      callback(left, top, width, height);
    }, 0);
  };
  host.setNativeProps = (nativeProps: NativePropsBag) => {
    applyNativeProps(node, nativeProps ?? {});
  };
}
