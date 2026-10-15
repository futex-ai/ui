/** Pure grouping and selection rules for `ComboboxMultiSelect`. */
import { filterComboboxSections } from "./comboboxModel";

/** The option fields the grouping and selection rules read. */
export type ComboboxSelectableOption = {
  disabled?: boolean;
  group?: string;
  label: string;
  value: string;
};

/** A run of options under one heading. Ungrouped options have no `title`. */
export type ComboboxOptionSection<TOption extends ComboboxSelectableOption> = {
  /** Stable id from the group's position in `options`, kept while filtering. */
  id: string;
  options: TOption[];
  title?: string;
};

/** Id of the pinned footer action row, used for keyboard navigation. */
export const COMBOBOX_FOOTER_ACTION_ID = "combobox-footer-action";

const UNGROUPED_SECTION_ID = "combobox-ungrouped";

/**
 * Splits options into sections by `group`. Options without a group come
 * first, untitled; groups follow in the order of their first option.
 */
export function groupComboboxOptions<TOption extends ComboboxSelectableOption>(
  options: readonly TOption[],
): ComboboxOptionSection<TOption>[] {
  const ungrouped: TOption[] = [];
  const groups = new Map<string, TOption[]>();
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
  const titled = [...groups].map(([title, members], index) => ({
    id: `combobox-group-${index}`,
    options: members,
    title,
  }));
  return ungrouped.length > 0
    ? [{ id: UNGROUPED_SECTION_ID, options: ungrouped }, ...titled]
    : titled;
}

/**
 * The sections to list for a search query. A label match keeps that option;
 * a group-name match keeps the whole group; a group with no match is hidden.
 * Matching ignores case and surrounding whitespace.
 */
export function visibleComboboxSections<
  TOption extends ComboboxSelectableOption,
>(
  options: readonly TOption[],
  query: string,
): ComboboxOptionSection<TOption>[] {
  const sections = groupComboboxOptions(options);
  const ids = new Map(sections.map((section) => [section.title, section.id]));
  return filterComboboxSections(sections, query, { matchTitles: true }).map(
    (section) => ({
      ...section,
      id: ids.get(section.title) ?? UNGROUPED_SECTION_ID,
    }),
  );
}

/** The inputs of the selection rules. */
export type ComboboxSelectionRules = {
  lockedValues: readonly string[];
  options: readonly ComboboxSelectableOption[];
  singlePerGroup: boolean;
  values: readonly string[];
};

/** The selection rules resolved once per render. */
export type ComboboxSelection = Omit<ComboboxSelectionRules, "values"> & {
  /** Locked values. Every locked value is also selected. */
  locked: ReadonlySet<string>;
  /** With `singlePerGroup`, the groups whose selected value is locked. */
  lockedGroups: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  /** `values` plus any locked value that `values` is missing. */
  values: string[];
};

/** What the user can do with one option row. */
export type ComboboxOptionState = {
  /** Pressing the row toggles its value. */
  interactive: boolean;
  /** The value is selected and locked: shown checked, never toggled. */
  locked: boolean;
  selected: boolean;
};

/** Locked values that `values` does not contain. */
export function missingLockedValues(
  values: readonly string[],
  lockedValues: readonly string[],
): string[] {
  return lockedValues.filter((value) => !values.includes(value));
}

export function comboboxSelection(
  rules: ComboboxSelectionRules,
): ComboboxSelection {
  const values = [
    ...rules.values,
    ...missingLockedValues(rules.values, rules.lockedValues),
  ];
  const locked = new Set(rules.lockedValues);
  const lockedGroups = new Set<string>();
  if (rules.singlePerGroup) {
    for (const option of rules.options) {
      if (option.group && locked.has(option.value)) {
        lockedGroups.add(option.group);
      }
    }
  }
  return { ...rules, locked, lockedGroups, selected: new Set(values), values };
}

/**
 * A locked value is checked and inert. Any other selected value toggles off,
 * even when its option is disabled. An unselected option can be chosen unless
 * it is disabled or, with `singlePerGroup`, its group's value is locked.
 */
export function comboboxOptionState(
  selection: ComboboxSelection,
  option: ComboboxSelectableOption,
): ComboboxOptionState {
  if (selection.locked.has(option.value)) {
    return { interactive: false, locked: true, selected: true };
  }
  if (selection.selected.has(option.value)) {
    return { interactive: true, locked: false, selected: true };
  }
  const blocked = Boolean(
    option.group && selection.lockedGroups.has(option.group),
  );
  return {
    interactive: !option.disabled && !blocked,
    locked: false,
    selected: false,
  };
}

/**
 * The values after a row press, or `null` when the row cannot change. With
 * `singlePerGroup`, choosing an option replaces its group's selected value.
 */
export function toggleComboboxValue(
  selection: ComboboxSelection,
  value: string,
): string[] | null {
  const option = selection.options.find(
    (candidate) => candidate.value === value,
  );
  if (!option || !comboboxOptionState(selection, option).interactive) {
    return null;
  }
  if (selection.selected.has(value)) {
    return selection.values.filter((selected) => selected !== value);
  }
  const group = option.group;
  if (selection.singlePerGroup && group) {
    const rivals = new Set(
      selection.options
        .filter((candidate) => candidate.group === group)
        .map((candidate) => candidate.value),
    );
    return [
      ...selection.values.filter((selected) => !rivals.has(selected)),
      value,
    ];
  }
  return [...selection.values, value];
}

/** The values after a chip's remove button, or `null` for a locked value. */
export function removeComboboxValue(
  selection: ComboboxSelection,
  value: string,
): string[] | null {
  if (!selection.selected.has(value) || selection.locked.has(value)) {
    return null;
  }
  return selection.values.filter((selected) => selected !== value);
}

/** The selected options, in `options` order rather than selection order. */
export function selectedComboboxOptions<
  TOption extends ComboboxSelectableOption,
>(options: readonly TOption[], selection: ComboboxSelection): TOption[] {
  return options.filter((option) => selection.selected.has(option.value));
}
