/** Native RichTextEditor fallback that edits raw markdown in a shared textarea. */
import { useMemo } from "react";
import type { ViewStyle } from "react-native";

import { Textarea } from "../input";

import type { RichTextEditorProps } from "./richTextTypes";

/**
 * Rich text editor public component. Native platforms use a markdown textarea
 * with the same value/onChange contract while the web build resolves to the
 * contentEditable implementation.
 */
export function RichTextEditor({
  autoFocus,
  label,
  maxHeight,
  minHeight,
  onChangeMarkdown,
  placeholder,
  readOnly = false,
  testID,
  value = "",
}: RichTextEditorProps) {
  const style = useMemo<ViewStyle>(
    () => ({
      maxHeight,
      minHeight,
    }),
    [maxHeight, minHeight],
  );
  return (
    <Textarea
      autoFocus={autoFocus}
      editable={!readOnly}
      label={label}
      onChangeText={onChangeMarkdown}
      placeholder={placeholder}
      style={style}
      testID={testID}
      value={value}
    />
  );
}
