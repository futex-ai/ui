/**
 * Source checks of the dropdown list rows: the pinned chrome, the row slots,
 * and the inversion of row content on the solid active fill.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("dropdown row inverts its subtext on the solid active fill", () => {
  const list = readSource("../../src/dropdown/DropdownRow.tsx");
  const stylesSource = readSource("../../src/dropdown/dropdownListStyles.ts");

  // The subtext line picks up the highlight's secondary override on top of the
  // base muted style, so an active solid row's subtext is recolored rather than
  // left at the muted grey that vanishes against the `primary` fill.
  assert.match(list, /styles\.secondary, highlight\.secondaryStyle/);
  // The solid active row maps the subtext to `onSolid`, mirroring the inverted
  // label, and the highlight shape exposes that override.
  assert.match(
    stylesSource,
    /itemSecondaryOnSolid: \{ color: theme\.colors\.onSolid \}/,
  );
  assert.match(stylesSource, /secondaryStyle: object \| null;/);
  // Only the solid active branch sets the override; every other state leaves it
  // null so light fills keep the muted subtext.
  assert.match(
    stylesSource,
    /solidActiveFill\(styles, state\.tone\);\s*labelStyle = styles\.itemLabelOnSolid;\s*secondaryStyle = styles\.itemSecondaryOnSolid;/,
  );
});

test("dropdown item rows forward a per-entry testID to the row pressable", () => {
  const types = readSource("../../src/dropdown/dropdownListTypes.ts");
  const row = readSource("../../src/dropdown/DropdownRow.tsx");
  const selector = readSource("../../src/dropdown/DropdownSelector.tsx");

  // The item/footer entry carries an optional testID, forwarded to its row.
  assert.match(
    types,
    /Test identifier forwarded to this row's pressable[\s\S]*?testID\?: string;/,
  );
  assert.match(row, /testID=\{entry\.testID\}/);
  // The selector option exposes the same testID and threads it into the entry.
  assert.match(selector, /testID\?: string;/);
  assert.match(selector, /testID: option\.testID,/);
});

test("dropdown danger row uses a red solid highlight with inverted text", () => {
  const list = readSource("../../src/dropdown/DropdownRow.tsx");
  const stylesSource = readSource("../../src/dropdown/dropdownListStyles.ts");

  // The solid active fill is tone-aware: danger/amber rows take their deep
  // accents so the fill itself carries the tone under white text.
  assert.match(
    stylesSource,
    /itemActiveSolidDanger: \{ backgroundColor: theme\.colors\.roseDeep \}/,
  );
  assert.match(
    stylesSource,
    /itemActiveSolidWarning: \{ backgroundColor: theme\.colors\.amberDeep \}/,
  );
  assert.match(
    stylesSource,
    /tone === "danger"[\s\S]*?return styles\.itemActiveSolidDanger/,
  );
  // The highlight reports the inverted (solid active) row, and DropdownList uses
  // that to drop the tone accent so the white label wins instead of red-on-fill.
  assert.match(stylesSource, /invertText/);
  assert.match(list, /tone: entry\.tone/);
  assert.match(list, /highlight\.invertText\s*\?\s*null/);
});

test("dropdown row renders trailing rightText that inverts on the solid fill", () => {
  const list = readSource("../../src/dropdown/DropdownRow.tsx");
  const stylesSource = readSource("../../src/dropdown/dropdownListStyles.ts");
  const selector = readSource("../../src/dropdown/DropdownSelector.tsx");

  // The trailing text is library-rendered (like `secondary`) over the base muted
  // style, so it reuses the active-row inversion instead of staying muted grey
  // (~1.2:1) on the `primary` fill.
  assert.match(list, /styles\.rightText, highlight\.secondaryStyle/);
  assert.match(
    stylesSource,
    /rightText: \{[\s\S]*?color: theme\.colors\.muted[\s\S]*?\}/,
  );
  // The rightText occupies the trailing slot like a custom `right` node, so it
  // suppresses the redundant selection check rather than doubling up.
  assert.match(list, /!entry\.right\s*&&\s*!entry\.rightText/);
  // The selector forwards an option's `rightText` straight through to the row.
  assert.match(selector, /rightText\?: string;/);
  assert.match(selector, /rightText: option\.rightText/);
});

test("dropdown row slots can render against the active row's content color", () => {
  const types = readSource("../../src/dropdown/dropdownListTypes.ts");
  const list = readSource("../../src/dropdown/DropdownRow.tsx");
  const stylesSource = readSource("../../src/dropdown/dropdownListStyles.ts");
  const selector = readSource("../../src/dropdown/DropdownSelector.tsx");

  // A caller node is opaque to the library, so an icon hard-coded to `ink`
  // stayed near-black on the `primary` fill while the label beside it inverted
  // to white. Both slots take an optional render function instead, handed the
  // row's resolved content color so the caller can tint its own glyph.
  assert.match(
    types,
    /export type DropdownRowSlot =\s*\|\s*ReactNode\s*\|\s*\(\(state: \{ color: string \}\) => ReactNode\);/,
  );
  assert.match(types, /leading\?: DropdownRowSlot;/);
  assert.match(types, /right\?: DropdownRowSlot;/);
  // Both slots resolve through the same helper, so `leading` and `right` cannot
  // drift apart the way `secondary`/`rightText` did.
  assert.match(
    list,
    /renderRowSlot\(entry\.leading, highlight\.contentColor\)/,
  );
  assert.match(list, /renderRowSlot\(entry\.right, highlight\.contentColor\)/);
  assert.match(
    list,
    /function renderRowSlot\([\s\S]*?typeof slot === "function" \? slot\(\{ color \}\) : slot/,
  );

  // The highlight resolves the content color alongside the label style in the
  // same state branch, so a slot always matches the label beside it.
  assert.match(stylesSource, /contentColor: string;/);
  assert.match(
    stylesSource,
    /labelStyle = styles\.itemLabelOnSolid;\s*secondaryStyle = styles\.itemSecondaryOnSolid;\s*contentColor = theme\.colors\.onSolid;/,
  );
  // Off the inverted row the tone accent wins, mirroring how `toneLabel`
  // overrides the label style in DropdownList.
  assert.match(
    stylesSource,
    /if \(!invertText\)[\s\S]*?tone === "danger"[\s\S]*?theme\.colors\.rose[\s\S]*?tone === "amber"[\s\S]*?theme\.colors\.amber/,
  );

  // The selector's `right` option widens with the row slot it feeds.
  assert.match(selector, /right\?: DropdownRowSlot;/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
