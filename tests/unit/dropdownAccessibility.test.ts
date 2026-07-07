import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dropdown rows expose an overridable role and accessible name", () => {
  const listSource = readSource("../../src/dropdown/DropdownList.tsx");

  // Rows default to the `option` role (footer rows to `button`) and accept an
  // override, so consumers can target them via getByRole(role, { name }).
  assert.match(
    listSource,
    /role = entry\.role \?\? \(entry\.type === "footer" \? "button" : "option"\)/,
  );
  assert.match(listSource, /role=\{role\}/);
  // The accessible name is overridable and defaults to the visible label.
  assert.match(
    listSource,
    /accessibilityLabel=\{entry\.accessibilityLabel \?\? entry\.label\}/,
  );
});

test("dropdown option rows carry explicit aria-selected and aria-disabled", () => {
  const listSource = readSource("../../src/dropdown/DropdownList.tsx");

  // RNW drops accessibilityState.selected on the DOM, so selected/disabled
  // state is emitted explicitly to stay assertable in tests.
  assert.match(
    listSource,
    /aria-selected=\{role === "option" \? Boolean\(entry\.selected\) : undefined\}/,
  );
  assert.match(listSource, /aria-disabled=\{entry\.disabled \|\| undefined\}/);
});

test("dropdown selector maps options to the option role", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  assert.match(selectorSource, /role: "option" as const/);
  assert.match(
    selectorSource,
    /accessibilityLabel: option\.accessibilityLabel/,
  );
});

test("combobox names its search input and gives chip remove a button role", () => {
  const comboboxSource = readSource(
    "../../src/dropdown/ComboboxMultiSelect.tsx",
  );

  assert.match(
    comboboxSource,
    /accessibilityLabel=\{searchLabel \?\? placeholder\}/,
  );
  assert.match(
    comboboxSource,
    /accessibilityLabel=\{`Remove \$\{option\.label\}`\}/,
  );
  assert.match(comboboxSource, /accessibilityRole="button"/);
  assert.match(comboboxSource, /role: "option" as const/);
});

test("selector trigger name is value-independent and exposes the value", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  // The trigger name resolves through selectorTriggerName (triggerLabel wins,
  // else the composed default) and the value moves to aria-valuetext.
  assert.match(selectorSource, /function selectorTriggerName\(/);
  assert.match(selectorSource, /return triggerLabel \?\? fallback;/);
  assert.match(selectorSource, /accessibilityLabel=\{triggerName\}/);
  assert.match(selectorSource, /aria-valuetext=\{display \|\| placeholder\}/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
