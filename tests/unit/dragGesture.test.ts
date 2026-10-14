import assert from "node:assert/strict";
import test from "node:test";

import { autoScrollDelta } from "../../src/dragGesture";

const rect = { bottom: 600, left: 200, right: 1000, top: 0 };

test("auto-scroll does not move while the pointer is away from every edge", () => {
  assert.deepEqual(autoScrollDelta({ x: 600, y: 300 }, rect), { dx: 0, dy: 0 });
});

test("auto-scroll moves toward the edge that the pointer is near", () => {
  assert.deepEqual(autoScrollDelta({ x: 600, y: 580 }, rect), {
    dx: 0,
    dy: 16,
  });
  assert.deepEqual(autoScrollDelta({ x: 600, y: 20 }, rect), {
    dx: 0,
    dy: -16,
  });
  assert.deepEqual(autoScrollDelta({ x: 990, y: 300 }, rect), {
    dx: 16,
    dy: 0,
  });
  assert.deepEqual(autoScrollDelta({ x: 210, y: 300 }, rect), {
    dx: -16,
    dy: 0,
  });
});

test("auto-scroll keeps moving when the pointer is beyond the edge", () => {
  assert.deepEqual(autoScrollDelta({ x: 1200, y: 900 }, rect), {
    dx: 16,
    dy: 16,
  });
  assert.deepEqual(autoScrollDelta({ x: 50, y: -40 }, rect), {
    dx: -16,
    dy: -16,
  });
});

test("auto-scroll uses a 36px edge zone and accepts other values", () => {
  assert.deepEqual(autoScrollDelta({ x: 600, y: 600 - 36 }, rect), {
    dx: 0,
    dy: 0,
  });
  assert.deepEqual(autoScrollDelta({ x: 600, y: 600 - 35 }, rect), {
    dx: 0,
    dy: 16,
  });
  assert.deepEqual(autoScrollDelta({ x: 600, y: 590 }, rect, 8, 4), {
    dx: 0,
    dy: 0,
  });
  assert.deepEqual(autoScrollDelta({ x: 600, y: 595 }, rect, 8, 4), {
    dx: 0,
    dy: 4,
  });
});
