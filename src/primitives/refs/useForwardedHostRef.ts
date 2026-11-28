import { useCallback, type Ref, type RefCallback, type RefObject } from "react";

import { fillMissingHostMethods } from "./hostMethods";

export function useForwardedHostRef<
  Forwarded,
  Host extends Forwarded = Forwarded,
>(
  forwardedRef: Ref<Forwarded> | undefined,
  localRef?: RefObject<Host | null>,
  textField = false,
): RefCallback<Host> | undefined {
  const setRef = useCallback(
    (node: Host | null) => {
      if (localRef != null) {
        localRef.current = node;
      }
      if (forwardedRef == null) {
        return;
      }
      if (node != null) {
        fillMissingHostMethods(node, textField);
      }
      if (typeof forwardedRef === "function") {
        const cleanup = forwardedRef(node);
        if (typeof cleanup === "function") {
          return () => {
            if (localRef != null) {
              localRef.current = null;
            }
            cleanup();
          };
        }
      } else {
        forwardedRef.current = node;
      }
    },
    [forwardedRef, localRef, textField],
  );
  return forwardedRef != null || localRef != null ? setRef : undefined;
}
