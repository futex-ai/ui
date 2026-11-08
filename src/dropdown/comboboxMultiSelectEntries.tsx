/**
 * The option rows of {@link ComboboxMultiSelect}: a leading mark, a check on
 * each selected option, the empty-state row, and an optional footer row.
 */
import { Check } from "../primitives/icons";
import { Text, View } from "../primitives/reactNative";

import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type { ComboboxMultiSelectOption } from "./comboboxMultiSelectTypes";
import type { DropdownListEntry } from "./dropdownListTypes";

export function entriesForOptions(
  options: ComboboxMultiSelectOption[],
  values: string[],
  onSelect: (value: string) => void,
  styles: ComboboxMultiSelectStyles,
  footer?: string,
): DropdownListEntry[] {
  const optionRows: DropdownListEntry[] = options.map((option) => {
    const selected = values.includes(option.value);
    return {
      id: option.value,
      label: option.label,
      leading: <OptionMark option={option} styles={styles} />,
      onPress: () => onSelect(option.value),
      // Tinted from the row's content color rather than pinned to `primaryDeep`,
      // which all but vanishes (~1.3:1) on the solid active fill.
      right: selected
        ? ({ color }: { color: string }) => <Check color={color} size={15} />
        : null,
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
