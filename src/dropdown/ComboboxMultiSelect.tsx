/** Input-backed chip multi-select for combobox forms. */
import { Check } from "lucide-react-native";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { announce } from "../announcer";
import { hideWebOutline } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import type { SharedUiTheme } from "../theme";

import { ComboboxPopover } from "./ComboboxPopover";
import {
  DropdownList,
  DropdownListEntry,
  dropdownRowDomId,
} from "./DropdownList";
import type { DropdownHighlightVariant } from "./DropdownList";
import { comboboxInputA11y, filterComboboxOptions } from "./comboboxModel";
import { useComboboxNavigation } from "./useComboboxNavigation";

export type ComboboxMultiSelectOption = {
  color?: string;
  label: string;
  mark?: string;
  value: string;
};

export function ComboboxMultiSelect({
  footer,
  highlightVariant,
  onChange,
  options,
  placeholder = "Search to add...",
  values,
}: {
  footer?: string;
  /** How the keyboard-focused row is highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  onChange: (values: string[]) => void;
  options: ComboboxMultiSelectOption[];
  placeholder?: string;
  values: string[];
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createComboboxMultiSelectStyles(theme), [theme]);
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.filter((option) => values.includes(option.value));
  const filtered = useMemo(
    () => filterComboboxOptions(options, query),
    [options, query],
  );
  const entries = entriesForOptions(
    filtered,
    values,
    (value) => {
      if (!values.includes(value)) {
        onChange([...values, value]);
      }
      setQuery("");
    },
    theme,
    styles,
    footer,
  );
  const navigation = useComboboxNavigation({
    entries,
    onClose: () => setOpen(false),
    onOpen: () => setOpen(true),
    open,
  });

  const reactId = useId();
  const listId = `${reactId}-list`;
  const activeDescendant =
    open && navigation.activeId
      ? dropdownRowDomId(listId, navigation.activeId)
      : undefined;

  // Announce the result count so screen readers hear matches change as the
  // query filters, without focus leaving the input (WCAG 4.1.3).
  const matchCount = filtered.length;
  useEffect(() => {
    if (!open || !query.trim()) {
      return;
    }
    announce(
      matchCount === 0
        ? "No matching options"
        : `${matchCount} ${matchCount === 1 ? "option" : "options"} available`,
    );
  }, [matchCount, open, query]);

  return (
    <View ref={anchorRef} style={styles.wrap}>
      <Pressable onPress={() => setOpen(true)} style={styles.control}>
        {selected.map((option) => (
          <View key={option.value} style={styles.chip}>
            <Text numberOfLines={1} style={styles.chipText}>
              {option.label}
            </Text>
            <Pressable
              accessibilityLabel={`Remove ${option.label}`}
              accessibilityRole="button"
              onPress={() =>
                onChange(values.filter((value) => value !== option.value))
              }
              style={styles.chipRemove}
            >
              {/* The visible "x" is decorative — the Pressable's name is
                  "Remove {label}". Hide it from AT so the name is not polluted
                  by the glyph (WCAG 2.5.3 Label in Name). */}
              <Text aria-hidden style={styles.chipRemoveText}>
                x
              </Text>
            </Pressable>
          </View>
        ))}
        <TextInput
          onChangeText={setQuery}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          style={[styles.input, hideWebOutline]}
          value={query}
          {...comboboxInputA11y({ activeDescendant, controls: listId, open })}
          {...navigation.keyProps}
        />
      </Pressable>
      <ComboboxPopover
        anchorRef={anchorRef}
        onClose={() => setOpen(false)}
        open={open}
      >
        {(placement) => (
          <DropdownList
            activeId={navigation.activeId}
            entries={entries}
            highlightVariant={highlightVariant}
            label={placeholder}
            listId={listId}
            listRole="listbox"
            maxHeight={placement.maxHeight}
            onActiveIdChange={navigation.setActiveId}
            onClose={() => setOpen(false)}
          />
        )}
      </ComboboxPopover>
    </View>
  );
}

function entriesForOptions(
  options: ComboboxMultiSelectOption[],
  values: string[],
  onSelect: (value: string) => void,
  theme: SharedUiTheme,
  styles: ComboboxMultiSelectStyles,
  footer?: string,
): DropdownListEntry[] {
  const optionRows: DropdownListEntry[] = options.map((option) => {
    const selected = values.includes(option.value);
    return {
      disabled: selected,
      id: option.value,
      label: option.label,
      leading: <OptionMark option={option} styles={styles} />,
      onPress: () => onSelect(option.value),
      right: selected ? (
        <Check color={theme.colors.primaryDeep} size={15} />
      ) : null,
      selected,
      type: "item",
    };
  });
  const rows: DropdownListEntry[] =
    optionRows.length > 0
      ? optionRows
      : [{ id: "empty", label: "No matching options", type: "section" }];
  if (footer) {
    rows.push({ id: "footer", label: footer, type: "section" });
  }
  return rows;
}

function OptionMark({
  option,
  styles,
}: {
  option: ComboboxMultiSelectOption;
  styles: ComboboxMultiSelectStyles;
}) {
  return (
    <View
      style={[
        styles.mark,
        option.color ? { backgroundColor: option.color } : null,
      ]}
    >
      <Text style={styles.markText}>
        {option.mark ?? option.label[0] ?? "?"}
      </Text>
    </View>
  );
}

function createComboboxMultiSelectStyles(theme: SharedUiTheme) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  return StyleSheet.create({
    chip: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      maxWidth: "100%",
      paddingHorizontal: 9,
      paddingVertical: 4,
    },
    chipRemove: {
      alignItems: "center",
      height: 18,
      justifyContent: "center",
      width: 18,
    },
    chipRemoveText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 15,
    },
    chipText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    control: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      minHeight: 42,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    input: {
      ...baseText,
      color: theme.colors.ink,
      flexGrow: 1,
      fontSize: 13,
      minWidth: 130,
      padding: 0,
    },
    mark: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    markText: { ...baseText, color: "#fff", fontSize: 11, fontWeight: "800" },
    wrap: { position: "relative" },
  });
}

type ComboboxMultiSelectStyles = ReturnType<
  typeof createComboboxMultiSelectStyles
>;
