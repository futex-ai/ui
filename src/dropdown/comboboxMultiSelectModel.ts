/**
 * Pure grouping, filtering, and selection rules for `ComboboxMultiSelect`.
 * See `docs/protocol/combobox-multi-select.md`.
 */
import { filterComboboxSections } from "./comboboxModel";
import type {
  ComboboxFooterAction,
  ComboboxMultiSelectOption,
} from "./comboboxMultiSelectTypes";

/**
 * Options listed under one heading. `title` is the group name, absent for the
 * ungrouped options; `key` stays stable while a query filters the sections.
 */
export type ComboboxOptionSection = {
  key: string;
  options: ComboboxMultiSelectOption[];
  title?: string;
};

/** The selection state the rules read. */
export type ComboboxSelectionRules = {
  lockedValues: readonly string[];
  options: readonly ComboboxMultiSelectOption[];
  singlePerGroup: boolean;
  values: readonly string[];
};

/** How one option row behaves. */
export type ComboboxOptionState = {
  disabled: boolean;
  locked: boolean;
  selected: boolean;
};

/** Row id of the pinned footer action. */
export const COMBOBOX_FOOTER_ACTION_ID = "combobox-footer-action";

/**
 * Groups options for the list: ungrouped options first, then one section per
 * `group` in the order of its first option, each keeping `options` order. An
 * empty group name counts as ungrouped.
 */
export function groupComboboxOptions(
  options: readonly ComboboxMultiSelectOption[],
): ComboboxOptionSection[] {
  const ungrouped: ComboboxMultiSelectOption[] = [];
  const groups = new Map<string, ComboboxMultiSelectOption[]>();
  for (const option of options) {
    if (!option.group) {
      ungrouped.push(option);
      continue;
    }
    const members = groups.get(option.group);
    if (members) {
      members.push(option);
    } else {
      groups.set(option.group, [option]);
    }
  }
  const sections: ComboboxOptionSection[] = [...groups].map(
    ([title, members], index) => ({
      key: `combobox-group-${index}`,
      options: members,
      title,
    }),
  );
  return ungrouped.length > 0
    ? [{ key: "combobox-ungrouped", options: ungrouped }, ...sections]
    : sections;
}

/**
 * Filters grouped options by a query: case-insensitive, trimmed, matching an
 * option's label or, for a whole group, its name. Sections left empty drop
 * out. An empty query returns the sections unchanged.
 */
export function filterComboboxOptionSections(
  sections: ComboboxOptionSection[],
  query: string,
): ComboboxOptionSection[] {
  return filterComboboxSections(sections, query, { matchTitles: true });
}

/** The number of options listed across the sections. */
export function comboboxOptionCount(sections: ComboboxOptionSection[]): number {
  return sections.reduce((count, section) => count + section.options.length, 0);
}

/** Whether a selected value is fixed in place by `lockedValues`. */
export function isComboboxValueLocked(
  value: string,
  rules: Pick<ComboboxSelectionRules, "lockedValues" | "values">,
): boolean {
  return rules.values.includes(value) && rules.lockedValues.includes(value);
}

/**
 * Resolves an option's row state. With `singlePerGroup`, a group that holds a
 * locked value cannot change, so its other options are disabled too.
 */
export function comboboxOptionState(
  option: ComboboxMultiSelectOption,
  rules: ComboboxSelectionRules,
): ComboboxOptionState {
  const selected = rules.values.includes(option.value);
  const locked = isComboboxValueLocked(option.value, rules);
  const groupFixed =
    !locked && rules.singlePerGroup && isComboboxGroupLocked(option, rules);
  return {
    disabled: Boolean(option.disabled) || groupFixed,
    locked,
    selected,
  };
}

/**
 * The next `values` after choosing an option: a selected option is removed,
 * an unselected one appended. With `singlePerGroup`, choosing an unselected
 * grouped option first removes the group's other values. Disabled and locked
 * options, and options in a locked group, return `values` unchanged.
 */
export function toggleComboboxValue(
  option: ComboboxMultiSelectOption,
  rules: ComboboxSelectionRules,
): readonly string[] {
  const state = comboboxOptionState(option, rules);
  if (state.disabled || state.locked) {
    return rules.values;
  }
  if (state.selected) {
    return rules.values.filter((value) => value !== option.value);
  }
  if (!rules.singlePerGroup || !option.group) {
    return [...rules.values, option.value];
  }
  const groupValues = new Set(
    rules.options
      .filter((candidate) => candidate.group === option.group)
      .map((candidate) => candidate.value),
  );
  return [
    ...rules.values.filter((value) => !groupValues.has(value)),
    option.value,
  ];
}

/**
 * The footer action's row label and press handler for the current query. The
 * query is trimmed once so the label and the handler see the same text; the
 * handler runs `onPress`, then `onDone` (which closes the list).
 */
export function comboboxFooterAction(
  action: ComboboxFooterAction,
  query: string,
  onDone: () => void,
): { label: string; onPress: () => void } {
  const trimmed = query.trim();
  return {
    label: action.label(trimmed),
    onPress: () => {
      action.onPress(trimmed);
      onDone();
    },
  };
}

function isComboboxGroupLocked(
  option: ComboboxMultiSelectOption,
  rules: ComboboxSelectionRules,
): boolean {
  if (!option.group) {
    return false;
  }
  return rules.options.some(
    (candidate) =>
      candidate.group === option.group &&
      isComboboxValueLocked(candidate.value, rules),
  );
}
