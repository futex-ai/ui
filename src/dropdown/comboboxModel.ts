/** Pure helpers for input-backed combobox controls. */

export type ComboboxFilterOption = {
  label: string;
};

/**
 * Web-only ARIA props for a combobox text input that filters a popup listbox:
 * `role=combobox` + `aria-autocomplete=list` + `aria-expanded`, linked to the
 * list container and its active option (WCAG 1.3.1 / 4.1.2 / 2.1.1). Returned as
 * a cast object because React Native Web's bundled types omit these literal
 * attributes (RNW forwards them at runtime; native gets an empty object).
 */
export function comboboxInputA11y({
  activeDescendant,
  controls,
  open,
}: {
  activeDescendant?: string;
  controls: string;
  open: boolean;
}): object {
  // Keep this file pure (no `react-native` import) so it stays unit-testable;
  // `document` is absent on native, which is the same gate as `Platform.OS`.
  if (typeof document === "undefined") {
    return {};
  }
  return {
    "aria-activedescendant": open ? activeDescendant : undefined,
    "aria-autocomplete": "list",
    "aria-controls": open ? controls : undefined,
    "aria-expanded": open,
    role: "combobox",
  } as unknown as object;
}

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
