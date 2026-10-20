/** Pure stack tests use object identity for layers, openers, and page nodes. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  createWebModalStackState,
  pushWebModalStack,
  removeWebModalStack,
  webModalRestoreCandidates,
  webModalRootMoves,
  webModalScrollLockPadding,
  webModalStackBelow,
  webModalStackTop,
} from "../../src/modal/webModalStackModel";

type Layer = { readonly name: string; readonly parent: Layer | null };
type Element = { readonly name: string; readonly owner: Layer | null };

const parent: Layer = { name: "parent", parent: null };
const child: Layer = { name: "child", parent };
const grandchild: Layer = { name: "grandchild", parent: child };
const sibling: Layer = { name: "sibling", parent };
const stranger: Layer = { name: "stranger", parent: null };
const page: Element = { name: "page", owner: null };
const insideParent: Element = { name: "parent button", owner: parent };
const insideChild: Element = { name: "child button", owner: child };
const isInside = (element: Element, layer: Layer) => element.owner === layer;
const empty = () => createWebModalStackState<Layer, Element>();

function stackWith(layers: readonly Layer[]) {
  return layers.reduce(
    (state, layer) => pushWebModalStack(state, layer, null, []).state,
    empty(),
  );
}

test("empty stack has no top, lower layers, or restore candidates", () => {
  const state = empty();
  assert.equal(webModalStackTop(state), null);
  assert.deepEqual(webModalStackBelow(state), []);
  assert.deepEqual(
    webModalRestoreCandidates(removeWebModalStack(state, stranger, isInside)),
    [],
  );
});

for (const scenario of [
  {
    name: "siblings keep push order",
    pushed: [child, sibling],
    order: [child, sibling],
  },
  {
    name: "parent follows child",
    pushed: [child, parent],
    order: [parent, child],
  },
  {
    name: "three generations mount child-first",
    pushed: [grandchild, child, parent],
    order: [parent, child, grandchild],
  },
  {
    name: "parent follows two children",
    pushed: [child, sibling, parent],
    order: [parent, child, sibling],
  },
]) {
  test(`tree order: ${scenario.name}`, () => {
    const state = stackWith(scenario.pushed);
    assert.deepEqual(
      state.entries.map((entry) => entry.layer),
      scenario.order,
    );
    assert.equal(webModalStackTop(state)?.layer, scenario.order.at(-1));
    assert.deepEqual(
      webModalStackBelow(state).map((entry) => entry.layer),
      scenario.order.slice(0, -1),
    );
  });
}

test("parent takes its descendant's opener without becoming top", () => {
  const first = pushWebModalStack(empty(), grandchild, page, []);
  const second = pushWebModalStack(first.state, child, insideChild, []);
  const third = pushWebModalStack(second.state, parent, insideChild, []);
  assert.equal(first.isTop, true);
  assert.equal(second.isTop, false);
  assert.equal(third.isTop, false);
  assert.deepEqual(third.state.entries, [
    { layer: parent, opener: page },
    { layer: child, opener: null },
    { layer: grandchild, opener: null },
  ]);
  assert.equal(first.state.entries[0].opener, page);
  assert.deepEqual(
    webModalRestoreCandidates(
      removeWebModalStack(third.state, grandchild, isInside),
    ),
    [{ kind: "layer", layer: child }],
  );
});

test("duplicate push changes neither order, opener, nor page membership", () => {
  const state = pushWebModalStack(empty(), parent, page, [page]).state;
  const pushed = pushWebModalStack(state, parent, insideParent, [insideParent]);
  assert.equal(pushed.state, state);
  assert.equal(pushed.inserted, false);
  assert.equal(pushed.isTop, false);
  assert.deepEqual(pushed.newlyMarked, []);
  assert.equal(pushed.pageLock, null);
});

test("unknown removal is a no-op and middle removal preserves the top", () => {
  const state = stackWith([parent, child, grandchild]);
  const unknown = removeWebModalStack(state, stranger, isInside);
  assert.equal(unknown.state, state);
  assert.equal(unknown.removed, null);
  assert.equal(unknown.wasTop, false);
  assert.equal(unknown.pageLock, null);
  assert.deepEqual(unknown.released, []);
  const middle = removeWebModalStack(state, child, isInside);
  assert.equal(middle.removed, state.entries[1]);
  assert.equal(middle.wasTop, false);
  assert.deepEqual(
    middle.state.entries.map((entry) => entry.layer),
    [parent, grandchild],
  );
  assert.equal(webModalStackTop(middle.state)?.layer, grandchild);
  assert.deepEqual(webModalRestoreCandidates(middle), []);
  assert.equal(state.entries.length, 3);
});

for (const opener of [null, insideParent, page]) {
  test(`non-top removal inherits only null or inside openers: ${opener?.name ?? "null"}`, () => {
    const lower = pushWebModalStack(empty(), parent, insideChild, []).state;
    const state = pushWebModalStack(lower, sibling, opener, []).state;
    const removal = removeWebModalStack(state, parent, isInside);
    const inherited = opener === page ? page : insideChild;
    assert.equal(webModalStackTop(removal.state)?.opener, inherited);
    assert.deepEqual(webModalRestoreCandidates(removal), []);
  });
}

test("inherited opener survives multiple lower-layer removals", () => {
  const first = pushWebModalStack(empty(), parent, page, []).state;
  const second = pushWebModalStack(first, child, insideParent, []).state;
  const third = pushWebModalStack(second, grandchild, insideChild, []).state;
  const withoutChild = removeWebModalStack(third, child, isInside).state;
  const withoutParent = removeWebModalStack(
    withoutChild,
    parent,
    isInside,
  ).state;
  const last = removeWebModalStack(withoutParent, grandchild, isInside);
  assert.deepEqual(webModalRestoreCandidates(last), [
    { kind: "element", element: page },
  ]);
});

test("top removal tries the opener before the new top, then nothing when empty", () => {
  const lower = pushWebModalStack(empty(), parent, page, []).state;
  const state = pushWebModalStack(lower, child, insideParent, []).state;
  const removed = removeWebModalStack(state, child, isInside);
  assert.equal(removed.removed, state.entries[1]);
  assert.equal(removed.wasTop, true);
  assert.deepEqual(webModalRestoreCandidates(removed), [
    { kind: "element", element: insideParent },
    { kind: "layer", layer: parent },
  ]);
  assert.deepEqual(
    webModalRestoreCandidates(
      removeWebModalStack(stackWith([parent]), parent, isInside),
    ),
    [],
  );
});

test("page nodes stay marked until their last member closes", () => {
  const first = pushWebModalStack(empty(), parent, null, [page]);
  const second = pushWebModalStack(first.state, child, null, [page]);
  assert.deepEqual(first.newlyMarked, [page]);
  assert.deepEqual(second.newlyMarked, []);
  assert.deepEqual(first.state.pageNodes.get(page), new Set([parent]));
  assert.deepEqual(second.state.pageNodes.get(page), new Set([parent, child]));
  const removeTop = removeWebModalStack(second.state, child, isInside);
  assert.deepEqual(removeTop.released, []);
  assert.deepEqual(removeTop.state.pageNodes.get(page), new Set([parent]));
  const removeLast = removeWebModalStack(removeTop.state, parent, isInside);
  assert.deepEqual(removeLast.released, [page]);
  assert.equal(removeLast.state.pageNodes.size, 0);
});

test("a page node added after the first push is released with the second layer", () => {
  const first = pushWebModalStack(empty(), parent, null, [page]);
  const second = pushWebModalStack(first.state, child, null, [
    page,
    insideParent,
  ]);
  assert.deepEqual(second.newlyMarked, [insideParent]);
  const removed = removeWebModalStack(second.state, child, isInside);
  assert.deepEqual(removed.released, [insideParent]);
  assert.deepEqual(removed.state.pageNodes.get(page), new Set([parent]));
  assert.equal(webModalStackTop(removed.state)?.layer, parent);
});

test("non-top removal keeps nodes marked by a later layer", () => {
  const first = pushWebModalStack(empty(), parent, null, [page]);
  const second = pushWebModalStack(first.state, child, null, [
    page,
    insideParent,
  ]);
  const removed = removeWebModalStack(second.state, parent, isInside);
  assert.deepEqual(removed.released, []);
  assert.deepEqual(removed.state.pageNodes.get(page), new Set([child]));
  assert.deepEqual(removed.state.pageNodes.get(insideParent), new Set([child]));
  assert.deepEqual(
    removeWebModalStack(removed.state, child, isInside).released,
    [page, insideParent],
  );
});

test("page lock transitions happen only on first push and last removal", () => {
  const first = pushWebModalStack(empty(), parent, null, []);
  const second = pushWebModalStack(first.state, child, null, []);
  const third = pushWebModalStack(second.state, grandchild, null, []);
  assert.equal(first.pageLock, "lock");
  assert.equal(second.pageLock, null);
  assert.equal(third.pageLock, null);
  const middle = removeWebModalStack(third.state, child, isInside);
  const top = removeWebModalStack(middle.state, grandchild, isInside);
  assert.equal(middle.pageLock, null);
  assert.equal(top.pageLock, null);
  assert.equal(
    removeWebModalStack(top.state, parent, isInside).pageLock,
    "unlock",
  );
});

test("root moves correct every permutation without moving the focused top", () => {
  const order = [page, insideParent, insideChild];
  for (const current of [
    [page, insideParent, insideChild],
    [page, insideChild, insideParent],
    [insideParent, page, insideChild],
    [insideParent, insideChild, page],
    [insideChild, page, insideParent],
    [insideChild, insideParent, page],
  ]) {
    const result = [...current];
    for (const move of webModalRootMoves(order, current)) {
      assert.notEqual(move.root, insideChild);
      result.splice(result.indexOf(move.root), 1);
      result.splice(result.indexOf(move.before), 0, move.root);
    }
    assert.deepEqual(result, order);
  }
  assert.deepEqual(webModalRootMoves(order, order), []);
  assert.deepEqual(webModalRootMoves([page], [page]), []);
  assert.deepEqual(webModalRootMoves([], []), []);
});

test("scroll lock pads the body by the width that hiding the scrollbar gains", () => {
  // No gutter, for example overlay scrollbars or a page that reserves its
  // gutter: the width does not change, so the padding stays as it is.
  assert.equal(webModalScrollLockPadding(0, 1280, 1280), null);
  // A 15px classic scrollbar comes back as 15px of padding.
  assert.equal(webModalScrollLockPadding(0, 1265, 1280), 15);
  // An existing padding keeps its width, and the gutter adds to it.
  assert.equal(webModalScrollLockPadding(8, 1265, 1280), 23);
  // A zero or negative difference never shrinks or replaces the padding.
  assert.equal(webModalScrollLockPadding(8, 1280, 1280), null);
  assert.equal(webModalScrollLockPadding(8, 1280, 1270), null);
});
