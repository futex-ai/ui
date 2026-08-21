/** Input-backed chip multi-select for combobox forms. */
import { Check, LucideIcon } from "lucide-react-native";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { announce } from "../announcer";
import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { useFocusRing } from "../focusRing";
import { inputSizeTokens, LabelInfo } from "../input";
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

export type ComboboxMultiSelectProps = {
  /**
   * Accessible name for the search input. When a `label` is set the input is
   * already named from it (via `aria-labelledby`); pass this to name the bare,
   * label-less variant, or to override the name where `aria-labelledby` is not
   * honoured (e.g. iOS, which does not map it). Mirrors `Input`.
   */
  accessibilityLabel?: string;
  /** Focus the search input when the control mounts. */
  autoFocus?: boolean;
  /**
   * Corner radius (px) of the control box. Defaults to `theme.radii.md`; pass
   * `0` for square corners (e.g. an in-grid cell editor that must match a
   * square container).
   */
  borderRadius?: number;
  /** Disable the shared focus glow and use the browser's default outline. */
  disableFocusRing?: boolean;
  /** Validation message shown below the control; turns its border rose. */
  error?: string | null;
  footer?: string;
  /** How the keyboard-focused row is highlighted. Defaults to `"solid"`. */
  highlightVariant?: DropdownHighlightVariant;
  /** Helper text shown below the control. */
  hint?: string;
  /** Force the rose invalid border independent of `error`. */
  invalid?: boolean;
  /** Field label shown above the control. Omit for a bare, label-less control. */
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
  onChange: (values: string[]) => void;
  options: ComboboxMultiSelectOption[];
  placeholder?: string;
  /** Marks the field required (adds a `*` to the label, wires `aria-required`). */
  required?: boolean;
  /**
   * Keep the control at one fixed-height row instead of wrapping selected chips,
   * showing the first selection plus a `+N` summary for the remainder. Useful
   * inside dense table and data-grid cells.
   */
  singleLine?: boolean;
  /** Control density. Defaults to `md`, matching the shared input size scale. */
  size?: ControlSize;
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  values: string[];
};

