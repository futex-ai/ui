import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { filterComboboxSections } from "../../src/dropdown/comboboxModel";
import type { DropdownListEntry } from "../../src/dropdown/DropdownList";
import {
  dropdownGroupHeadingDomId,
  dropdownListNavigationItems,
  dropdownListSegments,
  dropdownRowDescriptionDomId,
  isActivatableDropdownListEntry,
  isInertDropdownListEntry,
} from "../../src/dropdown/dropdownListModel";
import type { DropdownListItemEntry } from "../../src/dropdown/dropdownListModel";
import {
  navigationResetKey,
  nextSelectableId,
  selectedOrFirstId,
} from "../../src/dropdown/dropdownNavigation";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  junoDarkSharedUiTheme,
  junoSharedUiTheme,
} from "../../src/theme";

const item = (
  id: string,
  extra: Partial<DropdownListItemEntry> = {},
): DropdownListEntry => ({ id, label: id, type: "item", ...extra });

test("grouped sections wrap the rows up to the next section or divider", () => {
  const entries: DropdownListEntry[] = [
    item("loose"),
    { group: true, id: "g1", label: "Properties", type: "section" },
    item("flat"),
    item("mill"),
    { id: "note", label: "Plain heading", type: "section" },
    item("after-note"),
    { group: true, id: "g2", label: "Vehicles", type: "section" },
    item("van"),
    { id: "rule", label: "", type: "divider" },
    item("after-rule"),
  ];
  assert.deepEqual(
    dropdownListSegments(entries).map((segment) => ({
      heading: segment.heading?.label,
      rows: segment.rows.map((row) => row.id),
    })),
    [
      { heading: undefined, rows: ["loose"] },
      { heading: "Properties", rows: ["flat", "mill"] },
      { heading: undefined, rows: ["note", "after-note"] },
      { heading: "Vehicles", rows: ["van"] },
      { heading: undefined, rows: ["rule", "after-rule"] },
    ],
  );
  // A list without grouped sections stays one segment, rendered as before.
  const flat = [item("a"), { id: "s", label: "S", type: "section" } as const];
  assert.equal(dropdownListSegments(flat).length, 1);
});

test("grouped headings and row descriptions get stable DOM ids", () => {
  assert.equal(dropdownGroupHeadingDomId("list", "g1"), "list-group-g1");
  assert.equal(dropdownGroupHeadingDomId(undefined, "g1"), undefined);
  assert.equal(
    dropdownRowDescriptionDomId("list-row-van"),
    "list-row-van-description",
  );
  assert.equal(dropdownRowDescriptionDomId(undefined), undefined);
});

test("locked and focusable disabled rows are reachable but never activated", () => {
  const locked = item("locked", { locked: true, selected: true });
  const focusable = item("focusable", {
    disabled: true,
    focusableWhenDisabled: true,
  });
  const skipped = item("skipped", { disabled: true });
  const normal = item("normal");

  assert.equal(isInertDropdownListEntry(locked), true);
  assert.equal(isInertDropdownListEntry(focusable), true);
  assert.equal(isInertDropdownListEntry(skipped), false);
  assert.equal(isActivatableDropdownListEntry(locked), false);
  assert.equal(isActivatableDropdownListEntry(focusable), false);
  assert.equal(isActivatableDropdownListEntry(skipped), false);
  assert.equal(isActivatableDropdownListEntry(normal), true);
  assert.equal(isActivatableDropdownListEntry(undefined), false);

  const navItems = dropdownListNavigationItems([
    locked,
    focusable,
    skipped,
    normal,
  ]);
  // Arrow keys stop on the inert rows and still skip the plain disabled row.
  assert.equal(nextSelectableId(navItems, "locked", 1), "focusable");
  assert.equal(nextSelectableId(navItems, "focusable", 1), "normal");
  // Opening prefers a row that can be activated over a selected locked row.
  assert.equal(selectedOrFirstId(navItems, "locked"), "normal");
  // With no activatable row, the first reachable row is still active.
  assert.equal(
    selectedOrFirstId(dropdownListNavigationItems([locked, skipped]), null),
    "locked",
  );
  // Toggling a row between inert and normal resets the active row.
  assert.notEqual(
    navigationResetKey(dropdownListNavigationItems([locked])),
    navigationResetKey(dropdownListNavigationItems([item("locked")])),
  );
});

