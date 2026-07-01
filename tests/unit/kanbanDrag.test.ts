import assert from "node:assert/strict";
import test from "node:test";

import {
  columnIdAtX,
  describeTarget,
  findCardOrigin,
  indicatorIndex,
  initialDropTarget,
  keyboardDropTarget,
  liftedDropTarget,
  targetToMove,
  type KanbanColumnLayout,
  type MeasuredCard,
  type MeasuredColumn,
} from "../../src/kanban/kanbanDragModel";
import { cardKeyAt } from "../../src/kanban/kanbanDragDom";

const layout: KanbanColumnLayout[] = [
  { id: "a", cardKeys: ["a1", "a2", "a3"] },
  { id: "b", cardKeys: ["b1"] },
  { id: "c", cardKeys: [] },
];

const columns: MeasuredColumn[] = [
  { columnId: "a", left: 0, right: 100 },
  { columnId: "b", left: 120, right: 220 },
  { columnId: "c", left: 240, right: 340 },
];

// The cards in flow while dragging a2 (a2 is lifted out): column a has a1 and
// a3, column b has b1, column c is empty.
const flowCards: MeasuredCard[] = [
  { bottom: 20, cardKey: "a1", columnId: "a", left: 0, right: 100, top: 0 },
  { bottom: 44, cardKey: "a3", columnId: "a", left: 0, right: 100, top: 24 },
  { bottom: 20, cardKey: "b1", columnId: "b", left: 120, right: 220, top: 0 },
];

test("findCardOrigin locates a card or returns null", () => {
  assert.deepEqual(findCardOrigin(layout, "a2"), { columnId: "a", index: 1 });
  assert.deepEqual(findCardOrigin(layout, "b1"), { columnId: "b", index: 0 });
  assert.equal(findCardOrigin(layout, "missing"), null);
});

test("columnIdAtX hits a span or snaps to the nearest column across gaps", () => {
  assert.equal(columnIdAtX(columns, 50), "a");
  assert.equal(columnIdAtX(columns, 150), "b");
  // In the gap, snap to the nearer edge; beyond the ends, snap to the end column.
  assert.equal(columnIdAtX(columns, 115), "b");
  assert.equal(columnIdAtX(columns, 105), "a");
  assert.equal(columnIdAtX(columns, -40), "a");
  assert.equal(columnIdAtX(columns, 999), "c");
  assert.equal(columnIdAtX([], 10), null);
});

test("cardKeyAt picks the card under the pointer, guarding against same-height cards in other columns", () => {
  // a1 and b1 share the vertical span (top 0–20) but sit in different columns;
  // the x must select the right one rather than the first at that height.
  assert.equal(cardKeyAt(flowCards, 50, 10), "a1");
  assert.equal(cardKeyAt(flowCards, 150, 10), "b1");
  // A point in no card's rect (empty column c's x, or below every card) is null.
  assert.equal(cardKeyAt(flowCards, 300, 10), null);
  assert.equal(cardKeyAt(flowCards, 50, 999), null);
});

test("liftedDropTarget reads a pointer straight into removed-card index in another column", () => {
  // Over column b: above b1's middle inserts at 0, below it at 1.
  assert.deepEqual(liftedDropTarget(columns, flowCards, 150, 5), {
    columnId: "b",
    index: 0,
  });
  assert.deepEqual(liftedDropTarget(columns, flowCards, 150, 15), {
    columnId: "b",
    index: 1,
  });
  // Empty column c: any position inserts at 0.
  assert.deepEqual(liftedDropTarget(columns, flowCards, 290, 30), {
    columnId: "c",
    index: 0,
  });
});

test("liftedDropTarget counts the in-flow cards above the pointer within a column", () => {
  // Column a in flow is [a1, a3] (a2 lifted out): above a1 -> 0, between -> 1,
  // below a3 -> 2. The count is already the removed-card index (no adjustment).
  assert.deepEqual(liftedDropTarget(columns, flowCards, 50, 5), {
    columnId: "a",
    index: 0,
  });
  assert.deepEqual(liftedDropTarget(columns, flowCards, 50, 22), {
    columnId: "a",
    index: 1,
  });
  assert.deepEqual(liftedDropTarget(columns, flowCards, 50, 60), {
    columnId: "a",
    index: 2,
  });
});

test("initialDropTarget is the card's own slot", () => {
  assert.deepEqual(initialDropTarget(layout, "a2"), {
    columnId: "a",
    index: 1,
  });
  assert.equal(initialDropTarget(layout, "missing"), null);
});

test("keyboardDropTarget steps and clamps within and across columns", () => {
  const start = { columnId: "a", index: 1 };
  assert.deepEqual(keyboardDropTarget(layout, start, "a2", "ArrowUp"), {
    columnId: "a",
    index: 0,
  });
  // Down clamps to the removed-list length (a1, a3 -> 2 slots, max index 2).
  assert.deepEqual(keyboardDropTarget(layout, start, "a2", "ArrowDown"), {
    columnId: "a",
    index: 2,
  });
  assert.deepEqual(
    keyboardDropTarget(layout, { columnId: "a", index: 2 }, "a2", "ArrowDown"),
    { columnId: "a", index: 2 },
  );
  // Right moves to column b and clamps the index to b's slot count (1).
  assert.deepEqual(keyboardDropTarget(layout, start, "a2", "ArrowRight"), {
    columnId: "b",
    index: 1,
  });
  // Left at the first column stays put; an unrelated key is unhandled.
  assert.deepEqual(keyboardDropTarget(layout, start, "a2", "ArrowLeft"), start);
  assert.equal(keyboardDropTarget(layout, start, "a2", "Enter"), null);
});

test("targetToMove drops no-ops and emits a move otherwise", () => {
  assert.equal(targetToMove(layout, "a2", { columnId: "a", index: 1 }), null);
  assert.deepEqual(targetToMove(layout, "a2", { columnId: "a", index: 2 }), {
    cardKey: "a2",
    fromColumnId: "a",
    fromIndex: 1,
    toColumnId: "a",
    toIndex: 2,
  });
  assert.deepEqual(targetToMove(layout, "a2", { columnId: "b", index: 0 }), {
    cardKey: "a2",
    fromColumnId: "a",
    fromIndex: 1,
    toColumnId: "b",
    toIndex: 0,
  });
});

test("indicatorIndex maps a removed-index target back to a visual slot", () => {
  const from = { columnId: "a", index: 1 };
  assert.equal(indicatorIndex(from, { columnId: "a", index: 0 }), 0);
  // At or past the origin slot, the dragged card shifts the visual position by one.
  assert.equal(indicatorIndex(from, { columnId: "a", index: 1 }), 2);
  assert.equal(indicatorIndex(from, { columnId: "a", index: 2 }), 3);
  // A different column draws the indicator at the removed index directly.
  assert.equal(indicatorIndex(from, { columnId: "b", index: 0 }), 0);
});

test("describeTarget reads the slot for screen-reader announcements", () => {
  const title = (id: string) =>
    ({ a: "Drafted", b: "Approved", c: "Done" })[id]!;
  assert.equal(
    describeTarget(layout, "a2", { columnId: "b", index: 0 }, title),
    "Approved, position 1 of 2",
  );
  assert.equal(
    describeTarget(layout, "a2", { columnId: "a", index: 0 }, title),
    "Drafted, position 1 of 3",
  );
});