export function ComboboxMultiSelect({
  accessibilityLabel,
  autoFocus = false,
  borderRadius,
  disableFocusRing = false,
  error,
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
  const focus = useFocusRing({ disabled: disableFocusRing });
  const styles = useMemo(
    () =>
      createComboboxMultiSelectStyles(theme, borderRadius, size, singleLine),
    [theme, borderRadius, singleLine, size],
  );
  const anchorRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const autoFocusAtRef = useRef(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    autoFocusAtRef.current = Date.now();
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }
    const frame = requestAnimationFrame(focusInput);
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);
  const selected = options.filter((option) => values.includes(option.value));
  const visibleSelected = singleLine ? selected.slice(0, 1) : selected;
  const hiddenSelectedCount = selected.length - visibleSelected.length;
  const filtered = useMemo(
    () => filterComboboxOptions(options, query),
    [options, query],
  );
  const entries = entriesForOptions(
    filtered,
    values,
    (value) => {
      onChange(
        values.includes(value)
          ? values.filter((selectedValue) => selectedValue !== value)
          : [...values, value],
      );
      setQuery("");
    },
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
  // Describe the input with whichever messages exist (error first so it reads
  // before the hint). RNW does NOT map `accessibilityHint` to `aria-describedby`
  // (WCAG 3.3.1 / 1.3.1), so emit the literal `aria-*` ourselves — as a cast
  // object because RNW's bundled types omit these attributes on `TextInput`.
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;
  const describedByA11y =
    typeof document === "undefined"
      ? {}
      : ({
          "aria-describedby": describedBy,
          "aria-errormessage": error ? errorId : undefined,
        } as unknown as object);

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
          onPress={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
          style={[
            styles.control,
            invalid
              ? styles.controlInvalid
              : focus.focused
                ? styles.controlActive
                : null,
            focus.focusVisible ? focus.focusRingStyle : null,
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
            style={[styles.input, focus.webOutlineReset]}
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

function entriesForOptions(
  options: ComboboxMultiSelectOption[],
  values: string[],
  onSelect: (value: string) => void,
  styles: ComboboxMultiSelectStyles,
  footer?: string,
): DropdownListEntry[] {
  const optionRows: DropdownListEntry[] = options.map((option) => {
    const selected = values.includes(option.value);
    return {
      id: option.value,
      label: option.label,
      leading: <OptionMark option={option} styles={styles} />,
      onPress: () => onSelect(option.value),
      // Tinted from the row's content color rather than pinned to `primaryDeep`,
      // which all but vanishes (~1.3:1) on the solid active fill.
      right: selected
        ? ({ color }: { color: string }) => <Check color={color} size={15} />
        : null,
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

function createComboboxMultiSelectStyles(
  theme: SharedUiTheme,
  borderRadius = theme.radii.md,
  size: ControlSize = "md",
  singleLine = false,
) {
  const baseText = { fontFamily: theme.fonts.sans } as const;
  const inputSize = inputSizeTokens(size);
  const sizing = MULTI_SELECT_SIZES[size];
  return StyleSheet.create({
    chip: {
      alignItems: "center",
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      flexShrink: singleLine ? 1 : 0,
      gap: sizing.gap,
      maxWidth: "100%",
      paddingHorizontal: sizing.chipPaddingHorizontal,
      paddingVertical: sizing.chipPaddingVertical,
    },
    chipRemove: {
      alignItems: "center",
      height: sizing.removeSize,
      justifyContent: "center",
      width: sizing.removeSize,
    },
    chipRemoveText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      fontSize: sizing.chipFontSize,
      fontWeight: "800",
      lineHeight: sizing.chipLineHeight,
    },
    chipSummary: {
      flexShrink: 0,
      paddingHorizontal: singleLine ? 5 : sizing.chipPaddingHorizontal,
    },
    chipText: {
      ...baseText,
      color: theme.colors.primaryDeep,
      flexShrink: singleLine ? 1 : 0,
      fontSize: sizing.chipFontSize,
      fontWeight: "700",
      lineHeight: sizing.chipLineHeight,
      minWidth: 0,
    },
    control: {
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.controlBorder,
      borderRadius,
      borderWidth: 1,
      flexDirection: "row",
      flexWrap: singleLine ? "nowrap" : "wrap",
      gap: singleLine ? 3 : sizing.gap,
      height: singleLine ? inputSize.boxHeight : undefined,
      minHeight: inputSize.boxHeight,
      overflow: singleLine ? "hidden" : "visible",
      paddingHorizontal: singleLine ? 6 : sizing.controlPaddingHorizontal,
      paddingVertical: sizing.controlPaddingVertical,
    },
    controlActive: { borderColor: theme.colors.primary },
    // Rose border + soft ring for the invalid state (matches DropdownSelector).
    controlInvalid: {
      borderColor: theme.colors.rose,
      boxShadow: `0 0 0 2px ${theme.colors.roseSoft}`,
    },
    error: {
      ...baseText,
      color: theme.colors.rose,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
    // The label + control + messages stack.
    field: { gap: 6 },
    hint: {
      ...baseText,
      color: theme.colors.muted,
      fontSize: 11,
      lineHeight: 16.5,
    },
    input: {
      ...baseText,
      color: theme.colors.ink,
      flex: singleLine ? 1 : undefined,
      flexGrow: singleLine ? undefined : 1,
      flexShrink: 1,
      fontSize: inputSize.inputFontSize,
      minWidth: singleLine ? 28 : 130,
      padding: 0,
    },
    label: {
      ...baseText,
      color: theme.colors.ink2,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 18,
    },
    // The label + optional ⓘ info button share one baseline-centred row.
    labelRow: { alignItems: "center", flexDirection: "row", gap: 4 },
    mark: {
      alignItems: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    markText: {
      ...baseText,
      color: theme.colors.onSolid,
      fontSize: 11,
      fontWeight: "800",
    },
    required: { color: theme.colors.rose },
    wrap: { position: "relative" },
  });
}

const MULTI_SELECT_SIZES = {
  sm: {
    chipFontSize: 11,
    chipLineHeight: 16,
    chipPaddingHorizontal: 7,
    chipPaddingVertical: 1,
    controlPaddingHorizontal: 8,
    controlPaddingVertical: 5,
    gap: 4,
    removeSize: 16,
  },
  md: {
    chipFontSize: 12,
    chipLineHeight: 18,
    chipPaddingHorizontal: 9,
    chipPaddingVertical: 3,
    controlPaddingHorizontal: 8,
    controlPaddingVertical: 6,
    gap: 6,
    removeSize: 18,
  },
  lg: {
    chipFontSize: 13,
    chipLineHeight: 20,
    chipPaddingHorizontal: 10,
    chipPaddingVertical: 4,
    controlPaddingHorizontal: 10,
    controlPaddingVertical: 8,
    gap: 8,
    removeSize: 20,
  },
} as const satisfies Record<ControlSize, object>;

type ComboboxMultiSelectStyles = ReturnType<
  typeof createComboboxMultiSelectStyles
>;
