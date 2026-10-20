/**
 * Native text input for a `Sheet` body. Inside the gorhom sheet it is gorhom's
 * own input, which tells the sheet where the keyboard target is, so the sheet
 * rises above the software keyboard while the input has focus.
 */
import {
  BottomSheetTextInput,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import type { ComponentProps, Ref } from "react";
import { TextInput } from "../primitives/reactNative";

import type { SheetTextInputProps } from "./types";

type GorhomInputProps = ComponentProps<typeof BottomSheetTextInput>;

/**
 * Re-types the seam's text input props and ref for gorhom's input, which is
 * declared with `react-native`'s own types. The seam's types are a superset
 * that also cover the web-only keys, and this file only renders on native,
 * where those keys never appear, so the values pass through unchanged. The
 * same boundary re-type as `nativeStyle` in `BottomSheetShell.tsx`.
 */
function gorhomInputProps(
  props: SheetTextInputProps,
  ref: Ref<TextInput>,
): GorhomInputProps {
  return { ...props, ref } as unknown as GorhomInputProps;
}

export const SheetTextInput = forwardRef<TextInput, SheetTextInputProps>(
  function SheetTextInput({ testID, ...props }, ref) {
    // Outside a gorhom sheet, gorhom's input would throw, so a plain input
    // keeps a misplaced field working instead.
    const insideSheet = useBottomSheetInternal(true) !== null;
    if (!insideSheet) {
      return <TextInput ref={ref} testID={testID} {...props} />;
    }
    return (
      <BottomSheetTextInput {...gorhomInputProps({ testID, ...props }, ref)} />
    );
  },
);
