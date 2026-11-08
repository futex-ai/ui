/**
 * Field examples for the Dropdown stories: sizes, highlights, help, and
 * validation.
 */
import { ShieldQuestionMark } from "../primitives/icons";
import { useState } from "react";
import { View } from "../primitives/reactNative";

import { ComboboxMultiSelect, DropdownSelector } from "../index";
import type { DropdownHighlightVariant } from "../index";

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

export function ChipMultiSelectValidationExample() {
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

export function SelectorLabelInfoExample() {
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

export function SelectorValidationExample() {
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

export function SelectorHighlightVariantsExample() {
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

export function SelectorSizesExample() {
  const [extraSmall, setExtraSmall] = useState("standard");
  const [small, setSmall] = useState("standard");
  const [medium, setMedium] = useState("standard");
  const [large, setLarge] = useState("standard");
  return (
    <View style={{ gap: 14, minWidth: 320 }}>
      <DropdownSelector
        label="Extra small selector"
        onValueChange={setExtraSmall}
        options={sizeOptions}
        size="xs"
        value={extraSmall}
      />
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
