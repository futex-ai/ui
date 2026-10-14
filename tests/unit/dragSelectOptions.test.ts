import assert from "node:assert/strict";
import test from "node:test";

import { createDragSelectableLayerStore } from "../../src/drag-select/dragSelectableLayerStore";
import {
  dragSelectableDefaultDragMode,
  dragSelectableMergeOptions,
  dragSelectableResolveOptions,
} from "../../src/drag-select/dragSelectableOptions";
import type { DragSelectableOptions } from "../../src/drag-select/dragSelectableOptionTypes";
import { dragSelectableNextSelection } from "../../src/drag-select/dragSelectableSelectionModel";

const keys = { altKey: false, ctrlKey: false, metaKey: false, shiftKey: false };

function storeWithCounter() {
  let changes = 0;
  const store = createDragSelectableLayerStore(() => {
    changes += 1;
  });
  const resolved = (provider: DragSelectableOptions = {}) =>
    dragSelectableResolveOptions(
      dragSelectableMergeOptions([provider, ...store.layers()]),
    );
  return { changes: () => changes, resolved, store };
}

test("drag-select options apply defaults, then provider props, then hook layers", () => {
  const { resolved, store } = storeWithCounter();
  assert.equal(resolved().disabled, false);
  assert.equal(resolved({ disabled: true }).disabled, true);
  store.set(1, { disabled: false });
  assert.equal(resolved({ disabled: true }).disabled, false);
});

test("drag-select options skip keys whose value is undefined", () => {
  const { resolved, store } = storeWithCounter();
  store.set(1, { disabled: undefined, minimumDragDistance: 12 });
  const options = resolved({ disabled: true, minimumDragDistance: 8 });
  assert.equal(options.disabled, true);
  assert.equal(options.minimumDragDistance, 12);
});

test("drag-select options let the newest layer win and restore on removal", () => {
  const { resolved, store } = storeWithCounter();
  store.set(2, { minimumDragDistance: 20 });
  store.set(1, { minimumDragDistance: 10 });
  assert.equal(resolved().minimumDragDistance, 20);
  store.remove(2);
  assert.equal(resolved().minimumDragDistance, 10);
  store.remove(1);
  assert.equal(resolved().minimumDragDistance, 4);
});

test("drag-select options combine ignore selectors across layers", () => {
  const { resolved, store } = storeWithCounter();
  store.set(1, { ignore: ["[data-notes]", ".chart"] });
  store.set(2, { ignore: ".chart" });
  assert.deepEqual(resolved({ ignore: "[data-shell]" }).ignore, [
    "[data-shell]",
    "[data-notes]",
    ".chart",
  ]);
});

test("drag-select options read a function option at call time", () => {
  const { changes, resolved, store } = storeWithCounter();
  const first = () => true;
  const second = () => false;
  store.set(1, { shouldStartDrag: first });
  assert.equal(resolved().shouldStartDrag, first);
  store.set(1, { shouldStartDrag: second });
  assert.equal(resolved().shouldStartDrag, second);
  assert.equal(changes(), 0);
});

test("drag-select options re-render only when a value changes", () => {
  const { changes, store } = storeWithCounter();
  store.set(1, { ignore: ["[data-notes]"], selectionLabel: () => "1" });
  assert.equal(changes(), 1);
  store.set(1, { ignore: ["[data-notes]"], selectionLabel: () => "2" });
  assert.equal(changes(), 1);
  store.set(1, { disabled: true, ignore: ["[data-notes]"] });
  assert.equal(changes(), 2);
  store.set(2, { shouldStartDrag: () => true });
  assert.equal(changes(), 2);
  store.remove(2);
  assert.equal(changes(), 2);
  store.remove(1);
  assert.equal(changes(), 3);
  store.remove(1);
  assert.equal(changes(), 3);
});

test("drag-select options normalize distances and fill defaults", () => {
  const defaults = dragSelectableResolveOptions({});
  assert.equal(defaults.minimumDragDistance, 4);
  assert.equal(defaults.minimumControlDragDistance, 10);
  assert.equal(defaults.preventTextSelection, true);
  assert.equal(defaults.startFromControls, true);
  assert.equal(defaults.dragMode, dragSelectableDefaultDragMode);
  assert.deepEqual(defaults.ignore, []);
  const custom = dragSelectableResolveOptions({
    ignore: ".notes",
    minimumControlDragDistance: -3,
    minimumDragDistance: Number.NaN,
  });
  assert.equal(custom.minimumControlDragDistance, 0);
  assert.equal(custom.minimumDragDistance, 4);
  assert.deepEqual(custom.ignore, [".notes"]);
  assert.equal(
    dragSelectableResolveOptions({ minimumControlDragDistance: Infinity })
      .minimumControlDragDistance,
    10,
  );
});

test("drag-select maps modifier keys to a drag mode", () => {
  assert.equal(dragSelectableDefaultDragMode(keys), "replace");
  assert.equal(
    dragSelectableDefaultDragMode({ ...keys, shiftKey: true }),
    "add",
  );
  assert.equal(
    dragSelectableDefaultDragMode({ ...keys, metaKey: true }),
    "toggle",
  );
  assert.equal(
    dragSelectableDefaultDragMode({ ...keys, metaKey: true, shiftKey: true }),
    "add",
  );
  assert.equal(dragSelectableDefaultDragMode({ ...keys, ctrlKey: true }), null);
  assert.equal(dragSelectableDefaultDragMode({ ...keys, altKey: true }), null);
  assert.equal(
    dragSelectableDefaultDragMode({ ...keys, altKey: true, shiftKey: true }),
    null,
  );
});

test("drag-select turns hits into the next selection for each mode", () => {
  assert.deepEqual(
    dragSelectableNextSelection(["a", "b"], ["c", "b", "c"], "replace"),
    ["c", "b"],
  );
  assert.deepEqual(dragSelectableNextSelection(["a", "b"], ["c", "b"], "add"), [
    "a",
    "b",
    "c",
  ]);
  assert.deepEqual(
    dragSelectableNextSelection(["a", "b", "c"], ["b", "d"], "toggle"),
    ["a", "c", "d"],
  );
  assert.deepEqual(dragSelectableNextSelection([], [], "replace"), []);
  assert.deepEqual(dragSelectableNextSelection(["a"], [], "add"), ["a"]);
});
