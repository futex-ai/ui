import assert from "node:assert/strict";
import test from "node:test";

import {
  snapCandidates,
  snapOffset,
  snapTime,
  snapToleranceSeconds,
} from "../../src/timeline/timelineSnap";
import type { TimelineClipData } from "../../src/timeline/timelineTypes";

const clips: TimelineClipData[] = [
  { duration: 4, id: "a", label: "A", start: 0, trackId: "v1" },
  { duration: 3, id: "b", label: "B", start: 6, trackId: "v1" },
];

test("candidates are both edges of every clip, plus the fixed points", () => {
  assert.deepEqual(
    snapCandidates({ clips, duration: 20, playheadTime: 5 }),
    [0, 4, 5, 6, 9, 20],
  );
});

test("the clips being dragged do not attract themselves", () => {
  assert.deepEqual(snapCandidates({ clips, excludeClipIds: ["a"] }), [0, 6, 9]);
});

test("markers snap, and zero can be opted out of", () => {
  assert.deepEqual(
    snapCandidates({
      clips: [],
      includeZero: false,
      markers: [{ id: "m", time: 12 }],
    }),
    [12],
  );
});

test("tolerance is pixel-based, so it feels the same at every zoom", () => {
  assert.equal(snapToleranceSeconds(60, 6), 0.1);
  assert.equal(snapToleranceSeconds(600, 6), 0.01);
  assert.equal(snapToleranceSeconds(0, 6), 0);
});

test("a time inside the tolerance is pulled onto the candidate", () => {
  const hit = snapTime(4.05, [0, 4, 9], 0.1);
  assert.deepEqual(hit, { snapped: true, target: 4, time: 4 });

  const miss = snapTime(4.5, [0, 4, 9], 0.1);
  assert.deepEqual(miss, { snapped: false, target: null, time: 4.5 });
});

test("the nearest candidate wins when two are in range", () => {
  assert.equal(snapTime(4.4, [4, 5], 1).time, 4);
  assert.equal(snapTime(4.6, [4, 5], 1).time, 5);
});

test("snapping is inert without candidates or tolerance", () => {
  assert.equal(snapTime(3, [], 1).snapped, false);
  assert.equal(snapTime(3, [3], 0).snapped, false);
});

test("a group drag snaps by whichever moving edge is closest", () => {
  // Leading edge at 4.05 catches the candidate at 4; the trailing edge is far.
  const leading = snapOffset([4.05, 9.4], [0, 4, 20], 0.2);
  assert.equal(leading.target, 4);
  assert.ok(Math.abs(leading.delta - -0.05) < 1e-9);

  // Trailing edge is the one in range this time.
  const trailing = snapOffset([1.5, 5.95], [0, 6], 0.2);
  assert.equal(trailing.target, 6);
  assert.ok(Math.abs(trailing.delta - 0.05) < 1e-9);
});

test("a group drag with nothing in range does not move", () => {
  assert.deepEqual(snapOffset([4.5, 9.5], [0, 20], 0.2), {
    delta: 0,
    target: null,
  });
  assert.deepEqual(snapOffset([], [0], 1), { delta: 0, target: null });
});
