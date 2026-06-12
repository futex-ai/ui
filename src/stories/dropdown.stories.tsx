import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ActionMenuExample,
  ChipMultiSelectExample,
  InputBackedComboboxExample,
  SelectorExample,
  StorySurface,
} from "./sharedExamples";

const meta = {
  title: "Dropdown/Examples",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const DropdownSelectorDefault: Story = {
  name: "Dropdown selector",
  render: () => (
    <StorySurface>
      <SelectorExample />
    </StorySurface>
  ),
};

export const DropdownActionMenu: Story = {
  name: "Dropdown action menu",
  render: () => (
    <StorySurface>
      <ActionMenuExample />
    </StorySurface>
  ),
};

export const InputBackedCombobox: Story = {
  name: "Input-backed combobox",
  render: () => (
    <StorySurface>
      <InputBackedComboboxExample />
    </StorySurface>
  ),
};

export const ChipMultiSelect: Story = {
  name: "Chip multi-select",
  render: () => (
    <StorySurface>
      <ChipMultiSelectExample />
    </StorySurface>
  ),
};
