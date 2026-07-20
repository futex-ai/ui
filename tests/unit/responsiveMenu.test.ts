import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { DropdownListEntry } from "../../src/dropdown/DropdownList";
import { hasSelectableDropdownMenuEntry } from "../../src/dropdown/dropdownMenuModel";

test("hasSelectableDropdownMenuEntry is true only when a row can be selected", () => {
  const inert: DropdownListEntry[] = [
    { id: "section", label: "Section", type: "section" },
    { id: "divider", label: "divider", type: "divider" },
    {
      disabled: true,
      id: "off",
      label: "Off",
      onPress: () => undefined,
      type: "item",
    },
  ];
  assert.equal(hasSelectableDropdownMenuEntry(inert), false);

  assert.equal(
    hasSelectableDropdownMenuEntry([
      ...inert,
      { id: "go", label: "Go", onPress: () => undefined, type: "item" },
    ]),
    true,
  );
  // A non-disabled footer row is selectable too.
  assert.equal(
    hasSelectableDropdownMenuEntry([
      { id: "add", label: "Add", onPress: () => undefined, type: "footer" },
    ]),
    true,
  );
});

test("responsive menu owns the same keyboard machinery as the dropdown menu", () => {
  const source = readSource("../../src/popover/ResponsiveMenu.tsx");

  // Renders the menu list in the responsive surface.
  assert.match(source, /<ResponsivePopover/);
  assert.match(source, /<DropdownList/);
  assert.match(source, /listRole="menu"/);

  // Focus-independent navigation, driven through a controlled active row, is
  // what makes ↑/↓ work when focus rests on the dialog surface.
  assert.match(source, /useDropdownSelectorNavigation/);
  assert.match(source, /resetOnOpen: true/);
  assert.match(source, /activeId=\{activeRowId\}/);
  assert.match(source, /onActiveIdChange=\{setActiveRowId\}/);

  // Selectable rows close the surface after a press, and only selectable menus
  // arm the keyboard navigation.
  assert.match(source, /closeDropdownMenuEntries/);
  assert.match(source, /hasSelectableDropdownMenuEntry/);
});

test("public popover entrypoint exports the responsive menu", () => {
  const source = readSource("../../src/popover/index.ts");
  assert.match(source, /ResponsiveMenu/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
