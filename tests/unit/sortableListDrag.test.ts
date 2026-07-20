import assert from "node:assert/strict";
import test from "node:test";

import {
  applySortableMove,
  arrowDelta,
  axisRange,
  describeTarget,
  findItemIndex,
  indicatorIndex,
  initialDropTarget,
  keyboardDropTarget,
  liftedDropTarget,
  targetToMove,
  type MeasuredSortableItem,
} from "../../src/sortable-list/sortableListModel";

const keys = ["a", "b", "c"];

// Rows a, b, c laid out with a gap. Left/right and top/bottom are both set so the
// same rows can be read on either axis.
const rows: MeasuredSortableItem[] = [
  { bottom: 20, key: "a", left: 0, right: 20, top: 0 },
  { bottom: 44, key: "b", left: 24, right: 44, top: 24 },
  { bottom: 68, key: "c", left: 48, right: 68, top: 48 },
];
// The rows in flow while dragging b (b is lifted out): a and c remain.
const flow = rows.filter((row) => row.key !== "b");

test("findItemIndex locates a key or returns null", () => {
  assert.equal(findItemIndex(keys, "a"), 0);
  assert.equal(findItemIndex(keys, "c"), 2);
  assert.equal(findItemIndex(keys, "missing"), null);
});

test("axisRange projects the rect onto the flow axis", () => {
  assert.deepEqual(axisRange(rows[1], "vertical"), { end: 44, start: 24 });
  assert.deepEqual(axisRange(rows[1], "horizontal"), { end: 44, start: 24 });
});

test("initialDropTarget is the item's own slot", () => {
  assert.deepEqual(initialDropTarget(keys, "b"), { index: 1 });
  assert.equal(initialDropTarget(keys, "missing"), null);
});

test("liftedDropTarget reads a vertical pointer into the removed-item index", () => {
  // In-flow is [a, c] (b lifted out); midpoints are a=10, c=58.
  assert.deepEqual(liftedDropTarget(flow, "vertical", 5), { index: 0 });
  assert.deepEqual(liftedDropTarget(flow, "vertical", 30), { index: 1 });
  assert.deepEqual(liftedDropTarget(flow, "vertical", 60), { index: 2 });
});

test("liftedDropTarget reads a horizontal pointer the same way on the x-axis", () => {
  assert.deepEqual(liftedDropTarget(flow, "horizontal", 5), { index: 0 });
  assert.deepEqual(liftedDropTarget(flow, "horizontal", 30), { index: 1 });
  assert.deepEqual(liftedDropTarget(flow, "horizontal", 60), { index: 2 });
});

test("liftedDropTarget sorts by axis start regardless of input order", () => {
  const shuffled = [flow[1], flow[0]];
  assert.deepEqual(liftedDropTarget(shuffled, "vertical", 5), { index: 0 });
  assert.deepEqual(liftedDropTarget(shuffled, "vertical", 60), { index: 2 });
});

test("arrowDelta maps only the on-axis arrows for each orientation", () => {
  assert.equal(arrowDelta("ArrowUp", "vertical"), -1);
  assert.equal(arrowDelta("ArrowDown", "vertical"), 1);
  assert.equal(arrowDelta("ArrowLeft", "vertical"), null);
  assert.equal(arrowDelta("ArrowLeft", "horizontal"), -1);
  assert.equal(arrowDelta("ArrowRight", "horizontal"), 1);
  assert.equal(arrowDelta("ArrowUp", "horizontal"), null);
  assert.equal(arrowDelta("Enter", "vertical"), null);
});

test("keyboardDropTarget steps and clamps within the list", () => {
  const start = { index: 1 };
  assert.deepEqual(keyboardDropTarget(keys, start, "b", -1), { index: 0 });
  // Down clamps to the removed-list length (a, c -> 2 slots, max index 2).
  assert.deepEqual(keyboardDropTarget(keys, start, "b", 1), { index: 2 });
  assert.deepEqual(keyboardDropTarget(keys, { index: 2 }, "b", 1), {
    index: 2,
  });
  assert.deepEqual(keyboardDropTarget(keys, { index: 0 }, "b", -1), {
    index: 0,
  });
});

test("targetToMove drops no-ops and emits a move otherwise", () => {
  assert.equal(targetToMove(keys, "b", { index: 1 }), null);
  assert.deepEqual(targetToMove(keys, "b", { index: 0 }), {
    fromIndex: 1,
    key: "b",
    toIndex: 0,
  });
  assert.deepEqual(targetToMove(keys, "b", { index: 2 }), {
    fromIndex: 1,
    key: "b",
    toIndex: 2,
  });
  assert.equal(targetToMove(keys, "missing", { index: 0 }), null);
});

test("indicatorIndex maps a removed-index target back to a visual slot", () => {
  // The keyboard-grabbed item stays in place, so at/after its origin the target
  // sits one slot later; before it, the raw index.
  assert.equal(indicatorIndex(1, { index: 0 }), 0);
  assert.equal(indicatorIndex(1, { index: 1 }), 2);
  assert.equal(indicatorIndex(1, { index: 2 }), 3);
});

test("describeTarget reads the slot for screen-reader announcements", () => {
  assert.equal(describeTarget(keys, "b", { index: 1 }), "Position 2 of 3");
  assert.equal(describeTarget(keys, "b", { index: 0 }), "Position 1 of 3");
});

test("applySortableMove splices the moved item into its removed-index slot", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const key = (item: { id: string }) => item.id;
  assert.deepEqual(
    applySortableMove(items, { fromIndex: 1, key: "b", toIndex: 0 }, key),
    [{ id: "b" }, { id: "a" }, { id: "c" }],
  );
  assert.deepEqual(
    applySortableMove(items, { fromIndex: 0, key: "a", toIndex: 2 }, key),
    [{ id: "b" }, { id: "c" }, { id: "a" }],
  );
  // An unknown key leaves the list unchanged.
  assert.equal(
    applySortableMove(items, { fromIndex: 0, key: "x", toIndex: 0 }, key),
    items,
  );
});
