/** Single-value selector and read-only selector input surfaces. */
import { ChevronDown, LucideIcon, Search } from "lucide-react-native";
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";

import { announce } from "../announcer";
import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { hideWebOutline, hideWebOutlineView, useFocusRing } from "../focusRing";
import { inputIconSize, LabelInfo } from "../input";
import { useSharedUiTheme } from "../theme";

import {
  DropdownList,
  DropdownListEntry,
  dropdownRowDomId,
} from "./DropdownList";
import type { DropdownHighlightVariant } from "./DropdownList";
import { DropdownPortal } from "./DropdownPortal";
import { comboboxInputA11y, filterComboboxSections } from "./comboboxModel";
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
  /**
   * Overridable accessible name for the option row. Defaults to `label`. Set it
   * to disambiguate duplicate visible labels or pin a locale-stable name for
   * `getByRole("option", { name })`.
   */
  accessibilityLabel?: string;
  disabled?: boolean;
  label: string;
  right?: ReactNode;
  /** Trailing text (e.g. an account code); see {@link DropdownListEntry}. */
  rightText?: string;
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
  /** How focused/selected option rows are highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  hint?: string;
  invalid?: boolean;
  label?: string;
  /**
   * Supplementary help text revealed by an ⓘ button after the label. Pressing
   * the button opens a small bubble with this text (built on `Popover`);
   * screen-reader users get it from the button's description. Unlike `hint` it
   * is not shown until requested. Requires a `label` to anchor the button.
   */
  labelInfo?: string;
  /** Icon for the {@link labelInfo} button. Defaults to the lucide `Info` glyph. */
  labelInfoIcon?: LucideIcon;
  /**
   * Accessible name for the {@link labelInfo} button. Defaults to
   * `More information about {label}`.
   */
  labelInfoLabel?: string;
  onValueChange?: (value: string) => void;
  options: DropdownSelectorOption[];
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  searchPlaceholder?: string;
  searchable?: boolean;
  sections?: DropdownSelectorSection[];
  /** Control density of the default `field` variant: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  /**
   * Stable, value-independent accessible name for the trigger. When set, the
   * trigger name stays constant as the selected value changes (the value stays
   * visible in the trigger text), so `getByRole("button", { name })` keeps
   * resolving. Defaults to the composed `"{label}, {value}"` name.
   */
  triggerLabel?: string;
  value: string;
  variant?: SelectorVariant;
};

export function DropdownSelector(props: DropdownSelectorProps) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createDropdownSelectorStyles(theme, props.size ?? "md"),
    [theme, props.size],
  );
  const focus = useFocusRing();
  return <DropdownSelectorView {...props} focus={focus} styles={styles} />;
}

