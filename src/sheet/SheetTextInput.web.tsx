/**
 * Web build of {@link SheetTextInput}: the plain text input. The web sheet is
 * a page dialog, and the browser keeps a focused input in view above the
 * on-screen keyboard, so the input needs no sheet wiring.
 */
import { forwardRef } from "react";
import { TextInput } from "../primitives/reactNative";

import type { SheetTextInputProps } from "./types";

export const SheetTextInput = forwardRef<TextInput, SheetTextInputProps>(
  function SheetTextInput({ testID, ...props }, ref) {
    return <TextInput ref={ref} testID={testID} {...props} />;
  },
);
