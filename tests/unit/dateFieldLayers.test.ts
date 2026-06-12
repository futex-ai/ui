import assert from "node:assert/strict";
import test from "node:test";

import {
  DATE_FIELD_LAYERS,
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
