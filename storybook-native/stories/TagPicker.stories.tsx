import type { Meta, StoryObj } from "@storybook/react-native";
import { Car, House } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { ComboboxMultiSelect } from "@firna/ui/dropdown";
import type {
  ComboboxMultiSelectOption,
  ComboboxMultiSelectPresentation,
} from "@firna/ui/dropdown";

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
];

/**
 * The on-device check for the grouped tag picker. `Sheet` opens the native
 * gorhom bottom sheet: confirm the chips and search input sit at the top, the
 * header shows "Done", and the keyboard leaves the list usable.
 */
function TagPickerDemo({
  presentation,
}: {
  presentation: ComboboxMultiSelectPresentation;
}) {
  const [values, setValues] = useState(["flat2", "loft"]);
  const [lastCreate, setLastCreate] = useState("No tag created yet");
  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <ComboboxMultiSelect
        footerAction={{
          label: (query) => (query ? `Create tag “${query}”` : "Create tag"),
          onPress: (query) => setLastCreate(`Create pressed: “${query}”`),
        }}
        label="Tags"
        lockedValues={["flat2"]}
        onChange={setValues}
        options={tagOptions}
        placeholder="Add tag"
        presentation={presentation}
        singlePerGroup
        values={values}
      />
      <Text style={styles.readout}>{lastCreate}</Text>
    </ScrollView>
  );
}

const meta: Meta<typeof TagPickerDemo> = {
  args: { presentation: "sheet" },
  component: TagPickerDemo,
  title: "Dropdown/Tag picker",
};

export default meta;

type Story = StoryObj<typeof TagPickerDemo>;

export const Sheet: Story = {};
export const Popover: Story = { args: { presentation: "popover" } };

const styles = StyleSheet.create({
  readout: { color: "#3e4540", fontSize: 13 },
  screen: { gap: 16, padding: 24 },
});
