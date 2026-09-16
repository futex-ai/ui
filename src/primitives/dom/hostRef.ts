/**
 * The callback ref every primitive installs on its DOM element.
 *
 * It keeps the component's own `hostRef` current, adds React Native's
 * imperative methods to the element (`measure`, `measureInWindow`, …), and then
 * hands the same element to whatever `ref` the caller passed. The element
 * itself is what a caller receives, which is why `useRef<View>()` callers can
 * both call `measureInWindow` and read `clientWidth` off the result.
 */
import { useCallback, type ForwardedRef, type RefObject } from "react";

import { attachHostMethods } from "./useLayout";

/** A `ref` typed with one of the seam's instance types. */
export type HostRefTarget = ForwardedRef<never> | ForwardedRef<unknown>;

export function useHostRef(
  hostRef: RefObject<HTMLElement | null>,
  forwardedRef: HostRefTarget,
): (node: HTMLElement | null) => void {
  return useCallback(
    (node: HTMLElement | null) => {
      hostRef.current = node;
      attachHostMethods(node);
      if (typeof forwardedRef === "function") {
        (forwardedRef as (value: HTMLElement | null) => void)(node);
      } else if (forwardedRef != null) {
        (forwardedRef as { current: HTMLElement | null }).current = node;
      }
    },
    [forwardedRef, hostRef],
  );
}
