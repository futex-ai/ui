/** The single-value selector: its trigger, messages, and option popup. */
import { ChevronDown, Search } from "../primitives/icons";
import { useMemo } from "react";
import { Pressable, Text, TextInput, View } from "../primitives/reactNative";

import { hideWebOutline, useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";
import { touchControlMetrics } from "../touchMetrics";
import { useTouchSurface } from "../touchSurface";

import { DropdownList } from "./DropdownList";
import { DropdownPortal } from "./DropdownPortal";
import { comboboxInputA11y } from "./comboboxModel";
import { DEFAULT_DROPDOWN_MAX_WIDTH } from "./dropdownGeometry";
import { selectorTriggerA11y } from "./dropdownSelectorModel";
import { selectorChevronSize, SelectorLabel } from "./dropdownSelectorParts";
import type { DropdownSelectorProps } from "./dropdownSelectorProps";
import {
  createDropdownSelectorStyles,
  createTouchDropdownSelectorStyles,
  dropdownMinWidth,
  invalidValueStyle,
  triggerStyle,
  valueStyle,
} from "./dropdownSelectorStyles";
import type { DropdownSelectorStyles } from "./dropdownSelectorStyles";
import { useDropdownSelectorState } from "./useDropdownSelectorState";

export function DropdownSelector(props: DropdownSelectorProps) {
  const theme = useSharedUiTheme();
  const touch = useTouchSurface();
  const styles = useMemo(
    () =>
      touch
        ? createTouchDropdownSelectorStyles(theme)
        : createDropdownSelectorStyles(theme, props.size ?? "md"),
    [theme, props.size, touch],
  );
  const focus = useFocusRing({ indicator: props.focusIndicator });
  return (
    <DropdownSelectorView
      {...props}
      focus={focus}
      styles={styles}
      touch={touch}
    />
  );
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
  menuMaxWidth = DEFAULT_DROPDOWN_MAX_WIDTH,
  menuMinWidth,
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
  touch,
  triggerLabel,
  triggerRef,
  value,
  variant = "field",
}: DropdownSelectorProps & {
  focus: ReturnType<typeof useFocusRing>;
  styles: DropdownSelectorStyles;
  /** Whether a touch surface marks the selector. */
  touch: boolean;
}) {
  const theme = useSharedUiTheme();
  const {
    accessibleLabel,
    activeDescendant,
    anchorRef,
    describedBy,
    display,
    entries,
    errorId,
    hintId,
    interactive,
    invalid,
    listId,
    navigation,
    open,
    query,
    setOpen,
    setQuery,
    setTriggerRef,
    triggerName,
  } = useDropdownSelectorState({
    error,
    hint,
    invalidProp,
    label,
    labelInfo,
    onValueChange,
    options,
    placeholder,
    readOnly,
    searchable,
    sections,
    triggerLabel,
    triggerRef,
    value,
  });
  const searchField = searchable ? (
    <View style={styles.searchField}>
      <Search
        color={theme.colors.muted}
        size={touch ? touchControlMetrics.iconSize : 15}
      />
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
        {...focus.focusRingProps}
        onBlur={focus.onBlur}
        onFocus={focus.onFocus}
        onPress={() => setOpen((current) => !current)}
        ref={setTriggerRef}
        style={[
          triggerStyle(styles, variant),
          invalid ? styles.invalid : null,
          invalid && variant === "map" ? styles.mapInvalid : null,
          !interactive ? styles.readOnly : null,
          focus.focusRingVariables,
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
          size={selectorChevronSize(variant, size, touch)}
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
        fitContentWidth
        maxWidth={menuMaxWidth}
        minWidth={dropdownMinWidth(variant, menuMinWidth)}
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
