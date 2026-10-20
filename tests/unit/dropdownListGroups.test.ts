import assert from "node:assert/strict";
import test from "node:test";

import type { DropdownListEntry } from "../../src/dropdown/DropdownList";
import {
  dropdownListContainerA11y,
  dropdownListSegments,
} from "../../src/dropdown/dropdownListModel";

const row = (id: string): DropdownListEntry => ({
  id,
  label: id,
  type: "item",
});
const section = (id: string): DropdownListEntry => ({
  id,
  label: id,
  type: "section",
});

function summary(entries: DropdownListEntry[], groupSections: boolean) {
  return dropdownListSegments(entries, groupSections).map((segment) => ({
    heading: segment.heading?.id,
    ids: segment.entries.map((entry) => entry.id),
  }));
}

test("grouped segments put each heading over the rows that follow it", () => {
  const entries = [
    row("review"),
    section("Properties"),
    row("flat2"),
    row("flat3"),
    { id: "rule", label: "", type: "divider" } as DropdownListEntry,
    row("archive"),
    section("Vehicles"),
    row("van"),
    // A trailing note or an empty state is a heading with no rows: it stays a
    // plain line instead of naming an empty group.
    section("note"),
  ];
  assert.deepEqual(summary(entries, true), [
    { heading: undefined, ids: ["review"] },
    { heading: "Properties", ids: ["flat2", "flat3"] },
    { heading: undefined, ids: ["rule"] },
    { heading: undefined, ids: ["archive"] },
    { heading: "Vehicles", ids: ["van"] },
    { heading: undefined, ids: ["note"] },
  ]);
});

test("ungrouped lists stay one run of rows", () => {
  const entries = [section("Properties"), row("flat2")];
  assert.deepEqual(summary(entries, false), [
    { heading: undefined, ids: ["Properties", "flat2"] },
  ]);
});

test("the list container owns pinned rows on web only", () => {
  const web = dropdownListContainerA11y({
    focusable: false,
    isWeb: true,
    label: "Tags",
    listId: "list",
    listRole: "listbox",
    ownedIds: ["list-row-create"],
    required: true,
  }) as Record<string, unknown>;
  assert.equal(web["aria-owns"], "list-row-create");
  assert.equal(web["aria-required"], true);
  assert.equal(web.role, "listbox");
  const plain = dropdownListContainerA11y({
    focusable: false,
    isWeb: true,
    listId: "list",
    listRole: "menu",
    ownedIds: [],
    required: true,
  }) as Record<string, unknown>;
  // No owned rows, no attribute; `aria-required` is not valid on a menu.
  assert.equal("aria-owns" in plain, false);
  assert.equal("aria-required" in plain, false);
  assert.deepEqual(
    dropdownListContainerA11y({
      focusable: true,
      isWeb: false,
      listRole: "listbox",
      ownedIds: ["x"],
    }),
    {},
  );
});

test("a focusable list is the Tab stop and points at its active row", () => {
  const focusable = dropdownListContainerA11y({
    activeRowId: "list-row-van",
    focusable: true,
    isWeb: true,
    listId: "list",
    listRole: "listbox",
    ownedIds: [],
  }) as Record<string, unknown>;
  assert.equal(focusable.tabIndex, 0);
  assert.equal(focusable["aria-activedescendant"], "list-row-van");
  // A combobox input controls the list instead: no stop, no active row.
  const controlled = dropdownListContainerA11y({
    activeRowId: "list-row-van",
    focusable: false,
    isWeb: true,
    listId: "list",
    listRole: "listbox",
    ownedIds: [],
  }) as Record<string, unknown>;
  assert.equal("tabIndex" in controlled, false);
  assert.equal("aria-activedescendant" in controlled, false);
});
