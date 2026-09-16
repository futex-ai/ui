/**
 * The `ScrollResponder` handlers a `ScrollView` registers with the responder
 * system.
 *
 * Transcribed from `react-native-web` 0.21.2's `exports/ScrollView/index.js`.
 * Only the touch paths reach any of it: the lock is claimed from
 * `onScrollShouldSetResponder`, which answers `isTouching`, and nothing sets
 * that but a `touchstart`. Split out of `ScrollView.tsx` to keep both files
 * near the line target.
 */
import type { RefObject } from "react";

import { isTextInputNode } from "./platform";
import {
  shouldDismissKeyboardOnRelease,
  type ScrollResponderState,
} from "./scrollViewHost";

/**
 * The field a software keyboard is open for, as `TextInputState` tracked it.
 *
 * That backend remembered the node its own `TextInput` last focused; the active
 * element answers the same question without the bookkeeping, and
 * `Keyboard.dismiss` already reads it this way.
 */
function currentlyFocusedField(): HTMLElement | null {
  const active =
    typeof document !== "undefined" ? document.activeElement : null;
  return active instanceof HTMLElement && isTextInputNode(active)
    ? active
    : null;
}

/**
 * The props a scroller reads through its `latest` ref.
 *
 * Handler parameters are `never` so any caller signature is assignable: these
 * are read off a `ScrollViewProps` bag whose own handlers are typed with the
 * seam's event, and a handler prop is contravariant in its parameter.
 */
type ScrollResponderProps = {
  keyboardShouldPersistTaps?: unknown;
  onResponderGrant?: (event: never) => void;
  onResponderRelease?: (event: never) => void;
  onTouchEnd?: (event: never) => void;
  onTouchStart?: (event: never) => void;
};

/** Builds the handler set, closing over the scroller's own gesture state. */
export function createScrollResponderHandlers(
  isTouching: RefObject<boolean>,
  responderState: RefObject<ScrollResponderState>,
  latest: RefObject<ScrollResponderProps>,
) {
  return {
    // The full `ScrollResponder` set that backend installed. Only the touch
    // paths reach any of it: the lock is claimed from `onScrollShouldSetResponder`,
    // which answers `isTouching`, and nothing sets that but a `touchstart`.
    onResponderGrant: (event: unknown) => {
      responderState.current.observedScrollSinceBecomingResponder = false;
      (
        latest.current.onResponderGrant as
          | ((event: unknown) => void)
          | undefined
      )?.(event);
      // Always false on web; see `responderState`.
      responderState.current.becameResponderWhileAnimating = false;
    },
    // A scroller that has already scrolled will not hand the gesture back.
    onResponderTerminationRequest: () =>
      !responderState.current.observedScrollSinceBecomingResponder,
    // That backend names a method it never defines here, so a caller's own
    // `onResponderTerminate` is swallowed rather than called. Transcribed.
    onResponderTerminate: undefined,
    // `scrollResponderHandleResponderReject` only logs a warning there.
    onResponderReject: () => {},
    onResponderRelease: (event: { target?: unknown }) => {
      const current = latest.current;
      (current.onResponderRelease as ((event: unknown) => void) | undefined)?.(
        event,
      );
      const focusedField = currentlyFocusedField();
      if (
        shouldDismissKeyboardOnRelease({
          ...responderState.current,
          focusedField,
          keyboardShouldPersistTaps: current.keyboardShouldPersistTaps,
          target: event.target,
        })
      ) {
        (focusedField as HTMLElement).blur();
      }
    },
    // A scroll view never takes the lock on touch-down: the views inside it
    // have priority. It takes it when a touch turns into a scroll.
    onScrollShouldSetResponder: () => isTouching.current,
    onStartShouldSetResponder: () => false,
    // `scrollResponderIsAnimating()`, which is always false here.
    onStartShouldSetResponderCapture: () => false,
    onTouchEnd: (event: { nativeEvent?: { touches?: ArrayLike<unknown> } }) => {
      isTouching.current = (event.nativeEvent?.touches?.length ?? 0) !== 0;
      (latest.current.onTouchEnd as ((event: unknown) => void) | undefined)?.(
        event,
      );
    },
    onTouchStart: (event: unknown) => {
      isTouching.current = true;
      (latest.current.onTouchStart as ((event: unknown) => void) | undefined)?.(
        event,
      );
    },
  };
}
