import assert from "node:assert/strict";
import test from "node:test";

import { applyTimelineEdits } from "../../src/timeline/timelineEditApply";
import {
  resolveMove,
  resolveRoll,
  resolveSlip,
  resolveSplit,
  resolveTrim,
} from "../../src/timeline/timelineEditModel";
import type {
  TimelineClipData,
  TimelineTrack,
} from "../../src/timeline/timelineTypes";

const FPS = 30;
const TRACKS: TimelineTrack[] = [
  { id: "v1", kind: "video", name: "Picture" },
  { id: "a1", kind: "audio", name: "Dialogue" },
];
const ORDER = ["v1", "a1"];

function clip(
  id: string,
  trackId: string,
  start: number,
  duration: number,
  extra: Partial<TimelineClipData> = {},
): TimelineClipData {
  return { duration, id, label: id, start, trackId, ...extra };
}

const byId = (clips: readonly TimelineClipData[], id: string) =>
  clips.find((entry) => entry.id === id);

// --- move -----------------------------------------------------------------

test("a move quantizes to the frame and reports new placements", () => {
  const clips = [clip("a", "v1", 2, 4)];
  const { edit } = resolveMove({
    clips,
    deltaTime: 1.017,
    deltaTrack: 0,
    draggedIds: ["a"],
    fps: FPS,
    trackOrder: ORDER,
  });
  assert.equal(edit?.placements.length, 1);
  // 1.017s is 30.51 frames, so it rounds to 31 frames past the start.
  assert.equal(edit?.placements[0].start, 2 + 31 / FPS);
  assert.equal(edit?.placements[0].trackId, "v1");
});

test("a move across lanes lands on the track the pointer crossed to", () => {
  const { edit } = resolveMove({
    clips: [clip("a", "v1", 2, 4)],
    deltaTime: 0,
    deltaTrack: 1,
    draggedIds: ["a"],
    fps: FPS,
    trackOrder: ORDER,
  });
  assert.equal(edit?.placements[0].trackId, "a1");
});

test("a group keeps its shape rather than piling up at the ends", () => {
  const clips = [clip("a", "v1", 0, 2), clip("b", "a1", 5, 2)];
  const { edit } = resolveMove({
    clips,
    deltaTime: 1,
    // Five lanes down a two-lane timeline: clamped to zero so `b`, already on
    // the last lane, stays in range — and `a` does not slide out from under it.
    deltaTrack: 5,
    draggedIds: ["a", "b"],
    fps: FPS,
    trackOrder: ORDER,
  });
  assert.deepEqual(
    edit?.placements.map((placement) => [placement.trackId, placement.start]),
    [
      ["v1", 1],
      ["a1", 6],
    ],
  );
});

test("a move cannot push any clip before the start of the timeline", () => {
  const clips = [clip("a", "v1", 1, 2), clip("b", "v1", 8, 2)];
  const { edit } = resolveMove({
    clips,
    deltaTime: -10,
    deltaTrack: 0,
    draggedIds: ["a", "b"],
    fps: FPS,
    trackOrder: ORDER,
  });
  // The whole group stops when its leading clip reaches zero, preserving the
  // seven-second gap between them.
  assert.deepEqual(
    edit?.placements.map((placement) => placement.start),
    [0, 7],
  );
});

test("a move snaps to a candidate and reports the target it caught", () => {
  const clips = [clip("a", "v1", 2, 4)];
  const result = resolveMove({
    clips,
    deltaTime: 0.98,
    deltaTrack: 0,
    draggedIds: ["a"],
    fps: FPS,
    snap: { candidates: [3], tolerance: 0.15 },
    trackOrder: ORDER,
  });
  assert.equal(result.edit?.placements[0].start, 3);
  assert.equal(result.snapTarget, 3);
});

test("locked clips and locked tracks are dropped from a move", () => {
  const clips = [clip("a", "v1", 0, 2, { locked: true })];
  assert.equal(
    resolveMove({
      clips,
      deltaTime: 1,
      deltaTrack: 0,
      draggedIds: ["a"],
      fps: FPS,
      trackOrder: ORDER,
    }).edit,
    null,
  );
  assert.equal(
    resolveMove({
      clips: [clip("b", "v1", 0, 2)],
      deltaTime: 1,
      deltaTrack: 0,
      draggedIds: ["b"],
      fps: FPS,
      lockedTrackIds: ["v1"],
      trackOrder: ORDER,
    }).edit,
    null,
  );
});

test("a move that changes nothing reports no edit", () => {
  assert.equal(
    resolveMove({
      clips: [clip("a", "v1", 2, 4)],
      deltaTime: 0,
      deltaTrack: 0,
      draggedIds: ["a"],
      fps: FPS,
      trackOrder: ORDER,
    }).edit,
    null,
  );
});

// --- trim -----------------------------------------------------------------

