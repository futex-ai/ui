/** Input-backed chip multi-select for combobox forms. */
import { useMemo } from "react";
import { Pressable, Text, TextInput, View } from "../primitives/reactNative";

import { useFocusRing } from "../focusRing";
import { LabelInfo } from "../input";
import { useSharedUiTheme } from "../theme";
import { useTouchSurface } from "../touchSurface";

import { ComboboxPopover } from "./ComboboxPopover";
import { DropdownList } from "./DropdownList";
import { comboboxInputA11y } from "./comboboxModel";
import { createComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type { ComboboxMultiSelectProps } from "./comboboxMultiSelectTypes";
import { useComboboxMultiSelectState } from "./useComboboxMultiSelectState";

export function ComboboxMultiSelect({
  accessibilityLabel,
  autoFocus = false,
  borderRadius,
  error,
  focusIndicator,
  footer,
  highlightVariant,
  hint,
  invalid: invalidProp = false,
  label,
  labelInfo,
  labelInfoIcon,
  labelInfoLabel,
  onChange,
  options,
  placeholder = "Search to add...",
  required = false,
  singleLine = false,
  size = "md",
  testID,
  values,
}: ComboboxMultiSelectProps) {
  const theme = useSharedUiTheme();
  const focus = useFocusRing({
    indicator: focusIndicator,
    target: "descendant",
  });
  const touch = useTouchSurface();
  const styles = useMemo(
    () =>
      createComboboxMultiSelectStyles(
        theme,
        borderRadius,
        size,
        singleLine,
        touch,
      ),
    [theme, borderRadius, singleLine, size, touch],
  );
  const {
    activeDescendant,
    anchorRef,
    autoFocusAtRef,
    describedByA11y,
    entries,
    errorId,
    hiddenSelectedCount,
    hintId,
    inputRef,
    invalid,
    labelId,
    labelInfoName,
    listId,
    navigation,
    open,
    query,
    setOpen,
    setQuery,
    visibleSelected,
  } = useComboboxMultiSelectState({
    autoFocus,
    error,
    footer,
    hint,
    invalidProp,
    label,
    labelInfo,
    labelInfoLabel,
    onChange,
    options,
    singleLine,
    styles,
    values,
  });

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
            inputRef.current?.focus();
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
          {visibleSelected.map((option) => (
            <View key={option.value} style={styles.chip}>
              <Text numberOfLines={1} style={styles.chipText}>
                {option.label}
              </Text>
              {singleLine ? null : (
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
              )}
            </View>
          ))}
          {hiddenSelectedCount > 0 ? (
            <View style={[styles.chip, styles.chipSummary]}>
              <Text
                accessibilityLabel={`${hiddenSelectedCount} more selected`}
                style={styles.chipText}
              >
                +{hiddenSelectedCount}
              </Text>
            </View>
          ) : null}
          <TextInput
            {...focus.focusTargetProps}
            accessibilityHint={error ?? hint}
            // Name the input from the visible label via `aria-labelledby` (so the
            // accessible name IS the visible text — WCAG 2.5.3), unless the caller
            // supplied an explicit `accessibilityLabel`, which then wins on both
            // platforms. Mirrors `Input`/`InputFrame`.
            accessibilityLabel={accessibilityLabel}
            aria-invalid={invalid}
            aria-labelledby={
              accessibilityLabel === undefined && label ? labelId : undefined
            }
            aria-required={required}
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
            {...comboboxInputA11y({ activeDescendant, controls: listId, open })}
            {...describedByA11y}
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
              label={label ?? placeholder}
              listId={listId}
              listRole="listbox"
              maxHeight={placement.maxHeight}
              onActiveIdChange={navigation.setActiveId}
              onClose={() => setOpen(false)}
            />
          )}
        </ComboboxPopover>
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
