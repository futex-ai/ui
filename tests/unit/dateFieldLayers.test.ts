import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DATE_FIELD_LAYERS,
  dateFieldZIndex,
  openFieldClearsSiblings,
} from "../../src/date/dateFieldLayers";

test("an open date trigger paints above overlapping sibling chrome", () => {
  assert.equal(
    openFieldClearsSiblings(DATE_FIELD_LAYERS.open, DATE_FIELD_LAYERS.base),
    true,
  );
});

test("an open range row keeps its active chrome above later siblings", () => {
  assert.equal(
    openFieldClearsSiblings(DATE_FIELD_LAYERS.open, DATE_FIELD_LAYERS.base),
    true,
  );
});

test("equal local layers do not let the earlier trigger clear a sibling", () => {
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

test("date fields forward z-index overrides to wrappers and the web portal", () => {
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
