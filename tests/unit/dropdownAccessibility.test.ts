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

test("selector trigger name is value-independent and exposes the value", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  // The trigger name resolves through selectorTriggerName (triggerLabel wins,
  // else the composed default) and the selected value moves to aria-valuetext,
  // so getByRole("button", { name }) stays stable across selections.
  assert.match(selectorSource, /function selectorTriggerName\(/);
  assert.match(selectorSource, /return triggerLabel \?\? fallback;/);
  assert.match(selectorSource, /accessibilityLabel=\{triggerName\}/);
  assert.match(selectorSource, /aria-valuetext=\{display \|\| placeholder\}/);
});

test("selector options forward an overridable accessible name", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  assert.match(
    selectorSource,
    /accessibilityLabel: option\.accessibilityLabel/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
