/**
 * A `TextInput`'s DOM-touching helpers.
 *
 * Split out of `TextInput.tsx` to keep both files near the line target: the
 * deferred selection on focus and the imperative methods on the field node.
 */
import {
  createFieldSetNativeProps,
  createSetSelection,
  type TextFieldElement,
} from "../refs/hostMethods.web";

/** A field element with the imperative methods React Native expects. */
export type FieldElement = TextFieldElement & Record<string, unknown>;

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

/** Adds the field methods React Native puts on a `TextInput`'s instance. */
export function attachFieldMethods(
  node: FieldElement,
  onMeasure: (node: FieldElement) => void,
) {
  node.clear = () => {
    node.value = "";
  };
  node.isFocused = () => document.activeElement === node;
  node.setSelection = createSetSelection(node);
  node.setNativeProps = createFieldSetNativeProps(node);
  onMeasure(node);
}
