import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DRAG_SELECTABLE_LAYERS,
  dragSelectableOverlayClearsSurface,
} from "../../src/drag-select/dragSelectableLayers";
import { dragSelectableShouldStartFromTarget } from "../../src/drag-select/dragSelectableDom";
import {
  dragSelectableBoundsForBox,
  dragSelectableBox,
  dragSelectableIdsForBox,
  dragSelectablePointFromEvent,
  hasDragSelectableMoved,
} from "../../src/drag-select/dragSelectableModel";
import type { DragSelectableTargetRegistration } from "../../src/drag-select/dragSelectableTypes";
import { DROPDOWN_LAYERS } from "../../src/dropdown/dropdownLayers";
import { WEB_MODAL_LAYERS } from "../../src/modal/modalLayers";

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

test("drag-select ignores nested interactive controls inside targets", () => {
  withFakeDragSelectableDom(() => {
    const row = new FakeElement();
    const nestedButton = row.append(new FakeElement("button"));
    const rootButton = new FakeElement("button");

    assert.equal(
      dragSelectableShouldStartFromTarget(nestedButton as unknown as Node, [
        dragSelectableRegistration(row),
      ]),
      false,
    );
    assert.equal(
      dragSelectableShouldStartFromTarget(rootButton as unknown as Node, [
        dragSelectableRegistration(rootButton),
      ]),
      true,
    );
  });
});

test("drag-select provider exposes provider, target, and listener hooks", () => {
  const contextSource = readSource(
    "../../src/drag-select/DragSelectableContext.tsx",
  );
  const providerSource = readSource(
    "../../src/drag-select/DragSelectableProvider.web.tsx",
  );
  const overlaySource = readSource(
    "../../src/drag-select/DragSelectableOverlay.web.tsx",
  );
  const typeSource = readSource("../../src/drag-select/dragSelectableTypes.ts");
  const nativeProviderSource = readSource(
    "../../src/drag-select/DragSelectableProvider.tsx",
  );
  const indexSource = readSource("../../src/drag-select/index.ts");

  assert.match(contextSource, /useDragSelectableTarget/);
  assert.match(contextSource, /useDragSelectableChanges/);
  assert.match(providerSource, /document\.addEventListener\("pointermove"/);
  assert.match(providerSource, /emptyMatchingTargets/);
  assert.match(providerSource, /measureDragSelectableTargets/);
  assert.match(providerSource, /onSelectionChange/);
  assert.match(providerSource, /overlayZIndex/);
  assert.match(overlaySource, /createPortal/);
  assert.match(overlaySource, /DRAG_SELECTABLE_LAYERS\.overlay/);
  assert.match(overlaySource, /matchingIds/);
  assert.match(overlaySource, /theme\.colors\.primary/);
  assert.match(typeSource, /DragSelectableSelectionLabelContext/);
  assert.match(nativeProviderSource, /registerTarget/);
  assert.match(nativeProviderSource, /emptyDragSelectableState/);
  assert.match(indexSource, /dragSelectableLayers/);
  assert.match(indexSource, /dragSelectableModel/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function dragSelectableRegistration(
  node: FakeElement,
): DragSelectableTargetRegistration {
  return {
    id: "target",
    node: node as unknown as DragSelectableTargetRegistration["node"],
  };
}

function withFakeDragSelectableDom(run: () => void) {
  const globals = globalThis as FakeDomGlobals;
  const hadElement = "Element" in globals;
  const hadNode = "Node" in globals;
  const previousElement = globals.Element;
  const previousNode = globals.Node;
  globals.Element = FakeElement;
  globals.Node = FakeNode;
  try {
    run();
  } finally {
    restoreFakeDomGlobal(globals, "Element", hadElement, previousElement);
    restoreFakeDomGlobal(globals, "Node", hadNode, previousNode);
  }
}

function restoreFakeDomGlobal(
  globals: FakeDomGlobals,
  key: "Element" | "Node",
  hadValue: boolean,
  previousValue: unknown,
) {
  if (hadValue) {
    globals[key] = previousValue;
    return;
  }
  delete globals[key];
}

type FakeDomGlobals = {
  Element?: unknown;
  Node?: unknown;
};

class FakeNode {
  parentElement: FakeElement | null = null;
}

class FakeElement extends FakeNode {
  private readonly selectorName: string | null;
  private readonly children: FakeNode[] = [];

  constructor(selectorName: string | null = null) {
    super();
    this.selectorName = selectorName;
  }

  append<T extends FakeNode>(child: T): T {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  contains(target: FakeNode): boolean {
    if (target === this) {
      return true;
    }
    return this.children.some(
      (child) =>
        child === target ||
        (child instanceof FakeElement && child.contains(target)),
    );
  }

  closest(selector: string): FakeElement | null {
    let current: FakeElement | null = this;
    while (current) {
      if (current.selectorName && selector.includes(current.selectorName)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }
}
