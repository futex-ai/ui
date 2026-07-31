import assert from "node:assert/strict";
import test from "node:test";

import {
  measureGroupItems,
  measureGroupRects,
  type GroupNode,
} from "../../src/sortable-list/sortableListDom";

import {
  describeGroupTarget,
  findGroupOrigin,
  groupAt,
  groupIndicatorIndex,
  groupTargetToMove,
  initialGroupTarget,
  liftedGroupDropTarget,
  type MeasuredGroupItem,
  type MeasuredSortableGroup,
  type SortableGroupLayout,
} from "../../src/sortable-list/sortableGroupModel";

// Two stacked vertical groups: "workspace" holds a, b; "personal" holds c.
const layout: SortableGroupLayout[] = [
  { groupId: "workspace", keys: ["a", "b"], orientation: "vertical" },
  { groupId: "personal", keys: ["c"], orientation: "vertical" },
];

// The same two groups as rects, stacked with a 20px gutter between them.
const stacked: MeasuredSortableGroup[] = [
  { bottom: 100, groupId: "workspace", left: 0, right: 200, top: 0 },
  { bottom: 220, groupId: "personal", left: 0, right: 200, top: 120 },
];

// Two groups side by side, the arrangement a Kanban-like board would use.
const sideBySide: MeasuredSortableGroup[] = [
  { bottom: 300, groupId: "todo", left: 0, right: 100, top: 0 },
  { bottom: 300, groupId: "done", left: 140, right: 240, top: 0 },
];

test("findGroupOrigin locates an item's group and index", () => {
  assert.deepEqual(findGroupOrigin(layout, "a"), {
    groupId: "workspace",
    index: 0,
  });
  assert.deepEqual(findGroupOrigin(layout, "b"), {
    groupId: "workspace",
    index: 1,
  });
  assert.deepEqual(findGroupOrigin(layout, "c"), {
    groupId: "personal",
    index: 0,
  });
  assert.equal(findGroupOrigin(layout, "missing"), null);
});

test("groupAt returns the group whose rect contains the point", () => {
  assert.equal(groupAt(stacked, 50, 40), "workspace");
  assert.equal(groupAt(stacked, 50, 200), "personal");
  assert.equal(groupAt(sideBySide, 10, 150), "todo");
  assert.equal(groupAt(sideBySide, 200, 150), "done");
});

test("groupAt falls back to the nearest group across a stacked gutter", () => {
  // In the 100..120 gutter: 105 is nearer workspace, 118 nearer personal.
  assert.equal(groupAt(stacked, 50, 105), "workspace");
  assert.equal(groupAt(stacked, 50, 118), "personal");
  // Above the first group and below the last, the nearest is still reachable.
  assert.equal(groupAt(stacked, 50, -40), "workspace");
  assert.equal(groupAt(stacked, 50, 400), "personal");
});

test("groupAt falls back to the nearest group across a side-by-side gutter", () => {
  assert.equal(groupAt(sideBySide, 110, 150), "todo");
  assert.equal(groupAt(sideBySide, 130, 150), "done");
  // A point off both axes measures the true corner distance, not just one axis.
  assert.equal(groupAt(sideBySide, 260, 400), "done");
});

test("groupAt returns null when there are no groups", () => {
  assert.equal(groupAt([], 10, 10), null);
});

// Dragging "c" out of personal and over workspace: the items left in flow are
// workspace's a (midpoint y=10) and b (midpoint y=34); personal is now empty.
const inFlow: MeasuredGroupItem[] = [
  { bottom: 20, groupId: "workspace", key: "a", left: 0, right: 200, top: 0 },
  { bottom: 44, groupId: "workspace", key: "b", left: 0, right: 200, top: 24 },
];

test("liftedGroupDropTarget reads the pointer into a removed-item index", () => {
  assert.deepEqual(liftedGroupDropTarget(layout, stacked, inFlow, 50, 5), {
    groupId: "workspace",
    index: 0,
  });
  assert.deepEqual(liftedGroupDropTarget(layout, stacked, inFlow, 50, 30), {
    groupId: "workspace",
    index: 1,
  });
  assert.deepEqual(liftedGroupDropTarget(layout, stacked, inFlow, 50, 60), {
    groupId: "workspace",
    index: 2,
  });
});

