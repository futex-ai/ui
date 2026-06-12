import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { filterComboboxOptions } from "../../src/dropdown/comboboxModel";

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
  assert.match(source, /placeholderTextColor=\{theme\.colors\.faint\}/);
});

test("combobox empty state renders before optional footer rows", () => {
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");

  assert.match(source, /const optionRows: DropdownListEntry\[\]/);
  assert.match(source, /optionRows\.length > 0/);
  assert.match(source, /No matching options/);
  assert.match(source, /rows\.push\(\{ id: "footer"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
