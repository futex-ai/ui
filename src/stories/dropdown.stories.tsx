import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShieldQuestionMark } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";

import {
  ComboboxMultiSelect,
  DropdownSelector,
  darkSharedUiTheme,
} from "../index";
import type { DropdownHighlightVariant } from "../index";

import {
  ActionMenuExample,
  ActionMenuSubtextExample,
  ActionMenuTintedIconsExample,
  BottomEdgeFlipExample,
  CategorySelectExample,
  ChipMultiSelectExample,
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

const sizeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Cash accounting", value: "cash" },
  { label: "Flat rate", value: "flat" },
];

const bookOptions = [
  { label: "Greenhouse Studio", value: "book_1" },
  { label: "Payroll Reserve", value: "book_2" },
  { label: "VAT Archive", value: "book_3" },
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

function ChipMultiSelectValidationExample() {
  // A required multi-select that surfaces a programmatically associated error:
  // the combobox input reflects aria-required/aria-invalid and references its
  // error/hint Text by id via aria-describedby (WCAG 3.3.1 / 1.3.1 / 4.1.3).
  // Leaving the selection empty keeps the error on screen so it is demonstrable.
  const [values, setValues] = useState<string[]>([]);
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <ComboboxMultiSelect
        error={
          values.length === 0
            ? "Select at least one book to continue."
            : undefined
        }
        hint="Start typing to link the books this report should cover."
        label="Linked books"
        labelInfo="Linked books scope the report to specific ledgers. Leave it empty to include every active book in the organisation."
        labelInfoIcon={ShieldQuestionMark}
        labelInfoLabel="How linked books scope a report"
        onChange={setValues}
        options={bookOptions}
        required
        values={values}
      />
    </View>
  );
}

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

function SelectorLabelInfoExample() {
  const [scheme, setScheme] = useState("standard");
  const [basis, setBasis] = useState("cash");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DropdownSelector
        // The ⓘ after the label opens a tooltip with the detail, so the
        // always-read `hint` stays free for short, everyday guidance.
        hint="This determines how VAT is calculated on invoices."
        label="VAT scheme"
        labelInfo="The standard scheme reclaims VAT on purchases; the flat-rate scheme pays a fixed percentage of turnover instead. Switching schemes needs HMRC approval."
        onValueChange={setScheme}
        options={sizeOptions}
        value={scheme}
      />
      <DropdownSelector
        // `labelInfoIcon` swaps the default ⓘ glyph and `labelInfoLabel` names
        // the button when the default reads awkwardly.
        label="Accounting scheme"
        labelInfo="Cash accounting reports VAT when invoices are paid rather than issued — useful when customers pay late."
        labelInfoIcon={ShieldQuestionMark}
        labelInfoLabel="What each scheme means"
        onValueChange={setBasis}
        options={sizeOptions}
        value={basis}
      />
    </View>
  );
}

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

const highlightVariantOptions: {
  label: string;
  variant: DropdownHighlightVariant;
}[] = [
  { label: "Solid fill (default)", variant: "solid" },
  { label: "Outline ring", variant: "ring" },
  { label: "Outline + light fill", variant: "ringFill" },
  { label: "Leading dot", variant: "dot" },
];

function SelectorHighlightVariantsExample() {
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      {highlightVariantOptions.map(({ label, variant }) => (
        <HighlightVariantSelector
          key={variant}
          label={label}
          variant={variant}
        />
      ))}
    </View>
  );
}

function HighlightVariantSelector({
  label,
  variant,
}: {
  label: string;
  variant: DropdownHighlightVariant;
}) {
  const [value, setValue] = useState("standard");
  return (
    <DropdownSelector
      highlightVariant={variant}
      label={label}
      onValueChange={setValue}
      options={sizeOptions}
      value={value}
    />
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
