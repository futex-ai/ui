import type { Meta, StoryObj } from "@storybook/react-vite";

import { darkSharedUiTheme } from "../index";

import { DropdownAsyncFocusExample } from "./dropdownAsyncFocusExample";
import {
  ChipMultiSelectValidationExample,
  SelectorHighlightVariantsExample,
  SelectorLabelInfoExample,
  SelectorSizesExample,
  SelectorValidationExample,
} from "./dropdownFieldExamples";
import {
  ActionMenuExample,
  ActionMenuSubtextExample,
  ActionMenuTintedIconsExample,
  BottomEdgeFlipExample,
  CategorySelectExample,
  ChipMultiSelectExample,
  ContentWidthSelectorExample,
  ContextMenuExample,
  EdgePlacementGridExample,
  EndAlignedMenuExample,
  ExplicitSelectorExample,
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

export const AsyncFormFocus: Story = {
  name: "Selector focused after async hydration",
  render: () => (
    <StorySurface>
      <DropdownAsyncFocusExample />
    </StorySurface>
  ),
};

export const ContentWidthSelector: Story = {
  name: "Content-width selector",
  render: () => (
    <StorySurface>
      <ContentWidthSelectorExample />
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

export const SelectorHighlightVariants: Story = {
  name: "Selector highlight variants",
  render: () => (
    <StorySurface>
      <SelectorHighlightVariantsExample />
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

export const SelectorLabelInfo: Story = {
  name: "Selector with label info tooltip",
  render: () => (
    <StorySurface>
      <SelectorLabelInfoExample />
    </StorySurface>
  ),
};

export const CategorySelect: Story = {
  name: "Selector with trailing codes",
  render: () => (
    <StorySurface>
      <CategorySelectExample />
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

export const Dark: Story = {
  name: "Dark theme",
  render: () => (
    <StorySurface theme={darkSharedUiTheme}>
      <ActionMenuExample />
    </StorySurface>
  ),
};

export const DropdownActionMenuTintedIcons: Story = {
  name: "Dropdown action menu with tinted icons",
  render: () => (
    <StorySurface>
      <ActionMenuTintedIconsExample />
    </StorySurface>
  ),
};

export const DropdownActionMenuSubtext: Story = {
  name: "Dropdown action menu with subtext",
  render: () => (
    <StorySurface>
      <ActionMenuSubtextExample />
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

export const ChipMultiSelectValidation: Story = {
  name: "Chip multi-select · required with validation",
  render: () => (
    <StorySurface>
      <ChipMultiSelectValidationExample />
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
