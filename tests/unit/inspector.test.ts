import assert from "node:assert/strict";
import test from "node:test";

import {
  clampToRange,
  decimalsFor,
  describeProperty,
  formatPropertyValue,
  isPropertyModified,
  type InspectorNumberProperty,
  type InspectorSelectProperty,
  type InspectorTextProperty,
  type InspectorToggleProperty,
} from "../../src/video-editor/inspectorModel";

test("a value snaps to its step", () => {
  assert.equal(clampToRange(1.234, { step: 0.1 }), 1.2);
  assert.equal(clampToRange(1.26, { step: 0.1 }), 1.3);
  assert.equal(clampToRange(7.4, { step: 1 }), 7);
});

test("snapping does not leave float noise behind", () => {
  // 0.1 * 3 is 0.30000000000000004 in binary floating point; a field showing
  // that would be absurd, so the step's own precision is re-applied.
  assert.equal(clampToRange(0.3, { step: 0.1 }), 0.3);
  assert.equal(clampToRange(0.7, { step: 0.1 }), 0.7);
  assert.equal(clampToRange(2.9, { step: 0.1 }), 2.9);
});

test("bounds clamp after snapping, so the ends stay reachable exactly", () => {
  assert.equal(clampToRange(500, { max: 100, step: 0.5 }), 100);
  assert.equal(clampToRange(-20, { min: 0, step: 0.5 }), 0);
  assert.equal(clampToRange(50, { max: 100, min: 0, step: 0.5 }), 50);
});

test("a missing or nonsense step leaves the value alone", () => {
  assert.equal(clampToRange(1.234, {}), 1.234);
  assert.equal(clampToRange(1.234, { step: 0 }), 1.234);
  assert.equal(clampToRange(1.234, { step: -1 }), 1.234);
});

test("a step implies how many decimals a field shows", () => {
  assert.equal(decimalsFor(1), 0);
  assert.equal(decimalsFor(0.1), 1);
  assert.equal(decimalsFor(0.01), 2);
  assert.equal(decimalsFor(0.001), 3);
  assert.equal(decimalsFor(0), 0);
  // A pathological step cannot ask for hundreds of decimals.
  assert.equal(decimalsFor(0.00000000001), 6);
});

test("a field shows fixed decimals, and never NaN", () => {
  assert.equal(formatPropertyValue(1.5, { step: 0.1 }), "1.5");
  assert.equal(formatPropertyValue(1.5, { step: 1 }), "2");
  assert.equal(formatPropertyValue(1.5, { precision: 3 }), "1.500");
  assert.equal(formatPropertyValue(Number.NaN), "0");
});

const opacity: InspectorNumberProperty = {
  defaultValue: 100,
  id: "opacity",
  label: "Opacity",
  step: 1,
  type: "number",
  unit: "%",
  value: 62,
};
const flip: InspectorToggleProperty = {
  defaultValue: false,
  id: "flip",
  label: "Flip",
  type: "toggle",
  value: true,
};
const blend: InspectorSelectProperty = {
  id: "blend",
  label: "Blend",
  options: [
    { label: "Normal", value: "normal" },
    { label: "Screen", value: "screen" },
  ],
  type: "select",
  value: "screen",
};
const name: InspectorTextProperty = {
  id: "name",
  label: "Name",
  type: "text",
  value: "Title card",
};

test("each property type is spoken with its value", () => {
  assert.equal(describeProperty(opacity), "Opacity, 62 %");
  assert.equal(describeProperty(flip), "Flip, on");
  // A select speaks the option's label, not its machine value.
  assert.equal(describeProperty(blend), "Blend, Screen");
  assert.equal(describeProperty(name), "Name, Title card");
});

test("a select with an unknown value still speaks something", () => {
  assert.equal(describeProperty({ ...blend, value: "ghost" }), "Blend, ghost");
});

test("reset is offered only where a property differs from its default", () => {
  assert.equal(isPropertyModified(opacity), true);
  assert.equal(isPropertyModified({ ...opacity, value: 100 }), false);
  // No declared default means nothing to reset to.
  assert.equal(isPropertyModified(blend), false);
});
