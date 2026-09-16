import assert from "node:assert/strict";
import test from "node:test";

import {
  computeWindowedRenderLimits,
  constrainToItemCount,
  defaultKeyExtractor,
  elementsThatOverlapOffsets,
  getScrollingThreshold,
  initialRenderRegion,
  newRangeCount,
  DEFAULT_INITIAL_NUM_TO_RENDER,
  DEFAULT_MAX_TO_RENDER_PER_BATCH,
  DEFAULT_WINDOW_SIZE,
  type WindowRange,
} from "../../src/primitives/dom/flatListWindow";

/**
 * The windowing arithmetic behind `dom/FlatList.tsx`, transcribed from React
 * Native's `VirtualizeUtils`. The DataGrid's recorded ARIA baseline is the
 * reason the settled window size is pinned here rather than approximated: it
 * records exactly 105 body rows for the 1000-row story.
 */

const ROW_HEIGHT = 40;
const fixedRows = (index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
});

/** Runs the batcher to a fixpoint, the way the 50 ms timer does. */
function settle(
  itemCount: number,
  visibleLength: number,
  offset = 0,
  start: WindowRange = { first: 0, last: DEFAULT_INITIAL_NUM_TO_RENDER - 1 },
): WindowRange {
  let current = start;
  for (let step = 0; step < 200; step++) {
    const next = computeWindowedRenderLimits(
      itemCount,
      DEFAULT_MAX_TO_RENDER_PER_BATCH,
      DEFAULT_WINDOW_SIZE,
      current,
      fixedRows,
      { offset, velocity: 0, visibleLength },
    );
    if (next.first === current.first && next.last === current.last) {
      return next;
    }
    current = next;
  }
  throw new Error("window never settled");
}

test("offsets map to the first row that contains them", () => {
  const overlaps = elementsThatOverlapOffsets([0, 380, 4180], 1000, fixedRows);
  // The first frame's start is inclusive, every later one's exclusive.
  assert.deepEqual(overlaps, [0, 9, 104]);
  // An offset past the content has no row.
  assert.deepEqual(elementsThatOverlapOffsets([10_000], 10, fixedRows), []);
});

test("a new window only counts the rows the old one did not render", () => {
  assert.equal(newRangeCount({ first: 0, last: 9 }, { first: 0, last: 9 }), 0);
  assert.equal(
    newRangeCount({ first: 0, last: 9 }, { first: 0, last: 19 }),
    10,
  );
  assert.equal(
    newRangeCount({ first: 0, last: 9 }, { first: 100, last: 109 }),
    10,
  );
});

test("the first batch adds at most maxToRenderPerBatch rows", () => {
  const first = computeWindowedRenderLimits(
    1000,
    DEFAULT_MAX_TO_RENDER_PER_BATCH,
    DEFAULT_WINDOW_SIZE,
    { first: 0, last: 9 },
    fixedRows,
    { offset: 0, velocity: 0, visibleLength: 380 },
  );
  assert.deepEqual(first, { first: 0, last: 19 });
});

test("the window settles on the whole overscan region", () => {
  // 1000 rows of 40 px in a 380 px viewport: `windowSize` 21 means ten and a
  // half viewports below the fold, so rows 0..104 — the 105 the DataGrid's
  // `datagrid-examples--virtualized` ARIA baseline records.
  assert.deepEqual(settle(1000, 380), { first: 0, last: 104 });

  // The 30-row infinite-scroll story fits entirely inside its window.
  assert.deepEqual(settle(30, 360), { first: 0, last: 29 });
});

test("a window scrolled into the middle keeps a viewport on each side", () => {
  // Half a viewport of lead behind, ten in front, as `leadFactor` 0.5 asks.
  const settled = settle(1000, 380, 20_000, { first: 495, last: 504 });
  assert.deepEqual(settled, { first: 404, last: 604 });
});

test("an empty list renders nothing", () => {
  assert.deepEqual(
    computeWindowedRenderLimits(
      0,
      DEFAULT_MAX_TO_RENDER_PER_BATCH,
      DEFAULT_WINDOW_SIZE,
      { first: 0, last: -1 },
      fixedRows,
      { offset: 0, velocity: 0, visibleLength: 380 },
    ),
    { first: 0, last: -1 },
  );
});

test("a list scrolled entirely above the window renders its tail", () => {
  assert.deepEqual(
    computeWindowedRenderLimits(
      1000,
      DEFAULT_MAX_TO_RENDER_PER_BATCH,
      DEFAULT_WINDOW_SIZE,
      { first: 0, last: 9 },
      fixedRows,
      { offset: 1_000_000, velocity: 0, visibleLength: 380 },
    ),
    { first: 989, last: 999 },
  );
});

test("a changed row count clips the window without moving it", () => {
  // Appending leaves the window alone; the batcher grows it on the next scroll.
  assert.deepEqual(constrainToItemCount({ first: 0, last: 29 }, 60, 10), {
    first: 0,
    last: 29,
  });
  // Removing pulls `first` back to the last index a full batch can start at,
  // which is `itemCount - 1 - maxToRenderPerBatch` and does not depend on
  // `last`: 500 rows and a batch of ten give 489, not 490.
  assert.deepEqual(constrainToItemCount({ first: 495, last: 504 }, 500, 10), {
    first: 489,
    last: 499,
  });
  assert.deepEqual(constrainToItemCount({ first: 100, last: 140 }, 20, 10), {
    first: 9,
    last: 19,
  });
  // A window already inside the data is left where it is.
  assert.deepEqual(constrainToItemCount({ first: 0, last: 104 }, 1000, 10), {
    first: 0,
    last: 104,
  });
  assert.deepEqual(constrainToItemCount({ first: 0, last: 9 }, 0, 10), {
    first: 0,
    last: -1,
  });
});

test("the initial region is initialNumToRender rows from the scroll index", () => {
  assert.deepEqual(initialRenderRegion(1000, 10, undefined), {
    first: 0,
    last: 9,
  });
  assert.deepEqual(initialRenderRegion(1000, 10, 500), {
    first: 500,
    last: 509,
  });
  assert.deepEqual(initialRenderRegion(3, 10, undefined), {
    first: 0,
    last: 2,
  });
});

test("keys come from the item, then its id, then its index", () => {
  assert.equal(defaultKeyExtractor({ key: "k" }, 3), "k");
  assert.equal(defaultKeyExtractor({ id: 7 }, 3), "7");
  assert.equal(defaultKeyExtractor({ name: "x" }, 3), "3");
  assert.equal(defaultKeyExtractor("plain", 3), "3");
});

test("the hi-pri scrolling threshold is half a viewport per unit", () => {
  assert.equal(getScrollingThreshold(2, 380), 380);
  assert.equal(getScrollingThreshold(0.2, 360), 36);
});
