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

test("combobox popover forwards the anchor-width sizing policy", () => {
  const source = readSource("../../src/dropdown/ComboboxPopover.web.tsx");

  assert.match(
    source,
    /useDropdownSurfacePlacement\([\s\S]*?\{[\s\S]*?anchorWidthAsMinimum,/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
