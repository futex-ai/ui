import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  filterComboboxOptions,
  filterComboboxSections,
} from "../../src/dropdown/comboboxModel";

const options = [
  { label: "Greenhouse Studio", value: "book_1" },
  { label: "Payroll Reserve", value: "book_2" },
  { label: "VAT Archive", value: "book_3" },
];

test("combobox filtering is case-insensitive and trims query text", () => {
  assert.deepEqual(
    filterComboboxOptions(options, "  studio ").map((option) => option.value),
    ["book_1"],
  );
  assert.deepEqual(
    filterComboboxOptions(options, "RES").map((option) => option.value),
    ["book_2"],
  );
  assert.deepEqual(
    filterComboboxOptions(options, "   ").map((option) => option.value),
    ["book_1", "book_2", "book_3"],
  );
});

test("combobox section filtering drops empty sections and keeps matches", () => {
  const sections = [
    {
      options: [
        { label: "US Dollar", value: "usd" },
        { label: "Canadian Dollar", value: "cad" },
      ],
      title: "Americas",
    },
    {
      options: [
        { label: "Euro", value: "eur" },
        { label: "British Pound", value: "gbp" },
      ],
      title: "Europe",
    },
  ];

  // A matching query keeps only the sections that still have options.
  assert.deepEqual(
    filterComboboxSections(sections, "dollar").map((section) => ({
      title: section.title,
      values: section.options.map((option) => option.value),
    })),
    [{ title: "Americas", values: ["usd", "cad"] }],
  );

  // Whitespace-only queries leave the original sections untouched.
  assert.equal(filterComboboxSections(sections, "   "), sections);

  // A query that matches nothing removes every section.
  assert.deepEqual(filterComboboxSections(sections, "peso"), []);
});

test("combobox popover uses a non-modal portal with outside-close detection", () => {
  const source = readSource("../../src/dropdown/ComboboxPopover.web.tsx");

  assert.match(source, /<DropdownWebLayer>/);
  assert.match(source, /useDropdownDismiss/);
  assert.doesNotMatch(source, /<Modal/);
});

test("combobox controls use shared input keyboard navigation", () => {
  const multiSelectSource = readSource(
    "../../src/dropdown/ComboboxMultiSelect.tsx",
  );

  assert.match(multiSelectSource, /useComboboxNavigation/);
  assert.match(multiSelectSource, /navigation\.keyProps/);
  assert.match(multiSelectSource, /ComboboxPopover/);
});

test("combobox multi-select uses theme-driven selected chip colors", () => {
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");

  assert.match(source, /useSharedUiTheme/);
  assert.match(source, /primarySoft/);
  assert.match(source, /primaryDeep/);
  assert.match(source, /placeholderTextColor=\{theme\.colors\.placeholder\}/);
});

test("combobox empty state renders before optional footer rows", () => {
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");

  assert.match(source, /const optionRows: DropdownListEntry\[\]/);
  assert.match(source, /optionRows\.length > 0/);
  assert.match(source, /No matching options/);
  assert.match(source, /rows\.push\(\{ id: "footer"/);
});

test("combobox multi-select wires a labelled field surface", () => {
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");

  // Label names the combobox input via `aria-labelledby` (not an aria-label copy)
  // so the accessible name IS the visible label text — WCAG 2.5.3 / 1.3.1.
  assert.match(source, /<Text nativeID=\{labelId\} style=\{styles\.label\}>/);
  // Named from the visible label via `aria-labelledby`, unless an explicit
  // `accessibilityLabel` override is supplied (which then wins) — mirrors Input.
  assert.match(
    source,
    /aria-labelledby=\{\s*accessibilityLabel === undefined && label \? labelId : undefined\s*\}/,
  );
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  // Required marker is visual-only; the state is conveyed via `aria-required`.
  assert.match(source, /aria-required=\{required\}/);
  assert.match(source, /<Text aria-hidden style=\{styles\.required\}>/);
  // Error turns the border rose and is an assertive live region tied by id;
  // hint + error are referenced by the input via a literal `aria-describedby`.
  assert.match(source, /invalid = invalidProp \|\| Boolean\(error\)/);
  assert.match(source, /invalid \? styles\.controlInvalid : null/);
  assert.match(source, /aria-invalid=\{invalid\}/);
  assert.match(source, /accessibilityRole="alert"/);
  assert.match(source, /"aria-describedby": describedBy/);
});

test("combobox multi-select reveals supplementary help from a labelInfo button", () => {
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");

  // The shared ⓘ affordance is reused from the input package, not re-built.
  assert.match(source, /import \{[^}]*LabelInfo[^}]*\} from "\.\.\/input"/);
  assert.match(
    source,
    /\{labelInfo \? \([\s\S]*?<LabelInfo[\s\S]*?info=\{labelInfo\}[\s\S]*?\) : null\}/,
  );
  // The button's default accessible name derives from the visible label.
  assert.match(source, /More information about \$\{label\}/);
  // `labelInfo` without a `label` has nowhere to anchor: a dev-warned no-op.
  assert.match(source, /if \(labelInfo && !label\)/);
  assert.match(source, /devWarn\(/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
