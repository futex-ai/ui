import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { View } from "react-native";

import { DropdownSelector } from "../index";

import {
  ActionMenuExample,
  ChipMultiSelectExample,
  ExplicitSelectorExample,
  InputBackedComboboxExample,
  LongSelectorExample,
  SearchableSelectorExample,
  SelectorExample,
  SelectorWithHeaderFooterExample,
  StorySurface,
} from "./sharedExamples";

const sizeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Cash accounting", value: "cash" },
  { label: "Flat rate", value: "flat" },
];

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

export const SelectorSizes: Story = {
  name: "Selector sizes",
  render: () => (
    <StorySurface>
      <SelectorSizesExample />
    </StorySurface>
  ),
};

export const ExplicitSelector: Story = {
  name: "Selector with explicit options",
  render: () => (
    <StorySurface>
      <ExplicitSelectorExample />
    </StorySurface>
  ),
};

export const LongDropdownSelector: Story = {
  name: "Long dropdown selector",
  render: () => (
    <StorySurface>
      <LongSelectorExample />
    </StorySurface>
  ),
};

export const SelectorWithHeaderFooter: Story = {
  name: "Selector with header and footer",
  render: () => (
    <StorySurface>
      <SelectorWithHeaderFooterExample />
    </StorySurface>
  ),
};

export const SearchableSelector: Story = {
  name: "Searchable selector",
  render: () => (
    <StorySurface>
      <SearchableSelectorExample />
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

function SelectorSizesExample() {
  const [small, setSmall] = useState("standard");
  const [medium, setMedium] = useState("standard");
  const [large, setLarge] = useState("standard");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DropdownSelector
        label="Small selector"
        onValueChange={setSmall}
        options={sizeOptions}
        size="sm"
        value={small}
      />
      <DropdownSelector
        label="Medium selector"
        onValueChange={setMedium}
        options={sizeOptions}
        size="md"
        value={medium}
      />
      <DropdownSelector
        label="Large selector"
        onValueChange={setLarge}
        options={sizeOptions}
        size="lg"
        value={large}
      />
    </View>
  );
}
