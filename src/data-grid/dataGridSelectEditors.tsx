/**
 * Select in-cell editors: single-select via `DropdownMenu` (opens immediately),
 * multi-select via `ComboboxMultiSelect` (live toggles, ends on outside press).
 * Both use `highlightVariant="ring"` to avoid the solid-fill text-inversion.
 */
import { useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useFocusRing } from "../focusRing";
import { createInputStyles } from "../input";
import {
  ComboboxMultiSelect,
  DropdownMenu,
  type DropdownListEntry,
} from "../dropdown";

import { OptionPill, resolveOptionColor } from "./dataGridCellContent";
import {
  type CellEditorProps,
  useEditorAutofocus,
  useEscapeKey,
} from "./dataGridEditorHooks";

const editorStyles = StyleSheet.create({
  fill: { width: "100%" },
  squareFrame: { borderRadius: 0, width: "100%" },
});

export function SingleSelectEditor({
  column,
  value,
  fontSize,
  theme,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const committedRef = useRef(false);
  const triggerRef = useRef<View>(null);
  const inputStyles = useMemo(() => createInputStyles(theme, "sm"), [theme]);
  const focus = useFocusRing();
  useEditorAutofocus(triggerRef);
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
      style={editorStyles.fill}
    >
      <Pressable
        accessibilityLabel={`Edit ${column.label}`}
        accessibilityRole="button"
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        ref={triggerRef}
        style={[
          inputStyles.box,
          focus.focused ? inputStyles.boxActive : null,
          editorStyles.squareFrame,
          focus.focusVisible ? focus.focusRingStyle : null,
          focus.webOutlineReset,
        ]}
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

export function MultiSelectEditor({
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
        accessibilityLabel={`Edit ${column.label}`}
        autoFocus
        borderRadius={0}
        highlightVariant="ring"
        onChange={(next) => onChange?.(next)}
        options={options}
        placeholder="Add…"
        singleLine
        size="sm"
        values={values}
      />
    </View>
  );
}
