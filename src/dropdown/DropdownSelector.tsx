/** Single-value selector and read-only selector input surfaces. */
import { ChevronDown, Search } from "lucide-react-native";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { hideWebOutline, hideWebOutlineView, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import { DropdownList, DropdownListEntry } from "./DropdownList";
import { DropdownPortal } from "./DropdownPortal";
import { filterComboboxSections } from "./comboboxModel";
import {
  createDropdownSelectorStyles,
  dropdownMinWidth,
  invalidValueStyle,
  triggerStyle,
  valueStyle,
} from "./dropdownSelectorStyles";
import type { DropdownSelectorStyles } from "./dropdownSelectorStyles";
import { useDropdownSelectorNavigation } from "./useDropdownSelectorNavigation";

export type DropdownSelectorOption = {
  disabled?: boolean;
  label: string;
  right?: ReactNode;
  secondary?: string;
  value: string;
};

export type DropdownSelectorSection = {
  options: DropdownSelectorOption[];
  title?: string;
};

export type SelectorVariant = "field" | "map" | "mobilePeriod" | "pill";

type DropdownSelectorProps = {
  error?: string | null;
  footer?: ReactNode;
  header?: ReactNode;
  hint?: string;
  invalid?: boolean;
  label?: string;
  onValueChange?: (value: string) => void;
  options: DropdownSelectorOption[];
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
  searchable?: boolean;
  sections?: DropdownSelectorSection[];
  value: string;
  variant?: SelectorVariant;
};

export function DropdownSelector(props: DropdownSelectorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownSelectorStyles(theme), [theme]);
  const focus = useFocusRing();
  return <DropdownSelectorView {...props} focus={focus} styles={styles} />;
}

function DropdownSelectorView({
  error,
  focus,
  footer,
  header,
  hint,
  invalid: invalidProp = false,
  label,
  onValueChange,
  options,
  placeholder = "Select an option",
  readOnly = false,
  required = false,
  searchPlaceholder = "Search options",
  searchable = false,
  sections,
  styles,
  value,
  variant = "field",
}: DropdownSelectorProps & {
  focus: ReturnType<typeof useFocusRing>;
  styles: DropdownSelectorStyles;
}) {
  const theme = useSharedUiTheme();
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const grouped = sections ?? [{ options }];
  const flat = grouped.flatMap((section) => section.options);
  const selected = flat.find((option) => option.value === value);
  const display = selected?.label ?? value;
  const interactive = !readOnly && Boolean(onValueChange) && flat.length > 0;

  // Reset the search query whenever the menu closes so the next open starts
  // from the full option list.
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const visibleSections = searchable
    ? filterComboboxSections(grouped, query)
    : grouped;
  const optionEntries = selectorEntries(visibleSections, value, (next) => {
    onValueChange?.(next);
    setOpen(false);
  });
  const entries: DropdownListEntry[] =
    searchable && optionEntries.length === 0
      ? [{ id: "empty", label: "No matching options", type: "section" }]
      : optionEntries;

  // Keyboard navigation runs through a document-level key listener (set up by
  // the hook) rather than the input's own `onKeyDown`, because React Native Web
  // `TextInput` replaces a forwarded `onKeyDown` with its internal handler. The
  // `typeahead` flag keeps the space bar typing into the search query instead
  // of activating the highlighted row.
  const navigation = useDropdownSelectorNavigation({
    entries,
    interactive,
    onClose: () => setOpen(false),
    onOpen: () => setOpen(true),
    open,
    typeahead: searchable,
  });

  const invalid = invalidProp || Boolean(error);
  const accessibleLabel = selectorAccessibleLabel(
    label,
    display || placeholder,
  );
  const searchField = searchable ? (
    <View style={styles.searchField}>
      <Search color={theme.colors.muted} size={15} />
      <TextInput
        accessibilityLabel={searchPlaceholder}
        autoFocus
        onChangeText={setQuery}
        placeholder={searchPlaceholder}
        placeholderTextColor={theme.colors.faint}
        style={[styles.searchInput, hideWebOutline]}
        value={query}
      />
    </View>
  ) : null;

  return (
    <View style={label ? styles.field : null}>
      {label ? (
        <SelectorLabel label={label} required={required} styles={styles} />
      ) : null}
      <Pressable
        accessibilityHint={error ?? hint}
        accessibilityLabel={accessibleLabel}
        accessibilityRole={interactive ? "button" : undefined}
        accessibilityState={{ disabled: !interactive }}
        aria-expanded={interactive ? open : undefined}
        aria-invalid={invalid}
        aria-required={required}
        disabled={!interactive}
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onPress={() => setOpen((current) => !current)}
        ref={anchorRef}
        style={[
          triggerStyle(styles, variant),
          focus.focused ? focus.focusRingStyle : null,
          invalid ? styles.invalid : null,
          invalid && variant === "map" ? styles.mapInvalid : null,
          !interactive ? styles.readOnly : null,
          hideWebOutlineView,
        ]}
        {...navigation.keyProps}
      >
        <Text
          numberOfLines={1}
          style={[
            valueStyle(styles, variant),
            invalid ? invalidValueStyle(styles, variant) : null,
            !display ? styles.placeholder : null,
          ]}
        >
          {display || placeholder}
        </Text>
        <ChevronDown
          color={invalid ? theme.colors.rose : theme.colors.muted}
          size={variant === "field" ? 16 : 13}
        />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <DropdownPortal
        anchorRef={anchorRef}
        minWidth={dropdownMinWidth(variant)}
        onClose={() => setOpen(false)}
        open={open}
      >
        {(placement) => (
          <DropdownList
            activeId={navigation.activeId}
            entries={entries}
            footer={footer}
            header={header}
            maxHeight={placement.maxHeight}
            onActiveIdChange={navigation.setActiveId}
            onClose={() => setOpen(false)}
            search={searchField}
          />
        )}
      </DropdownPortal>
    </View>
  );
}

