import assert from "node:assert/strict";
import test from "node:test";

import {
  boundaryAtTime,
  clipAtTime,
  clipRect,
  clipsOnTrack,
  contentWidth,
  nearestTrackAtY,
  trackAtY,
  trackLayouts,
  tracksHeight,
  visibleClips,
} from "../../src/timeline/timelineLayout";
import {
  cellsAcross,
  filmstripFrames,
  sourceWindow,
  waveformBars,
} from "../../src/timeline/timelineClipContent";
import type {
  TimelineClipData,
  TimelineTrack,
} from "../../src/timeline/timelineTypes";

const tracks: TimelineTrack[] = [
  { id: "v2", kind: "title", name: "Titles" },
  { id: "v1", kind: "video", name: "Video" },
  { id: "a1", height: 40, kind: "audio", name: "Dialogue" },
];

function clip(
  id: string,
  trackId: string,
  start: number,
  duration: number,
  extra: Partial<TimelineClipData> = {},
): TimelineClipData {
  return { duration, id, label: id, start, trackId, ...extra };
}

test("tracks stack in order, honouring per-track heights and the gap", () => {
  const layouts = trackLayouts(tracks, 60, 4);
  assert.deepEqual(
    layouts.map((entry) => [entry.trackId, entry.top, entry.height]),
    [
      ["v2", 0, 60],
      ["v1", 64, 60],
      ["a1", 128, 40],
    ],
  );
  assert.equal(tracksHeight(layouts), 168);
  assert.equal(tracksHeight([]), 0);
});

test("a y offset resolves to the lane it lands in", () => {
  const layouts = trackLayouts(tracks, 60, 0);
  assert.equal(trackAtY(layouts, 0)?.trackId, "v2");
  assert.equal(trackAtY(layouts, 59)?.trackId, "v2");
  assert.equal(trackAtY(layouts, 60)?.trackId, "v1");
  assert.equal(trackAtY(layouts, 1000), null);
});

test("a stray drag clamps to the nearest lane instead of missing", () => {
  const layouts = trackLayouts(tracks, 60, 0);
  assert.equal(nearestTrackAtY(layouts, -40)?.trackId, "v2");
  assert.equal(nearestTrackAtY(layouts, 5000)?.trackId, "a1");
  assert.equal(nearestTrackAtY([], 10), null);
});

test("a clip's box comes from its track's lane and the zoom", () => {
  const layouts = trackLayouts(tracks, 60, 0);
  const rect = clipRect(clip("c1", "v1", 2, 3), layouts, 60);
  assert.deepEqual(rect, {
    clipId: "c1",
    height: 60,
    left: 120,
    top: 60,
    width: 180,
  });
});

test("a clip on an unknown track places nowhere rather than throwing", () => {
  const layouts = trackLayouts(tracks, 60, 0);
  assert.equal(clipRect(clip("c1", "ghost", 0, 1), layouts, 60), null);
});

test("a sub-pixel clip keeps a hairline so it stays selectable", () => {
  const layouts = trackLayouts(tracks, 60, 0);
  assert.equal(clipRect(clip("c1", "v1", 0, 0.001), layouts, 1)?.width, 1);
});

test("culling keeps the clips overlapping the visible window", () => {
  const clips = [
    clip("a", "v1", 0, 2),
    clip("b", "v1", 5, 2),
    clip("c", "v1", 20, 2),
  ];
  assert.deepEqual(
    visibleClips(clips, 4, 10).map((entry) => entry.id),
    ["b"],
  );
  // Clips straddling an edge are kept, or half of one would vanish.
  assert.deepEqual(
    visibleClips(clips, 1, 6).map((entry) => entry.id),
    ["a", "b"],
  );
});

