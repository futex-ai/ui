/**
 * Point anchoring: `dropdownPlacement` is a pure rect-in / placement-out
 * function, so a zero-size rect at the pointer is a valid anchor. These pin the
 * arithmetic a context menu depends on — including the one real trap, that a
 * zero-width anchor resolves to a zero-width surface unless the caller opts out
 * of `anchorWidthAsMinimum` and supplies a `minWidth`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  dropdownPlacement,
  dropdownWidthBounds,
} from "../../src/dropdown/dropdownGeometry";

const VIEWPORT = { height: 800, width: 1000 };

/** The options `ContextMenu` passes for a cursor-anchored menu. */
const MENU_OPTIONS = {
  align: "start" as const,
  anchorWidthAsMinimum: false,
  gutter: 2,
  minWidth: 220,
};

const point = (x: number, y: number) => ({ height: 0, width: 0, x, y });

test("a zero-size rect anchors the surface at the point", () => {
  const placement = dropdownPlacement(
    point(100, 200),
    VIEWPORT,
    MENU_OPTIONS,
    220,
  );
  assert.equal(placement.left, 100);
  assert.equal(placement.top, 202); // y + gutter
  assert.equal(placement.width, 220);
  assert.equal(placement.side, "bottom");
  assert.equal(placement.bottom, undefined);
});

test("a point near the right edge clamps rather than overflowing", () => {
  const placement = dropdownPlacement(
    point(950, 200),
    VIEWPORT,
    MENU_OPTIONS,
    220,
  );
  // viewport.width - width - margin === 1000 - 220 - 8
  assert.equal(placement.left, 772);
  assert.ok(placement.left + placement.width <= VIEWPORT.width);
});

test("a point near the left edge clamps to the margin", () => {
  const placement = dropdownPlacement(
    point(2, 200),
    VIEWPORT,
    MENU_OPTIONS,
    220,
  );
  assert.equal(placement.left, 8); // DEFAULT_MARGIN
});

test("a point near the bottom flips the surface above the cursor", () => {
  const placement = dropdownPlacement(
    point(100, 780),
    VIEWPORT,
    MENU_OPTIONS,
    220,
  );
  assert.equal(placement.side, "top");
  assert.equal(placement.top, undefined);
  // viewport.height - y + gutter === 800 - 780 + 2
  assert.equal(placement.bottom, 22);
});

test("align end puts the surface's right edge at the point", () => {
  const placement = dropdownPlacement(
    point(500, 200),
    VIEWPORT,
    { ...MENU_OPTIONS, align: "end" },
    220,
  );
  assert.equal(placement.left, 280); // x - width
});

test("the zero-width trap: a point anchor with no minWidth resolves to 0", () => {
  // `dropdownWidthBounds` treats `anchor.width` as the minimum unless
  // `anchorWidthAsMinimum` is false, and `dropdownPlacement`'s `preferredWidth`
  // defaults to `anchor.width`. With a zero-size anchor that is 0 on both
  // counts — which is why `ContextMenu` hard-codes both options rather than
  // leaving them to callers.
  const bare = dropdownPlacement(point(100, 200), VIEWPORT, {});
  assert.equal(bare.width, 0);

  const guarded = dropdownPlacement(
    point(100, 200),
    VIEWPORT,
    MENU_OPTIONS,
    220,
  );
  assert.equal(guarded.width, 220);
});

test("a point anchor does not force the surface wider than the pointer", () => {
  // With `anchorWidthAsMinimum` left at its default the zero-width anchor would
  // pin `minWidth` to 0; the explicit opt-out is what lets `minWidth` win.
  const bounds = dropdownWidthBounds(point(100, 200), VIEWPORT, MENU_OPTIONS);
  assert.equal(bounds.minWidth, 220);
});
