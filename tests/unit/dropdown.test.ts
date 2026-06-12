import assert from "node:assert/strict";
import test from "node:test";

import {
  DROPDOWN_LAYERS,
  dropdownPortalClearsContent,
} from "../../src/dropdown/dropdownLayers";
import {
  dropdownPlacement,
  dropdownPointWithinRects,
} from "../../src/dropdown/dropdownGeometry";
import {
  dropdownKeyAction,
  dropdownTriggerKeyAction,
  firstSelectableId,
  navigationResetKey,
  nextDropdownValue,
  nextSelectableId,
  selectedOrFirstId,
  shouldResetDropdownListActiveId,
} from "../../src/dropdown/dropdownNavigation";
import { dropdownShouldClose } from "../../src/dropdown/dropdownOutsideClose";

const items = [
  { id: "section", selectable: false },
  { id: "a" },
  { disabled: true, id: "b" },
  { id: "c" },
];

test("dropdown placement opens below when there is viewport space", () => {
  assert.deepEqual(
    dropdownPlacement(
      { height: 40, width: 120, x: 20, y: 80 },
      { height: 600, width: 800 },
      { maxHeight: 300 },
    ),
    { left: 20, maxHeight: 300, side: "bottom", top: 126, width: 120 },
  );
});

test("dropdown placement flips above and clamps height near viewport bottom", () => {
  assert.deepEqual(
    dropdownPlacement(
      { height: 40, width: 180, x: 700, y: 520 },
      { height: 600, width: 800 },
      { align: "end", maxHeight: 260, minWidth: 220 },
    ),
    { bottom: 86, left: 572, maxHeight: 260, side: "top", width: 220 },
  );
});

test("dropdown navigation skips disabled and structural rows", () => {
  assert.equal(firstSelectableId(items), "a");
  assert.equal(nextSelectableId(items, "a", 1), "c");
  assert.equal(nextSelectableId(items, "c", 1), "a");
  assert.equal(nextSelectableId(items, "a", -1), "c");
});

test("dropdown navigation falls back from missing selection to first selectable row", () => {
  assert.equal(selectedOrFirstId(items, "missing"), "a");
  assert.equal(selectedOrFirstId(items, "c"), "c");
});

test("dropdown active reset key survives rebuilt entry arrays", () => {
  const firstItems = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const rebuiltItems = firstItems.map((item) => ({ ...item }));
  let activeId = selectedOrFirstId(firstItems, null);

  activeId = nextSelectableId(firstItems, activeId, 1);
  if (navigationResetKey(firstItems) !== navigationResetKey(rebuiltItems)) {
    activeId = selectedOrFirstId(rebuiltItems, null);
  }

  assert.equal(nextSelectableId(rebuiltItems, activeId, 1), "c");
});

test("dropdown active reset key changes when row availability changes", () => {
  assert.notEqual(
    navigationResetKey([{ id: "a" }, { disabled: true, id: "b" }]),
    navigationResetKey([{ id: "a" }, { id: "b" }]),
  );
});

test("dropdown key mapping supports web menu commands", () => {
  assert.equal(dropdownKeyAction("ArrowDown"), "moveDown");
  assert.equal(dropdownKeyAction("ArrowUp"), "moveUp");
  assert.equal(dropdownKeyAction("Enter"), "select");
  assert.equal(dropdownKeyAction("Escape"), "close");
  assert.equal(dropdownKeyAction("Tab"), null);
});

test("selector trigger keyboard handling leaves press activation to Pressable", () => {
  assert.equal(dropdownTriggerKeyAction("ArrowDown"), "moveDown");
  assert.equal(dropdownTriggerKeyAction("ArrowUp"), "moveUp");
  assert.equal(dropdownTriggerKeyAction("Escape"), "close");
  assert.equal(dropdownTriggerKeyAction("Enter"), null);
  assert.equal(dropdownTriggerKeyAction(" "), null);
});

test("controlled dropdown lists keep parent-owned active selection on mount", () => {
  assert.equal(shouldResetDropdownListActiveId(undefined), true);
  assert.equal(shouldResetDropdownListActiveId(null), false);
  assert.equal(shouldResetDropdownListActiveId("flat_rate"), false);
});

test("dropdown outside close allows trigger and portal nodes", () => {
  const triggerTarget = new EventTarget();
  const portalTarget = new EventTarget();
  const outside = new EventTarget();
  const trigger = {
    contains: (target: EventTarget | null) => target === triggerTarget,
  };
  const portal = {
    contains: (target: EventTarget | null) => target === portalTarget,
  };

  assert.equal(dropdownShouldClose([trigger, portal], triggerTarget), false);
  assert.equal(dropdownShouldClose([trigger, portal], portalTarget), false);
  assert.equal(dropdownShouldClose([trigger, portal], outside), true);
});

test("dropdown portal layer clears ordinary app content", () => {
  assert.equal(
    dropdownPortalClearsContent(DROPDOWN_LAYERS.portal, DROPDOWN_LAYERS.base),
    true,
  );
});

test("dropdown point containment matches trigger and surface rects", () => {
  const surface = { bottom: 200, left: 100, right: 300, top: 80 };
  const trigger = { bottom: 70, left: 120, right: 190, top: 40 };

  assert.equal(
    dropdownPointWithinRects({ x: 150, y: 120 }, [trigger, surface]),
    true,
  );
  assert.equal(
    dropdownPointWithinRects({ x: 150, y: 55 }, [trigger, surface]),
    true,
  );
  assert.equal(
    dropdownPointWithinRects({ x: 150, y: 75 }, [trigger, surface]),
    false,
  );
  assert.equal(
    dropdownPointWithinRects({ x: 99, y: 120 }, [trigger, surface]),
    false,
  );
  assert.equal(
    dropdownPointWithinRects({ x: 100, y: 80 }, [null, surface]),
    true,
  );
  assert.equal(
    dropdownPointWithinRects({ x: 150, y: 120 }, [null, null]),
    false,
  );
});

test("selector keyboard stepping ignores disabled options", () => {
  assert.equal(
    nextDropdownValue(
      [{ value: "a" }, { disabled: true, value: "b" }, { value: "c" }],
      "a",
      1,
    ),
    "c",
  );
});

test("selector keyboard stepping starts from the list edge when value is empty or stale", () => {
  const options = [
    { value: "standard" },
    { value: "cash_accounting" },
    { value: "flat_rate" },
  ];

  assert.equal(nextDropdownValue(options, "", 1), "standard");
  assert.equal(nextDropdownValue(options, "", -1), "flat_rate");
  assert.equal(nextDropdownValue(options, "missing", 1), "standard");
  assert.equal(nextDropdownValue(options, "missing", -1), "flat_rate");
});
