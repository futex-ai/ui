import assert from "node:assert/strict";
import test from "node:test";

import {
  isEditEntryKey,
  isGridNavigationKey,
  nextGridCell,
} from "../../src/data-grid/dataGridKeyboardModel";

const grid = { rowCount: 4, colCount: 3 };

test("arrow keys move one cell and clamp at the edges", () => {
  assert.deepEqual(
    nextGridCell({ key: "ArrowDown", position: { row: 0, col: 1 }, ...grid }),
    { row: 1, col: 1 },
  );
  assert.deepEqual(
    nextGridCell({ key: "ArrowRight", position: { row: 0, col: 1 }, ...grid }),
    { row: 0, col: 2 },
  );
  // Clamp, not wrap, at the bounds.
  assert.deepEqual(
    nextGridCell({ key: "ArrowUp", position: { row: 0, col: 1 }, ...grid }),
    { row: 0, col: 1 },
  );
  assert.deepEqual(
    nextGridCell({ key: "ArrowRight", position: { row: 0, col: 2 }, ...grid }),
    { row: 0, col: 2 },
  );
});

test("Home and End jump within the row; Ctrl jumps to grid corners", () => {
  assert.deepEqual(
    nextGridCell({ key: "Home", position: { row: 2, col: 2 }, ...grid }),
    { row: 2, col: 0 },
  );
  assert.deepEqual(
    nextGridCell({ key: "End", position: { row: 2, col: 0 }, ...grid }),
    { row: 2, col: 2 },
  );
  assert.deepEqual(
    nextGridCell({
      key: "Home",
      position: { row: 2, col: 2 },
      ctrl: true,
      ...grid,
    }),
    { row: 0, col: 0 },
  );
  assert.deepEqual(
    nextGridCell({
      key: "End",
      position: { row: 0, col: 0 },
      ctrl: true,
      ...grid,
    }),
    { row: 3, col: 2 },
  );
});

test("Tab walks reading order and wraps to the next/previous row", () => {
  assert.deepEqual(
    nextGridCell({ key: "Tab", position: { row: 1, col: 2 }, ...grid }),
    { row: 2, col: 0 },
  );
  assert.deepEqual(
    nextGridCell({
      key: "Tab",
      position: { row: 0, col: 0 },
      shiftTab: true,
      ...grid,
    }),
    { row: 0, col: 0 },
  );
  assert.deepEqual(
    nextGridCell({
      key: "Tab",
      position: { row: 1, col: 0 },
      shiftTab: true,
      ...grid,
    }),
    { row: 0, col: 2 },
  );
});

test("non-navigation keys and empty grids return null", () => {
  assert.equal(
    nextGridCell({ key: "x", position: { row: 0, col: 0 }, ...grid }),
    null,
  );
  assert.equal(
    nextGridCell({
      key: "ArrowDown",
      position: { row: 0, col: 0 },
      rowCount: 0,
      colCount: 0,
    }),
    null,
  );
});

test("navigation and edit-entry key predicates", () => {
  assert.equal(isGridNavigationKey("ArrowLeft"), true);
  assert.equal(isGridNavigationKey("Tab"), true);
  assert.equal(isGridNavigationKey("Enter"), false);
  assert.equal(isEditEntryKey("Enter"), true);
  assert.equal(isEditEntryKey("a"), true);
  assert.equal(isEditEntryKey(" "), false);
  assert.equal(isEditEntryKey("ArrowDown"), false);
});
