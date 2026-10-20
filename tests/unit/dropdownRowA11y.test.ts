import assert from "node:assert/strict";
import test from "node:test";

import { dropdownRowA11y } from "../../src/dropdown/dropdownRowA11y";
import type { DropdownSelectableEntry } from "../../src/dropdown/dropdownRowA11y";

const tag: DropdownSelectableEntry = {
  id: "skoda",
  label: "Skoda Octavia WK21 LMN",
  secondary: "Consultancy trade",
  type: "item",
};

test("a web option row is described by its secondary line and is no Tab stop", () => {
  const a11y = dropdownRowA11y({
    entry: { ...tag, disabled: true, selected: false },
    isWeb: true,
    itemRole: "option",
    rowDomId: "list-row-skoda",
  });
  assert.equal(a11y.secondaryId, "list-row-skoda-secondary");
  assert.deepEqual(a11y.props, {
    accessibilityLabel: "Skoda Octavia WK21 LMN",
    accessibilityState: { disabled: true, selected: false },
    "aria-describedby": "list-row-skoda-secondary",
    "aria-selected": false,
    nativeID: "list-row-skoda",
    role: "option",
    tabIndex: -1,
  });
});

test("a web menu item has no selected state and no description without a secondary line", () => {
  const a11y = dropdownRowA11y({
    entry: {
      accessibilityLabel: "Archive tag",
      id: "a",
      label: "Archive",
      type: "item",
    },
    isWeb: true,
    itemRole: "menuitem",
    rowDomId: "menu-row-a",
  });
  assert.equal(a11y.secondaryId, undefined);
  assert.deepEqual(a11y.props, {
    accessibilityLabel: "Archive tag",
    accessibilityState: { disabled: undefined, selected: undefined },
    "aria-describedby": undefined,
    nativeID: "menu-row-a",
    role: "menuitem",
    tabIndex: -1,
  });
});

test("a native row is a button whose hint is its secondary line", () => {
  const a11y = dropdownRowA11y({
    entry: { ...tag, selected: true },
    isWeb: false,
    itemRole: "option",
    rowDomId: "list-row-skoda",
  });
  assert.equal(a11y.secondaryId, undefined);
  assert.deepEqual(a11y.props, {
    accessibilityHint: "Consultancy trade",
    accessibilityLabel: "Skoda Octavia WK21 LMN",
    accessibilityRole: "button",
    accessibilityState: { disabled: undefined, selected: true },
  });
});
