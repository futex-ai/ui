import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the coordinator is a pure provider with no layout box of its own", () => {
  const source = readSource("../../src/sortable-list/SortableGroups.tsx");

  // It renders only the provider around its children — no View, so the
  // consumer's own section layout is untouched.
  assert.match(
    source,
    /<SortableGroupProvider value=\{value\}>\{children\}<\/SortableGroupProvider>/,
  );
  assert.doesNotMatch(source, /<View/);
});

test("the coordinator's onMove is the single sink that enables dragging", () => {
  const source = readSource("../../src/sortable-list/SortableGroups.tsx");
  const list = readSource("../../src/sortable-list/SortableList.tsx");

  assert.match(source, /onMove\?: \(move: SortableGroupMove\) => void;/);
  assert.match(source, /enabled: Boolean\(onMove\)/);
  // A member list's own onReorder is ignored, and says so in development.
  assert.match(list, /enabled: Boolean\(onReorder\) && !grouped/);
  assert.match(list, /its onReorder is ignored/);
});

test("a member list registers its live layout and leaves on unmount", () => {
  const source = readSource("../../src/sortable-list/SortableList.tsx");

  assert.match(source, /groupId\?: string;/);
  assert.match(source, /grouped\.register\(\s*groupId,/);
  // The teardown is owner-guarded: React renders a replacement list before
  // unmounting the one it replaces, so an id-only delete would drop the live
  // registration.
  assert.match(source, /unregister\?\.\(groupId, owner\.current\)/);
  // And it must not key off the context object, which is a new value on every
  // drag-state change — that would tear the registry down mid-drag.
  assert.match(source, /\[groupId, unregister\],/);
});

test("the coordinator only drops a registration its owner still holds", () => {
  const source = readSource("../../src/sortable-list/SortableGroups.tsx");

  assert.match(
    source,
    /if \(registryRef\.current\.get\(groupId\)\?\.owner === owner\)/,
  );
});

test("only the list holding the target opens a preview", () => {
  const source = readSource("../../src/sortable-list/SortableList.tsx");

  assert.match(source, /shared\.target\?\.groupId === groupId/);
  // The dragged row's content is published by the list that owns it, so a
  // sibling can draw the preview for a row it does not hold.
  assert.match(source, /grouped\.preview\.current = ownPreview/);
  // Exactly one floating clone: the list that owns the dragged row renders it.
  assert.match(
    source,
    /mode === "pointer" && draggedIndex >= 0 && previewNode/,
  );
});

test("canDrop is consulted on both the pointer and keyboard paths", () => {
  const coordinator = readSource("../../src/sortable-list/SortableGroups.tsx");
  const engine = readSource("../../src/sortable-list/useSortableDrag.web.ts");

  assert.match(
    coordinator,
    /canDrop\?: \(move: SortableGroupMove\) => boolean;/,
  );
  // Pointer: a rejected target is never adopted, so no preview opens there.
  assert.match(engine, /if \(!accepts\(session\.draggedKey, target\)\) \{/);
  // Keyboard: the step walks on over rejected slots.
  assert.match(engine, /acceptableGroupTarget\(/);
  // The item's own slot is always allowed, so a drag can always return home.
  assert.match(engine, /move === null \|\| \(optionsRef\.current\.canDrop/);
});

test("the coordinator warns when item keys collide across groups", () => {
  const source = readSource("../../src/sortable-list/SortableGroups.tsx");

  assert.match(source, /function warnOnDuplicateKeys/);
  assert.match(source, /item keys must be unique across every group/);
});

test("the drag engine is platform-split behind one shared contract", () => {
  const web = readSource("../../src/sortable-list/useSortableDrag.web.ts");
  const native = readSource("../../src/sortable-list/useSortableDrag.ts");
  const types = readSource("../../src/sortable-list/sortableDragTypes.ts");

  // Groups are read live, because member lists register during their own render.
  assert.match(types, /groups: \(\) => SortableDragGroup\[\];/);
  assert.match(web, /optionsRef\.current\.groups\(\)/);
  // The keyboard steps through the model's canDrop-aware walker, which wraps
  // keyboardGroupTarget.
  assert.match(web, /acceptableGroupTarget\(/);
  // Native stays inert with the same signature.
  assert.match(native, /itemBinding: \(\) => null/);
  assert.match(native, /bindList: \(\) => NO_BIND/);
});

test("the coordinator ships under the existing sortable-list subpath", () => {
  const index = readSource("../../src/sortable-list/index.ts");
  const packageJson = JSON.parse(readSource("../../package.json"));

  assert.match(index, /export \* from "\.\/SortableGroups"/);
  assert.match(index, /applyGroupedSortableMove/);
  // No new package subpath: the coordinator rides along with the list.
  assert.deepEqual(
    Object.keys(packageJson.exports).filter((key) => key.includes("group")),
    [],
  );
  assert.ok(packageJson.exports["./sortable-list"]);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
