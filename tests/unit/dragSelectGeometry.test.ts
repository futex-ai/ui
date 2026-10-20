import assert from "node:assert/strict";
import test from "node:test";

import { dragSelectableAutoScrollDelta } from "../../src/drag-select/dragSelectableAutoScroll";
import { dragSelectableBox } from "../../src/drag-select/dragSelectableModel";
import { dragSelectableAnchoredPoint } from "../../src/drag-select/dragSelectableScrollAnchor";
import { dragSelectableOverflowAxes } from "../../src/drag-select/dragSelectableScrollAxes";
import {
  DRAG_SELECTABLE_OVERLAY_SCROLLBAR_ZONE,
  dragSelectableScrollbarHit,
  type DragSelectableScrollbarMetrics,
} from "../../src/drag-select/dragSelectableScrollbar";
import { dragSelectableClipBox } from "../../src/drag-select/dragSelectableScrollContainer";

const client = { bottom: 720, left: 200, right: 1265, top: 0 };

/** A column with a classic 15px vertical scrollbar on its right side. */
const classic: DragSelectableScrollbarMetrics = {
  client,
  hidesScrollbar: false,
  overflowsX: false,
  overflowsY: true,
  paddingBox: { ...client, right: 1280 },
  reservesX: false,
  reservesY: true,
  rtl: false,
};

/** The same column with an overlay scrollbar that takes no space. */
const overlay: DragSelectableScrollbarMetrics = {
  ...classic,
  client: { ...client, right: 1280 },
  paddingBox: { ...client, right: 1280 },
  reservesY: false,
};

test("drag-select ignores a press on a classic scrollbar", () => {
  assert.equal(dragSelectableScrollbarHit(classic, { x: 1272, y: 300 }), true);
  assert.equal(dragSelectableScrollbarHit(classic, { x: 1260, y: 300 }), false);
  assert.equal(
    dragSelectableScrollbarHit(classic, { x: 1265.5, y: 300 }),
    false,
    "a press within the rounding tolerance of the client edge is content",
  );
});

test("drag-select ignores a press in the overlay scrollbar zone", () => {
  const edge = overlay.client.right;
  const zone = DRAG_SELECTABLE_OVERLAY_SCROLLBAR_ZONE;
  assert.equal(zone, 16);
  assert.equal(
    dragSelectableScrollbarHit(overlay, { x: edge - 4, y: 300 }),
    true,
  );
  assert.equal(
    dragSelectableScrollbarHit(overlay, { x: edge - zone, y: 300 }),
    true,
  );
  assert.equal(
    dragSelectableScrollbarHit(overlay, { x: edge - zone - 1, y: 300 }),
    false,
  );
});

test("drag-select puts the overlay zone on the left for right-to-left content", () => {
  const rtl = { ...overlay, rtl: true };
  assert.equal(dragSelectableScrollbarHit(rtl, { x: 205, y: 300 }), true);
  assert.equal(dragSelectableScrollbarHit(rtl, { x: 1275, y: 300 }), false);
});

test("drag-select puts the horizontal overlay zone at the bottom", () => {
  const horizontal: DragSelectableScrollbarMetrics = {
    ...overlay,
    overflowsX: true,
    overflowsY: false,
  };
  assert.equal(
    dragSelectableScrollbarHit(horizontal, { x: 600, y: 710 }),
    true,
  );
  assert.equal(
    dragSelectableScrollbarHit(horizontal, { x: 600, y: 690 }),
    false,
  );
  assert.equal(
    dragSelectableScrollbarHit(horizontal, { x: 1275, y: 300 }),
    false,
  );
});

test("drag-select exempts hidden and non-overflowing scrollbars from the overlay rule", () => {
  assert.equal(
    dragSelectableScrollbarHit(
      { ...overlay, hidesScrollbar: true },
      { x: 1275, y: 300 },
    ),
    false,
  );
  assert.equal(
    dragSelectableScrollbarHit(
      { ...overlay, overflowsY: false },
      { x: 1275, y: 300 },
    ),
    false,
  );
});

test("drag-select applies only the overlay rule to the document scroller", () => {
  const root: DragSelectableScrollbarMetrics = {
    ...overlay,
    client: { bottom: 720, left: 0, right: 1280, top: 0 },
    paddingBox: null,
  };
  assert.equal(dragSelectableScrollbarHit(root, { x: 1270, y: 300 }), true);
  assert.equal(dragSelectableScrollbarHit(root, { x: 600, y: 300 }), false);
});

test("drag-select moves the anchored start point with the scrolled content", () => {
  const origin = { left: 200, scrollLeft: 0, scrollTop: 0, top: 0 };
  assert.deepEqual(
    dragSelectableAnchoredPoint({ x: 300, y: 100 }, origin, {
      ...origin,
      scrollTop: 400,
    }),
    { x: 300, y: -300 },
  );
  assert.deepEqual(
    dragSelectableAnchoredPoint({ x: 300, y: 100 }, origin, {
      ...origin,
      left: 150,
      scrollLeft: 30,
      top: -80,
    }),
    { x: 220, y: 20 },
  );
  assert.deepEqual(
    dragSelectableAnchoredPoint({ x: 300, y: 100 }, origin, origin),
    { x: 300, y: 100 },
  );
});

test("drag-select reads the scroll axes from the overflow values", () => {
  assert.deepEqual(dragSelectableOverflowAxes("hidden", "auto", false), {
    x: false,
    y: true,
  });
  assert.deepEqual(dragSelectableOverflowAxes("scroll", "overlay", false), {
    x: true,
    y: true,
  });
  assert.deepEqual(dragSelectableOverflowAxes("visible", "clip", false), {
    x: false,
    y: false,
  });
  assert.deepEqual(dragSelectableOverflowAxes("visible", "hidden", true), {
    x: true,
    y: false,
  });
  assert.deepEqual(dragSelectableOverflowAxes("auto", "clip", true), {
    x: true,
    y: false,
  });
});

test("drag-select auto-scroll leaves an axis that cannot scroll", () => {
  const rect = { bottom: 600, left: 200, right: 1000, top: 0 };
  const corner = { x: 990, y: 590 };
  assert.deepEqual(
    dragSelectableAutoScrollDelta(corner, rect, { x: true, y: true }),
    { dx: 16, dy: 16 },
  );
  assert.deepEqual(
    dragSelectableAutoScrollDelta(corner, rect, { x: false, y: true }),
    { dx: 0, dy: 16 },
  );
  assert.deepEqual(
    dragSelectableAutoScrollDelta(corner, rect, { x: true, y: false }),
    { dx: 16, dy: 0 },
  );
});

test("drag-select keeps a cut box that has no width or no height", () => {
  const visible = { bottom: 600, left: 200, right: 1000, top: 0 };
  const vertical = dragSelectableBox({ x: 300, y: 50 }, { x: 300, y: 400 });
  assert.deepEqual(dragSelectableClipBox(vertical, visible), {
    bottom: 400,
    height: 350,
    left: 300,
    right: 300,
    top: 50,
    width: 0,
  });
  const horizontal = dragSelectableBox({ x: 300, y: 50 }, { x: 1200, y: 50 });
  assert.deepEqual(dragSelectableClipBox(horizontal, visible), {
    bottom: 50,
    height: 0,
    left: 300,
    right: 1000,
    top: 50,
    width: 700,
  });
  const outside = dragSelectableBox({ x: 100, y: 50 }, { x: 150, y: 400 });
  assert.equal(dragSelectableClipBox(outside, visible), null);
});