test("trimming the head advances the source window by the same amount", () => {
  const { edit } = resolveTrim({
    clip: clip("a", "v1", 4, 6, { sourceDuration: 20, sourceIn: 5 }),
    deltaTime: 2,
    edge: "start",
    fps: FPS,
  });
  assert.equal(edit?.start, 6);
  assert.equal(edit?.duration, 4);
  assert.equal(edit?.sourceIn, 7);
});

test("the head stops where the source runs out above it", () => {
  const { edit } = resolveTrim({
    clip: clip("a", "v1", 4, 6, { sourceDuration: 20, sourceIn: 1 }),
    deltaTime: -5,
    edge: "start",
    fps: FPS,
  });
  // Only one second of media sits above the head, so it can retreat one second.
  assert.equal(edit?.start, 3);
  assert.equal(edit?.sourceIn, 0);
});

test("the tail stops where the source runs out below it", () => {
  const { edit } = resolveTrim({
    clip: clip("a", "v1", 0, 6, { sourceDuration: 8, sourceIn: 1 }),
    deltaTime: 10,
    edge: "end",
    fps: FPS,
  });
  assert.equal(edit?.duration, 7);
  assert.equal(edit?.sourceIn, 1);
});

test("a trim can never invert a clip", () => {
  const frame = 1 / FPS;
  const head = resolveTrim({
    clip: clip("a", "v1", 0, 2),
    deltaTime: 10,
    edge: "start",
    fps: FPS,
  });
  assert.ok(Math.abs((head.edit?.duration ?? 0) - frame) < 1e-9);

  const tail = resolveTrim({
    clip: clip("a", "v1", 0, 2),
    deltaTime: -10,
    edge: "end",
    fps: FPS,
  });
  assert.ok(Math.abs((tail.edit?.duration ?? 0) - frame) < 1e-9);
});

test("a clip with no known source length can grow freely at the tail", () => {
  const { edit } = resolveTrim({
    clip: clip("a", "v1", 0, 2),
    deltaTime: 100,
    edge: "end",
    fps: FPS,
  });
  assert.equal(edit?.duration, 102);
});

// --- slip, roll, split ----------------------------------------------------

test("slipping moves the source window against the drag", () => {
  const edit = resolveSlip({
    clip: clip("a", "v1", 0, 4, { sourceDuration: 10, sourceIn: 3 }),
    deltaTime: 1,
    fps: FPS,
  });
  assert.equal(edit?.sourceIn, 2);
});

test("slipping is bounded by the source, and needs one to exist", () => {
  const clamped = resolveSlip({
    clip: clip("a", "v1", 0, 4, { sourceDuration: 10, sourceIn: 3 }),
    deltaTime: -100,
    fps: FPS,
  });
  assert.equal(clamped?.sourceIn, 6);
  assert.equal(
    resolveSlip({ clip: clip("a", "v1", 0, 4), deltaTime: 1, fps: FPS }),
    null,
  );
  // A clip using its whole source has no window left to slide.
  assert.equal(
    resolveSlip({
      clip: clip("a", "v1", 0, 4, { sourceDuration: 4 }),
      deltaTime: 1,
      fps: FPS,
    }),
    null,
  );
});

test("a roll moves the shared boundary within both source limits", () => {
  const left = clip("a", "v1", 0, 4, { sourceDuration: 10, sourceIn: 0 });
  const right = clip("b", "v1", 4, 4, { sourceDuration: 10, sourceIn: 2 });
  assert.equal(
    resolveRoll({ deltaTime: 1, fps: FPS, left, right }).edit?.boundary,
    5,
  );
  // The right clip's head cannot retreat past the start of its own media.
  assert.equal(
    resolveRoll({ deltaTime: -5, fps: FPS, left, right }).edit?.boundary,
    2,
  );
});

test("a split needs a whole frame on each side of the cut", () => {
  const target = clip("a", "v1", 0, 4);
  assert.equal(resolveSplit(target, 2, FPS)?.at, 2);
  assert.equal(resolveSplit(target, 0, FPS), null);
  assert.equal(resolveSplit(target, 4, FPS), null);
  assert.equal(
    resolveSplit(clip("b", "v1", 0, 4, { locked: true }), 2, FPS),
    null,
  );
});

// --- the reducer ----------------------------------------------------------

test("applying edits never mutates the array it was given", () => {
  const clips = [clip("a", "v1", 0, 4)];
  const next = applyTimelineEdits(clips, [
    { placements: [{ clipId: "a", start: 5, trackId: "a1" }], type: "move" },
  ]);
  assert.equal(clips[0].start, 0);
  assert.equal(next[0].start, 5);
  assert.equal(next[0].trackId, "a1");
});

test("a ripple move pushes the clips already on the destination track", () => {
  const clips = [
    clip("a", "v1", 0, 4),
    clip("resident", "a1", 6, 3),
    clip("earlier", "a1", 0, 2),
  ];
  const next = applyTimelineEdits(clips, [
    {
      placements: [{ clipId: "a", start: 5, trackId: "a1" }],
      ripple: true,
      type: "move",
    },
  ]);
  // The clip after the insertion point moves by the inserted length; the one
  // before it does not.
  assert.equal(byId(next, "resident")?.start, 10);
  assert.equal(byId(next, "earlier")?.start, 0);
});

