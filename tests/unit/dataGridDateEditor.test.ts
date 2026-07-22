import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { dataGridDatePickerVariant } from "../../src/data-grid/dataGridDateEditorModel";

test("data-grid date editing uses the picker suited to each platform", () => {
  assert.equal(dataGridDatePickerVariant("web"), "calendar");
  assert.equal(dataGridDatePickerVariant("ios"), "wheel");
  assert.equal(dataGridDatePickerVariant("android"), "wheel");
});

test("the data-grid editor applies the platform picker policy", () => {
  const source = readSource("../../src/data-grid/dataGridCellEditors.tsx");

  assert.match(source, /<DateInput[\s\S]*autoFocus/);
  assert.match(source, /variant=\{dataGridDatePickerVariant\(Platform\.OS\)\}/);
});

test("an auto-focused date input opens every platform picker", () => {
  const field = readSource("../../src/date/DateField.tsx");
  const trigger = readSource("../../src/date/DateTrigger.tsx");

  assert.match(field, /if \(autoFocus\) \{\s*field\.setOpen\(true\)/);
  assert.match(
    trigger,
    /setTimeout\(\(\) => inputRef\.current\?\.focus\(\), 0\)/,
  );
});

test("the native wheel overlay uses the shared reference-style sheet", () => {
  const overlay = readSource("../../src/date/DatePickerOverlay.tsx");
  const sheet = readSource("../../src/date/DateWheelSheet.tsx");

  assert.match(overlay, /return <DateWheelSheet \{\.\.\.props\} \/>/);
  assert.match(sheet, /<WebModalFrame[\s\S]*placement="bottom-sheet"/);
  assert.match(sheet, />Cancel<\/Text>/);
  assert.match(sheet, />Done<\/Text>/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
