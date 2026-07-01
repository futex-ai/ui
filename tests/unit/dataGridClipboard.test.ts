import assert from "node:assert/strict";
import test from "node:test";

import {
  buildClipboardText,
  cellCopyText,
  coerceCellValue,
  parseClipboardGrid,
} from "../../src/data-grid/dataGridClipboard";
import type { DataGridColumn, DataGridRow } from "../../src/data-grid/types";

const columns: DataGridColumn[] = [
  { id: "name", label: "Name", fieldType: "text" },
  { id: "score", label: "Score", fieldType: "number" },
  {
    id: "status",
    label: "Status",
    fieldType: "singleSelect",
    options: [
      { id: "todo", label: "To do" },
      { id: "done", label: "Done" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    fieldType: "multiSelect",
    options: [
      { id: "a", label: "Alpha" },
      { id: "b", label: "Beta" },
    ],
  },
];

const rows: DataGridRow[] = [
  {
    id: "r1",
    cells: { name: "Ada", score: 5, status: "todo", tags: ["a", "b"] },
  },
  { id: "r2", cells: { name: "Bob", score: 3, status: "done", tags: [] } },
];

const byId = (id: string) => columns.find((c) => c.id === id)!;

test("cellCopyText renders display text per field type", () => {
  assert.equal(cellCopyText(byId("name"), "Ada"), "Ada");
  assert.equal(cellCopyText(byId("score"), 5), "5");
  assert.equal(cellCopyText(byId("status"), "todo"), "To do");
  assert.equal(cellCopyText(byId("tags"), ["a", "b"]), "Alpha, Beta");
  assert.equal(cellCopyText(byId("name"), null), "");
});

test("coerceCellValue parses pasted text into typed values", () => {
  assert.equal(coerceCellValue(byId("score"), "7"), 7);
  assert.equal(coerceCellValue(byId("score"), "x"), null);
  assert.equal(coerceCellValue(byId("status"), "Done"), "done"); // by label
  assert.equal(coerceCellValue(byId("status"), "todo"), "todo"); // by id
  assert.equal(coerceCellValue(byId("status"), "nope"), null);
  assert.deepEqual(coerceCellValue(byId("tags"), "Alpha, Beta"), ["a", "b"]);
  assert.deepEqual(coerceCellValue(byId("tags"), ""), []);
  assert.equal(coerceCellValue(byId("name"), "hi"), "hi");
  assert.equal(coerceCellValue(byId("name"), ""), null);
});

test("buildClipboardText serializes a rectangle to TSV", () => {
  const text = buildClipboardText(
    { minRow: 0, maxRow: 1, minCol: 0, maxCol: 1 },
    ["r1", "r2"],
    ["name", "score", "status", "tags"],
    columns,
    rows,
  );
  assert.equal(text, "Ada\t5\nBob\t3");
});

test("parseClipboardGrid splits TSV and drops a trailing newline", () => {
  assert.deepEqual(parseClipboardGrid("Ada\t5\nBob\t3"), [
    ["Ada", "5"],
    ["Bob", "3"],
  ]);
  assert.deepEqual(parseClipboardGrid("x\n"), [["x"]]);
  assert.deepEqual(parseClipboardGrid(""), []);
});
