/**
 * Typed in-cell editors. Each reuses a library primitive and commits an
 * already-typed value:
 *   text → Input, number → Input (decimal) with validation, date → DateField
 *   (`variant="wheel"`, which portals — the calendar variant clips in the grid's
 *   scroll container), singleSelect → DropdownMenu (`highlightVariant="ring"` to
 *   avoid the solid-fill text-inversion gotcha). multiSelect is added in M6.
 *
 * `onCommit(value, moveNext)` — moveNext (Enter) advances the active cell down.
 */
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { DateField } from "../date";
import {
  ComboboxMultiSelect,
  DropdownMenu,
  type DropdownListEntry,
} from "../dropdown";
import { InputFrame } from "../input";
import type { SharedUiTheme } from "../theme";

import { OptionPill, resolveOptionColor } from "./dataGridCellContent";
import type {
  DataGridCellValue,
  DataGridColumn,
  DataGridFieldType,
} from "./types";

/** Whether a field type has an in-cell editor (gates edit entry). */
export function hasCellEditor(_type: DataGridFieldType): boolean {
  return true;
}

export type CellEditorProps = {
  column: DataGridColumn;
  value: DataGridCellValue;
  fontSize: number;
  theme: SharedUiTheme;
  /** Commit a value; `moveNext` (Enter) advances the active cell down + closes. */
  onCommit: (value: DataGridCellValue, moveNext: boolean) => void;
  /** Live value update that does NOT close the editor (multi-select toggles). */
  onChange?: (value: DataGridCellValue) => void;
  onCancel: () => void;
};

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

/**
 * Autofocus a freshly-mounted editor input and guard against the spurious blur
 * that the opening double-press pointer-up fires before focus settles: returns
 * `shouldCommitOnBlur()` (false during the ~250ms settle window) so the editor
 * re-focuses instead of committing the unchanged value and closing immediately.
 */
function useEditorAutofocus(inputRef: React.RefObject<TextInput | null>) {
  const mountAtRef = useRef(0);
  useEffect(() => {
    mountAtRef.current = Date.now();
    inputRef.current?.focus();
  }, [inputRef]);
  return () => Date.now() - mountAtRef.current >= 250;
}

function useEscapeKey(onCancel: () => void) {
  // RNW's TextInput swallows a forwarded onKeyDown, so listen on the document for
  // Escape while the editor is mounted (the pattern the dropdown filter uses).
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onCancel]);
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
  useEscapeKey(onCancel);
  return (
    <DateField
      label={column.label}
      onChange={(iso) => onCommit(iso === "" ? null : iso, false)}
      size="sm"
      value={value == null ? "" : String(value)}
      variant="wheel"
    />
  );
}

function SingleSelectEditor({
  column,
  value,
  fontSize,
  theme,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const committedRef = useRef(false);
  const options = column.options ?? [];
  const current = options.find((option) => option.id === value);
  const entries: DropdownListEntry[] = options.map((option) => ({
    id: option.id,
    label: option.label,
    leading: (
      <View
        style={{
          backgroundColor: resolveOptionColor(theme, option.color)
            .backgroundColor,
          borderRadius: 8,
          height: 12,
          width: 12,
        }}
      />
    ),
    onPress: () => {
      committedRef.current = true;
      onCommit(option.id, false);
    },
    selected: option.id === value,
    type: "item",
  }));
  return (
    <DropdownMenu
      accessibilityLabel={column.label}
      defaultOpen
      entries={entries}
      highlightVariant="ring"
      minWidth={180}
      onOpenChange={(open) => {
        if (!open && !committedRef.current) {
          onCancel();
        }
      }}
    >
      <Pressable
        accessibilityLabel={`Edit ${column.label}`}
        accessibilityRole="button"
      >
        {current ? (
          <OptionPill
            colors={resolveOptionColor(theme, current.color)}
            fontSize={fontSize}
            label={current.label}
          />
        ) : (
          <Text style={{ color: theme.colors.placeholder, fontSize }}>
            Select…
          </Text>
        )}
      </Pressable>
    </DropdownMenu>
  );
}

function MultiSelectEditor({
  column,
  value,
  theme,
  onChange,
  onCancel,
}: CellEditorProps) {
  const rootRef = useRef<View>(null);
  useEscapeKey(onCancel);
  // End editing on a press outside the editor (live changes are already saved).
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handler = (event: Event) => {
      const target = event.target as Element | null;
      // The combobox's option list is portaled outside the editor root, so a
      // press on an option must not be treated as "outside" (it would close
      // editing before the selection registers).
      if (target?.closest?.('[role="listbox"]')) {
        return;
      }
      const root = rootRef.current as unknown as {
        contains?: (n: Node) => boolean;
      } | null;
      if (root?.contains && !root.contains(event.target as Node)) {
        onCancel();
      }
    };
    const id = setTimeout(
      () => document.addEventListener("pointerdown", handler, true),
      0,
    );
    return () => {
      clearTimeout(id);
      document.removeEventListener("pointerdown", handler, true);
    };
  }, [onCancel]);

  const options = (column.options ?? []).map((option) => ({
    color: resolveOptionColor(theme, option.color).backgroundColor,
    label: option.label,
    mark: option.label[0]?.toUpperCase(),
    value: option.id,
  }));
  const values = Array.isArray(value) ? value : [];
  return (
    <View ref={rootRef}>
      <ComboboxMultiSelect
        highlightVariant="ring"
        onChange={(next) => onChange?.(next)}
        options={options}
        placeholder="Add…"
        values={values}
      />
    </View>
  );
}
