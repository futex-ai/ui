import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { handleComboboxKeyDown } from "../../src/dropdown/comboboxKeys";
import type { ComboboxKeyState } from "../../src/dropdown/comboboxKeys";
import {
  COMBOBOX_FOOTER_ACTION_ID,
  comboboxFooterAction,
  comboboxOptionCount,
  comboboxOptionState,
  filterComboboxOptionSections,
  groupComboboxOptions,
  isComboboxValueLocked,
  toggleComboboxValue,
} from "../../src/dropdown/comboboxMultiSelectModel";
import type { ComboboxSelectionRules } from "../../src/dropdown/comboboxMultiSelectModel";
import type { ComboboxMultiSelectOption } from "../../src/dropdown/comboboxMultiSelectTypes";
import type { DropdownListEntry } from "../../src/dropdown/DropdownList";
import { dropdownListNavigationItems } from "../../src/dropdown/dropdownListModel";

/** The Bookfolio example from the request, plus one ungrouped tag. */
const TAGS: ComboboxMultiSelectOption[] = [
  { label: "Needs review", value: "review" },
  {
    description: "UK rental property",
    group: "Properties",
    label: "Flat 2, 14 Brook Street",
    value: "flat2",
  },
  {
    description: "UK rental property",
    group: "Vehicles",
    label: "Renault Kangoo BX19 KLM",
    value: "van",
  },
  { group: "Properties", label: "9 Mill Lane", value: "mill9" },
  {
    description: "Consultancy trade",
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
    options: TAGS,
    singlePerGroup: false,
    values: [],
    ...overrides,
  };
}

function option(value: string): ComboboxMultiSelectOption {
  const found = TAGS.find((candidate) => candidate.value === value);
  assert.ok(found, `missing option ${value}`);
  return found;
}

test("grouping lists ungrouped options first, then groups by first option", () => {
  const sections = groupComboboxOptions(TAGS);
  assert.deepEqual(
    sections.map((section) => ({
      title: section.title,
      values: section.options.map((candidate) => candidate.value),
    })),
    [
      { title: undefined, values: ["review"] },
      { title: "Properties", values: ["flat2", "mill9"] },
      { title: "Vehicles", values: ["van", "skoda"] },
      { title: "Projects", values: ["loft"] },
    ],
  );
  // Keys stay stable and never collide with an option value.
  assert.deepEqual(
    sections.map((section) => section.key),
    [
      "combobox-ungrouped",
      "combobox-group-0",
      "combobox-group-1",
      "combobox-group-2",
    ],
  );
  // An empty group name counts as ungrouped, so no blank heading renders.
  assert.deepEqual(
    groupComboboxOptions([{ group: "", label: "Solo", value: "solo" }]).map(
      (section) => section.title,
    ),
    [undefined],
  );
});

test("group-name search lists the whole group, case-insensitively", () => {
  const sections = groupComboboxOptions(TAGS);
  const byTitle = (query: string) =>
    filterComboboxOptionSections(sections, query).map((section) => ({
      title: section.title,
      values: section.options.map((candidate) => candidate.value),
    }));

  // "veh" matches the Vehicles group name, so both vehicles list, including
  // the disabled one, while groups with no match drop out.
  assert.deepEqual(byTitle("  VEH "), [
    { title: "Vehicles", values: ["van", "skoda"] },
  ]);
  // A label match keeps just the matching options of each group.
  assert.deepEqual(byTitle("lane"), [
    { title: "Properties", values: ["mill9"] },
  ]);
  // Descriptions are not searched.
  assert.deepEqual(byTitle("consultancy"), []);
  // An empty query returns the sections untouched.
  assert.equal(filterComboboxOptionSections(sections, "  "), sections);
  assert.equal(
    comboboxOptionCount(filterComboboxOptionSections(sections, "o")),
    5,
  );
});

test("disabled options cannot be chosen but stay reachable by keyboard", () => {
  const skoda = option("skoda");
  assert.deepEqual(comboboxOptionState(skoda, rules()), {
    disabled: true,
    locked: false,
    selected: false,
  });
  const values = ["van"];
  assert.equal(toggleComboboxValue(skoda, rules({ values })), values);

  // The row the combobox builds for it (`disabled` + `focusableWhenDisabled`)
  // is reachable by arrow keys but never activated.
  const [item] = dropdownListNavigationItems([
    {
      disabled: true,
      focusableWhenDisabled: true,
      id: "skoda",
      label: skoda.label,
      type: "item",
    },
  ]);
  assert.deepEqual(item, {
    disabled: false,
    id: "skoda",
    inert: true,
    selectable: true,
  });
});