export function ReadOnlySelector({
  label,
  required = false,
  value,
  variant = "field",
}: {
  label?: string;
  required?: boolean;
  value: string;
  variant?: SelectorVariant;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(() => createDropdownSelectorStyles(theme), [theme]);
  const accessibleLabel = selectorAccessibleLabel(label, value);
  return (
    <View style={label ? styles.field : null}>
      {label ? (
        <SelectorLabel label={label} required={required} styles={styles} />
      ) : null}
      <View
        accessibilityLabel={accessibleLabel}
        style={[triggerStyle(styles, variant), styles.readOnly]}
      >
        <Text numberOfLines={1} style={valueStyle(styles, variant)}>
          {value}
        </Text>
        <ChevronDown
          color={theme.colors.muted}
          size={variant === "field" ? 16 : 13}
        />
      </View>
    </View>
  );
}

function selectorAccessibleLabel(label: string | undefined, value: string) {
  return label ? `${label}, ${value}` : value;
}

function selectorEntries(
  sections: DropdownSelectorSection[],
  value: string,
  onSelect: (value: string) => void,
): DropdownListEntry[] {
  return sections.flatMap((section, sectionIndex) => {
    const sectionRows: DropdownListEntry[] = section.title
      ? [
          {
            id: `section-${sectionIndex}`,
            label: section.title,
            type: "section",
          },
        ]
      : [];
    return [
      ...sectionRows,
      ...section.options.map((option) => ({
        disabled: option.disabled,
        id: option.value,
        label: option.label,
        onPress: () => onSelect(option.value),
        right: option.right,
        secondary: option.secondary,
        selected: option.value === value,
        type: "item" as const,
      })),
    ];
  });
}

function SelectorLabel({
  label,
  required,
  styles,
}: {
  label: string;
  required: boolean;
  styles: DropdownSelectorStyles;
}) {
  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}
