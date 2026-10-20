/** Input-backed chip multi-select for combobox forms. */
import { useId, useMemo, useRef } from "react";
import { Pressable, TextInput, View } from "../primitives/reactNative";

import { useFocusRing } from "../focusRing";
import { useSharedUiTheme } from "../theme";

import {
  ComboboxFieldLabel,
  ComboboxFieldMessages,
} from "./ComboboxFieldParts";
import { ComboboxChips, comboboxChipPalette } from "./ComboboxOptionParts";
import { ComboboxPopover } from "./ComboboxPopover";
import { ComboboxSheet, ComboboxSheetTrigger } from "./ComboboxSheet";
import { DropdownList, dropdownRowDomId } from "./DropdownList";
import { comboboxInputA11y } from "./comboboxModel";
import { comboboxOptionEntries } from "./comboboxMultiSelectEntries";
import {
  comboboxFieldDescriptionA11y,
  comboboxSearchInputA11y,
} from "./comboboxSearchInputA11y";
import type { ComboboxSearchInputPlacement } from "./comboboxSearchInputA11y";
import {
  MULTI_SELECT_SIZES,
  createComboboxMultiSelectStyles,
} from "./comboboxMultiSelectStyles";
import type {
  ComboboxMultiSelectFieldProps,
  ComboboxMultiSelectOption,
  ComboboxMultiSelectPickerProps,
} from "./comboboxMultiSelectTypes";
import { useComboboxNavigation } from "./useComboboxNavigation";
import { useComboboxAutoFocus, useComboboxPicker } from "./useComboboxPicker";

export type ComboboxMultiSelectProps = ComboboxMultiSelectFieldProps &
  ComboboxMultiSelectPickerProps & {
    /** Called with the next selected values. */
    onChange: (values: string[]) => void;
    options: ComboboxMultiSelectOption[];
    /** Test identifier forwarded to the root element (`data-testid` on web). */
    testID?: string;
    values: string[];
  };

const NO_LOCKED_VALUES: string[] = [];

