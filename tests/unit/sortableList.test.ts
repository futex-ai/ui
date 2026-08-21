import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("sortable list is a role=list that forwards a caller testID", () => {
  const source = readSource("../../src/sortable-list/SortableList.tsx");

  assert.match(source, /role="list"/);
  assert.match(source, /testID=\{testID\}/);
  assert.match(source, /testID\?: string;/);
});

test("sortable list enables dragging only when given onReorder", () => {
  const source = readSource("../../src/sortable-list/SortableList.tsx");

  assert.match(source, /onReorder\?: \(move: SortableMove\) => void;/);
  assert.match(source, /enabled: Boolean\(onReorder\)/);
  assert.match(source, /handle: Boolean\(handle\)/);
  assert.match(source, /useSortableListDrag\(/);
});

test("sortable list defaults to a vertical axis and takes a horizontal one", () => {
  const source = readSource("../../src/sortable-list/SortableList.tsx");

  assert.match(source, /orientation = "vertical"/);
  assert.match(
    source,
    /flexDirection: orientation === "horizontal" \? "row" : "column"/,
  );
});

test("sortable list renders the lifted-row clone and the dashed drop preview", () => {
  const source = readSource("../../src/sortable-list/SortableList.tsx");
  const rowSource = readSource("../../src/sortable-list/SortableRow.tsx");

  // The pointer drag lifts the row into a fixed clone; the target slot gets a
  // dashed preview. Both testIDs flow through the shared clone helper.
  assert.match(source, /"sortable-drag-ghost"/);
  assert.match(source, /"sortable-drop-preview"/);
  assert.match(source, /position: "fixed"/);
  // The shared decorative clone forwards its testID and is aria-hidden,
  // click-through, and marked inert so a row's own controls are never a
  // focusable copy inside an aria-hidden subtree (WCAG 4.1.2) mid-reorder.
  assert.match(rowSource, /export function SortableClone/);
  assert.match(rowSource, /testID=\{testID\}/);
  assert.match(rowSource, /aria-hidden/);
  assert.match(rowSource, /pointerEvents="none"/);
  assert.match(rowSource, /el\.inert = true/);
});

test("sortable list places an optional grab handle at the start or end", () => {
  const source = readSource("../../src/sortable-list/SortableRow.tsx");

  assert.match(source, /handle === "start" \? grip : null/);
  assert.match(source, /handle === "end" \? grip : null/);
  // The default handle glyph is a themed grip icon, picked by orientation.
  assert.match(
    source,
    /import \{ GripHorizontal, GripVertical \} from "lucide-react-native";/,
  );
  assert.match(
    source,
    /orientation === "horizontal" \? GripHorizontal : GripVertical/,
  );
});

test("sortable list can place the grab handle inside content (custom mode)", () => {
  const listSource = readSource("../../src/sortable-list/SortableList.tsx");
  const rowSource = readSource("../../src/sortable-list/SortableRow.tsx");

  // renderItem gains a third arg (the wired handle) and, in custom mode, the
  // list hands the grip to it to place inside the content (e.g. a card).
  assert.match(listSource, /handle\?: ReactNode\) => ReactNode/);
  assert.match(listSource, /handle === "custom"/);
  assert.match(listSource, /customGrip\(binding, grabbed, grabLabel\)/);
  // The row is a plain, measured listitem in custom mode (grip is in content),
  // and the wired handle component is exported for the list to place.
  assert.match(rowSource, /handle === "custom" \|\| !binding/);
  assert.match(rowSource, /export function SortableHandle/);
});

test("sortable rows are listitems with a button drag target and the focus ring", () => {
  const source = readSource("../../src/sortable-list/SortableRow.tsx");

  assert.match(source, /role="listitem"/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /useFocusRing/);
  assert.match(source, /focus\.focusVisible \? focus\.focusRingStyle : null/);
  assert.match(source, /focus\.webOutlineReset/);
  // onKeyDown / tabIndex are web-only and gated behind Platform.OS.
  assert.match(source, /Platform\.OS === "web"/);
  assert.match(source, /onKeyDown: binding\.onKeyDown, tabIndex: 0 as const/);
});

test("a disabled row is measured but never a drag start or keyboard target", () => {
  const listSource = readSource("../../src/sortable-list/SortableList.tsx");
  const rowSource = readSource("../../src/sortable-list/SortableRow.tsx");

  // The list skips the binding for a disabled item; the row still carries its
  // measurement testID so the drop math counts its slot.
  assert.match(
    listSource,
    /const binding = disabled \? null : drag\.itemBinding\(key\)/,
  );
  assert.match(listSource, /itemTestID=\{`sortable-item-\$\{key\}`\}/);
  assert.match(rowSource, /if \(!binding\) \{/);
});

test("the drag hook is platform-split: web pointer+keyboard, inert native", () => {
  const web = readSource("../../src/sortable-list/useSortableListDrag.web.ts");
  const engine = readSource("../../src/sortable-list/useSortableDrag.web.ts");
  const native = readSource("../../src/sortable-list/useSortableListDrag.ts");

  // The web hook is a thin adapter over the shared N-group engine: a lone list
  // is a coordinator of one implicit group.
  assert.match(web, /useSortableDrag\(\{/);
  assert.match(web, /bindList: drag\.bindList\(IMPLICIT_GROUP_ID\)/);
  // The engine owns the drag itself: capture-phase pointerdown, a move
  // threshold, Space-grab / Escape-cancel.
  assert.match(engine, /const DRAG_THRESHOLD = 5;/);
  assert.match(
    engine,
    /addEventListener\("pointerdown", onPointerDown, true\)/,
  );
  assert.match(engine, /announce\(/);
  assert.match(engine, /Escape/);
  // The handle vs. whole-row start hit test picks the right nodes, per group.
  assert.match(engine, /group\.handle\s*\?\s*measureHandles\(hit\.node\)/);
  // Native: an inert no-op with the same signature.
  assert.match(native, /itemBinding: \(\) => null/);
  assert.match(native, /active: false/);
});

test("sortable list styles are driven by shared theme tokens", () => {
  const styles = readSource("../../src/sortable-list/sortableListStyles.ts");

  assert.match(styles, /borderColor: theme\.colors\.primary/);
  assert.match(styles, /backgroundColor: theme\.colors\.soft/);
  assert.match(styles, /borderRadius: theme\.radii\.sm/);
  // The web-only grab cursors take the escape cast (not in RN's cursor union).
  assert.match(styles, /cursor: "grab" \} as unknown as ViewStyle/);
  assert.match(styles, /cursor: "grabbing" \} as unknown as ViewStyle/);
});

test("sortable list has public root and subpath exports plus the move helper", () => {
  const rootSource = readSource("../../src/index.ts");
  const indexSource = readSource("../../src/sortable-list/index.ts");
  const componentSource = readSource(
    "../../src/sortable-list/SortableList.tsx",
  );
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/sortable-list"/);
  assert.match(indexSource, /SortableList/);
  assert.match(
    componentSource,
    /export \{ applySortableMove \} from "\.\/sortableListModel"/,
  );
  assert.match(packageJson, /"\.\/sortable-list"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
