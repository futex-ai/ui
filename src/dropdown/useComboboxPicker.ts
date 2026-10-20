/** Open, query, and selection state behind `ComboboxMultiSelect`. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import { announce } from "../announcer";
import { devWarn } from "../devWarn";

import { comboboxFooterActionEntries } from "./comboboxMultiSelectEntries";
import {
  comboboxSelection,
  missingLockedValues,
  removeComboboxValue,
  selectedComboboxOptions,
  toggleComboboxValue,
  visibleComboboxSections,
} from "./comboboxMultiSelectModel";
import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type {
  ComboboxFooterAction,
  ComboboxMultiSelectOption,
} from "./comboboxMultiSelectTypes";

type ComboboxPickerOptions = {
  footerAction?: ComboboxFooterAction;
  lockedValues: string[];
  onChange: (values: string[]) => void;
  options: ComboboxMultiSelectOption[];
  singlePerGroup: boolean;
  styles: ComboboxMultiSelectStyles;
  values: string[];
};

/**
 * Owns the list's open state and search query, resolves the selection rules,
 * and announces the result count as the query filters (WCAG 4.1.3). Every
 * change goes out through `onChange`; a press that cannot change anything
 * (a disabled, locked, or blocked row) calls nothing.
 */
export function useComboboxPicker({
  footerAction,
  lockedValues,
  onChange,
  options,
  singlePerGroup,
  styles,
  values,
}: ComboboxPickerOptions) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selection = useMemo(
    () => comboboxSelection({ lockedValues, options, singlePerGroup, values }),
    [lockedValues, options, singlePerGroup, values],
  );
  const sections = useMemo(
    () => visibleComboboxSections(options, query),
    [options, query],
  );
  const missingLocked = missingLockedValues(values, lockedValues);
  if (missingLocked.length > 0) {
    devWarn(
      "ComboboxMultiSelect: locked values missing from `values` are shown " +
        `as selected: ${missingLocked.join(", ")}.`,
    );
  }

  // Announce the result count so screen readers hear matches change as the
  // query filters, without focus leaving the input (WCAG 4.1.3).
  const matchCount = sections.reduce(
    (count, section) => count + section.options.length,
    0,
  );
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

  const close = () => setOpen(false);
  const apply = (next: string[] | null) => {
    if (next) {
      onChange(next);
    }
  };
  return {
    close,
    footerEntries: comboboxFooterActionEntries(
      footerAction,
      query,
      styles,
      () => {
        setQuery("");
        close();
      },
    ),
    open,
    query,
    /** Remove a chip's value; a locked value stays. */
    remove: (value: string) => apply(removeComboboxValue(selection, value)),
    sections,
    /** Selected options, in `options` order, for the chips. */
    selected: selectedComboboxOptions(options, selection),
    selection,
    setOpen,
    setQuery,
    /** Toggle a row's value, then clear the query for the next search. */
    toggle: (value: string) => {
      apply(toggleComboboxValue(selection, value));
      setQuery("");
    },
  };
}

/**
 * Focuses `target` when the control mounts with `autoFocus`, again on the next
 * frame, and returns when that happened so a blur right after mount can be
 * ignored.
 */
export function useComboboxAutoFocus(
  autoFocus: boolean,
  target: RefObject<{ focus?: () => void } | null>,
) {
  const autoFocusAtRef = useRef(0);
  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    autoFocusAtRef.current = Date.now();
    const focusTarget = () => target.current?.focus?.();
    focusTarget();
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }
    const frame = requestAnimationFrame(focusTarget);
    return () => cancelAnimationFrame(frame);
  }, [autoFocus, target]);
  return autoFocusAtRef;
}