export function ComboboxMultiSelect({
  accessibilityLabel,
  autoFocus = false,
  borderRadius,
  error,
  focusIndicator,
  footer,
  footerAction,
  highlightVariant,
  hint,
  invalid: invalidProp = false,
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  lockedValues = NO_LOCKED_VALUES,
  onChange,
  options,
  placeholder = "Search to add...",
  presentation = "popover",
  required = false,
  singleLine = false,
  singlePerGroup = false,
  size = "md",
  testID,
  values,
}: ComboboxMultiSelectProps) {
  const theme = useSharedUiTheme();
  const focus = useFocusRing({
    indicator: focusIndicator,
    target: "descendant",
  });
  const styles = useMemo(
    () =>
      createComboboxMultiSelectStyles(theme, borderRadius, size, singleLine),
    [theme, borderRadius, singleLine, size],
  );
  const palette = useMemo(() => comboboxChipPalette(theme), [theme]);
  const sheet = presentation === "sheet";
  const anchorRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  // The sheet presentation has no input in the field, only its trigger; its
  // search input lives in the sheet.
  const triggerRef = useRef<View>(null);
  const sheetInputRef = useRef<TextInput>(null);
  const autoFocusAtRef = useComboboxAutoFocus(
    autoFocus,
    sheet ? triggerRef : inputRef,
  );
  const picker = useComboboxPicker({
    footerAction,
    lockedValues,
    onChange,
    options,
    singlePerGroup,
    styles,
    values,
  });
  const { close, open, query, setOpen, setQuery } = picker;
  const entries = comboboxOptionEntries(
    picker.sections,
    picker.selection,
    picker.toggle,
    styles,
    footer,
  );
  const navigation = useComboboxNavigation({
    entries: [...entries, ...picker.footerEntries],
    // The sheet is a dialog with its own buttons: only its search input's keys
    // drive the list, so Enter on Done or on a chip's remove button stays put.
    keyTarget: sheet ? sheetInputRef : undefined,
    onClose: close,
    onOpen: () => setOpen(true),
    open,
  });

  const reactId = useId();
  const listId = `${reactId}-list`;
  const labelId = `${reactId}-label`;
  const errorId = `${reactId}-error`;
  const hintId = `${reactId}-hint`;
  const activeDescendant =
    open && navigation.activeId
      ? dropdownRowDomId(listId, navigation.activeId)
      : undefined;

  const invalid = invalidProp || Boolean(error);
  // The field's error and hint describe the search input and the sheet
  // button. `document` is absent on native, the same gate as `Platform.OS`.
  const fieldText = {
    error,
    hint,
    ids: { errorId, hintId, labelId },
    isWeb: typeof document !== "undefined",
  };
  const searchInputA11y = (placement: ComboboxSearchInputPlacement) =>
    comboboxSearchInputA11y({
      ...fieldText,
      accessibilityLabel,
      invalid,
      label,
      placeholder,
      placement,
      required,
    });

  const chipProps = {
    isLocked: (value: string) => picker.selection.locked.has(value),
    onRemove: picker.remove,
    options: picker.selected,
    palette,
  };
  const listProps = {
    activeId: navigation.activeId,
    entries,
    // The search input controls the list and keeps focus.
    focusable: false,
    footerEntries: picker.footerEntries,
    groupSections: true,
    highlightVariant,
    label: label ?? placeholder,
    listId,
    listRole: "listbox" as const,
    onActiveIdChange: navigation.setActiveId,
    onClose: close,
  };

  return (
    <View
      style={label || error || hint ? styles.field : undefined}
      testID={testID}
    >
      <ComboboxFieldLabel
        label={label}
        labelId={labelId}
        labelInfo={labelInfo}
        labelInfoIcon={labelInfoIcon}
        labelInfoLabel={labelInfoLabel}
        required={required}
        styles={styles}
      />
      <View ref={anchorRef} style={styles.wrap}>
        <Pressable
          {...focus.focusRingProps}
          onPress={() => {
            (sheet ? triggerRef : inputRef).current?.focus();
            setOpen(true);
          }}
          style={[
            styles.control,
            invalid
              ? styles.controlInvalid
              : focus.focused && focus.indicator !== "none"
                ? styles.controlActive
                : null,
            focus.focusRingVariables,
          ]}
          tabIndex={-1}
        >
          <ComboboxChips
            {...chipProps}
            iconSize={MULTI_SELECT_SIZES[size].chipIconSize}
            singleLine={singleLine}
            styles={styles}
          />
          {sheet ? (
            <ComboboxSheetTrigger
              accessibilityLabel={
                accessibilityLabel ??
                [label, placeholder].filter(Boolean).join(", ")
              }
              description={comboboxFieldDescriptionA11y(fieldText)}
              focus={focus}
              invalid={invalid}
              onPress={() => setOpen(true)}
              open={open}
              placeholder={placeholder}
              styles={styles}
              triggerRef={triggerRef}
            />
          ) : (
            <TextInput
              {...focus.focusTargetProps}
              {...searchInputA11y("field")}
              onChangeText={setQuery}
              onBlur={() => {
                focus.onBlur();
                // An in-place editor can mount during pointer-down. Ignore the
                // matching release's transient focus transfer so the newly
                // mounted search input remains ready for immediate typing.
                if (autoFocus && Date.now() - autoFocusAtRef.current < 250) {
                  inputRef.current?.focus();
                }
              }}
              onFocus={(event) => {
                focus.onFocus(event);
                setOpen(true);
              }}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.placeholder}
              ref={inputRef}
              style={styles.input}
              value={query}
              {...comboboxInputA11y({
                activeDescendant,
                controls: listId,
                open,
              })}
              {...navigation.keyProps}
            />
          )}
        </Pressable>
        {sheet ? (
          <ComboboxSheet
            activeDescendant={activeDescendant}
            chips={chipProps}
            focusIndicator={focusIndicator}
            inputA11y={searchInputA11y("sheet")}
            inputKeyProps={navigation.keyProps}
            inputRef={sheetInputRef}
            label={label ?? accessibilityLabel ?? placeholder}
            list={listProps}
            onClose={close}
            onQueryChange={setQuery}
            open={open}
            placeholder={placeholder}
            query={query}
            size={size}
          />
        ) : (
          <ComboboxPopover anchorRef={anchorRef} onClose={close} open={open}>
            {(placement) => (
              <DropdownList {...listProps} maxHeight={placement.maxHeight} />
            )}
          </ComboboxPopover>
        )}
      </View>
      <ComboboxFieldMessages
        error={error}
        errorId={errorId}
        hint={hint}
        hintId={hintId}
        styles={styles}
      />
    </View>
  );
}