test("content width spans the declared duration, the last clip, and the runway", () => {
  const clips = [clip("a", "v1", 0, 2), clip("b", "v1", 30, 5)];
  assert.equal(contentWidth(clips, 10, 10, 0), 350);
  assert.equal(contentWidth(clips, 100, 10, 0), 1000);
  assert.equal(contentWidth(clips, 10, 10, 2), 370);
});

test("a track's clips come back in timeline order", () => {
  const clips = [
    clip("late", "v1", 9, 1),
    clip("early", "v1", 1, 1),
    clip("other", "a1", 0, 1),
  ];
  assert.deepEqual(
    clipsOnTrack(clips, "v1").map((entry) => entry.id),
    ["early", "late"],
  );
});

test("the clip under a time is found, with an exclusive end", () => {
  const clips = [clip("a", "v1", 0, 4), clip("b", "v1", 4, 4)];
  assert.equal(clipAtTime(clips, "v1", 0)?.id, "a");
  assert.equal(clipAtTime(clips, "v1", 3.9)?.id, "a");
  // Exactly on the boundary belongs to the clip that starts there.
  assert.equal(clipAtTime(clips, "v1", 4)?.id, "b");
  assert.equal(clipAtTime(clips, "v1", 20), null);
  assert.equal(clipAtTime(clips, "a1", 1), null);
});

test("a roll target needs two clips actually touching", () => {
  const touching = [clip("a", "v1", 0, 4), clip("b", "v1", 4, 4)];
  assert.equal(boundaryAtTime(touching, "v1", 4.1, 0.5)?.left.id, "a");
  assert.equal(boundaryAtTime(touching, "v1", 6, 0.5), null);

  const gapped = [clip("a", "v1", 0, 4), clip("b", "v1", 6, 4)];
  assert.equal(boundaryAtTime(gapped, "v1", 4, 0.5), null);
});

test("the source window narrows as a clip is trimmed", () => {
  assert.deepEqual(
    sourceWindow(clip("a", "v1", 0, 5, { sourceDuration: 10, sourceIn: 2 })),
    { end: 0.7, start: 0.2 },
  );
  // Without a source duration the whole array is shown.
  assert.deepEqual(sourceWindow(clip("a", "v1", 0, 5)), { end: 1, start: 0 });
});

test("waveform bars take the peak of each slice, not its mean", () => {
  const peaks = [0, 1, 0, 0, 0.5, 0, 0, 0];
  const bars = waveformBars(
    clip("a", "v1", 0, 8, { peaks, sourceDuration: 8 }),
    4,
  );
  // A transient in the first slice survives the downsample.
  assert.deepEqual(bars, [1, 0, 0.5, 0]);
});

test("waveform and filmstrip sampling degrade safely", () => {
  assert.deepEqual(waveformBars(clip("a", "v1", 0, 1), 8), []);
  assert.deepEqual(
    waveformBars(clip("a", "v1", 0, 1, { peaks: [0.5] }), 0),
    [],
  );
  assert.deepEqual(filmstripFrames(clip("a", "v1", 0, 1), 4), []);
});

test("filmstrip frames walk the visible window evenly", () => {
  const thumbnails = ["f0", "f1", "f2", "f3"];
  assert.deepEqual(
    filmstripFrames(
      clip("a", "v1", 0, 4, { sourceDuration: 4, thumbnails }),
      4,
    ),
    ["f0", "f1", "f2", "f3"],
  );
  // Trimmed to the second half: only the later frames appear.
  assert.deepEqual(
    filmstripFrames(
      clip("a", "v1", 0, 2, { sourceDuration: 4, sourceIn: 2, thumbnails }),
      2,
    ),
    ["f2", "f3"],
  );
});

test("cell counts stay within the render budget", () => {
  assert.equal(cellsAcross(100, 10), 10);
  assert.equal(cellsAcross(0, 10), 0);
  assert.equal(cellsAcross(100, 0), 0);
  assert.equal(cellsAcross(5, 10), 1);
  assert.equal(cellsAcross(100_000, 1), 240);
});
