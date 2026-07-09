import assert from "node:assert/strict";
import test from "node:test";

import type { DropdownNode } from "../../src/dropdown/dropdownOutsideClose";
import {
  dropdownSurfacesAbove,
  pushDropdownDismissLayer,
  removeDropdownDismissLayer,
  type DropdownDismissLayer,
} from "../../src/dropdown/dropdownDismissLayers";

function surfaceNode(): DropdownNode {
  return { contains: () => false };
}

function layer(node: DropdownNode | null): DropdownDismissLayer {
  return { surface: () => node };
}

test("a lone open surface has no descendants stacked above it", () => {
  const only = layer(surfaceNode());
  pushDropdownDismissLayer(only);
  // A single dropdown behaves exactly as before: nothing is "inside" it beyond
  // its own anchor and surface.
  assert.deepEqual(dropdownSurfacesAbove(only), []);
  removeDropdownDismissLayer(only);
});

test("an ancestor sees every surface stacked above it, in order; the top sees none", () => {
  const bottomNode = surfaceNode();
  const middleNode = surfaceNode();
  const topNode = surfaceNode();
  const bottom = layer(bottomNode);
  const middle = layer(middleNode);
  const top = layer(topNode);
  pushDropdownDismissLayer(bottom);
  pushDropdownDismissLayer(middle);
  pushDropdownDismissLayer(top);

  assert.deepEqual(dropdownSurfacesAbove(bottom), [middleNode, topNode]);
  assert.deepEqual(dropdownSurfacesAbove(middle), [topNode]);
  assert.deepEqual(dropdownSurfacesAbove(top), []);

  removeDropdownDismissLayer(bottom);
  removeDropdownDismissLayer(middle);
  removeDropdownDismissLayer(top);
});

test("layers whose surface has not mounted yet are skipped", () => {
  const bottomNode = surfaceNode();
  const bottom = layer(bottomNode);
  const pending = layer(null); // surface() returns null before it mounts
  const topNode = surfaceNode();
  const top = layer(topNode);
  pushDropdownDismissLayer(bottom);
  pushDropdownDismissLayer(pending);
  pushDropdownDismissLayer(top);

  assert.deepEqual(dropdownSurfacesAbove(bottom), [topNode]);

  removeDropdownDismissLayer(bottom);
  removeDropdownDismissLayer(pending);
  removeDropdownDismissLayer(top);
});

test("removing a layer takes it off the stack; an unregistered layer has no descendants", () => {
  const bottomNode = surfaceNode();
  const bottom = layer(bottomNode);
  const topNode = surfaceNode();
  const top = layer(topNode);
  pushDropdownDismissLayer(bottom);
  pushDropdownDismissLayer(top);

  removeDropdownDismissLayer(top);
  assert.deepEqual(dropdownSurfacesAbove(bottom), []);
  // A layer no longer on the stack reports no descendants.
  assert.deepEqual(dropdownSurfacesAbove(top), []);

  removeDropdownDismissLayer(bottom);
});
