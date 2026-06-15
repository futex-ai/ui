import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DEFAULT_SELECTABLE_SELECTOR,
  emptySelectableSelection,
  selectableElements,
  selectableSelectionFromSelection,
  selectableSelectionsEqual,
  selectedMatchingElements,
} from "../../src/selectable";

test("selectable matching reports selected count, ids, and elements", () => {
  const first = fakeElement("row-a", "Alpha");
  const second = fakeElement("row-b", "Beta");
  const third = fakeElement("", "Gamma", "fallback-c");
  const range = fakeRange([first, third]);

  const selection = selectedMatchingElements({
    elements: [first, second, third],
    ranges: [range],
    text: "Alpha Gamma",
  });

  assert.equal(selection.active, true);
  assert.equal(selection.selectedCount, 2);
  assert.deepEqual(selection.selectedIds, ["row-a", "fallback-c"]);
  assert.deepEqual(
    selection.selectedElements.map((item) => item.element),
    [first, third],
  );
  assert.equal(selection.text, "Alpha Gamma");
});

test("selectable matching ignores collapsed and unmatched ranges", () => {
  const element = fakeElement("row-a", "Alpha");

  assert.equal(
    selectedMatchingElements({
      elements: [element],
      ranges: [{ ...fakeRange([element]), collapsed: true }],
    }),
    emptySelectableSelection,
  );
  assert.equal(
    selectedMatchingElements({
      elements: [element],
      ranges: [fakeRange([])],
    }),
    emptySelectableSelection,
  );
});

test("selectable snapshot scopes candidates to selector matches", () => {
  const root = fakeRoot([
    fakeElement("row-a", "Alpha"),
    fakeElement("row-b", "Beta"),
  ]);
  const selectedRange = fakeRange([root.children[1]]);
  const selection = fakeSelection([selectedRange], "Beta");

  const snapshot = selectableSelectionFromSelection({
    root: root.element,
    selection,
    selector: DEFAULT_SELECTABLE_SELECTOR,
  });

  assert.equal(snapshot.selectedCount, 1);
  assert.deepEqual(snapshot.selectedIds, ["row-b"]);
  assert.equal(snapshot.text, "Beta");
});

test("selectableElements includes a matching element root", () => {
  const child = fakeElement("child", "Child");
  const root = fakeElement("root", "Root");
  const rootElement = {
    ...root,
    matches: (selector: string) => selector === DEFAULT_SELECTABLE_SELECTOR,
    querySelectorAll: () => [child],
  } as unknown as Element;

  assert.deepEqual(
    selectableElements(rootElement, DEFAULT_SELECTABLE_SELECTOR),
    [rootElement, child],
  );
});

test("selectable equality keeps selected element identity meaningful", () => {
  const first = selectedMatchingElements({
    elements: [fakeElement("row-a", "Alpha")],
    ranges: [fakeRange([])],
  });
  const secondElement = fakeElement("row-a", "Alpha");
  const second = selectedMatchingElements({
    elements: [secondElement],
    ranges: [fakeRange([secondElement])],
    text: "Alpha",
  });
  const thirdElement = fakeElement("row-a", "Alpha");
  const third = selectedMatchingElements({
    elements: [thirdElement],
    ranges: [fakeRange([thirdElement])],
    text: "Alpha",
  });

  assert.equal(selectableSelectionsEqual(second, second), true);
  assert.equal(selectableSelectionsEqual(first, second), false);
  assert.equal(selectableSelectionsEqual(second, third), false);
});

test("selectable package exports provider and native-safe fallback", () => {
  const packageSource = readSource("../../package.json");
  const rootIndexSource = readSource("../../src/index.ts");
  const nativeProviderSource = readSource(
    "../../src/selectable/SelectableProvider.tsx",
  );
  const webProviderSource = readSource(
    "../../src/selectable/SelectableProvider.web.tsx",
  );

  assert.match(packageSource, /"\.\/selectable"/);
  assert.match(rootIndexSource, /export \* from "\.\/selectable"/);
  assert.doesNotMatch(nativeProviderSource, /addEventListener/);
  assert.match(webProviderSource, /selectionchange/);
  assert.match(webProviderSource, /selectableSelectionFromSelection/);
});

function fakeElement(
  selectableId: string,
  textContent: string,
  id = "",
): Element {
  return {
    getAttribute: (name: string) =>
      name === "data-selectable-id" && selectableId ? selectableId : null,
    id,
    textContent,
  } as unknown as Element;
}

function fakeRange(nodes: readonly Element[]) {
  const selected = new Set<unknown>(nodes);
  return {
    collapsed: false,
    intersectsNode: (node: Node) => selected.has(node),
  };
}

function fakeRoot(children: Element[]) {
  const element = {
    matches: () => false,
    querySelectorAll: () => children,
  } as unknown as Element;

  return { children, element };
}

function fakeSelection(ranges: ReturnType<typeof fakeRange>[], text: string) {
  return {
    getRangeAt: (index: number) => ranges[index],
    isCollapsed: false,
    rangeCount: ranges.length,
    toString: () => text,
  } as unknown as Selection;
}

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
