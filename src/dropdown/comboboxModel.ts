/** Pure helpers for input-backed combobox controls. */

export type ComboboxFilterOption = {
  label: string;
};

export type ComboboxFilterSection<TOption extends ComboboxFilterOption> = {
  options: TOption[];
  title?: string;
};

export function filterComboboxOptions<TOption extends ComboboxFilterOption>(
  options: TOption[],
  query: string,
): TOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return options;
  }
  return options.filter((option) =>
    option.label.toLowerCase().includes(needle),
  );
}

/**
 * Filter labeled options within each section and drop sections that no longer
 * have any matching options, so empty section titles never render. An empty
 * query returns the sections unchanged.
 */
export function filterComboboxSections<TOption extends ComboboxFilterOption>(
  sections: ComboboxFilterSection<TOption>[],
  query: string,
): ComboboxFilterSection<TOption>[] {
  if (!query.trim()) {
    return sections;
  }
  return sections
    .map((section) => ({
      ...section,
      options: filterComboboxOptions(section.options, query),
    }))
    .filter((section) => section.options.length > 0);
}
