/**
 * A `TextInput`'s DOM-touching helpers.
 *
 * Split out of `TextInput.tsx` to keep both files near the line target: the
 * guarded `setSelectionRange`, what Enter does, and the imperative methods
 * `react-native-web` assigned onto the field node.
 */
import type { TextInputProps } from "../types";

import { isSelectionStale } from "./textInputProps";

/** A field element with the imperative methods React Native expects. */
export type FieldElement = HTMLInputElement & Record<string, unknown>;

/** A controlled selection range. */
export type Selection = { start: number; end?: number };

export const CARET_HIDDEN = { caretColor: "transparent" } as const;

/** Safari only honours a programmatic selection from a task, not inline. */
let focusTimeout: ReturnType<typeof setTimeout> | null = null;

/** `selectTextOnFocus`, deferred because Safari ignores an inline `select()`. */
export function selectAllSoon(node: FieldElement): void {
  if (focusTimeout != null) {
    clearTimeout(focusTimeout);
  }
  focusTimeout = setTimeout(() => {
    // Focus may have moved on again while the task was pending.
    if (document.activeElement === node) {
      node.select();
    }
  }, 0);
}

/** Certain input types throw on `setSelectionRange`, so it is guarded. */
export function applySelection(node: FieldElement, selection: Selection) {
  if (!isSelectionStale(node, selection)) {
    return;
  }
  try {
    node.setSelectionRange(selection.start, selection.end ?? selection.start);
  } catch {
    // A `type="email"` or `type="number"` field has no selection to set.
  }
}

/**
 * What Enter does, in React Native's modern terms.
 *
 * `blurOnSubmit` is the deprecated spelling and still wins where a caller sets
 * it; otherwise `submitBehavior` decides, defaulting to `newline` on a
 * multiline field and `blurAndSubmit` on a single-line one.
 */
export function submitBehaviorOf(props: TextInputProps): string {
  if (props.blurOnSubmit != null) {
    if (props.blurOnSubmit) {
      return "blurAndSubmit";
    }
    return props.multiline === true ? "newline" : "submit";
  }
  return (
    props.submitBehavior ??
    (props.multiline === true ? "newline" : "blurAndSubmit")
  );
}

/** Adds the field methods React Native puts on a `TextInput`'s instance. */
export function attachFieldMethods(
  node: FieldElement,
  onMeasure: (node: FieldElement) => void,
) {
  node.clear = () => {
    node.value = "";
  };
  node.isFocused = () => document.activeElement === node;
  node.setSelection = (start: number, end: number) =>
    applySelection(node, { end, start });
  // `setNativeProps({ selection })` is how the rich-text editor moves the
  // caret, so it is handled before the generic attribute assignment
  // `attachHostMethods` installed.
  node.setNativeProps = (nativeProps: Record<string, unknown>) => {
    const next = nativeProps?.selection as Selection | undefined;
    if (next != null) {
      applySelection(node, next);
    }
    if (typeof nativeProps?.text === "string") {
      node.value = nativeProps.text;
    }
    if (nativeProps?.style != null) {
      Object.assign(node.style, nativeProps.style);
    }
  };
  onMeasure(node);
}
