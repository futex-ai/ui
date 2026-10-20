/** Input-backed chip multi-select for combobox forms. */
import { useId, useMemo, useRef } from "react";
import { Pressable, Text, TextInput, View } from "../primitives/reactNative";

import { devWarn } from "../devWarn";
import { useFocusRing } from "../focusRing";
import { LabelInfo } from "../input";
import type { SharedUiTheme } from "../theme";
import { useSharedUiTheme } from "../theme";

import { ComboboxChips } from "./ComboboxOptionParts";
import type { ComboboxChipPalette } from "./ComboboxOptionParts";
import { ComboboxPopover } from "./ComboboxPopover";
import { ComboboxSheet, ComboboxSheetTrigger } from "./ComboboxSheet";
import {
  DropdownList,
  DropdownListEntry,
  dropdownRowDomId,
} from "./DropdownList";
import { comboboxInputA11y } from "./comboboxModel";
import { comboboxOptionEntry } from "./comboboxMultiSelectEntries";
import {
  comboboxFieldDescriptionA11y,
  comboboxSearchInputA11y,
} from "./comboboxSearchInputA11y";
import type { ComboboxSearchInputPlacement } from "./comboboxSearchInputA11y";
import type {
  ComboboxOptionSection,
  ComboboxSelection,
} from "./comboboxMultiSelectModel";
import {
  MULTI_SELECT_SIZES,
  createComboboxMultiSelectStyles,
} from "./comboboxMultiSelectStyles";
import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
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
  const entries = entriesForOptions(
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
  // The ⓘ button anchors to the label row, so it needs a label to sit beside.
  if (labelInfo && !label) {
    devWarn(
      "ComboboxMultiSelect: `labelInfo` needs a `label` to anchor the ⓘ " +
        "button; it is ignored without one.",
    );
  }
  const labelInfoName =
    labelInfoLabel ??
    (label ? `More information about ${label}` : "More information");
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
      {label ? (
        <View style={styles.labelRow}>
          {/* The label <Text> carries its own `nativeID`, so the input's
              `aria-labelledby` name is the visible label text alone — the ⓘ
              button is a sibling, never folded into the accessible name. */}
          <Text nativeID={labelId} style={styles.label}>
            {label}
            {/* Visual-only `*`; the required state is conveyed programmatically
                via `aria-required`. Hide it from AT so it does not leak into the
                input's `aria-labelledby` name. */}
            {required ? (
              <Text aria-hidden style={styles.required}>
                {" *"}
              </Text>
            ) : null}
          </Text>
          {labelInfo ? (
            <LabelInfo
              accessibilityLabel={labelInfoName}
              icon={labelInfoIcon}
              info={labelInfo}
            />
          ) : null}
        </View>
      ) : null}
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
      {error ? (
        // `role="alert"` (assertive live region) announces a newly-shown
        // validation message without moving focus — WCAG 2.1 4.1.3 (AA).
        <Text
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          nativeID={errorId}
          style={styles.error}
        >
          {error}
        </Text>
      ) : null}
      {hint ? (
        <Text nativeID={hintId} style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Option rows under their group headings, then the empty state and the note. */
function entriesForOptions(
  sections: ComboboxOptionSection<ComboboxMultiSelectOption>[],
  selection: ComboboxSelection,
  onSelect: (value: string) => void,
  styles: ComboboxMultiSelectStyles,
  footer?: string,
): DropdownListEntry[] {
  const optionRows: DropdownListEntry[] = sections.flatMap((section) => [
    ...(section.title
      ? [{ id: section.id, label: section.title, type: "section" as const }]
      : []),
    ...section.options.map((option) =>
      comboboxOptionEntry(option, selection, onSelect, styles),
    ),
  ]);
  const rows: DropdownListEntry[] =
    optionRows.length > 0
      ? optionRows
      : [{ id: "empty", label: "No matching options", type: "section" }];
  if (footer) {
    rows.push({ id: "footer", label: footer, type: "section" });
  }
  return rows;
}

/**
 * Chip colors per `chipTone`, shared by the field's chips and the sheet's.
 * `default` is the theme's primary tint (`primarySoft` fill, `primaryDeep`
 * text); `muted` is a neutral grey for a value that is still applied but no
 * longer current, such as an archived tag. Both texts clear AA on their fill.
 */
function comboboxChipPalette(theme: SharedUiTheme): ComboboxChipPalette {
  return {
    default: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
      color: theme.colors.primaryDeep,
    },
    muted: {
      backgroundColor: theme.colors.soft,
      borderColor: theme.colors.border2,
      color: theme.colors.ink2,
    },
  };
}
