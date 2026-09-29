import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CALENDAR_POPOVER_HEIGHT,
  CALENDAR_POPOVER_PLACEMENT,
  CALENDAR_POPOVER_WIDTH,
} from "../../src/date/calendarPopoverPlacement";
import { dropdownPlacement } from "../../src/dropdown/dropdownGeometry";

const viewport = { height: 888, width: 1280 };
const FIELD_HEIGHT = 40;
/** Default portal gap to the field plus the default viewport margin. */
const EDGE_ALLOWANCE = 6 + 8;

/** A wide field whose bottom edge sits `roomBelow` px above the viewport's. */
function fieldWithRoomBelow(roomBelow: number, height = viewport.height) {
  return {
    height: FIELD_HEIGHT,
    width: 480,
    x: 400,
    y: height - roomBelow - FIELD_HEIGHT,
  };
}

test("calendar popover flips above a field without room for a six-week month", () => {
  // 200px clears a scrolling list's 140px threshold, so the list-sized default
  // kept the calendar below and clipped its last week rows.
  const placement = dropdownPlacement(
    fieldWithRoomBelow(200),
    viewport,
    CALENDAR_POPOVER_PLACEMENT,
  );

  assert.equal(placement.side, "top");
  assert.equal(placement.bottom, 200 + FIELD_HEIGHT + 6);
  assert.ok(placement.maxHeight >= CALENDAR_POPOVER_HEIGHT);
});

test("calendar popover stays below a field with room for a six-week month", () => {
  const placement = dropdownPlacement(
    fieldWithRoomBelow(CALENDAR_POPOVER_HEIGHT + EDGE_ALLOWANCE),
    viewport,
    CALENDAR_POPOVER_PLACEMENT,
  );

  assert.equal(placement.side, "bottom");
  assert.ok(placement.maxHeight >= CALENDAR_POPOVER_HEIGHT);
});

test("calendar popover flips one pixel short of a six-week month", () => {
  const placement = dropdownPlacement(
    fieldWithRoomBelow(CALENDAR_POPOVER_HEIGHT + EDGE_ALLOWANCE - 1),
    viewport,
    CALENDAR_POPOVER_PLACEMENT,
  );

  assert.equal(placement.side, "top");
});

test("calendar popover takes the roomier side when neither fits a month", () => {
  const short = { height: 420, width: 1280 };
  const nearBottom = dropdownPlacement(
    fieldWithRoomBelow(120, short.height),
    short,
    CALENDAR_POPOVER_PLACEMENT,
  );
  const nearTop = dropdownPlacement(
    fieldWithRoomBelow(240, short.height),
    short,
    CALENDAR_POPOVER_PLACEMENT,
  );

  assert.equal(nearBottom.side, "top");
  assert.equal(
    nearBottom.maxHeight,
    short.height - 120 - FIELD_HEIGHT - EDGE_ALLOWANCE,
  );
  assert.equal(nearTop.side, "bottom");
  assert.equal(nearTop.maxHeight, 240 - EDGE_ALLOWANCE);
});

test("calendar popover keeps its compact width below a wide field", () => {
  const placement = dropdownPlacement(
    fieldWithRoomBelow(200),
    viewport,
    CALENDAR_POPOVER_PLACEMENT,
  );

  assert.equal(placement.width, CALENDAR_POPOVER_WIDTH);
  assert.equal(placement.left, 400);
});

test("the web calendar overlay hands its placement to the portal", () => {
  const source = readSource("../../src/date/DatePickerOverlay.web.tsx");

  assert.match(
    source,
    /<DropdownPortal\s+\{\.\.\.CALENDAR_POPOVER_PLACEMENT\}/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
