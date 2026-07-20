import assert from "node:assert/strict";
import test from "node:test";

import {
  clampColumnWidth,
  resolveColumnWidths,
} from "../../src/data-grid/dataGridColumnWidths";
import type { DataGridColumn } from "../../src/data-grid/types";

const text = (
  id: string,
  extra: Partial<DataGridColumn> = {},
): DataGridColumn => ({ id, label: id, fieldType: "text", ...extra });

test("clampColumnWidth rounds and clamps to [minWidth, maxWidth]", () => {
  const column = text("a", { minWidth: 100, maxWidth: 300 });
  assert.equal(clampColumnWidth(column, 50), 100);
  assert.equal(clampColumnWidth(column, 500), 300);
  assert.equal(clampColumnWidth(column, 187.4), 187);
});

test("clampColumnWidth uses the 80px default minimum", () => {
  assert.equal(clampColumnWidth(text("a"), 10), 80);
});

test("resolveColumnWidths splits the remaining space by flex", () => {
  const { columns, contentWidth } = resolveColumnWidths(
    [text("a", { flex: 3 }), text("b", { flex: 1 }), text("c", { width: 100 })],
    500,
    0,
  );
  // 400 flex px shared 3:1 → 300 / 100; fixed column keeps 100.
  assert.deepEqual(
    columns.map((column) => column.width),
    [300, 100, 100],
  );
  assert.equal(contentWidth, 500);
});

test("an override pins a flex column to a fixed width and reflows the rest", () => {
  const columns = [text("a", { flex: 1 }), text("b", { flex: 1 })];
  const { columns: resolved, contentWidth } = resolveColumnWidths(
    columns,
    600,
    0,
    { a: 200 },
  );
  // `a` is pinned to 200; `b` (the only remaining flex) fills the other 400.
  assert.deepEqual(
    resolved.map((column) => column.width),
    [200, 400],
  );
  assert.equal(contentWidth, 600);
});

test("a flex column is capped at its maxWidth (not only minWidth)", () => {
  // Share would be 1000px, but maxWidth caps it so it never renders above max
  // (and aria-valuenow stays <= aria-valuemax).
  const { columns } = resolveColumnWidths(
    [text("a", { flex: 1, maxWidth: 150 })],
    1000,
    0,
  );
  assert.equal(columns[0].width, 150);
});

test("an override is clamped to the column's bounds", () => {
  const columns = [text("a", { minWidth: 120, maxWidth: 240, flex: 1 })];
  assert.equal(
    resolveColumnWidths(columns, 1000, 0, { a: 5000 }).columns[0].width,
    240,
  );
  assert.equal(
    resolveColumnWidths(columns, 1000, 0, { a: 10 }).columns[0].width,
    120,
  );
});

test("chromeWidth is reserved before flex is distributed", () => {
  const { columns, contentWidth } = resolveColumnWidths(
    [text("a", { flex: 1 })],
    500,
    100,
  );
  assert.equal(columns[0].width, 400);
  assert.equal(contentWidth, 500);
});
