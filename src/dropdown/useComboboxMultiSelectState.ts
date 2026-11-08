/**
 * The state of {@link ComboboxMultiSelect}: the open and query state, the
 * mount focus, the selected chips, the filtered option rows and their keyboard
 * navigation, the element ids and descriptions, and the announcement of the
 * match count.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { TextInput, View } from "../primitives/reactNative";

import { announce } from "../announcer";
import { devWarn } from "../devWarn";

import { filterComboboxOptions } from "./comboboxModel";
import { entriesForOptions } from "./comboboxMultiSelectEntries";
import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type { ComboboxMultiSelectOption } from "./comboboxMultiSelectTypes";
import { dropdownRowDomId } from "./dropdownListModel";
import { useComboboxNavigation } from "./useComboboxNavigation";

export function useComboboxMultiSelectState({
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
}: {
  autoFocus: boolean;
  error?: string | null;
  footer?: string;
  hint?: string;
  invalidProp: boolean;
  label?: string;
  labelInfo?: string;
  labelInfoLabel?: string;
  onChange: (values: string[]) => void;
  options: ComboboxMultiSelectOption[];
  singleLine: boolean;
  styles: ComboboxMultiSelectStyles;
  values: string[];
}) {
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

  return {
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
  };
}
