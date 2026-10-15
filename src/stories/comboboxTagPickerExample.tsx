/** Bookfolio-shaped grouped tag picker fixtures for Storybook. */
import { Car, House } from "../primitives/icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { ComboboxMultiSelect, useSharedUiTheme } from "../index";
import type {
  ComboboxMultiSelectOption,
  ComboboxMultiSelectPresentation,
} from "../index";

const tagOptions: ComboboxMultiSelectOption[] = [
  {
    description: "UK rental property",
    group: "Properties",
    icon: House,
    label: "Flat 2, 14 Brook Street",
    value: "flat2",
  },
  {
    description: "UK rental property",
    group: "Properties",
    icon: House,
    label: "Flat 3, 14 Brook Street",
    value: "flat3",
  },
  {
    description: "UK rental property",
    group: "Vehicles",
    icon: Car,
    label: "Renault Kangoo BX19 KLM",
    value: "van",
  },
  {
    description: "Consultancy trade",
    disabled: true,
    group: "Vehicles",
    icon: Car,
    label: "Skoda Octavia WK21 LMN",
    value: "skoda",
  },
  {
    chipTone: "muted",
    description: "Archived",
    group: "Projects",
    label: "Loft conversion",
    value: "loft",
  },
  {
    description: "Consultancy trade",
    group: "Projects",
    label: "Website rebuild",
    value: "website",
  },
];

/**
 * A transaction's Tags field: one tag per group, the posted property locked,
 * a tag from another business listed but unavailable, an archived tag in a
 * muted chip, and a pinned action that creates a tag from the search text.
 * `autoFocus` opens the list on mount, so the snapshot sweep pins the rows.
 */
export function GroupedTagPickerExample({
  autoFocus = false,
  presentation = "popover",
}: {
  autoFocus?: boolean;
  presentation?: ComboboxMultiSelectPresentation;
}) {
  const theme = useSharedUiTheme();
  const [options, setOptions] = useState(tagOptions);
  const [values, setValues] = useState(["flat2", "loft"]);
  const [lastCreate, setLastCreate] = useState<string | null>(null);
  return (
    <View style={styles.example}>
      <ComboboxMultiSelect
        autoFocus={autoFocus}
        footerAction={{
          label: (query) => (query ? `Create tag “${query}”` : "Create tag"),
          onPress: (query) => {
            const label = query || `Tag ${options.length + 1}`;
            const value = `tag-${options.length + 1}`;
            // A new tag has no group yet, so one-per-group leaves it alone.
            setOptions((current) => [...current, { label, value }]);
            setValues((current) => [...current, value]);
            setLastCreate(label);
          },
        }}
        label="Tags"
        labelInfo="Tags group transactions by property, vehicle, project or anything else you track."
        lockedValues={["flat2"]}
        onChange={setValues}
        options={options}
        placeholder="Add tag"
        presentation={presentation}
        singlePerGroup
        values={values}
      />
      <Text style={[styles.status, { color: theme.colors.ink2 }]}>
        {lastCreate ? `Created tag: ${lastCreate}` : "No tag created yet"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  example: { gap: 14, minWidth: 320 },
  status: { fontSize: 12, lineHeight: 18 },
});
