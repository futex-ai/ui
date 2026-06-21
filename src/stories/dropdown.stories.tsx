import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { View } from "react-native";

import { DropdownSelector } from "../index";

import {
  ActionMenuExample,
  BottomEdgeFlipExample,
  ChipMultiSelectExample,
  ContextMenuExample,
  EdgePlacementGridExample,
  EndAlignedMenuExample,
  HorizontalEdgeClampExample,
  HoverMenuExample,
  InputBackedComboboxExample,
  LongPressMenuExample,
  LongSelectorExample,
  PlacementPlaygroundExample,
  ScrollTrackingSelectorExample,
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

export const SelectorValidation: Story = {
  name: "Selector with label, hint, and error",
  render: () => (
    <StorySurface>
      <SelectorValidationExample />
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

export const SelectorScrollTracking: Story = {
  name: "Placement · follows the trigger on scroll",
  parameters: { layout: "fullscreen" },
  render: () => <ScrollTrackingSelectorExample />,
};

export const DropdownActionMenu: Story = {
  name: "Dropdown action menu",
  render: () => (
    <StorySurface>
      <ActionMenuExample />
    </StorySurface>
  ),
};

export const DropdownHoverMenu: Story = {
  name: "Trigger · hover menu",
  render: () => (
    <StorySurface>
      <HoverMenuExample />
    </StorySurface>
  ),
};

export const DropdownLongPressMenu: Story = {
  name: "Trigger · long-press menu",
  render: () => (
    <StorySurface>
      <LongPressMenuExample />
    </StorySurface>
  ),
};

export const DropdownContextMenu: Story = {
  name: "Trigger · context menu",
  render: () => (
    <StorySurface>
      <ContextMenuExample />
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

export const EdgePlacementGrid: Story = {
  name: "Placement · edge grid",
  parameters: { layout: "fullscreen" },
  render: () => <EdgePlacementGridExample />,
};

export const BottomEdgeFlip: Story = {
  name: "Placement · flips above the bottom edge",
  parameters: { layout: "fullscreen" },
  render: () => <BottomEdgeFlipExample />,
};

export const HorizontalEdgeClamp: Story = {
  name: "Placement · clamps to the side edges",
  parameters: { layout: "fullscreen" },
  render: () => <HorizontalEdgeClampExample />,
};

export const EndAlignedMenu: Story = {
  name: "Placement · end-aligned menu",
  parameters: { layout: "fullscreen" },
  render: () => <EndAlignedMenuExample />,
};

export const PlacementPlayground: Story = {
  name: "Placement · playground",
  parameters: { layout: "fullscreen" },
  render: () => <PlacementPlaygroundExample />,
};

function SelectorValidationExample() {
  // A required selector that surfaces a programmatically associated hint and
  // error: the trigger advertises the popup listbox (`aria-haspopup`,
  // `aria-controls`), reflects `aria-required`/`aria-invalid`, and references
  // its hint/error Text by id via `aria-describedby` (WCAG 3.3.1 / 1.3.1 /
  // 4.1.2). Leaving the value empty keeps the error on screen so the
  // association is demonstrable.
  const [scheme, setScheme] = useState("");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DropdownSelector
        error={scheme ? undefined : "Choose a VAT scheme to continue."}
        hint="This determines how VAT is calculated on invoices."
        label="VAT scheme"
        onValueChange={setScheme}
        options={sizeOptions}
        placeholder="Select a scheme"
        required
        value={scheme}
      />
    </View>
  );
}

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
