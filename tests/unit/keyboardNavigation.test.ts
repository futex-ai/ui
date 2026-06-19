import assert from "node:assert/strict";
import test from "node:test";

import { nextNavIndex, rovingTabIndex } from "../../src/keyboardNavigation";

test("horizontal navigation moves with Left/Right and ignores Up/Down", () => {
  assert.equal(nextNavIndex({ key: "ArrowRight", index: 0, count: 3 }), 1);
  assert.equal(nextNavIndex({ key: "ArrowLeft", index: 1, count: 3 }), 0);
  assert.equal(nextNavIndex({ key: "ArrowDown", index: 0, count: 3 }), null);
  assert.equal(nextNavIndex({ key: "ArrowUp", index: 0, count: 3 }), null);
});

test("vertical navigation moves with Up/Down and ignores Left/Right", () => {
  const opts = { count: 3, orientation: "vertical" as const };
  assert.equal(nextNavIndex({ key: "ArrowDown", index: 0, ...opts }), 1);
  assert.equal(nextNavIndex({ key: "ArrowUp", index: 1, ...opts }), 0);
  assert.equal(nextNavIndex({ key: "ArrowRight", index: 0, ...opts }), null);
});

test("loop wraps past both ends by default", () => {
  assert.equal(nextNavIndex({ key: "ArrowRight", index: 2, count: 3 }), 0);
  assert.equal(nextNavIndex({ key: "ArrowLeft", index: 0, count: 3 }), 2);
});

test("loop disabled clamps at the ends", () => {
  assert.equal(
    nextNavIndex({ key: "ArrowRight", index: 2, count: 3, loop: false }),
    2,
  );
  assert.equal(
    nextNavIndex({ key: "ArrowLeft", index: 0, count: 3, loop: false }),
    0,
  );
});

test("Home and End jump to the first and last item", () => {
  assert.equal(nextNavIndex({ key: "Home", index: 5, count: 7 }), 0);
  assert.equal(nextNavIndex({ key: "End", index: 0, count: 7 }), 6);
});

test("grid navigation steps by a full row vertically and wraps", () => {
  // 3 columns, 7 items (last row partial).
  const grid = { count: 7, orientation: "grid" as const, columns: 3 };
  assert.equal(nextNavIndex({ key: "ArrowDown", index: 0, ...grid }), 3);
  assert.equal(nextNavIndex({ key: "ArrowUp", index: 4, ...grid }), 1);
  assert.equal(nextNavIndex({ key: "ArrowRight", index: 2, ...grid }), 3);
  // Wrap from the end forward.
  assert.equal(nextNavIndex({ key: "ArrowDown", index: 6, ...grid }), 2);
});

test("non-navigation keys and empty collections return null", () => {
  assert.equal(nextNavIndex({ key: "a", index: 0, count: 3 }), null);
  assert.equal(nextNavIndex({ key: "Enter", index: 0, count: 3 }), null);
  assert.equal(nextNavIndex({ key: "ArrowRight", index: 0, count: 0 }), null);
});

test("rovingTabIndex makes only the active item tabbable", () => {
  assert.equal(rovingTabIndex(2, 2), 0);
  assert.equal(rovingTabIndex(1, 2), -1);
});
