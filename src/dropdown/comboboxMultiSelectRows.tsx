/** Dropdown rows for `ComboboxMultiSelect`: grouped options and the footer action. */
import { Check, Lock, Plus } from "../primitives/icons";
import { Text, View } from "../primitives/reactNative";

import type { DropdownListEntry } from "./DropdownList";
import {
  COMBOBOX_FOOTER_ACTION_ID,
  comboboxFooterAction,
  comboboxOptionState,
} from "./comboboxMultiSelectModel";
import type {
  ComboboxOptionSection,
  ComboboxSelectionRules,
} from "./comboboxMultiSelectModel";
import type {
  ComboboxFooterAction,
  ComboboxMultiSelectOption,
} from "./comboboxMultiSelectTypes";

/** The `ComboboxMultiSelect` styles the rows read. */
export type ComboboxRowStyles = {
  actionMark: object;
  mark: object;
  markText: object;
  selectedGlyphs: object;
};

/** How option rows look: their styles and the mark glyph's ink (`onSolid`). */
export type ComboboxRowLook = {
  markGlyphColor: string;
  styles: ComboboxRowStyles;
};

/**
 * One row per listed option, each group introduced by a grouped section
 * heading (a web `role="group"` labelled by the heading). Disabled rows stay
 * reachable by keyboard so assistive tech announces them and their reason.
 */
export function comboboxOptionRows(
  sections: ComboboxOptionSection[],
  rules: ComboboxSelectionRules,
  onSelect: (option: ComboboxMultiSelectOption) => void,
  look: ComboboxRowLook,
): DropdownListEntry[] {
  return sections.flatMap((section): DropdownListEntry[] => [
    ...(section.title
      ? [
          {
            group: true,
            id: section.key,
            label: section.title,
            type: "section" as const,
          },
        ]
      : []),
    ...section.options.map((option) =>
      comboboxOptionRow(option, rules, onSelect, look),
    ),
  ]);
}

/** The pinned footer action row, labelled from the current query. */
export function comboboxFooterActionRow(
  action: ComboboxFooterAction,
  query: string,
  onDone: () => void,
  styles: ComboboxRowStyles,
): DropdownListEntry {
  const { label, onPress } = comboboxFooterAction(action, query, onDone);
  return {
    id: COMBOBOX_FOOTER_ACTION_ID,
    label,
    leading: ({ color }: { color: string }) => (
      <View style={styles.actionMark}>
        <Plus color={color} size={16} />
      </View>
    ),
    onPress,
    type: "item",
  };
}

function comboboxOptionRow(
  option: ComboboxMultiSelectOption,
  rules: ComboboxSelectionRules,
  onSelect: (option: ComboboxMultiSelectOption) => void,
  { markGlyphColor, styles }: ComboboxRowLook,
): DropdownListEntry {
  const { disabled, locked, selected } = comboboxOptionState(option, rules);
  return {
    disabled: disabled || undefined,
    focusableWhenDisabled: disabled || undefined,
    id: option.value,
    label: option.label,
    leading: (
      <OptionMark glyphColor={markGlyphColor} option={option} styles={styles} />
    ),
    locked: locked || undefined,
    onPress: () => onSelect(option),
    // Tinted from the row's content color rather than pinned to `primaryDeep`,
    // which all but vanishes (~1.3:1) on the solid active fill.
    right: selected
      ? ({ color }: { color: string }) =>
          locked ? (
            <View style={styles.selectedGlyphs}>
              <Lock color={color} size={13} />
              <Check color={color} size={15} />
            </View>
          ) : (
            <Check color={color} size={15} />
          )
      : null,
    secondary: option.description,
    selected,
    type: "item",
  };
}

function OptionMark({
  glyphColor,
  option,
  styles,
}: {
  glyphColor: string;
  option: ComboboxMultiSelectOption;
  styles: ComboboxRowStyles;
}) {
  const Icon = option.icon;
  return (
    <View
      style={[
        styles.mark,
        option.color ? { backgroundColor: option.color } : null,
      ]}
    >
      {Icon ? (
        <Icon color={glyphColor} size={13} />
      ) : (
        <Text style={styles.markText}>
          {option.mark ?? option.label[0] ?? "?"}
        </Text>
      )}
    </View>
  );
}
