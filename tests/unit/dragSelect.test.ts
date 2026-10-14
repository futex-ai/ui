import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DRAG_SELECTABLE_LAYERS,
  dragSelectableOverlayClearsSurface,
} from "../../src/drag-select/dragSelectableLayers";
import { dragSelectableSelectionForTargets } from "../../src/drag-select/dragSelectableDom";
import {
  dragSelectableIdsEqual,
  dragSelectableBoundsForBox,
  dragSelectableBox,
  dragSelectableIdsForBox,
  dragSelectablePointFromEvent,
  dragSelectableThresholdForValue,
  hasDragSelectableMoved,
} from "../../src/drag-select/dragSelectableModel";
import { dragSelectableDefaultDragMode } from "../../src/drag-select/dragSelectableOptions";
import { dragSelectableStartDecision } from "../../src/drag-select/dragSelectableStartRules";
import type { DragSelectableTargetRegistration } from "../../src/drag-select/dragSelectableTypes";
import { DROPDOWN_LAYERS } from "../../src/dropdown/dropdownLayers";
import { WEB_MODAL_LAYERS } from "../../src/modal/modalLayers";

import { asElement, FakeElement } from "./dragSelectFakeDom";

test("drag-select normalizes a box dragged in any direction", () => {
  assert.deepEqual(dragSelectableBox({ x: 320, y: 180 }, { x: 120, y: 60 }), {
    bottom: 180,
    height: 120,
    left: 120,
    right: 320,
    top: 60,
    width: 200,
  });
});

test("drag-select uses a movement threshold to separate clicks from drags", () => {
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 13, y: 13 }),
    false,
  );
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 14, y: 10 }),
    true,
  );
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 10, y: 14 }),
    true,
  );
});

test("drag-select normalizes configurable movement thresholds", () => {
  assert.equal(dragSelectableThresholdForValue(undefined), 4);
  assert.equal(dragSelectableThresholdForValue(Number.NaN), 4);
  assert.equal(dragSelectableThresholdForValue(-8), 0);
  assert.equal(dragSelectableThresholdForValue(0), 0);
  assert.equal(dragSelectableThresholdForValue(12), 12);
});

test("drag-select respects a custom movement threshold", () => {
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 10, y: 10 }, 0),
    false,
  );
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 10.5, y: 10 }, 0),
    true,
  );
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 21, y: 10 }, 12),
    false,
  );
  assert.equal(
    hasDragSelectableMoved({ x: 10, y: 10 }, { x: 22, y: 10 }, 12),
    true,
  );
});

test("drag-select returns every target intersecting the independent box", () => {
  const targets = [
    { bottom: 68, id: "row_a", left: 240, right: 980, top: 20 },
    { bottom: 130, id: "row_b", left: 240, right: 980, top: 82 },
    { bottom: 192, id: "row_c", left: 240, right: 980, top: 144 },
    { bottom: 254, id: "row_d", left: 240, right: 980, top: 206 },
  ];
  const box = dragSelectableBox({ x: 40, y: 72 }, { x: 1200, y: 198 });

  assert.deepEqual(dragSelectableIdsForBox(targets, box), ["row_b", "row_c"]);
  assert.deepEqual(
    dragSelectableBoundsForBox(targets, box).map((target) => target.id),
    ["row_b", "row_c"],
  );
});

test("drag-select compares selected ids by value", () => {
  assert.equal(dragSelectableIdsEqual([], []), true);
  assert.equal(dragSelectableIdsEqual(["row_a"], ["row_a"]), true);
  assert.equal(dragSelectableIdsEqual(["row_a"], ["row_b"]), false);
  assert.equal(dragSelectableIdsEqual(["row_a"], ["row_a", "row_b"]), false);
});

test("drag-select converts page coordinates into fixed viewport coordinates", () => {
  assert.deepEqual(
    dragSelectablePointFromEvent({ pageX: 420, pageY: 780 }, { x: 20, y: 300 }),
    { x: 400, y: 480 },
  );
  assert.deepEqual(
    dragSelectablePointFromEvent(
      { clientX: 420, clientY: 780 },
      { x: 20, y: 300 },
    ),
    { x: 420, y: 780 },
  );
});

test("drag-select overlay clears shared portal surfaces", () => {
  assert.equal(
    dragSelectableOverlayClearsSurface(
      DRAG_SELECTABLE_LAYERS.overlay,
      WEB_MODAL_LAYERS.surface,
    ),
    true,
  );
  assert.equal(
    dragSelectableOverlayClearsSurface(
      DRAG_SELECTABLE_LAYERS.overlay,
      DROPDOWN_LAYERS.surface,
    ),
    true,
  );
});

test("drag-select starts from controls inside targets but never from editable content", () => {
  const provider = new FakeElement();
  const row = provider.append(new FakeElement());
  const nested = [
    row.append(new FakeElement(["button"])),
    row.append(new FakeElement(["[role='checkbox']"])),
    row.append(new FakeElement(["[role='radio']"])),
    row.append(new FakeElement(["[role='switch']"])),
  ];
  const nestedEditable = row.append(
    new FakeElement(["[contenteditable]:not([contenteditable='false' i])"]),
  );
  const rootButton = provider.append(new FakeElement(["button"]));
  const targets = [
    dragSelectableRegistration(row, "row"),
    dragSelectableRegistration(rootButton, "root"),
  ];
  const decide = (element: FakeElement) =>
    dragSelectableStartDecision({
      element: asElement(element),
      event: {} as PointerEvent,
      keys: { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false },
      options: {
        dragMode: dragSelectableDefaultDragMode,
        ignore: [],
        startFromControls: true,
      },
      provider: asElement(provider),
      targets,
    });

  for (const control of nested) {
    assert.equal(decide(control).allowed, true);
    assert.equal(decide(control).onControl, true);
  }
  assert.equal(decide(nestedEditable).allowed, false);
  assert.equal(decide(nestedEditable).reason, "field");
  assert.equal(decide(rootButton).allowed, true);
  assert.equal(decide(rootButton).onControl, false);
});

test("drag-select snapshots selected target metadata on commit", () => {
  const data = { label: "Previous" };
  const selection = dragSelectableSelectionForTargets([{ data, id: "target" }]);

  assert.deepEqual(selection.selectedIds, ["target"]);
  assert.equal(selection.selectedCount, 1);
  assert.deepEqual(selection.selectedTargets, [{ data, id: "target" }]);
});

test("drag-select target hook returns an empty legacy focus style", () => {
  // `a11yProps` carries the CSS focus marker, so the legacy `focusRingStyle`
  // field must not also carry the hook's inline glow: a consumer applying both
  // (the previously documented pattern) would paint a doubled halo on web.
  const source = readFileSync(
    new URL("../../src/drag-select/DragSelectableContext.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /\.\.\.focus\.focusRingProps/);
  assert.match(source, /focusRingStyle: EMPTY_FOCUS_RING_STYLE/);
  assert.doesNotMatch(source, /focusRingStyle: focus\.focusRingStyle/);
  assert.doesNotMatch(source, /focus\.focusRingStyle,/);
});

function dragSelectableRegistration(
  node: FakeElement,
  id: string,
): DragSelectableTargetRegistration {
  return {
    id,
    node: node as unknown as DragSelectableTargetRegistration["node"],
  };
}
