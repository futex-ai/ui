import assert from "node:assert/strict";
import test from "node:test";

import {
  marqueeSelection,
  resolveClipSelection,
} from "../../src/timeline/timelineSelection";
import { clipGrabZone } from "../../src/timeline/timelineDragDom";
import type { TimelineClipData } from "../../src/timeline/timelineTypes";

function clip(
  id: string,
  trackId: string,
  start: number,
  duration: number,
): TimelineClipData {
  return { duration, id, label: id, start, trackId };
}

const clips: TimelineClipData[] = [
  clip("a", "v1", 0, 2),
  clip("b", "v1", 3, 2),
  clip("c", "v1", 6, 2),
  clip("d", "a1", 1, 4),
];

test("a plain click replaces the selection", () => {
  assert.deepEqual(resolveClipSelection(["a", "b"], clips[2], clips), ["c"]);
});

test("an additive click toggles just that clip", () => {
  assert.deepEqual(
    resolveClipSelection(["a"], clips[1], clips, { additive: true }),
    ["a", "b"],
  );
  // Toggling off is the only way to drop one clip from a group.
  assert.deepEqual(
    resolveClipSelection(["a", "b"], clips[1], clips, { additive: true }),
    ["a"],
  );
});

test("a range click extends along the clicked clip's own track", () => {
  assert.deepEqual(
    resolveClipSelection(["a"], clips[2], clips, { range: true }),
    ["a", "b", "c"],
  );
});

test("a range click never sweeps in clips from another lane", () => {
  // `d` is selected but lives on another track, so it anchors nothing here and
  // the click falls back to selecting just the clip.
  assert.deepEqual(
    resolveClipSelection(["d"], clips[2], clips, { range: true }),
    ["c"],
  );
});

test("a range click with nothing selected selects only the clicked clip", () => {
  assert.deepEqual(resolveClipSelection([], clips[1], clips, { range: true }), [
    "b",
  ]);
});

test("a marquee catches every clip it overlaps, not only those it contains", () => {
  assert.deepEqual(
    marqueeSelection(clips, {
      fromTime: 1,
      toTime: 4,
      trackIds: ["v1"],
    }),
    ["a", "b"],
  );
});

test("a marquee is limited to the lanes it swept", () => {
  assert.deepEqual(
    marqueeSelection(clips, { fromTime: 0, toTime: 10, trackIds: ["a1"] }),
    ["d"],
  );
});

test("a marquee drawn right to left selects the same clips", () => {
  assert.deepEqual(
    marqueeSelection(clips, { fromTime: 4, toTime: 1, trackIds: ["v1"] }),
    ["a", "b"],
  );
});

test("an additive marquee unions with the existing selection", () => {
  assert.deepEqual(
    marqueeSelection(
      clips,
      { fromTime: 6, toTime: 8, trackIds: ["v1"] },
      ["a"],
      true,
    ),
    ["a", "c"],
  );
});

test("an edge grab is classified by which end it lands nearest", () => {
  assert.equal(clipGrabZone(102, 100, 200, 10), "start");
  assert.equal(clipGrabZone(295, 100, 200, 10), "end");
  assert.equal(clipGrabZone(200, 100, 200, 10), "body");
});

test("a narrow clip keeps a draggable middle third", () => {
  // With a 12px clip the handles would swallow it whole; they shrink instead.
  assert.equal(clipGrabZone(106, 100, 12, 10), "body");
  assert.equal(clipGrabZone(101, 100, 12, 10), "start");
  assert.equal(clipGrabZone(111, 100, 12, 10), "end");
});
