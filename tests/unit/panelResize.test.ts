import assert from "node:assert/strict";
import test from "node:test";

import {
  clampPanelWidth,
  panelActionWidth,
  panelDragWidth,
  panelKeyWidth,
  panelResizeRange,
} from "../../src/panel-resize/panelResizeModel";

test("a panel width is rounded and kept inside the caller's bounds", () => {
  assert.equal(clampPanelWidth(250.6, 200, 360), 251);
  assert.equal(clampPanelWidth(120, 200, 360), 200);
  assert.equal(clampPanelWidth(900, 200, 360), 360);
  // A layout too narrow for both bounds keeps the minimum.
  assert.equal(clampPanelWidth(300, 320, 280), 320);
});

test("a drag widens the panel when the pointer moves away from it", () => {
  // The handle on a panel's end edge: right is away from the panel.
  assert.equal(panelDragWidth(232, 40, "end", 200, 360), 272);
  assert.equal(panelDragWidth(232, -40, "end", 200, 360), 200);
  // The handle on a panel's start edge: left is away from the panel.
  assert.equal(panelDragWidth(340, -60, "start", 280, 520), 400);
  assert.equal(panelDragWidth(340, 100, "start", 280, 520), 280);
  assert.equal(panelDragWidth(340, -400, "start", 280, 520), 520);
});

test("arrow keys move the handle one step in their direction and Home and End give the bounds", () => {
  const end = { edge: "end" as const, max: 360, min: 200, step: 16 };
  const start = { edge: "start" as const, max: 520, min: 280, step: 16 };
  const cases: [string, number | null, number | null][] = [
    ["ArrowRight", panelKeyWidth("ArrowRight", 232, end), 248],
    ["ArrowLeft", panelKeyWidth("ArrowLeft", 232, end), 216],
    ["start-edge ArrowLeft", panelKeyWidth("ArrowLeft", 340, start), 356],
    ["start-edge ArrowRight", panelKeyWidth("ArrowRight", 340, start), 324],
    ["Home", panelKeyWidth("Home", 300, end), 200],
    ["End", panelKeyWidth("End", 300, end), 360],
    ["ArrowRight at the maximum", panelKeyWidth("ArrowRight", 352, end), 360],
    [
      "a custom step",
      panelKeyWidth("ArrowRight", 232, { ...end, step: 4 }),
      236,
    ],
    ["a key the handle leaves alone", panelKeyWidth("ArrowUp", 232, end), null],
  ];
  for (const [name, actual, expected] of cases) {
    assert.equal(actual, expected, name);
  }
});

test("native increment and decrement actions change the width by one step within the bounds", () => {
  const bounds = { max: 360, min: 200, step: 16 };
  assert.equal(panelActionWidth("increment", 232, bounds), 248);
  assert.equal(panelActionWidth("decrement", 232, bounds), 216);
  assert.equal(panelActionWidth("increment", 356, bounds), 360);
  assert.equal(panelActionWidth("decrement", 204, bounds), 200);
});

test("the exposed value is the width in pixels, with the maximum never below the minimum", () => {
  assert.deepEqual(panelResizeRange(232.4, 200, 360), {
    max: 360,
    min: 200,
    now: 232,
    text: "232 pixels",
  });
  assert.deepEqual(panelResizeRange(320, 320, 280), {
    max: 320,
    min: 320,
    now: 320,
    text: "320 pixels",
  });
});
