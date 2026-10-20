import assert from "node:assert/strict";
import test from "node:test";

import { filterComboboxSections } from "../../src/dropdown/comboboxModel";
import {
  comboboxOptionState,
  comboboxSelection,
  groupComboboxOptions,
  missingLockedValues,
  removeComboboxValue,
  selectedComboboxOptions,
  toggleComboboxValue,
  visibleComboboxSections,
} from "../../src/dropdown/comboboxMultiSelectModel";
import type { ComboboxSelectionRules } from "../../src/dropdown/comboboxMultiSelectModel";

// The Bookfolio tag catalogue from the feature request, plus one ungrouped tag.
const tags = [
  { group: "Properties", label: "Flat 2, 14 Brook Street", value: "flat2" },
  { group: "Vehicles", label: "Renault Kangoo BX19 KLM", value: "van" },
  { label: "Needs review", value: "review" },
  { group: "Properties", label: "Flat 3, 14 Brook Street", value: "flat3" },
  {
    disabled: true,
    group: "Vehicles",
    label: "Skoda Octavia WK21 LMN",
    value: "skoda",
  },
  { group: "Projects", label: "Loft conversion", value: "loft" },
];

function rules(
  overrides: Partial<ComboboxSelectionRules> = {},
): ComboboxSelectionRules {
  return {
    lockedValues: [],
    options: tags,
    singlePerGroup: false,
    values: [],
    ...overrides,
  };
}

function sectionSummary(query: string) {
  return visibleComboboxSections(tags, query).map((section) => ({
    title: section.title,
    values: section.options.map((option) => option.value),
  }));
}

test("grouping lists ungrouped options first, then groups by first option", () => {
  assert.deepEqual(
    groupComboboxOptions(tags).map((section) => ({
      id: section.id,
      title: section.title,
      values: section.options.map((option) => option.value),
    })),
    [
      { id: "combobox-ungrouped", title: undefined, values: ["review"] },
      {
        id: "combobox-group-0",
        title: "Properties",
        values: ["flat2", "flat3"],
      },
      { id: "combobox-group-1", title: "Vehicles", values: ["van", "skoda"] },
      { id: "combobox-group-2", title: "Projects", values: ["loft"] },
    ],
  );
  // Without any group the options stay one untitled run, as before groups.
  assert.deepEqual(
    groupComboboxOptions([
      { label: "Greenhouse Studio", value: "book_1" },
      { label: "Payroll Reserve", value: "book_2" },
    ]).map((section) => section.title),
    [undefined],
  );
});

test("search hides groups without a match and keeps their ids stable", () => {
  assert.deepEqual(sectionSummary("kangoo"), [
    { title: "Vehicles", values: ["van"] },
  ]);
  // The id comes from the unfiltered order, so it does not shift when the
  // groups before it are hidden.
  assert.deepEqual(
    visibleComboboxSections(tags, "loft").map((section) => section.id),
    ["combobox-group-2"],
  );
  assert.deepEqual(sectionSummary("zzz"), []);
});

test("a query that matches a group name shows the whole group, ignoring case", () => {
  assert.deepEqual(sectionSummary("  VEHIC "), [
    { title: "Vehicles", values: ["van", "skoda"] },
  ]);
  // A group-name match and label matches in other groups combine.
  assert.deepEqual(sectionSummary("pro"), [
    { title: "Properties", values: ["flat2", "flat3"] },
    { title: "Projects", values: ["loft"] },
  ]);
  // Whitespace-only queries list everything.
  assert.equal(sectionSummary("   ").length, 4);
});

test("section filtering matches titles only when asked", () => {
  const sections = [
    { options: [{ label: "US Dollar", value: "usd" }], title: "Americas" },
  ];
  assert.deepEqual(filterComboboxSections(sections, "americas"), []);
  assert.deepEqual(
    filterComboboxSections(sections, "americas", { matchTitles: true }),
    sections,
  );
});

test("disabled options cannot be chosen", () => {
  const selection = comboboxSelection(rules({ values: ["van"] }));
  const skoda = tags[4];
  assert.deepEqual(comboboxOptionState(selection, skoda), {
    interactive: false,
    locked: false,
    selected: false,
  });
  assert.equal(toggleComboboxValue(selection, "skoda"), null);
});

test("a disabled option that is already selected can still be removed", () => {
  const selection = comboboxSelection(rules({ values: ["skoda"] }));
  assert.equal(comboboxOptionState(selection, tags[4]).interactive, true);
  assert.deepEqual(toggleComboboxValue(selection, "skoda"), []);
  assert.deepEqual(removeComboboxValue(selection, "skoda"), []);
});

test("locked values cannot be removed or toggled", () => {
  const selection = comboboxSelection(
    rules({ lockedValues: ["flat2"], values: ["flat2", "van"] }),
  );
  assert.deepEqual(comboboxOptionState(selection, tags[0]), {
    interactive: false,
    locked: true,
    selected: true,
  });
  assert.equal(removeComboboxValue(selection, "flat2"), null);
  assert.equal(toggleComboboxValue(selection, "flat2"), null);
  // Unlocked chips stay removable.
  assert.deepEqual(removeComboboxValue(selection, "van"), ["flat2"]);
});

test("a locked value missing from values is still shown as selected", () => {
  assert.deepEqual(missingLockedValues(["van"], ["flat2", "van"]), ["flat2"]);
  const selection = comboboxSelection(
    rules({ lockedValues: ["flat2"], values: ["van"] }),
  );
  assert.deepEqual(selection.values, ["van", "flat2"]);
  // The next change keeps the locked value.
  assert.deepEqual(toggleComboboxValue(selection, "loft"), [
    "van",
    "flat2",
    "loft",
  ]);
});

test("singlePerGroup replaces the group's value", () => {
  const selection = comboboxSelection(
    rules({ singlePerGroup: true, values: ["flat2", "van", "review"] }),
  );
  assert.deepEqual(toggleComboboxValue(selection, "flat3"), [
    "van",
    "review",
    "flat3",
  ]);
  // Choosing the selected option again still removes it.
  assert.deepEqual(toggleComboboxValue(selection, "van"), ["flat2", "review"]);
  // Options without a group are not limited.
  const ungrouped = comboboxSelection(
    rules({
      options: [...tags, { label: "Follow up", value: "follow" }],
      singlePerGroup: true,
      values: ["review"],
    }),
  );
  assert.deepEqual(toggleComboboxValue(ungrouped, "follow"), [
    "review",
    "follow",
  ]);
  // Without the prop the caller gets both values and does the replace.
  assert.deepEqual(
    toggleComboboxValue(
      comboboxSelection(rules({ values: ["flat2"] })),
      "flat3",
    ),
    ["flat2", "flat3"],
  );
});

test("singlePerGroup blocks other options of a group whose value is locked", () => {
  const selection = comboboxSelection(
    rules({
      lockedValues: ["flat2"],
      singlePerGroup: true,
      values: ["flat2"],
    }),
  );
  assert.equal(comboboxOptionState(selection, tags[3]).interactive, false);
  assert.equal(toggleComboboxValue(selection, "flat3"), null);
  // Other groups are unaffected.
  assert.deepEqual(toggleComboboxValue(selection, "van"), ["flat2", "van"]);
});

test("chips follow options order, not selection order", () => {
  const selection = comboboxSelection(
    rules({ lockedValues: ["flat2"], values: ["loft", "van", "flat2"] }),
  );
  assert.deepEqual(
    selectedComboboxOptions(tags, selection).map((option) => option.value),
    ["flat2", "van", "loft"],
  );
});
