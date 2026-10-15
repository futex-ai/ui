/** Input-backed chip multi-select for combobox forms. */
import type { IconComponent } from "../primitives/icons";
import { useId, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "../primitives/reactNative";

import type { ControlSize } from "../controlSize";
import { devWarn } from "../devWarn";
import { type FocusIndicator, useFocusRing } from "../focusRing";
import { inputSizeTokens, LabelInfo } from "../input";
import { useSharedUiTheme } from "../theme";
import type { SharedUiTheme } from "../theme";

import { ComboboxChip } from "./ComboboxChip";
import { ComboboxPopover } from "./ComboboxPopover";
import {
  DropdownList,
  DropdownListEntry,
  dropdownRowDomId,
} from "./DropdownList";
import type { DropdownHighlightVariant } from "./DropdownList";
import { comboboxInputA11y } from "./comboboxModel";
import {
  comboboxOptionCount,
  filterComboboxOptionSections,
  groupComboboxOptions,
  isComboboxValueLocked,
  toggleComboboxValue,
} from "./comboboxMultiSelectModel";
import type {
  ComboboxOptionSection,
  ComboboxSelectionRules,
} from "./comboboxMultiSelectModel";
import {
  comboboxFooterActionRow,
  comboboxOptionRows,
} from "./comboboxMultiSelectRows";
import type { ComboboxRowLook } from "./comboboxMultiSelectRows";
import type {
  ComboboxFooterAction,
  ComboboxMultiSelectOption,
} from "./comboboxMultiSelectTypes";
import { MULTI_SELECT_SIZES } from "./comboboxMultiSelectSizes";
import {
  useComboboxAutoFocus,
  useComboboxResultAnnouncement,
} from "./useComboboxFieldEffects";
import { useComboboxNavigation } from "./useComboboxNavigation";

/** Shared empty default for `lockedValues`, so it keeps a stable identity. */
const NO_VALUES: string[] = [];

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
  /** Validation message shown below the control; turns its border rose. */
  error?: string | null;
  /**
   * How the control shows keyboard focus: the shared `ring` glow, the browser's
   * `outline`, or `none` — no glow, no outline, and no focus border, which
   * leaves the caller to show focus some other way (WCAG 2.1 — 2.4.7 Focus
   * Visible, AA). Defaults to the theme's `focusIndicator`.
   */
  focusIndicator?: FocusIndicator;
  /**
   * Static note shown as the last row of the list, for example which options
   * can be picked. Use {@link footerAction} for a pressable row.
   */
  footer?: string;
  /**
   * A pressable row pinned under the list, outside the scroll area, such as
   * "Create tag". Its `label` and `onPress` receive the trimmed query. Arrow
   * keys reach it after the last option and Enter activates it; activation
   * calls `onPress(query)`, then closes the list and clears the query. It can
   * show alongside {@link footer}.
   */
  footerAction?: ComboboxFooterAction;
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
  labelInfoIcon?: IconComponent;
  /**
   * Accessible name for the {@link labelInfo} button. Defaults to
   * `More information about {label}`.
   */
  labelInfoLabel?: string;
  /**
   * Selected values that cannot be removed: their chips have no remove button
   * and their rows keep the selected state but cannot be toggled. Values that
   * are not in `values` are ignored.
   */
  lockedValues?: string[];
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
  /**
   * Allow at most one selected option per `group`: choosing an option replaces
   * the group's selected value, and choosing the selected option still removes
   * it. A group that holds a locked value cannot change, so its other options
   * are disabled. Options without a group are unaffected. Defaults to `false`.
   */
  singlePerGroup?: boolean;
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
  lockedValues = NO_VALUES,
  onChange,
  options,
  placeholder = "Search to add...",
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
  const anchorRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const keepAutoFocus = useComboboxAutoFocus(autoFocus, inputRef);
  const selected = options.filter((option) => values.includes(option.value));
  const visibleSelected = singleLine ? selected.slice(0, 1) : selected;
  const hiddenSelectedCount = selected.length - visibleSelected.length;
  const rules: ComboboxSelectionRules = {
    lockedValues,
    options,
    singlePerGroup,
    values,
  };
  const sections = useMemo(() => groupComboboxOptions(options), [options]);
  const filtered = useMemo(
    () => filterComboboxOptionSections(sections, query),
    [sections, query],
  );
  const rowLook: ComboboxRowLook = {
    markGlyphColor: theme.colors.onSolid,
    styles,
  };
  const entries = entriesForOptions(
    filtered,
    rules,
    (option) => {
      const next = toggleComboboxValue(option, rules);
      if (next !== values) {
        onChange([...next]);
        setQuery("");
      }
    },
    rowLook,
    footer,
  );
  // The footer action is pinned under the list rather than scrolling with it,
  // and joins keyboard navigation after the last option.
  const footerEntries: DropdownListEntry[] = footerAction
    ? [
        comboboxFooterActionRow(
          footerAction,
          query,
          () => {
            setOpen(false);
            setQuery("");
          },
          styles,
        ),
      ]
    : [];

  const reactId = useId();
  const inputId = `${reactId}-input`;
  const listId = `${reactId}-list`;
  const navigation = useComboboxNavigation({
    entries:
      footerEntries.length > 0 ? [...entries, ...footerEntries] : entries,
    onClose: () => setOpen(false),
    onOpen: () => setOpen(true),
    open,
    // Keys aimed at the chip remove buttons, or anything else outside the
    // input and its list, belong to that control.
    ownerIds: [inputId, listId],
  });
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

  useComboboxResultAnnouncement(comboboxOptionCount(filtered), open, query);

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
            <ComboboxChip
              glyphColors={{
                default: theme.colors.primaryDeep,
                muted: theme.colors.muted,
              }}
              glyphSize={MULTI_SELECT_SIZES[size].chipIconSize}
              key={option.value}
              locked={isComboboxValueLocked(option.value, rules)}
              onRemove={() =>
                onChange(values.filter((value) => value !== option.value))
              }
              option={option}
              styles={styles}
              trailing={!singleLine}
            />
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
              keepAutoFocus();
            }}
            onFocus={(event) => {
              focus.onFocus(event);
              setOpen(true);
            }}
            nativeID={inputId}
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
              footerEntries={footerEntries}
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
  sections: ComboboxOptionSection[],
  rules: ComboboxSelectionRules,
  onSelect: (option: ComboboxMultiSelectOption) => void,
  look: ComboboxRowLook,
  footer?: string,
): DropdownListEntry[] {
  const optionRows: DropdownListEntry[] = comboboxOptionRows(
    sections,
    rules,
    onSelect,
    look,
  );
  const rows: DropdownListEntry[] =
    optionRows.length > 0
      ? optionRows
      : [{ id: "empty", label: "No matching options", type: "section" }];
  if (footer) {
    rows.push({ id: "footer", label: footer, type: "section" });
  }
  return rows;
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
    // A 24px box for the footer action's plus glyph, so its label lines up
    // with the option labels beside their 24px marks.
    actionMark: {
      alignItems: "center",
      height: 24,
      justifyContent: "center",
      width: 24,
    },
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
    // `chipTone: "muted"` (for example an archived tag): an outlined chip on
    // the control's own `surface`, so it recedes beside the filled chips.
    // `muted` ink clears AA on `surface` in every theme, unlike on `soft`
    // (4.498:1 in the default theme).
    chipMuted: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border2,
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
    chipTextMuted: { color: theme.colors.muted },
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
    // A locked row's lock and check share the trailing slot.
    selectedGlyphs: { alignItems: "center", flexDirection: "row", gap: 6 },
    wrap: { position: "relative" },
  });
}

type ComboboxMultiSelectStyles = ReturnType<
  typeof createComboboxMultiSelectStyles
>;