test("locked values cannot be removed and fix their group with singlePerGroup", () => {
  const locked = rules({
    lockedValues: ["flat2", "loft"],
    singlePerGroup: true,
    values: ["flat2"],
  });
  // `loft` is not selected, so its lock is ignored.
  assert.equal(isComboboxValueLocked("flat2", locked), true);
  assert.equal(isComboboxValueLocked("loft", locked), false);
  assert.deepEqual(comboboxOptionState(option("flat2"), locked), {
    disabled: false,
    locked: true,
    selected: true,
  });
  assert.equal(toggleComboboxValue(option("flat2"), locked), locked.values);

  // The locked property fixes the Properties group: its other option is
  // disabled and choosing it changes nothing.
  assert.equal(comboboxOptionState(option("mill9"), locked).disabled, true);
  assert.equal(toggleComboboxValue(option("mill9"), locked), locked.values);
  // Without singlePerGroup the group stays open.
  assert.equal(
    comboboxOptionState(option("mill9"), { ...locked, singlePerGroup: false })
      .disabled,
    false,
  );
});

test("singlePerGroup replaces the group's value and still toggles off", () => {
  const single = rules({
    singlePerGroup: true,
    values: ["review", "flat2", "unknown"],
  });
  // Choosing another property replaces the selected one; the ungrouped tag
  // and a value with no option are kept.
  assert.deepEqual(toggleComboboxValue(option("mill9"), single), [
    "review",
    "unknown",
    "mill9",
  ]);
  // Choosing the selected option still removes it.
  assert.deepEqual(toggleComboboxValue(option("flat2"), single), [
    "review",
    "unknown",
  ]);
  // Ungrouped options stay multi-select.
  assert.deepEqual(
    toggleComboboxValue(
      { label: "Follow up", value: "follow" },
      {
        ...single,
        options: [...TAGS, { label: "Follow up", value: "follow" }],
      },
    ),
    ["review", "flat2", "unknown", "follow"],
  );
  // Without the prop the caller gets an append and does the replacing.
  assert.deepEqual(
    toggleComboboxValue(option("mill9"), { ...single, singlePerGroup: false }),
    ["review", "flat2", "unknown", "mill9"],
  );
});

test("footer action runs from the keyboard with the trimmed query", () => {
  const calls: string[] = [];
  const action = comboboxFooterAction(
    {
      label: (query) => (query ? `Create tag “${query}”` : "Create tag"),
      onPress: (query) => calls.push(`create:${query}`),
    },
    "  van ",
    () => calls.push("close"),
  );
  assert.equal(action.label, "Create tag “van”");

  // The rows the combobox builds: a group heading, two options, and the
  // pinned action after them.
  const entries: DropdownListEntry[] = [
    { group: true, id: "combobox-group-0", label: "Vehicles", type: "section" },
    {
      id: "van",
      label: "Renault Kangoo BX19 KLM",
      onPress: () => calls.push("van"),
      type: "item",
    },
    {
      disabled: true,
      focusableWhenDisabled: true,
      id: "skoda",
      label: "Skoda Octavia WK21 LMN",
      onPress: () => calls.push("skoda"),
      type: "item",
    },
    {
      id: COMBOBOX_FOOTER_ACTION_ID,
      label: action.label,
      onPress: action.onPress,
      type: "item",
    },
  ];
  let activeId: string | null = "van";
  const state = (): ComboboxKeyState => ({
    activeId,
    entries,
    navItems: dropdownListNavigationItems(entries),
    onClose: () => calls.push("escape"),
    onOpen: () => calls.push("open"),
    open: true,
    setActiveId: (id) => {
      activeId = id;
    },
  });

  // ArrowDown stops on the disabled row, where Enter does nothing...
  assert.equal(handleComboboxKeyDown({ key: "ArrowDown" }, state()), true);
  assert.equal(activeId, "skoda");
  handleComboboxKeyDown({ key: "Enter" }, state());
  assert.deepEqual(calls, []);
  // ...then reaches the pinned action, where Enter runs it with the query.
  handleComboboxKeyDown({ key: "ArrowDown" }, state());
  assert.equal(activeId, COMBOBOX_FOOTER_ACTION_ID);
  handleComboboxKeyDown({ key: "Enter" }, state());
  assert.deepEqual(calls, ["create:van", "close"]);
  // Space is never claimed: it types into the input.
  assert.equal(handleComboboxKeyDown({ key: " " }, state()), false);
});

test("combobox multi-select renders locked chips without a remove button", () => {
  const chip = readSource("../../src/dropdown/ComboboxChip.tsx");
  // A locked chip swaps the remove button for a decorative lock.
  assert.match(
    chip,
    /\{!trailing \? null : locked \? \([\s\S]*?<View aria-hidden style=\{styles\.chipRemove\}>[\s\S]*?<Lock[\s\S]*?\) : \([\s\S]*?accessibilityLabel=\{`Remove \$\{option\.label\}`\}/,
  );
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");
  assert.match(
    source,
    /locked=\{isComboboxValueLocked\(option\.value, rules\)\}/,
  );
  assert.match(source, /trailing=\{!singleLine\}/);
});

test("combobox multi-select pins the footer action and scopes its keys", () => {
  const source = readSource("../../src/dropdown/ComboboxMultiSelect.tsx");
  assert.match(source, /<DropdownList[\s\S]*footerEntries=\{footerEntries\}/);
  assert.match(source, /ownerIds: \[inputId, listId\]/);
  assert.match(source, /nativeID=\{inputId\}/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
