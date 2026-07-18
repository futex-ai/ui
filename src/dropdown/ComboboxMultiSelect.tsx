/** Input-backed chip multi-select for combobox forms. */
import { Check, LucideIcon } from "lucide-react-native";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { announce } from "../announcer";
import { devWarn } from "../devWarn";
import { hideWebOutline } from "../focusRing";
import { LabelInfo } from "../input";
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
  /** Test identifier forwarded to the root element (`data-testid` on web). */
  testID?: string;
  values: string[];
};

export function ComboboxMultiSelect({
  accessibilityLabel,
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
  testID,
  values,
}: ComboboxMultiSelectProps) {
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
          onPress={() => setOpen(true)}
          style={[styles.control, invalid ? styles.controlInvalid : null]}
        >
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
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.placeholder}
            style={[styles.input, hideWebOutline]}
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
      flexGrow: 1,
      fontSize: 13,
      minWidth: 130,
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
    markText: { ...baseText, color: "#fff", fontSize: 11, fontWeight: "800" },
    required: { color: theme.colors.rose },
    wrap: { position: "relative" },
  });
}

type ComboboxMultiSelectStyles = ReturnType<
  typeof createComboboxMultiSelectStyles
>;
