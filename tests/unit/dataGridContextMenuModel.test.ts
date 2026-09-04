/**
 * The grid menu vocabulary. These pin the gating rules — which rows appear for
 * which column/platform, how a multi-row selection is labelled, and that a
 * gated-out block never leaves a stray divider behind.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  cellMenuDescriptors,
  columnMenuDescriptors,
  rowMenuDescriptors,
  type DataGridMenuDescriptor,
} from "../../src/data-grid/dataGridContextMenuModel";

const ids = (descriptors: DataGridMenuDescriptor[]) =>
  descriptors.map((d) => (d.kind === "divider" ? "—" : d.id));

const labels = (descriptors: DataGridMenuDescriptor[]) =>
  descriptors.flatMap((d) => (d.kind === "item" ? [d.label] : []));

const dangerCount = (descriptors: DataGridMenuDescriptor[]) =>
  descriptors.filter((d) => d.kind === "item" && d.danger).length;

/** No menu may start or end with a rule, or show two rules in a row. */
function assertNoStrayDividers(descriptors: DataGridMenuDescriptor[]) {
  assert.notEqual(descriptors[0]?.kind, "divider", "leading divider");
  assert.notEqual(
    descriptors[descriptors.length - 1]?.kind,
    "divider",
    "trailing divider",
  );
  descriptors.forEach((descriptor, index) => {
    if (index === 0) return;
    assert.ok(
      !(
        descriptor.kind === "divider" &&
        descriptors[index - 1].kind === "divider"
      ),
      `doubled divider at ${index}`,
    );
  });
}

test("a sortable unsorted column offers sorting but no clear", () => {
  const descriptors = columnMenuDescriptors({});
  assert.deepEqual(ids(descriptors), [
    "sortAsc",
    "sortDesc",
    "—",
    "insertLeft",
    "insertRight",
    "hide",
    "delete",
  ]);
  assertNoStrayDividers(descriptors);
});

test("a sorted column gains Clear sort", () => {
  const descriptors = columnMenuDescriptors({ sortDirection: "asc" });
  assert.deepEqual(ids(descriptors), [
    "sortAsc",
    "sortDesc",
    "clearSort",
    "—",
    "insertLeft",
    "insertRight",
    "hide",
    "delete",
  ]);
});

test("an unsortable column drops the sort block and its divider", () => {
  const descriptors = columnMenuDescriptors({
    sortDirection: "asc",
    sortable: false,
  });
  assert.deepEqual(ids(descriptors), [
    "insertLeft",
    "insertRight",
    "hide",
    "delete",
  ]);
  assertNoStrayDividers(descriptors);
});

test("Delete field is the column menu's only destructive row", () => {
  assert.equal(dangerCount(columnMenuDescriptors({})), 1);
  const deleteRow = columnMenuDescriptors({}).find(
    (d) => d.kind === "item" && d.id === "delete",
  );
  assert.equal(deleteRow?.kind === "item" && deleteRow.danger, true);
});

test("a single-row menu speaks in the singular", () => {
  const descriptors = rowMenuDescriptors({ rowCount: 1, web: true });
  assert.ok(labels(descriptors).includes("Delete row"));
  assert.ok(labels(descriptors).includes("Duplicate row"));
  assert.equal(dangerCount(descriptors), 1);
  assertNoStrayDividers(descriptors);
});

test("a multi-row selection is counted in the labels", () => {
  const descriptors = rowMenuDescriptors({ rowCount: 5, web: true });
  assert.ok(labels(descriptors).includes("Delete 5 rows"));
  assert.ok(labels(descriptors).includes("Duplicate 5 rows"));
});

test("native drops the row menu's clipboard row without a stray divider", () => {
  const descriptors = rowMenuDescriptors({ rowCount: 1, web: false });
  assert.deepEqual(ids(descriptors), [
    "insertAbove",
    "insertBelow",
    "duplicate",
    "—",
    "delete",
  ]);
  assertNoStrayDividers(descriptors);
});

test("an editable cell offers editing and the clipboard", () => {
  const descriptors = cellMenuDescriptors({ editable: true, web: true });
  assert.deepEqual(ids(descriptors), [
    "edit",
    "—",
    "copy",
    "cut",
    "paste",
    "clear",
  ]);
  assertNoStrayDividers(descriptors);
});

test("a read-only cell drops Edit and Clear and leads with no divider", () => {
  const descriptors = cellMenuDescriptors({ editable: false, web: true });
  assert.deepEqual(ids(descriptors), ["copy", "cut", "paste"]);
  assertNoStrayDividers(descriptors);
});

test("a read-only cell on native has nothing to offer", () => {
  const descriptors = cellMenuDescriptors({ editable: false, web: false });
  assert.deepEqual(ids(descriptors), []);
});

test("native keeps editing but drops the clipboard", () => {
  const descriptors = cellMenuDescriptors({ editable: true, web: false });
  // The rule still earns its place with the clipboard gone: it separates the
  // edit action from the destructive one, which is what it was there to do.
  assert.deepEqual(ids(descriptors), ["edit", "—", "clear"]);
  assertNoStrayDividers(descriptors);
});

test("every item descriptor carries an icon and a non-empty label", () => {
  const all = [
    ...columnMenuDescriptors({ sortDirection: "desc" }),
    ...rowMenuDescriptors({ rowCount: 2, web: true }),
    ...cellMenuDescriptors({ editable: true, web: true }),
  ];
  for (const descriptor of all) {
    if (descriptor.kind !== "item") continue;
    assert.ok(descriptor.icon, `${descriptor.id} has no icon`);
    assert.ok(descriptor.label.length > 0, `${descriptor.id} has no label`);
  }
});
