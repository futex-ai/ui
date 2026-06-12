/** Pure helpers for input-backed combobox controls. */

export type ComboboxFilterOption = {
  label: string;
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
