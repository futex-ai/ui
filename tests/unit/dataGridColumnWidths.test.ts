import assert from "node:assert/strict";
import test from "node:test";

import {
  clampColumnWidth,
  clampFlexWidth,
  DEFAULT_MAX_FLEX_WIDTH,
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

test("clampFlexWidth caps an unbounded column at the default max", () => {
  assert.equal(clampFlexWidth(text("a"), 1000), DEFAULT_MAX_FLEX_WIDTH);
  // A share under the cap is untouched (still rounded).
  assert.equal(clampFlexWidth(text("a"), 200.6), 201);
  // An explicit maxWidth overrides the default cap in either direction.
  assert.equal(clampFlexWidth(text("a", { maxWidth: 300 }), 1000), 300);
  assert.equal(clampFlexWidth(text("a", { maxWidth: 700 }), 1000), 700);
  // The default cap never shrinks a column below its own minWidth.
  assert.equal(clampFlexWidth(text("a", { minWidth: 560 }), 1000), 560);
});

test("a lone flex column is capped at the default max, leaving space empty", () => {
  const { columns, contentWidth } = resolveColumnWidths(
    [text("a", { flex: 1 })],
    1000,
    0,
  );
  // Without the cap this would be 1000 (fill the viewport); it stops at the cap
  // and the content is intentionally narrower than the container.
  assert.equal(columns[0].width, DEFAULT_MAX_FLEX_WIDTH);
  assert.equal(contentWidth, DEFAULT_MAX_FLEX_WIDTH);
});

test("a sparse two-column grid does not balloon the flex column", () => {
  // The reported case: one flex Title column beside a fixed Status column in a
  // wide container. Title is capped instead of eating all the remaining width.
  const { columns } = resolveColumnWidths(
    [text("title", { flex: 1 }), text("status", { width: 130 })],
    1600,
    48, // gutter chrome
  );
  assert.deepEqual(
    columns.map((column) => column.width),
    [DEFAULT_MAX_FLEX_WIDTH, 130],
  );
});

test("an explicit maxWidth above the default cap lets a flex column grow", () => {
  const { columns } = resolveColumnWidths(
    [text("a", { flex: 1, maxWidth: 720 })],
    1000,
    0,
  );
  assert.equal(columns[0].width, 720);
});

test("a manual resize override can exceed the default flex cap", () => {
  // Overrides go through clampColumnWidth (no default cap), so a user drag can
  // widen a column past the default that bounds only automatic flex sizing.
  const { columns } = resolveColumnWidths([text("a", { flex: 1 })], 2000, 0, {
    a: 900,
  });
  assert.equal(columns[0].width, 900);
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