test("liftedGroupDropTarget offers slot 0 in an empty group", () => {
  assert.deepEqual(liftedGroupDropTarget(layout, stacked, inFlow, 50, 200), {
    groupId: "personal",
    index: 0,
  });
});

test("liftedGroupDropTarget scans each group on its own axis", () => {
  // "row" flows horizontally, so the drop scan reads x even though the
  // stacked group beside it reads y.
  const mixedLayout: SortableGroupLayout[] = [
    { groupId: "row", keys: ["x", "y"], orientation: "horizontal" },
    ...layout,
  ];
  const mixedGroups: MeasuredSortableGroup[] = [
    { bottom: 400, groupId: "row", left: 0, right: 200, top: 300 },
    ...stacked,
  ];
  // x sits at 0..20 (midpoint 10), y at 24..44 (midpoint 34).
  const rowItems: MeasuredGroupItem[] = [
    { bottom: 400, groupId: "row", key: "x", left: 0, right: 20, top: 300 },
    { bottom: 400, groupId: "row", key: "y", left: 24, right: 44, top: 300 },
  ];
  assert.deepEqual(
    liftedGroupDropTarget(mixedLayout, mixedGroups, rowItems, 5, 350),
    { groupId: "row", index: 0 },
  );
  assert.deepEqual(
    liftedGroupDropTarget(mixedLayout, mixedGroups, rowItems, 30, 350),
    { groupId: "row", index: 1 },
  );
  assert.deepEqual(
    liftedGroupDropTarget(mixedLayout, mixedGroups, rowItems, 60, 350),
    { groupId: "row", index: 2 },
  );
});

test("liftedGroupDropTarget returns null when no group is measurable", () => {
  assert.equal(liftedGroupDropTarget(layout, [], inFlow, 50, 5), null);
});

test("liftedGroupDropTarget returns null for a group missing from the layout", () => {
  const orphan: MeasuredSortableGroup[] = [
    { bottom: 100, groupId: "unregistered", left: 0, right: 200, top: 0 },
  ];
  assert.equal(liftedGroupDropTarget(layout, orphan, inFlow, 50, 5), null);
});

test("initialGroupTarget is the item's own slot in its own group", () => {
  assert.deepEqual(initialGroupTarget(layout, "b"), {
    groupId: "workspace",
    index: 1,
  });
  assert.equal(initialGroupTarget(layout, "missing"), null);
});

test("groupTargetToMove reports the source and destination group", () => {
  assert.deepEqual(
    groupTargetToMove(layout, "a", { groupId: "personal", index: 1 }),
    {
      fromGroupId: "workspace",
      fromIndex: 0,
      key: "a",
      toGroupId: "personal",
      toIndex: 1,
    },
  );
});

test("groupTargetToMove reports a within-group move with matching ids", () => {
  assert.deepEqual(
    groupTargetToMove(layout, "a", { groupId: "workspace", index: 1 }),
    {
      fromGroupId: "workspace",
      fromIndex: 0,
      key: "a",
      toGroupId: "workspace",
      toIndex: 1,
    },
  );
});

test("groupTargetToMove swallows a drop back onto the item's own slot", () => {
  assert.equal(
    groupTargetToMove(layout, "a", { groupId: "workspace", index: 0 }),
    null,
  );
  assert.equal(
    groupTargetToMove(layout, "missing", { groupId: "workspace", index: 0 }),
    null,
  );
});

const title = (groupId: string) =>
  groupId === "workspace" ? "Workspace" : "Personal";

test("describeGroupTarget names the destination group", () => {
  // Personal holds only c, so an incoming a makes two slots.
  assert.equal(
    describeGroupTarget(layout, "a", { groupId: "personal", index: 1 }, title),
    "Personal, position 2 of 2",
  );
});

test("describeGroupTarget excludes the dragged item from its own group's count", () => {
  // Workspace holds a and b; dragging a leaves b, so there are still two slots.
  assert.equal(
    describeGroupTarget(layout, "a", { groupId: "workspace", index: 1 }, title),
    "Workspace, position 2 of 2",
  );
});

test("describeGroupTarget leads with the item name when given one", () => {
  // Both names present: the item, then its destination group, then the slot.
  assert.equal(
    describeGroupTarget(
      layout,
      "a",
      { groupId: "personal", index: 1 },
      title,
      "Todo",
    ),
    "Todo, Personal, position 2 of 2",
  );
});

