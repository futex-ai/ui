/** List rows that `ComboboxMultiSelect` builds for options and its footer action. */
import { Check, Plus } from "../primitives/icons";
import { View } from "../primitives/reactNative";

import { ComboboxOptionMark } from "./ComboboxOptionParts";
import type { DropdownListEntry } from "./DropdownList";
import {
  COMBOBOX_FOOTER_ACTION_ID,
  comboboxOptionState,
} from "./comboboxMultiSelectModel";
import type { ComboboxSelection } from "./comboboxMultiSelectModel";
import type { ComboboxMultiSelectStyles } from "./comboboxMultiSelectStyles";
import type {
  ComboboxFooterAction,
  ComboboxMultiSelectOption,
} from "./comboboxMultiSelectTypes";

/**
 * One option row. A row that cannot change (disabled, locked, or blocked by a
 * locked value in its group) is a disabled row: the arrow keys skip it and
 * assistive tech hears it as disabled, while a locked row still shows as
 * selected. The `description` is the row's secondary line.
 */
export function comboboxOptionEntry(
  option: ComboboxMultiSelectOption,
  selection: ComboboxSelection,
  onSelect: (value: string) => void,
  styles: ComboboxMultiSelectStyles,
): DropdownListEntry {
  const state = comboboxOptionState(selection, option);
  return {
    disabled: !state.interactive,
    id: option.value,
    label: option.label,
    leading: <ComboboxOptionMark option={option} styles={styles} />,
    onPress: () => onSelect(option.value),
    // Tinted from the row's content color rather than pinned to `primaryDeep`,
    // which all but vanishes (~1.3:1) on the solid active fill.
    right: state.selected
      ? ({ color }: { color: string }) => <Check color={color} size={15} />
      : null,
    secondary: option.description,
    selected: state.selected,
    type: "item",
  };
}

/**
 * The pinned footer action row, or no row without a `footerAction`. Its label
 * and its press both get the trimmed search query; `onDone` then clears the
 * query and closes the list.
 */
export function comboboxFooterActionEntries(
  footerAction: ComboboxFooterAction | undefined,
  query: string,
  styles: ComboboxMultiSelectStyles,
  onDone: () => void,
): DropdownListEntry[] {
  if (!footerAction) {
    return [];
  }
  const actionQuery = query.trim();
  return [
    {
      id: COMBOBOX_FOOTER_ACTION_ID,
      label: footerAction.label(actionQuery),
      leading: ({ color }: { color: string }) => (
        <View style={styles.actionMark}>
          <Plus color={color} size={16} />
        </View>
      ),
      onPress: () => {
        footerAction.onPress(actionQuery);
        onDone();
      },
      type: "item",
    },
  ];
}
