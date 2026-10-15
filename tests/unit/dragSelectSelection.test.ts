import assert from "node:assert/strict";
import test from "node:test";

import {
  dragSelectableIdSetsEqual,
  dragSelectableInitialReport,
  dragSelectableRecordProposal,
  dragSelectableReportRender,
  dragSelectableStoredAfterEmpty,
  dragSelectableUniqueIds,
} from "../../src/drag-select/dragSelectableSelectionModel";

test("drag-select compares selections as sets", () => {
  assert.equal(dragSelectableIdSetsEqual([], []), true);
  assert.equal(dragSelectableIdSetsEqual(["a", "b"], ["b", "a"]), true);
  assert.equal(dragSelectableIdSetsEqual(["a", "a"], ["a"]), true);
  assert.equal(dragSelectableIdSetsEqual(["a"], ["a", "b"]), false);
  assert.equal(dragSelectableIdSetsEqual(["a", "c"], ["a", "b"]), false);
});

test("drag-select selection callback ignores registry-only updates", () => {
  const state = dragSelectableInitialReport(["txn_1", "txn_2"]);
  const sameIds = dragSelectableReportRender(state, ["txn_1", "txn_2"]);
  assert.equal(sameIds.notify, false);
  assert.equal(sameIds.announce, false);
  assert.equal(sameIds.state, state);

  const reordered = dragSelectableReportRender(state, ["txn_2", "txn_1"]);
  assert.equal(reordered.notify, false);
});

test("drag-select reports each change of the rendered selection once", () => {
  const first = dragSelectableReportRender(dragSelectableInitialReport([]), [
    "txn_1",
  ]);
  assert.equal(first.notify, true);
  const again = dragSelectableReportRender(first.state, ["txn_1"]);
  assert.equal(again.notify, false);
});

test("drag-select announces a proposal once when the rendered selection becomes it", () => {
  const proposed = dragSelectableRecordProposal(
    dragSelectableInitialReport([]),
    ["txn_1", "txn_2"],
  );
  const applied = dragSelectableReportRender(proposed, ["txn_2", "txn_1"]);
  assert.equal(applied.notify, true);
  assert.equal(applied.announce, true);
  assert.equal(applied.state.pending, null);

  const later = dragSelectableReportRender(applied.state, ["txn_3"]);
  assert.equal(later.notify, true);
  assert.equal(later.announce, false);
});

test("drag-select does not announce a changed or rejected proposal", () => {
  const proposed = dragSelectableRecordProposal(
    dragSelectableInitialReport(["txn_1"]),
    ["txn_1", "txn_2"],
  );
  const changed = dragSelectableReportRender(proposed, ["txn_1", "txn_3"]);
  assert.equal(changed.notify, true);
  assert.equal(changed.announce, false);

  const rejected = dragSelectableReportRender(proposed, ["txn_1"]);
  assert.equal(rejected.notify, false);
  assert.equal(rejected.state.pending?.length, 2);
  const appMade = dragSelectableReportRender(rejected.state, []);
  assert.equal(appMade.notify, true);
  assert.equal(appMade.announce, false);
});

test("drag-select lets a new proposal replace a waiting one", () => {
  const first = dragSelectableRecordProposal(dragSelectableInitialReport([]), [
    "txn_1",
  ]);
  const second = dragSelectableRecordProposal(first, ["txn_2"]);
  assert.equal(dragSelectableReportRender(second, ["txn_1"]).announce, false);
  assert.equal(dragSelectableReportRender(second, ["txn_2"]).announce, true);
});

test("drag-select clears the stored selection after a page change", () => {
  const stored = ["txn_1", "txn_2"];
  const invoices = new Set(["inv_1", "inv_2"]);
  assert.deepEqual(
    dragSelectableStoredAfterEmpty(stored, (id) => invoices.has(id)),
    [],
  );
  assert.deepEqual(
    dragSelectableStoredAfterEmpty(stored, () => false),
    [],
  );
});

test("drag-select keeps the stored selection when its targets register again", () => {
  const stored = ["txn_1", "txn_2"];
  const remounted = new Set(["txn_1", "txn_2", "txn_3"]);
  assert.equal(
    dragSelectableStoredAfterEmpty(stored, (id) => remounted.has(id)),
    stored,
  );
  const empty: string[] = [];
  assert.equal(
    dragSelectableStoredAfterEmpty(empty, () => false),
    empty,
  );
});

test("drag-select keeps each selected id once, at its first position", () => {
  assert.deepEqual(dragSelectableUniqueIds(["b", "a", "b", "c", "a"]), [
    "b",
    "a",
    "c",
  ]);
  assert.deepEqual(dragSelectableUniqueIds([]), []);
});
