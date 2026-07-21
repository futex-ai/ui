/**
 * Typed in-cell editors. Each reuses a library primitive and commits an
 * already-typed value: text → `InputFrame`, number → `InputFrame` (decimal, with
 * validation), date → `DateInput` (`variant="wheel"`, which portals — the calendar
 * variant clips in the grid's scroll container). Single/multi-select live in
 * {@link dataGridSelectEditors}.
 *
 * `onCommit(value, moveNext)` — moveNext (Enter) advances the active cell down.
 */
import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { DateInput } from "../date";
import { InputFrame } from "../input";

import {
  type CellEditorProps,
  useEditorAutofocus,
  useEscapeKey,
} from "./dataGridEditorHooks";
import { MultiSelectEditor, SingleSelectEditor } from "./dataGridSelectEditors";
import type { DataGridFieldType } from "./types";

export type { CellEditorProps } from "./dataGridEditorHooks";

/** Whether a field type has an in-cell editor (gates edit entry). */
export function hasCellEditor(_type: DataGridFieldType): boolean {
  return true;
}

// In-cell editors square off their bordered box so they read as part of the
// grid (whose cells + frame are square by default) rather than a rounded
// control floating inside a rectangular cell.
const editorStyles = StyleSheet.create({
  squareFrame: { borderRadius: 0 },
});

export function CellEditor(props: CellEditorProps) {
  switch (props.column.fieldType) {
    case "number":
      return <NumberEditor {...props} />;
    case "date":
      return <DateEditor {...props} />;
    case "singleSelect":
      return <SingleSelectEditor {...props} />;
    case "multiSelect":
      return <MultiSelectEditor {...props} />;
    default:
      return <TextEditor {...props} />;
  }
}

function TextEditor({ value, onCommit, onCancel }: CellEditorProps) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const inputRef = useRef<TextInput>(null);
  useEscapeKey(onCancel);
  const shouldCommitOnBlur = useEditorAutofocus(inputRef);
  return (
    <InputFrame
      accessibilityLabel="Edit cell"
      inputRef={inputRef}
      onBlur={() => {
        if (shouldCommitOnBlur()) {
          onCommit(text === "" ? null : text, false);
        } else {
          inputRef.current?.focus();
        }
      }}
      onChangeText={setText}
      onSubmitEditing={() => onCommit(text === "" ? null : text, true)}
      size="sm"
      style={editorStyles.squareFrame}
      value={text}
    />
  );
}

function NumberEditor({ value, onCommit, onCancel, theme }: CellEditorProps) {
  const [text, setText] = useState(value == null ? "" : String(value));
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  useEscapeKey(onCancel);
  const shouldCommitOnBlur = useEditorAutofocus(inputRef);
  const commit = (moveNext: boolean) => {
    const trimmed = text.trim();
    if (trimmed === "") {
      onCommit(null, moveNext);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isNaN(parsed)) {
      setError("Enter a number");
      return;
    }
    setError(null);
    onCommit(parsed, moveNext);
  };
  return (
    <View>
      <InputFrame
        accessibilityLabel="Edit number"
        inputMode="decimal"
        inputRef={inputRef}
        invalid={error !== null}
        onBlur={() => {
          if (shouldCommitOnBlur()) {
            commit(false);
          } else {
            inputRef.current?.focus();
          }
        }}
        onChangeText={(next) => {
          setText(next);
          if (error) {
            setError(null);
          }
        }}
        onSubmitEditing={() => commit(true)}
        size="sm"
        style={editorStyles.squareFrame}
        value={text}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: theme.colors.roseDeep,
            fontSize: 11,
            left: 2,
            position: "absolute",
            top: "100%",
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function DateEditor({ column, value, onCommit, onCancel }: CellEditorProps) {
  // Escape exits the editor; picking a date in the wheel commits + closes.
  // DateInput is the label-less trigger (DateField would render a field label
  // that overflows the fixed-height cell).
  useEscapeKey(onCancel);
  return (
    <DateInput
      borderRadius={0}
      invalid={false}
      label={column.label}
      onChange={(iso) => onCommit(iso === "" ? null : iso, false)}
      size="sm"
      value={value == null ? "" : String(value)}
      variant="wheel"
    />
  );
}