test("a ripple trim carries everything downstream with the new end", () => {
  const clips = [clip("a", "v1", 0, 4), clip("b", "v1", 4, 2)];
  const shorter = applyTimelineEdits(clips, [
    {
      clipId: "a",
      duration: 3,
      edge: "end",
      ripple: true,
      sourceIn: 0,
      start: 0,
      type: "trim",
    },
  ]);
  assert.equal(byId(shorter, "b")?.start, 3);
});

test("a non-rippling trim leaves the gap it opens", () => {
  const clips = [clip("a", "v1", 0, 4), clip("b", "v1", 4, 2)];
  const next = applyTimelineEdits(clips, [
    {
      clipId: "a",
      duration: 3,
      edge: "end",
      sourceIn: 0,
      start: 0,
      type: "trim",
    },
  ]);
  assert.equal(byId(next, "b")?.start, 4);
});

test("a split leaves two halves that exactly fill the original span", () => {
  const clips = [clip("a", "v1", 2, 6, { sourceDuration: 20, sourceIn: 4 })];
  const next = applyTimelineEdits(clips, [
    { at: 5, clipId: "a", type: "split" },
  ]);
  assert.equal(next.length, 2);
  // The left half keeps the id, so a selection survives the cut.
  assert.deepEqual(
    next.map((entry) => [
      entry.id,
      entry.start,
      entry.duration,
      entry.sourceIn,
    ]),
    [
      ["a", 2, 3, 4],
      ["a-2", 5, 3, 7],
    ],
  );
});

test("a roll gives one clip exactly what it takes from the other", () => {
  const clips = [
    clip("a", "v1", 0, 4, { sourceIn: 0 }),
    clip("b", "v1", 4, 4, { sourceIn: 2 }),
  ];
  const next = applyTimelineEdits(clips, [
    { boundary: 5, leftClipId: "a", rightClipId: "b", type: "roll" },
  ]);
  assert.equal(byId(next, "a")?.duration, 5);
  assert.equal(byId(next, "b")?.start, 5);
  assert.equal(byId(next, "b")?.duration, 3);
  // The right clip's content stays put: its head moved into its own source.
  assert.equal(byId(next, "b")?.sourceIn, 3);
});

test("a ripple remove closes every gap in one pass", () => {
  const clips = [
    clip("a", "v1", 0, 2),
    clip("b", "v1", 2, 2),
    clip("c", "v1", 4, 2),
    clip("d", "v1", 6, 2),
  ];
  const next = applyTimelineEdits(clips, [
    { clipIds: ["a", "c"], ripple: true, type: "remove" },
  ]);
  assert.deepEqual(
    next.map((entry) => [entry.id, entry.start]),
    [
      ["b", 0],
      ["d", 2],
    ],
  );
});

test("a magnetic track butts its clips together after any edit", () => {
  const tracks: TimelineTrack[] = [
    { id: "v1", kind: "video", magnetic: true, name: "Picture" },
    { id: "a1", kind: "audio", name: "Dialogue" },
  ];
  const clips = [
    clip("a", "v1", 0, 2),
    clip("b", "v1", 5, 3),
    clip("gap", "a1", 4, 1),
  ];
  const next = applyTimelineEdits(clips, [{ clipIds: [], type: "remove" }], {
    tracks,
  });
  assert.equal(byId(next, "b")?.start, 2);
  // The non-magnetic lane keeps its gap.
  assert.equal(byId(next, "gap")?.start, 4);
});

test("edits apply in order, so a preview equals the committed result", () => {
  const clips = [clip("a", "v1", 0, 6)];
  const next = applyTimelineEdits(clips, [
    { at: 3, clipId: "a", type: "split" },
    { placements: [{ clipId: "a-2", start: 10, trackId: "a1" }], type: "move" },
  ]);
  assert.equal(byId(next, "a")?.duration, 3);
  assert.equal(byId(next, "a-2")?.start, 10);
  assert.equal(byId(next, "a-2")?.trackId, "a1");
});

test("edits naming a clip that is gone are ignored rather than throwing", () => {
  const clips = [clip("a", "v1", 0, 4)];
  assert.deepEqual(
    applyTimelineEdits(clips, [{ at: 2, clipId: "ghost", type: "split" }]),
    clips,
  );
  assert.deepEqual(
    applyTimelineEdits(clips, [{ clipId: "ghost", sourceIn: 1, type: "slip" }]),
    clips,
  );
});

test("the tracks argument is optional, and no lane is magnetic without it", () => {
  const clips = [clip("a", "v1", 0, 2), clip("b", "v1", 9, 2)];
  assert.equal(
    byId(applyTimelineEdits(clips, [], { tracks: TRACKS }), "b")?.start,
    9,
  );
});
