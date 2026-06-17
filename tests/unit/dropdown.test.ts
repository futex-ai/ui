import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  dropdownPlacement,
  dropdownPointWithinRects,
} from "../../src/dropdown/dropdownGeometry";
import {
  DROPDOWN_LAYERS,
  dropdownPortalClearsContent,
  dropdownPortalZIndex,
} from "../../src/dropdown/dropdownLayers";
import { dropdownListNavigationItems } from "../../src/dropdown/dropdownListModel";
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
import { dropdownScrollOffsetForActiveRow } from "../../src/dropdown/dropdownScroll";

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

test("dropdown list navigation keeps action rows enabled by default", () => {
  const navItems = dropdownListNavigationItems([
    { id: "section", label: "Menu", type: "section" },
    { id: "settings", label: "Settings", type: "item" },
    { disabled: true, id: "remove", label: "Remove", type: "item" },
  ]);

  assert.deepEqual(navItems, [
    { disabled: true, id: "section", selectable: false },
    { disabled: undefined, id: "settings", selectable: true },
    { disabled: true, id: "remove", selectable: true },
  ]);
  assert.equal(firstSelectableId(navItems), "settings");
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

test("dropdown portal uses a high default layer with an explicit override", () => {
  assert.ok(DROPDOWN_LAYERS.portal >= 1_000_000);
  assert.equal(DROPDOWN_LAYERS.surface > DROPDOWN_LAYERS.portal, true);
  assert.equal(dropdownPortalZIndex(), DROPDOWN_LAYERS.portal);
  assert.equal(dropdownPortalZIndex(4_200), 4_200);
  assert.equal(dropdownPortalZIndex(0), 0);
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

test("dropdown active row scroll offset keeps rows inside the list viewport", () => {
  assert.equal(
    dropdownScrollOffsetForActiveRow({
      activeBottom: 90,
      activeTop: 50,
      viewportBottom: 100,
      viewportTop: 20,
    }),
    0,
  );
  assert.equal(
    dropdownScrollOffsetForActiveRow({
      activeBottom: 40,
      activeTop: 10,
      viewportBottom: 100,
      viewportTop: 20,
    }),
    -10,
  );
  assert.equal(
    dropdownScrollOffsetForActiveRow({
      activeBottom: 130,
      activeTop: 90,
      viewportBottom: 100,
      viewportTop: 20,
    }),
    30,
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

test("dropdown list pins header and footer content outside the scroll area", () => {
  const source = readSource("../../src/dropdown/DropdownList.tsx");

  // Header renders before the scrollable rows, footer after them, so both
  // stay fixed while the option list scrolls between them.
  assert.match(
    source,
    /styles\.headerRegion[\s\S]*\{scroll\}[\s\S]*styles\.footerRegion/,
  );
  // The scroll body shrinks (rather than owning maxHeight) when chrome is
  // present so the pinned regions keep their natural height.
  assert.match(source, /hasChrome \? styles\.scroll : \{ maxHeight \}/);
});

test("dropdown selector forwards header and footer content to the list", () => {
  const source = readSource("../../src/dropdown/DropdownSelector.tsx");

  assert.match(source, /header\?: ReactNode;/);
  assert.match(source, /footer\?: ReactNode;/);
  assert.match(source, /<DropdownList[\s\S]*footer=\{footer\}/);
  assert.match(source, /<DropdownList[\s\S]*header=\{header\}/);
});

test("dropdown list pins the search slot above the header and options", () => {
  const source = readSource("../../src/dropdown/DropdownList.tsx");

  // The search region renders before the header, which renders before the
  // scrollable rows, so the search input stays fixed while options scroll.
  assert.match(
    source,
    /styles\.searchRegion[\s\S]*styles\.headerRegion[\s\S]*\{scroll\}/,
  );
  // The search slot also counts as chrome so the scroll body shrinks for it.
  assert.match(source, /Boolean\(search\)/);
});

test("dropdown selector filters options through a searchable input", () => {
  const source = readSource("../../src/dropdown/DropdownSelector.tsx");

  // Opt-in prop that filters options as the query changes.
  assert.match(source, /searchable\?: boolean;/);
  assert.match(source, /filterComboboxSections/);
  // The search input drives navigation through the document-level key listener
  // with the typeahead flag so the space bar keeps typing into the query.
  assert.match(source, /typeahead: searchable/);
  // A searchable selector renders a search field into the list search slot...
  assert.match(source, /<DropdownList[\s\S]*search=\{searchField\}/);
  // ...and shows an empty state when no options match the query.
  assert.match(source, /No matching options/);
});

test("dropdown selector sizes the field variant from the shared input scale", () => {
  const source = readSource("../../src/dropdown/DropdownSelector.tsx");
  const stylesSource = readSource(
    "../../src/dropdown/dropdownSelectorStyles.ts",
  );

  // Opt-in size prop, default md, threaded into the styles and the chevron.
  assert.match(source, /size\?: ControlSize;/);
  assert.match(
    source,
    /createDropdownSelectorStyles\(theme, props\.size \?\? "md"\)/,
  );
  assert.match(source, /size = "md"/);
  assert.match(source, /variant === "field" \? inputIconSize\(size\) : 13/);
  // The field box reuses the input's per-size geometry (single source of truth)
  // so a select and a text input stay the same height.
  assert.match(stylesSource, /import \{ inputSizeTokens \} from "\.\.\/input"/);
  assert.match(stylesSource, /const sizing = inputSizeTokens\(size\)/);
  assert.match(stylesSource, /height: sizing\.boxHeight/);
  assert.match(stylesSource, /paddingHorizontal: sizing\.paddingHorizontal/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