test("describeGroupTarget with an item name but no group reads as a lone list", () => {
  // Single-list parity: exactly what describeTarget + the item name produce.
  assert.equal(
    describeGroupTarget(
      layout,
      "a",
      { groupId: "workspace", index: 1 },
      () => undefined,
      "Todo",
    ),
    "Todo, position 2 of 2",
  );
});

test("describeGroupTarget omits the prefix when the group has no name", () => {
  // Single-list parity: an unnamed group reads exactly like describeTarget.
  assert.equal(
    describeGroupTarget(
      layout,
      "a",
      { groupId: "workspace", index: 1 },
      () => undefined,
    ),
    "Position 2 of 2",
  );
});

test("groupIndicatorIndex shifts past the origin only inside the source group", () => {
  const origin = { groupId: "workspace", index: 0 };
  // Same group, at or past the origin: the grabbed item still occupies its slot.
  assert.equal(
    groupIndicatorIndex(origin, { groupId: "workspace", index: 0 }),
    1,
  );
  assert.equal(
    groupIndicatorIndex(origin, { groupId: "workspace", index: 1 }),
    2,
  );
  // A different group is unaffected — the item occupies no slot there.
  assert.equal(
    groupIndicatorIndex(origin, { groupId: "personal", index: 0 }),
    0,
  );
  assert.equal(
    groupIndicatorIndex(origin, { groupId: "personal", index: 1 }),
    1,
  );
});

test("groupTargetToMove keeps a same-index move into another group", () => {
  // Index 0 in personal is a real move even though "a" already sits at index 0
  // of workspace — only the origin group's own slot is a no-op.
  assert.deepEqual(
    groupTargetToMove(layout, "a", { groupId: "personal", index: 0 }),
    {
      fromGroupId: "workspace",
      fromIndex: 0,
      key: "a",
      toGroupId: "personal",
      toIndex: 0,
    },
  );
});

/** A stand-in for a rendered row node, keyed by its measurement `data-testid`. */
function fakeRow(testID: string, rect: Partial<DOMRect>) {
  return {
    getAttribute: (name: string) => (name === "data-testid" ? testID : null),
    getBoundingClientRect: () =>
      ({ bottom: 0, left: 0, right: 0, top: 0, ...rect }) as DOMRect,
  };
}

/** A stand-in for a list container node holding `rows`. */
function fakeList(rect: Partial<DOMRect>, rows: ReturnType<typeof fakeRow>[]) {
  return {
    getBoundingClientRect: () =>
      ({ bottom: 0, left: 0, right: 0, top: 0, ...rect }) as DOMRect,
    querySelectorAll: () => rows,
  };
}

test("measureGroupRects measures each group container", () => {
  const groups: GroupNode[] = [
    {
      groupId: "workspace",
      node: fakeList({ bottom: 100, left: 0, right: 200, top: 0 }, []),
    },
    {
      groupId: "personal",
      node: fakeList({ bottom: 220, left: 0, right: 200, top: 120 }, []),
    },
  ];

  assert.deepEqual(measureGroupRects(groups), stacked);
});

test("measureGroupRects skips a group that is not laid out", () => {
  const groups: GroupNode[] = [
    { groupId: "unmounted", node: null },
    {
      groupId: "workspace",
      node: fakeList({ bottom: 100, left: 0, right: 200, top: 0 }, []),
    },
  ];

  assert.deepEqual(
    measureGroupRects(groups).map((group) => group.groupId),
    ["workspace"],
  );
});

test("measureGroupItems tags every row with the group it belongs to", () => {
  const groups: GroupNode[] = [
    {
      groupId: "workspace",
      node: fakeList({ bottom: 100, left: 0, right: 200, top: 0 }, [
        fakeRow("sortable-item-a", { bottom: 20, left: 0, right: 200, top: 0 }),
        fakeRow("sortable-item-b", {
          bottom: 44,
          left: 0,
          right: 200,
          top: 24,
        }),
      ]),
    },
    {
      groupId: "personal",
      node: fakeList({ bottom: 220, left: 0, right: 200, top: 120 }, [
        fakeRow("sortable-item-c", {
          bottom: 140,
          left: 0,
          right: 200,
          top: 120,
        }),
      ]),
    },
  ];

  assert.deepEqual(measureGroupItems(groups), [
    ...inFlow,
    {
      bottom: 140,
      groupId: "personal",
      key: "c",
      left: 0,
      right: 200,
      top: 120,
    },
  ]);
});
