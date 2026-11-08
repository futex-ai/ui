/**
 * The state of the interactive selector: its open and query state, the list
 * entries and their keyboard navigation, the trigger's names and element ids,
 * and the announcement of the search result count.
 */
import { Ref, useCallback, useEffect, useId, useRef, useState } from "react";
import { View } from "../primitives/reactNative";

import { announce } from "../announcer";
import { devWarn } from "../devWarn";

import { filterComboboxSections } from "./comboboxModel";
import { dropdownRowDomId } from "./dropdownListModel";
import type { DropdownListEntry } from "./dropdownListTypes";
import { selectorEntries, selectorTriggerName } from "./dropdownSelectorModel";
import { selectorAccessibleLabel } from "./dropdownSelectorParts";
import type {
  DropdownSelectorOption,
  DropdownSelectorSection,
} from "./dropdownSelectorTypes";
import { useDropdownSelectorNavigation } from "./useDropdownSelectorNavigation";

export function useDropdownSelectorState({
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
}: {
  error?: string | null;
  hint?: string;
  invalidProp: boolean;
  label?: string;
  labelInfo?: string;
  onValueChange?: (value: string) => void;
  options: DropdownSelectorOption[];
  placeholder: string;
  readOnly: boolean;
  searchable: boolean;
  sections?: DropdownSelectorSection[];
  triggerLabel?: string;
  triggerRef?: Ref<View>;
  value: string;
}) {
  const anchorRef = useRef<View>(null);
  const setTriggerRef = useCallback(
    (node: View | null) => {
      anchorRef.current = node;
      if (typeof triggerRef === "function") {
        triggerRef(node);
      } else if (triggerRef) {
        (triggerRef as { current: View | null }).current = node;
      }
    },
    [triggerRef],
  );
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
  // the hook) rather than the input's own `onKeyDown`, because a key event does
  // not escape the field: the web backend's `TextInput` stops its propagation.
  // The `typeahead` flag keeps the space bar typing into the search query
  // instead of activating the highlighted row.
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

  return {
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
  };
}
