import assert from "node:assert/strict";
import test from "node:test";

import { dropdownPlacement } from "../../src/dropdown/dropdownGeometry";
import {
  isTextClipped,
  overflowTooltipTargets,
  REVEAL_PLACEMENT,
  shouldRevealOnHover,
} from "../../src/data-grid/dataGridOverflowModel";

const VIEWPORT = { height: 760, width: 1120 };
/** A clipped line of text sitting in the last visible row of the window. */
const NEAR_BOTTOM = { height: 18, width: 130, x: 300, y: 711 };
const MID_PAGE = { height: 18, width: 130, x: 300, y: 200 };

test("overflowTooltipTargets maps each mode to the surfaces it covers", () => {
  assert.deepEqual(overflowTooltipTargets("all"), {
    cells: true,
    headers: true,
  });
  assert.deepEqual(overflowTooltipTargets("headers"), {
    cells: false,
    headers: true,
  });
  assert.deepEqual(overflowTooltipTargets("none"), {
    cells: false,
    headers: false,
  });
});

test("overflowTooltipTargets defaults to revealing every clipped surface", () => {
  assert.deepEqual(overflowTooltipTargets(undefined), {
    cells: true,
    headers: true,
  });
});

test("isTextClipped is true only when the text overflows its box", () => {
  assert.equal(isTextClipped({ clientWidth: 80, scrollWidth: 240 }), true);
  assert.equal(isTextClipped({ clientWidth: 80, scrollWidth: 80 }), false);
});

test("isTextClipped tolerates a pixel of layout rounding", () => {
  // Browsers round fractional text widths up, so a text that exactly fits can
  // report a scrollWidth one pixel wider than its box. Without the tolerance
  // every header would show a popover repeating text already fully visible.
  assert.equal(isTextClipped({ clientWidth: 120, scrollWidth: 121 }), false);
  assert.equal(isTextClipped({ clientWidth: 120, scrollWidth: 122 }), true);
});

test("isTextClipped treats an unmeasured box as not clipped", () => {
  // A node inside a `display: none` subtree measures 0/0, and a detached one can
  // report content width with no box. Neither is a real overflow.
  assert.equal(isTextClipped({ clientWidth: 0, scrollWidth: 0 }), false);
  assert.equal(isTextClipped({ clientWidth: 0, scrollWidth: 240 }), false);
});

test("shouldRevealOnHover reveals clipped text under an idle pointer", () => {
  assert.equal(
    shouldRevealOnHover({
      buttons: 0,
      enabled: true,
      metrics: { clientWidth: 80, scrollWidth: 240 },
    }),
    true,
  );
});

test("shouldRevealOnHover stays closed when the text already fits", () => {
  assert.equal(
    shouldRevealOnHover({
      buttons: 0,
      enabled: true,
      metrics: { clientWidth: 240, scrollWidth: 240 },
    }),
    false,
  );
});

test("shouldRevealOnHover stays closed while a pointer button is held", () => {
  // Held button = a range drag, column drag, or resize in flight. Popping a
  // surface under the pointer mid-drag would cover the cells being painted.
  assert.equal(
    shouldRevealOnHover({
      buttons: 1,
      enabled: true,
      metrics: { clientWidth: 80, scrollWidth: 240 },
    }),
    false,
  );
});

test("shouldRevealOnHover stays closed when the surface is disabled", () => {
  assert.equal(
    shouldRevealOnHover({
      buttons: 0,
      enabled: false,
      metrics: { clientWidth: 80, scrollWidth: 240 },
    }),
    false,
  );
});

test("shouldRevealOnHover stays closed when the text could not be measured", () => {
  assert.equal(
    shouldRevealOnHover({ buttons: 0, enabled: true, metrics: null }),
    false,
  );
});

test("the reveal flips above rather than running off the bottom of the window", () => {
  // Only ~19px remain below a last-row anchor. Left to open downward the
  // surface is pinned past the window edge and clamped to a 64px scrap, so the
  // long string the reveal exists to show is itself cut off.
  const placement = dropdownPlacement(
    NEAR_BOTTOM,
    VIEWPORT,
    REVEAL_PLACEMENT,
    340,
  );

  assert.equal(placement.side, "top");
  assert.equal(placement.maxHeight, REVEAL_PLACEMENT.maxHeight);
});

test("the reveal still opens downward when there is room below", () => {
  const placement = dropdownPlacement(
    MID_PAGE,
    VIEWPORT,
    REVEAL_PLACEMENT,
    340,
  );

  assert.equal(placement.side, "bottom");
  assert.equal(placement.top, MID_PAGE.y + MID_PAGE.height + 4);
});
