import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dropdown rows expose an overridable accessible name", () => {
  const listSource = readSource("../../src/dropdown/DropdownList.tsx");

  // The row's accessible name is overridable per entry and defaults to the
  // visible label, so callers can disambiguate duplicates or pin a
  // locale-stable name for getByRole(role, { name }).
  assert.match(
    listSource,
    /accessibilityLabel=\{entry\.accessibilityLabel \?\? entry\.label\}/,
  );
});

test("selector trigger name is value-independent", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  // The trigger name resolves through selectorTriggerName (triggerLabel wins,
  // else the composed default), so getByRole("button", { name }) stays stable
  // across selections while the value stays visible in the trigger text.
  assert.match(selectorSource, /function selectorTriggerName\(/);
  assert.match(selectorSource, /return triggerLabel \?\? fallback;/);
  assert.match(selectorSource, /accessibilityLabel=\{triggerName\}/);
});

test("selector options forward an overridable accessible name", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  assert.match(
    selectorSource,
    /accessibilityLabel: option\.accessibilityLabel/,
  );
});

test("selector reveals supplementary help from a labelInfo button", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");
  const stylesSource = readSource(
    "../../src/dropdown/dropdownSelectorStyles.ts",
  );

  // The shared ⓘ affordance is reused, not re-implemented.
  assert.match(
    selectorSource,
    /import \{ inputIconSize, LabelInfo \} from "\.\.\/input"/,
  );
  // The label + ⓘ share one row; the ⓘ renders only when `labelInfo` is set.
  assert.match(selectorSource, /<View style=\{styles\.labelRow\}>/);
  assert.match(
    selectorSource,
    /\{labelInfo \? \([\s\S]*?<LabelInfo[\s\S]*?info=\{labelInfo\}[\s\S]*?\) : null\}/,
  );
  // The button's default accessible name derives from the visible label.
  assert.match(selectorSource, /More information about \$\{label\}/);
  // `labelInfo` without a `label` has nowhere to anchor: a dev-warned no-op.
  assert.match(selectorSource, /if \(labelInfo && !label\)/);
  assert.match(selectorSource, /devWarn\(/);
  assert.match(stylesSource, /labelRow: \{[\s\S]*?flexDirection: "row"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
