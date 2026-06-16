import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DATE_FIELD_LAYERS,
  dateFieldZIndex,
  openFieldClearsSiblings,
} from "../../src/date/dateFieldLayers";

test("an open date field paints above the form fields that follow it", () => {
  assert.equal(
    openFieldClearsSiblings(DATE_FIELD_LAYERS.open, DATE_FIELD_LAYERS.base),
    true,
  );
});

test("an open range row paints above its own hint and error siblings", () => {
  // The endpoint's calendar is nested inside the row, so the row must outrank
  // its later-DOM hint/error siblings for the calendar to escape them.
  assert.equal(
    openFieldClearsSiblings(DATE_FIELD_LAYERS.open, DATE_FIELD_LAYERS.base),
    true,
  );
});

test("a range row resting at the base layer leaves its calendar trapped behind the hint", () => {
  // Regression guard: the row rested at the base elevation, so the hint (a later
  // sibling at the same elevation) painted on top of the trapped open calendar.
  assert.equal(
    openFieldClearsSiblings(DATE_FIELD_LAYERS.base, DATE_FIELD_LAYERS.base),
    false,
  );
});

test("the open elevation sits strictly above the resting base layer", () => {
  assert.ok(DATE_FIELD_LAYERS.open > DATE_FIELD_LAYERS.base);
});

test("the default calendar elevation uses the high shared overlay floor", () => {
  assert.ok(DATE_FIELD_LAYERS.open >= 1_000_000);
  assert.equal(dateFieldZIndex(), DATE_FIELD_LAYERS.open);
});

test("date calendar z-index override preserves explicit numeric values", () => {
  assert.equal(dateFieldZIndex(4_200), 4_200);
  assert.equal(dateFieldZIndex(0), 0);
});

test("date fields forward z-index overrides to wrappers and the web calendar", () => {
  const fieldSource = readSource("../../src/date/DateField.tsx");
  const rangeSource = readSource("../../src/date/DateRangeField.tsx");
  const overlaySource = readSource("../../src/date/DatePickerOverlay.web.tsx");

  assert.match(fieldSource, /zIndex\?: number;/);
  assert.match(fieldSource, /zIndex=\{zIndex\}/);
  assert.match(rangeSource, /zIndex\?: number;/);
  assert.match(rangeSource, /zIndex=\{zIndex\}/);
  assert.match(overlaySource, /dateFieldZIndex\(zIndex\)/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
