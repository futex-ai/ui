import type { KeyboardEvent } from "react";

import type { TextInputProps } from "./types/textInput";
import type { SubmitBehavior } from "./types/textInputOptions";

type TextFieldSubmitProps = Pick<
  TextInputProps,
  "blurOnSubmit" | "multiline" | "onSubmitEditing" | "submitBehavior"
>;

export type TextFieldKeyEvent = KeyboardEvent<
  HTMLInputElement | HTMLTextAreaElement
>;

function submitBehaviorOf(props: TextFieldSubmitProps): SubmitBehavior {
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

/** An IME is still composing text, so Enter confirms an IME candidate. */
export function isEventComposing(nativeEvent: {
  isComposing?: boolean;
  keyCode?: number;
}): boolean {
  // A key handled by an IME can report 229.
  return nativeEvent.isComposing === true || nativeEvent.keyCode === 229;
}

export function handleTextFieldEnter(
  event: TextFieldKeyEvent,
  props: TextFieldSubmitProps,
): void {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    isEventComposing(event.nativeEvent) ||
    event.isDefaultPrevented()
  ) {
    return;
  }

  const node = event.currentTarget;
  const behavior = submitBehaviorOf(props);
  if (behavior !== "newline" && props.onSubmitEditing != null) {
    // Cancel the browser's newline or form submission.
    event.preventDefault();
    Object.assign(event.nativeEvent, { text: node.value });
    type SubmitEvent = Parameters<typeof props.onSubmitEditing>[0];
    props.onSubmitEditing(event as unknown as SubmitEvent);
  }
  if (behavior === "blurAndSubmit") {
    // The submit handler runs while the field still has focus.
    setTimeout(() => node.blur(), 0);
  }
}
