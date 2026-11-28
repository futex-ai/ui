import { forwardRef } from "react";

import { TextInput } from "./reactNative";
import { useForwardedHostRef } from "./refs/useForwardedHostRef";
import { handleTextFieldEnter, type TextFieldKeyEvent } from "./textFieldEnter";
import type {
  TextInputComponent,
  TextInputInstance,
  TextInputProps,
} from "./types";

type TextFieldProps = TextInputProps & {
  onKeyDown?: (event: TextFieldKeyEvent) => void;
};

// Both web renderers use this prop and ref surface. The native type check
// resolves the import above to React Native while checking this file too.
const WebTextInput = TextInput as unknown as TextInputComponent;

export const TextField = forwardRef<TextInputInstance, TextFieldProps>(
  function TextField(
    {
      blurOnSubmit,
      onKeyDown,
      onKeyPress,
      onSubmitEditing,
      submitBehavior,
      ...props
    },
    forwardedRef,
  ) {
    const ref = useForwardedHostRef(forwardedRef, undefined, true);
    return (
      <WebTextInput
        {...props}
        // The key callback handles submit and blur on both renderers.
        blurOnSubmit={false}
        onKeyPress={(event) => {
          // Both web renderers deliver the browser keydown here. RNW replaces
          // a passed onKeyDown, so forward it from this callback too.
          const keyEvent = event as unknown as TextFieldKeyEvent;
          onKeyDown?.(keyEvent);
          onKeyPress?.(event);
          handleTextFieldEnter(keyEvent, {
            blurOnSubmit,
            multiline: props.multiline,
            onSubmitEditing,
            submitBehavior,
          });
        }}
        ref={ref}
      />
    );
  },
);
