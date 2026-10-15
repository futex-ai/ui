/**
 * Grouped tag picker built on `ComboboxMultiSelect`: Bookfolio-style tags in
 * user-defined groups, at most one per group, a property fixed after posting,
 * an archived tag, a tag from another business, and a "Create tag" action.
 */
import { Car, House } from "../primitives/icons";
import { useState } from "react";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import { ComboboxMultiSelect, useSharedUiTheme } from "../index";
import type { ComboboxMultiSelectOption } from "../index";

const TAG_OPTIONS: ComboboxMultiSelectOption[] = [
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
    label: "9 Mill Lane",
    value: "mill9",
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
  { group: "Projects", label: "Loft conversion", value: "loft" },
  {
    chipTone: "muted",
    description: "Archived",
    group: "Projects",
    label: "Old office fit-out",
    value: "fitout",
  },
];

export function ComboboxTagPickerExample({
  autoFocus = false,
}: {
  /** Open the list on mount, so the story shows the grouped rows. */
  autoFocus?: boolean;
}) {
  const theme = useSharedUiTheme();
  const [options, setOptions] = useState(TAG_OPTIONS);
  const [values, setValues] = useState(["flat2", "fitout"]);
  const [created, setCreated] = useState("none");
  return (
    <View style={styles.stack}>
      <ComboboxMultiSelect
        autoFocus={autoFocus}
        footer="Archived tags show in grey."
        footerAction={{
          label: (query) => (query ? `Create tag “${query}”` : "Create tag"),
          onPress: (query) => {
            const label = query || `New tag ${options.length + 1}`;
            const value = `tag-${options.length + 1}`;
            setCreated(label);
            setOptions((current) => [...current, { label, value }]);
            setValues((current) => [...current, value]);
          },
        }}
        label="Tags"
        labelInfo="Tags group transactions by property, vehicle, project or anything else you track."
        lockedValues={["flat2"]}
        onChange={setValues}
        options={options}
        placeholder="Add tag"
        singlePerGroup
        values={values}
      />
      <Text style={[styles.status, { color: theme.colors.muted }]}>
        {`Selected: ${values.join(", ") || "none"} · Created: ${created}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10, minWidth: 360 },
  status: { fontSize: 12, lineHeight: 18 },
});