function DropdownSelectorView({
  error,
  focus,
  footer,
  header,
  highlightVariant,
  hint,
  invalid: invalidProp = false,
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  onValueChange,
  options,
  placeholder = "Select an option",
  readOnly = false,
  required = false,
  searchPlaceholder = "Search options",
  searchable = false,
  sections,
  size = "md",
  styles,
  testID,
  triggerLabel,
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
  // The ⓘ button anchors to the label row, so it needs a label to sit beside.
  if (labelInfo && !label) {
    devWarn(
      "DropdownSelector: `labelInfo` needs a `label` to anchor the ⓘ button; " +
        "it is ignored without one.",
    );
  }
  const accessibleLabel = selectorAccessibleLabel(
    label,
    display || placeholder,
  );
  const triggerName = selectorTriggerName(triggerLabel, accessibleLabel);

  // Stable ids tie the trigger to its option list, its active option, and its
  // error/hint text. RNW does not map `accessibilityHint` to `aria-describedby`
  // (WCAG 3.3.1 / 1.3.1), so the visible Text nodes are referenced by id below.
  const reactId = useId();
  const listId = `${reactId}-list`;
  const errorId = `${reactId}-error`;
  const hintId = `${reactId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;
  const activeDescendant =
    open && navigation.activeId
      ? dropdownRowDomId(listId, navigation.activeId)
      : undefined;

  // Announce the searchable result count so screen readers hear matches change
  // without focus moving off the search input (WCAG 4.1.3 Status Messages).
  const matchCount = searchable
    ? optionEntries.filter(
        (entry) => entry.type === "item" || entry.type === "footer",
      ).length
    : null;
  useEffect(() => {
    if (!open || !searchable || matchCount === null || !query.trim()) {
      return;
    }
    announce(
      matchCount === 0
        ? "No matching options"
        : `${matchCount} ${matchCount === 1 ? "option" : "options"} available`,
    );
  }, [matchCount, open, query, searchable]);
  const searchField = searchable ? (
    <View style={styles.searchField}>
      <Search color={theme.colors.muted} size={15} />
      <TextInput
        accessibilityLabel={searchPlaceholder}
        autoFocus
        onChangeText={setQuery}
        placeholder={searchPlaceholder}
        placeholderTextColor={theme.colors.placeholder}
        style={[styles.searchInput, hideWebOutline]}
        value={query}
        // The search input is the combobox text field: it filters the listbox
        // and points `aria-activedescendant` at the active result so arrow keys
        // announce without the input losing focus (WCAG 1.3.1 / 4.1.2 / 2.1.1).
        {...comboboxInputA11y({
          activeDescendant,
          controls: listId,
          open,
        })}
      />
    </View>
  ) : null;

  return (
    <View style={label ? styles.field : null} testID={testID}>
      {label ? (
        <SelectorLabel
          label={label}
          labelInfo={labelInfo}
          labelInfoIcon={labelInfoIcon}
          labelInfoLabel={labelInfoLabel}
          required={required}
          styles={styles}
        />
      ) : null}
      <Pressable
        accessibilityHint={error ?? hint}
        accessibilityLabel={triggerName}
        accessibilityRole={interactive ? "button" : undefined}
        accessibilityState={{ disabled: !interactive }}
        aria-expanded={interactive ? open : undefined}
        aria-invalid={invalid}
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
        // The trigger owns the popup option list (WCAG 4.1.2): it advertises the
        // listbox and links to its id while open. These literal aria props are
        // web-only; native uses the RN a11y state above. They are passed via a
        // cast object because RNW's bundled types omit `aria-haspopup` /
        // `aria-controls`.
        {...selectorTriggerA11y({
          controls: listId,
          describedBy,
          interactive,
          open,
        })}
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
          size={variant === "field" ? inputIconSize(size) : 13}
        />
      </Pressable>
      {error ? (
        <Text nativeID={errorId} style={styles.error}>
          {error}
        </Text>
      ) : null}
      {hint ? (
        <Text nativeID={hintId} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
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
            highlightVariant={highlightVariant}
            label={accessibleLabel}
            listId={listId}
            listRole="listbox"
            maxHeight={placement.maxHeight}
            onActiveIdChange={navigation.setActiveId}
            onClose={() => setOpen(false)}
            // The popup listbox is the choice the required field must be filled
            // from, so it carries `aria-required` (a valid attribute on
            // `role="listbox"`, unlike on the `button` trigger) (WCAG 4.1.2).
            required={required}
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
  size = "md",
  testID,
  value,
  variant = "field",
}: {
  label?: string;
  required?: boolean;
  /** Control density of the default `field` variant: `sm`, `md` (default), or `lg`. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  value: string;
  variant?: SelectorVariant;
}) {
  const theme = useSharedUiTheme();
  const styles = useMemo(
    () => createDropdownSelectorStyles(theme, size),
    [theme, size],
  );
  const accessibleLabel = selectorAccessibleLabel(label, value);
  return (
    <View style={label ? styles.field : null} testID={testID}>
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
          size={variant === "field" ? inputIconSize(size) : 13}
        />
      </View>
    </View>
  );
}

/**
 * Web-only ARIA props for the select-only `button` trigger: it advertises the
 * popup listbox (`aria-haspopup`) and, while open, links to the list container
 * (`aria-controls`). `aria-activedescendant` is deliberately omitted — it is not
 * an allowed attribute on `role=button` (the active option is still conveyed
 * visually and via the option's `aria-selected`). RNW's bundled types omit these
 * literal attributes, so they are built as a cast object (RNW forwards them at
 * runtime; native keeps the RN `accessibilityRole`/`accessibilityState` above).
 */
function selectorTriggerA11y({
  controls,
  describedBy,
  interactive,
  open,
}: {
  controls: string;
  describedBy?: string;
  interactive: boolean;
  open: boolean;
}): object {
  if (Platform.OS !== "web" || !interactive) {
    return describedBy
      ? ({ "aria-describedby": describedBy } as unknown as object)
      : {};
  }
  return {
    "aria-controls": open ? controls : undefined,
    "aria-describedby": describedBy,
    "aria-haspopup": "listbox",
  } as unknown as object;
}

function selectorAccessibleLabel(label: string | undefined, value: string) {
  return label ? `${label}, ${value}` : value;
}

// Prefer an explicit, value-independent `triggerLabel` when the caller wants a
// stable test/automation handle; otherwise fall back to the composed
// `"{label}, {value}"` name so existing selectors keep resolving.
function selectorTriggerName(
  triggerLabel: string | undefined,
  fallback: string,
) {
  return triggerLabel ?? fallback;
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
        accessibilityLabel: option.accessibilityLabel,
        disabled: option.disabled,
        id: option.value,
        label: option.label,
        onPress: () => onSelect(option.value),
        right: option.right,
        rightText: option.rightText,
        secondary: option.secondary,
        selected: option.value === value,
        type: "item" as const,
      })),
    ];
  });
}

function SelectorLabel({
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  required,
  styles,
}: {
  label: string;
  labelInfo?: string;
  labelInfoIcon?: LucideIcon;
  labelInfoLabel?: string;
  required: boolean;
  styles: DropdownSelectorStyles;
}) {
  const labelInfoName = labelInfoLabel ?? `More information about ${label}`;
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {labelInfo ? (
        <LabelInfo
          accessibilityLabel={labelInfoName}
          icon={labelInfoIcon}
          info={labelInfo}
        />
      ) : null}
    </View>
  );
}
