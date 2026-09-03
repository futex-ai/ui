/**
 * Two guarantees that live inside components/hooks rather than pure functions,
 * pinned at the source the way `dropdownSource.test.ts` and `dragSelect.test.ts`
 * already do for this repo. The behavioural coverage is in
 * `tests/browser/data-grid.spec.ts`; these stop a silent reordering from
 * quietly removing the guard.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

test("a cell bails on a secondary button before the double-press timer", () => {
  // `beginSession` filters non-primary buttons downstream, but by then a
  // right-click on an active select cell — or two right-clicks inside 350ms —
  // would already have opened the editor alongside the context menu.
  const source = read("../../src/data-grid/DataGridCell.tsx");
  const bail = source.indexOf("if (button !== undefined && button !== 0)");
  const timer = source.indexOf("lastDownRef.current = now");
  const edit = source.indexOf("onBeginEdit(cellRef)");
  assert.ok(bail > 0, "no secondary-button guard in DataGridCell");
  assert.ok(timer > 0, "double-press timer not found");
  assert.ok(
    bail < timer,
    "the button guard must precede the double-press timer",
  );
  assert.ok(bail < edit, "the button guard must precede the editor branch");
});

test("the grid hands the keyboard to an open context menu", () => {
  // The menu's navigation runs on a document listener that only stops
  // propagation for the keys it handles, and focus never leaves the cell — so
  // without this gate Delete would clear the selected cells underneath the
  // open menu, and the arrows would move the selection away from it.
  const source = read("../../src/data-grid/useDataGridKeyboard.ts");
  const gate = source.indexOf("if (contextMenuOpen)");
  const readsKey = source.indexOf("const key = event.nativeEvent?.key");
  assert.ok(gate > 0, "no contextMenuOpen gate in handleCellKeyDown");
  assert.ok(gate < readsKey, "the gate must precede any key handling");

  // Deliberately a bare return: preventDefault or stopPropagation here would
  // break the menu's own navigation and the shared escape layer.
  const gateBody = source.slice(gate, readsKey);
  assert.doesNotMatch(gateBody, /preventDefault/);
  assert.doesNotMatch(gateBody, /stopPropagation/);
});

test("the keyboard route to the menu precedes grid navigation", () => {
  const source = read("../../src/data-grid/useDataGridKeyboard.ts");
  const menuKey = source.indexOf('key === "ContextMenu"');
  // The call site, not the import at the top of the file.
  const navigation = source.indexOf("isGridNavigationKey(");
  assert.ok(menuKey > 0, "no ContextMenu key branch");
  assert.ok(navigation > 0, "no isGridNavigationKey call site");
  assert.match(source.slice(menuKey, menuKey + 120), /shift && key === "F10"/);
  assert.ok(
    menuKey < navigation,
    "the context-menu key must be handled before movement",
  );
});

test("the grid renders exactly one ContextMenu", () => {
  // One instance for the whole grid: a menu per cell would mount a portal per
  // cell in a virtualized body, each with its own open state.
  const source = read("../../src/data-grid/DataGrid.tsx");
  const matches = source.match(/<ContextMenu\b/g) ?? [];
  assert.equal(matches.length, 1);
});

test("the context menu is opt-in and gates every region", () => {
  const source = read("../../src/data-grid/DataGrid.tsx");
  assert.match(source, /contextMenu = false/);
  // One stable callback threaded down, rather than a closure per row or cell:
  // `DataGridRow` is memoised.
  assert.match(
    source,
    /const onContextMenu = contextMenu \? menu\.onContextMenu : undefined;/,
  );
});
