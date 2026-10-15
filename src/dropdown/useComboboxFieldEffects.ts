/** Focus and announcement effects for input-backed combobox fields. */
import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { TextInput } from "../primitives/reactNative";

import { announce } from "../announcer";

/**
 * Focuses the input on mount when `autoFocus` is set, and returns a blur
 * handler that takes focus back during the first moments after mount. An
 * in-place editor can mount during pointer-down; ignoring the matching
 * release's transient focus transfer keeps the new input ready for typing.
 */
export function useComboboxAutoFocus(
  autoFocus: boolean,
  inputRef: RefObject<TextInput | null>,
): () => void {
  const autoFocusAtRef = useRef(0);
  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    autoFocusAtRef.current = Date.now();
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }
    const frame = requestAnimationFrame(focusInput);
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);
  return useCallback(() => {
    if (autoFocus && Date.now() - autoFocusAtRef.current < 250) {
      inputRef.current?.focus();
    }
  }, [autoFocus, inputRef]);
}

/**
 * Announces the result count while a query filters the open list, so screen
 * readers hear matches change without focus leaving the input (WCAG 4.1.3).
 */
export function useComboboxResultAnnouncement(
  count: number,
  open: boolean,
  query: string,
): void {
  useEffect(() => {
    if (!open || !query.trim()) {
      return;
    }
    announce(
      count === 0
        ? "No matching options"
        : `${count} ${count === 1 ? "option" : "options"} available`,
    );
  }, [count, open, query]);
}
