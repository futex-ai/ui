import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { DropdownListEntry } from "../../src/dropdown/DropdownList";
import {
  closeDropdownMenuEntries,
  dropdownMenuTriggerProps,
  resolveDropdownMenuOpen,
} from "../../src/dropdown/dropdownMenuModel";

test("dropdown menu open state follows internal state when uncontrolled", () => {
  assert.deepEqual(resolveDropdownMenuOpen(undefined, false), {
    controlled: false,
    open: false,
  });
  assert.deepEqual(resolveDropdownMenuOpen(undefined, true), {
    controlled: false,
    open: true,
  });
});

test("dropdown menu open state follows the controlled prop", () => {
  assert.deepEqual(resolveDropdownMenuOpen(true, false), {
    controlled: true,
    open: true,
  });
  assert.deepEqual(resolveDropdownMenuOpen(false, true), {
    controlled: true,
    open: false,
  });
});

test("dropdown menu trigger props expose expanded state and toggle handler", () => {
  const toggle = () => undefined;
  const closed = dropdownMenuTriggerProps(false, toggle);

  assert.deepEqual(closed, {
    "aria-expanded": false,
    onPress: toggle,
  });
  assert.equal(closed.onPress, toggle);
  assert.equal(dropdownMenuTriggerProps(true, toggle)["aria-expanded"], true);
});

test("dropdown menu entries close after selectable row presses", () => {
  const events: string[] = [];
  const entries: DropdownListEntry[] = [
    {
      id: "settings",
      label: "Settings",
      onPress: () => events.push("settings"),
      type: "item",
    },
    { id: "divider", label: "divider", type: "divider" },
    {
      id: "create",
      label: "Create",
      onPress: () => events.push("create"),
      type: "footer",
    },
  ];

  const wrapped = closeDropdownMenuEntries(
    entries,
    () => events.push("close"),
    true,
  );
  const first = wrapped[0];
  const divider = wrapped[1];
  const footer = wrapped[2];

  assert.notEqual(first, entries[0]);
  assert.equal(divider, entries[1]);
  assert.notEqual(footer, entries[2]);
  if ("onPress" in first) first.onPress?.();
  if ("onPress" in footer) footer.onPress?.();
  assert.deepEqual(events, ["settings", "close", "create", "close"]);
});

test("dropdown menu entry wrapping preserves disabled rows and opt-out arrays", () => {
  const entries: DropdownListEntry[] = [
    {
      disabled: true,
      id: "disabled",
      label: "Disabled",
      onPress: () => undefined,
      type: "item",
    },
  ];

  assert.equal(
    closeDropdownMenuEntries(entries, () => undefined, false),
    entries,
  );
  assert.equal(
    closeDropdownMenuEntries(entries, () => undefined, true)[0],
    entries[0],
  );
});

test("dropdown menu composes the shared portal and list primitives", () => {
  const source = readSource("../../src/dropdown/DropdownMenu.tsx");
  const entrypoint = readSource("../../src/dropdown/index.ts");

  assert.match(source, /resolveDropdownMenuOpen/);
  assert.match(source, /closeDropdownMenuEntries/);
  assert.match(source, /children: DropdownMenuTrigger/);
  assert.match(source, /cloneElement/);
  assert.match(source, /<DropdownPortal/);
  assert.match(source, /<DropdownList/);
  assert.match(
    source,
    /dropdownMenuTriggerNode\(children, menuState, triggerProps\)/,
  );
  assert.match(entrypoint, /DropdownMenu/);
  assert.match(entrypoint, /dropdownMenuModel/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
