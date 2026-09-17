/**
 * `TextInput`, as an `input` or a `textarea`.
 *
 * A transcription of `react-native-web` 0.21.2's `exports/TextInput/index.js`.
 * The DOM element itself is what a `ref` yields, which is what lets
 * `useAutoGrowTextarea.web.ts` read `scrollHeight` and write `style.height` on
 * the same object the seam typed as a `TextInput`.
 *
 * Two deliberate differences from that backend:
 *
 * - A forwarded `onKeyDown` is delivered. It swallowed the prop by installing
 *   its own handler, which is why `keyboardNavigation.ts` grew
 *   `useDocumentKeyCapture`; that hook keeps working unchanged, because its
 *   capture-phase listener still runs first and still stops propagation for the
 *   keys it claims, so nothing is handled twice.
 * - `submitBehavior` is honoured where `blurOnSubmit` is absent, as React
 *   Native defines it. Every combination the library actually passes behaves
 *   exactly as before; that backend simply ignored the modern spelling.
 *
 * The base style is a class in `css.ts` rather than inline, for the reason the
 * `View` and `Text` resets are: it sits below every inline style, which is the
 * priority that backend's atomic reset had.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ForwardedRef,
} from "react";

import type {
  TextInputComponent,
  TextInputInstance,
  TextInputProps,
} from "../types";

import { createHostElement } from "./createHostElement";
import {
  PLACEHOLDER_COLOR_ATTRIBUTE,
  PLACEHOLDER_COLOR_VARIABLE,
  POINTER_EVENTS_ATTRIBUTE,
  TEXT_INPUT_CLASS,
  useDomBackendCss,
} from "./css";
import { createDomProps, pointerEventsFor, type PropBag } from "./domProps";
import { resolveStyle } from "./resolveStyle";
import { responderConfig, useResponderEvents } from "./responder";
import {
  applySelection,
  attachFieldMethods,
  selectAllSoon,
  submitBehaviorOf,
  CARET_HIDDEN,
  type FieldElement,
  type Selection,
} from "./textInputHost";
import {
  isEventComposing,
  pickTextInputProps,
  resolveInputType,
  textInputDefaults,
} from "./textInputProps";
import { attachHostMethods, useElementLayout } from "./useLayout";

function TextInputImpl(
  props: TextInputProps,
  forwardedRef: ForwardedRef<TextInputInstance>,
) {
  useDomBackendCss();
  const {
    caretHidden,
    inputMode: inputModeProp,
    keyboardType,
    multiline = false,
    onContentSizeChange,
    onLayout,
    placeholderTextColor,
    selection,
    style,
  } = props;
  const secureTextEntry = props.secureTextEntry === true;

  const hostRef = useRef<FieldElement | null>(null);
  const dimensions = useRef<{ height: number | null; width: number | null }>({
    height: null,
    width: null,
  });
  const prevSelection = useRef<Selection | null>(null);
  const prevSecureTextEntry = useRef(false);
  // Handlers read the current props through a ref so they stay stable, which
  // keeps React from detaching and reattaching a listener on every keystroke.
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    if (hostRef.current != null && prevSelection.current != null) {
      applySelection(hostRef.current, prevSelection.current);
    }
    prevSecureTextEntry.current = secureTextEntry;
  }, [secureTextEntry]);

  const handleContentSizeChange = useCallback(
    (hostNode: FieldElement | null) => {
      const handler = latest.current.onContentSizeChange;
      if (!multiline || handler == null || hostNode == null) {
        return;
      }
      const height = hostNode.scrollHeight;
      const width = hostNode.scrollWidth;
      if (
        height !== dimensions.current.height ||
        width !== dimensions.current.width
      ) {
        dimensions.current = { height, width };
        handler({ nativeEvent: { contentSize: { height, width } } } as never);
      }
    },
    [multiline],
  );

  const handleBlur = useCallback((event: PropBag) => {
    const handler = latest.current.onBlur;
    if (handler != null) {
      (event.nativeEvent as PropBag).text = (
        event.target as FieldElement
      ).value;
      handler(event as never);
    }
  }, []);

  const handleChange = useCallback(
    (event: PropBag) => {
      const hostNode = event.target as FieldElement;
      const text = hostNode.value;
      (event.nativeEvent as PropBag).text = text;
      handleContentSizeChange(hostNode);
      latest.current.onChange?.(event as never);
      latest.current.onChangeText?.(text);
    },
    [handleContentSizeChange],
  );

  const handleFocus = useCallback((event: PropBag) => {
    const hostNode = event.target as FieldElement;
    const current = latest.current;
    if (current.onFocus != null) {
      (event.nativeEvent as PropBag).text = hostNode.value;
      current.onFocus(event as never);
    }
    if (current.clearTextOnFocus === true) {
      hostNode.value = "";
    }
    if (current.selectTextOnFocus === true) {
      selectAllSoon(hostNode);
    }
  }, []);

  const handleKeyDown = useCallback((event: PropBag) => {
    const hostNode = event.target as FieldElement;
    const current = latest.current;
    // Key events do not bubble out of a field, which is what keeps a dropdown's
    // own handler from seeing every character typed into its filter.
    (event.stopPropagation as () => void)();

    const behavior = submitBehaviorOf(current);
    const forwarded = (current as PropBag).onKeyDown as
      | ((event: unknown) => void)
      | undefined;
    forwarded?.(event);
    current.onKeyPress?.(event as never);

    if (
      event.key === "Enter" &&
      event.shiftKey !== true &&
      !isEventComposing(event.nativeEvent as PropBag) &&
      !(event.isDefaultPrevented as () => boolean)()
    ) {
      if (behavior !== "newline" && current.onSubmitEditing != null) {
        // Stops the newline, and stops an enclosing form from submitting.
        (event.preventDefault as () => void)();
        (event.nativeEvent as PropBag).text = hostNode.value;
        current.onSubmitEditing(event as never);
      }
      if (behavior === "blurAndSubmit") {
        // Deferred, so the submit handler sees a field that still has focus.
        setTimeout(() => hostNode.blur(), 0);
      }
    }
  }, []);

  const handleSelectionChange = useCallback((event: PropBag) => {
    try {
      const target = event.target as FieldElement;
      const next: Selection = {
        end: target.selectionEnd ?? undefined,
        start: target.selectionStart ?? 0,
      };
      const current = latest.current;
      if (current.onSelectionChange != null) {
        (event.nativeEvent as PropBag).selection = next;
        (event.nativeEvent as PropBag).text = target.value;
        current.onSelectionChange(event as never);
      }
      // A field that just became a password field reports a stale selection.
      if (prevSecureTextEntry.current === (current.secureTextEntry === true)) {
        prevSelection.current = next;
      }
    } catch {
      // A field whose type has no selection to report.
    }
  }, []);

  useLayoutEffect(() => {
    const node = hostRef.current;
    if (node != null && selection != null) {
      applySelection(node, selection);
    }
  }, [selection]);

  useElementLayout(hostRef, onLayout);
  useResponderEvents(hostRef, responderConfig(props as PropBag));

  const setRef = useCallback(
    (node: FieldElement | null) => {
      hostRef.current = node;
      attachHostMethods(node);
      if (node != null) {
        attachFieldMethods(node, handleContentSizeChange);
      }
      if (typeof forwardedRef === "function") {
        forwardedRef(node as unknown as TextInputInstance);
      } else if (forwardedRef != null) {
        forwardedRef.current = node as unknown as TextInputInstance;
      }
    },
    [forwardedRef, handleContentSizeChange],
  );

  const { inputMode, type } = useMemo(
    () =>
      resolveInputType({
        inputMode: inputModeProp,
        keyboardType,
        secureTextEntry,
      }),
    [inputModeProp, keyboardType, secureTextEntry],
  );

  const element = multiline ? "textarea" : "input";
  const { props: domProps } = createDomProps(props as PropBag, {
    defaultElement: element,
  });
  Object.assign(domProps, pickTextInputProps(props as PropBag));
  Object.assign(domProps, textInputDefaults(props as PropBag));

  const resolved = resolveStyle([
    style,
    caretHidden === true ? CARET_HIDDEN : null,
  ]) as Record<string, unknown>;
  const pointerEvents = pointerEventsFor(
    props as PropBag,
    resolved.pointerEvents,
  );
  delete resolved.pointerEvents;
  if (placeholderTextColor != null) {
    resolved[PLACEHOLDER_COLOR_VARIABLE] = placeholderTextColor;
  }

  domProps.className = TEXT_INPUT_CLASS;
  domProps.inputMode = inputMode;
  domProps.onBlur = handleBlur;
  domProps.onChange = handleChange;
  domProps.onFocus = handleFocus;
  domProps.onKeyDown = handleKeyDown;
  domProps.onSelect = handleSelectionChange;
  domProps.ref = setRef;
  domProps.style = resolved;
  domProps.type = multiline ? undefined : type;
  // The placeholder rule is attached unconditionally, as that backend's class
  // was; see `css.ts`.
  domProps[PLACEHOLDER_COLOR_ATTRIBUTE] = "";
  if (pointerEvents != null) {
    domProps[POINTER_EVENTS_ATTRIBUTE] = pointerEvents;
  }
  // A field takes its text as `value`, never as children.
  delete domProps.children;

  return createHostElement(element, domProps);
}

export const TextInput: TextInputComponent = forwardRef<
  TextInputInstance,
  TextInputProps
>(TextInputImpl);
TextInput.displayName = "TextInput";