test("pinned footer rows follow the scrolling rows in keyboard order", () => {
  const source = readSource("../../src/dropdown/DropdownList.tsx");
  // Navigation and Enter run over the scrolling rows plus the pinned rows.
  assert.match(source, /\[\.\.\.entries, \.\.\.footerEntries\]/);
  // Pinned rows render inside the listbox element, after the scroll view.
  assert.match(
    source,
    /<View style=\{styles\.pinnedList\} \{\.\.\.containerA11y\} \{\.\.\.keyProps\}>\s*\{rows\}\s*<View style=\{styles\.footerEntriesRegion\}>/,
  );
  // An active pinned row never scrolls the rows.
  assert.match(source, /activeId && !activeIsPinned/);
});

test("dropdown rows expose groups, descriptions, and inert state on web", () => {
  const list = readSource("../../src/dropdown/DropdownList.tsx");
  const a11y = readSource("../../src/dropdown/dropdownListA11y.ts");
  assert.match(a11y, /"aria-labelledby": headingDomId,\s*role: "group"/);
  assert.match(list, /"aria-describedby": descriptionId/);
  assert.match(list, /nativeID=\{descriptionId\}/);
  // Inert rows are disabled to the platform (`aria-disabled` on web) and
  // ignore hover, and show the inset ring rather than the activation fill.
  assert.match(list, /disabled=\{inactive\}/);
  assert.match(list, /onHoverIn=\{inactive \? undefined : onHover\}/);
  assert.match(list, /active: active && !inert/);
  assert.match(list, /inert && active \? styles\.itemActiveRing : null/);
});

test("descriptions use primaryDeep on the soft fills; trailing text does not", () => {
  const list = readSource("../../src/dropdown/DropdownList.tsx");
  const styles = readSource("../../src/dropdown/dropdownListStyles.ts");
  assert.match(
    styles,
    /itemSecondaryOnSoft: \{ color: theme\.colors\.primaryDeep \}/,
  );
  // The selected fill and the active ringFill and dot fills set it...
  for (const fill of [
    "itemSelectedFill",
    "itemActiveRingFill",
    "itemActiveDot",
  ]) {
    assert.match(
      styles,
      new RegExp(
        `rowStyle = styles\\.${fill};\\s*labelStyle = styles\\.itemLabelActive;\\s*descriptionStyle = styles\\.itemSecondaryOnSoft;`,
      ),
    );
  }
  // ...for the secondary line only; `rightText` keeps `secondaryStyle`.
  assert.match(
    list,
    /\[styles\.secondary, highlight\.secondaryStyle\],\s*highlight\.descriptionStyle,/,
  );
  assert.doesNotMatch(list, /styles\.rightText,[^\]]*descriptionStyle/);
  // Every pair a description or chip can land on clears AA in all four
  // shipped themes; `muted` on `primarySoft` (the old selected-row subtext)
  // and on `soft` do not in the default theme.
  for (const theme of [
    defaultSharedUiTheme,
    junoSharedUiTheme,
    darkSharedUiTheme,
    junoDarkSharedUiTheme,
  ]) {
    const { colors } = theme;
    for (const [text, fill] of [
      [colors.primaryDeep, colors.primarySoft],
      [colors.primaryDeep, colors.soft],
      [colors.onSolid, colors.primary],
      [colors.muted, colors.surface],
    ]) {
      assert.ok(contrastRatio(text, fill) >= 4.5, `${text} on ${fill}`);
    }
  }
  const { colors } = defaultSharedUiTheme;
  assert.ok(contrastRatio(colors.muted, colors.primarySoft) < 4.5);
  assert.ok(contrastRatio(colors.muted, colors.soft) < 4.5);
});

test("section filtering can keep a whole section whose title matches", () => {
  const sections = [
    { options: [{ label: "Euro" }, { label: "Krona" }], title: "Europe" },
    { options: [{ label: "Yen" }], title: "Asia" },
  ];
  assert.deepEqual(filterComboboxSections(sections, "europe"), []);
  assert.deepEqual(
    filterComboboxSections(sections, "EUROPE", { matchTitles: true }),
    [sections[0]],
  );
  assert.deepEqual(
    filterComboboxSections(sections, "yen", { matchTitles: true }),
    [sections[1]],
  );
});

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((start) => {
    const channel = parseInt(value.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
