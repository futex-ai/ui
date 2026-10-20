import type { Meta, StoryObj } from "@storybook/react-vite";

import { GroupedTagPickerExample } from "./comboboxTagPickerExample";
import { StorySurface } from "./sharedExamples";

/**
 * `ComboboxMultiSelect` as a grouped tag picker: groups, descriptions,
 * disabled and locked tags, one tag per group, chip marks, and a pinned
 * "Create tag" row, in the popover and in the sheet presentation.
 */
const meta = {
  title: "Dropdown/Tag picker",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const GroupedTags: Story = {
  name: "Grouped tags",
  render: () => (
    <StorySurface>
      <GroupedTagPickerExample />
    </StorySurface>
  ),
};

export const GroupedTagsOpen: Story = {
  name: "Grouped tags, open",
  render: () => (
    <StorySurface>
      <GroupedTagPickerExample autoFocus />
    </StorySurface>
  ),
};

export const TagSheet: Story = {
  name: "Tags in a sheet",
  render: () => (
    <StorySurface>
      <GroupedTagPickerExample presentation="sheet" />
    </StorySurface>
  ),
};

export const TagSheetOpen: Story = {
  name: "Tags in a sheet, open",
  render: () => (
    <StorySurface>
      <GroupedTagPickerExample
        hint="Choose one tag per group."
        presentation="sheet"
        startOpen
      />
    </StorySurface>
  ),
};
