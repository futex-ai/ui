import assert from "node:assert/strict";
import test from "node:test";

import {
  describeRefusedEdit,
  describeTimelineEdit,
  playheadInsideClip,
} from "../../src/timeline/timelineAnnounce";
import {
  keyToEditIntent,
  nextFocusedClipId,
  trackOrderOf,
} from "../../src/timeline/timelineKeyboardModel";
import { trackLayouts } from "../../src/timeline/timelineLayout";
import type {
  TimelineClipData,
  TimelineTrack,
} from "../../src/timeline/timelineTypes";

const FPS = 30;
const FRAME = 1 / FPS;

const tracks: TimelineTrack[] = [
  { id: "v2", kind: "title", name: "Titles" },
  { id: "v1", kind: "video", name: "Picture" },
  { id: "a1", kind: "audio", name: "Dialogue" },
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

const clips: TimelineClipData[] = [
  clip("title", "v2", 0, 3),
  clip("shot-a", "v1", 0, 5),
  clip("shot-b", "v1", 5, 5),
  clip("vo", "a1", 8, 4),
];
const ORDER = ["v2", "v1", "a1"];

// --- focus navigation ------------------------------------------------------

test("left and right walk along the focused clip's own track", () => {
  assert.equal(
    nextFocusedClipId("ArrowRight", "shot-a", clips, ORDER),
    "shot-b",
  );
  assert.equal(
    nextFocusedClipId("ArrowLeft", "shot-b", clips, ORDER),
    "shot-a",
  );
  // At the ends the focus stays put rather than wrapping onto another lane.
  assert.equal(nextFocusedClipId("ArrowRight", "shot-b", clips, ORDER), null);
  assert.equal(nextFocusedClipId("ArrowLeft", "shot-a", clips, ORDER), null);
});

test("up and down cross to the clip nearest in time, not to the lane's first", () => {
  // From `shot-b` (starts at 5s) the nearest clip on Dialogue is `vo` at 8s.
  assert.equal(nextFocusedClipId("ArrowDown", "shot-b", clips, ORDER), "vo");
  assert.equal(nextFocusedClipId("ArrowUp", "shot-b", clips, ORDER), "title");
});

test("crossing lanes skips a lane that has no clips", () => {
  const sparse = [clip("top", "v2", 0, 2), clip("bottom", "a1", 0, 2)];
  assert.equal(nextFocusedClipId("ArrowDown", "top", sparse, ORDER), "bottom");
});

test("home and end jump to the ends of the focused track", () => {
  assert.equal(nextFocusedClipId("Home", "shot-b", clips, ORDER), "shot-a");
  assert.equal(nextFocusedClipId("End", "shot-a", clips, ORDER), "shot-b");
});

test("with nothing focused, any navigation key adopts the earliest clip", () => {
  assert.equal(nextFocusedClipId("ArrowRight", null, clips, ORDER), "title");
  assert.equal(nextFocusedClipId("q", null, clips, ORDER), null);
  assert.equal(nextFocusedClipId("ArrowRight", null, [], ORDER), null);
});

test("track order comes from the rendered lane layout", () => {
  assert.deepEqual(trackOrderOf(trackLayouts(tracks, 50)), ORDER);
});

// --- edit intents ----------------------------------------------------------

test("bare arrows are navigation, so they yield no edit intent", () => {
  assert.equal(keyToEditIntent("ArrowRight", {}, FPS), null);
  assert.equal(keyToEditIntent("ArrowLeft", { shift: true }, FPS), null);
});

test("alt-arrows nudge by a frame, and by a second with shift", () => {
  assert.deepEqual(keyToEditIntent("ArrowRight", { alt: true }, FPS), {
    deltaTime: FRAME,
    type: "nudge",
  });
  assert.deepEqual(keyToEditIntent("ArrowLeft", { alt: true }, FPS), {
    deltaTime: -FRAME,
    type: "nudge",
  });
  assert.deepEqual(
    keyToEditIntent("ArrowRight", { alt: true, shift: true }, FPS),
    { deltaTime: 1, type: "nudge" },
  );
});

test("the bracket keys pull each edge in, and shift pushes it back out", () => {
  assert.deepEqual(keyToEditIntent("[", {}, FPS), {
    deltaTime: FRAME,
    edge: "start",
    type: "trim",
  });
  assert.deepEqual(keyToEditIntent("]", {}, FPS), {
    deltaTime: -FRAME,
    edge: "end",
    type: "trim",
  });
  assert.deepEqual(keyToEditIntent("[", { shift: true }, FPS), {
    deltaTime: -1,
    edge: "start",
    type: "trim",
  });
  assert.deepEqual(keyToEditIntent("]", { shift: true }, FPS), {
    deltaTime: 1,
    edge: "end",
    type: "trim",
  });
});

test("s splits and the delete keys remove", () => {
  assert.deepEqual(keyToEditIntent("s", {}, FPS), { type: "split" });
  assert.deepEqual(keyToEditIntent("S", {}, FPS), { type: "split" });
  assert.deepEqual(keyToEditIntent("Delete", {}, FPS), { type: "remove" });
  assert.deepEqual(keyToEditIntent("Backspace", {}, FPS), { type: "remove" });
  assert.equal(keyToEditIntent("q", {}, FPS), null);
});

// --- announcements ---------------------------------------------------------

const context = { clips, fps: FPS, tracks };

test("a move is announced with its new timecode", () => {
  assert.equal(
    describeTimelineEdit(
      {
        placements: [{ clipId: "shot-a", start: 4, trackId: "v1" }],
        type: "move",
      },
      context,
    ),
    "Moved shot-a to 00:00:04:00.",
  );
});

test("a move across lanes names the track it landed on", () => {
  assert.equal(
    describeTimelineEdit(
      {
        placements: [{ clipId: "shot-a", start: 4, trackId: "a1" }],
        type: "move",
      },
      context,
    ),
    "Moved shot-a to 00:00:04:00 on Dialogue.",
  );
});

test("a group move is announced as a count", () => {
  assert.equal(
    describeTimelineEdit(
      {
        placements: [
          { clipId: "shot-a", start: 4, trackId: "v1" },
          { clipId: "shot-b", start: 9, trackId: "v1" },
        ],
        type: "move",
      },
      context,
    ),
    "Moved 2 clips to 00:00:04:00.",
  );
});

test("a trim is announced with its new span and length", () => {
  assert.equal(
    describeTimelineEdit(
      {
        clipId: "shot-a",
        duration: 4,
        edge: "end",
        sourceIn: 0,
        start: 0,
        type: "trim",
      },
      context,
    ),
    "Trimmed the tail of shot-a. Now 00:00:00:00 to 00:00:04:00, 0:04 long.",
  );
});

test("slips, rolls, splits, and removals each get a sentence", () => {
  assert.equal(
    describeTimelineEdit(
      { clipId: "shot-a", sourceIn: 2, type: "slip" },
      context,
    ),
    "Slipped shot-a to source 00:00:02:00.",
  );
  assert.equal(
    describeTimelineEdit(
      {
        boundary: 6,
        leftClipId: "shot-a",
        rightClipId: "shot-b",
        type: "roll",
      },
      context,
    ),
    "Rolled the cut between shot-a and shot-b to 00:00:06:00.",
  );
  assert.equal(
    describeTimelineEdit({ at: 2, clipId: "shot-a", type: "split" }, context),
    "Split shot-a at 00:00:02:00.",
  );
  assert.equal(
    describeTimelineEdit({ clipIds: ["shot-a"], type: "remove" }, context),
    "Removed shot-a.",
  );
  assert.equal(
    describeTimelineEdit(
      { clipIds: ["shot-a", "vo"], type: "remove" },
      context,
    ),
    "Removed 2 clips.",
  );
});

test("an edit with nothing to say is silent rather than announcing noise", () => {
  assert.equal(
    describeTimelineEdit({ clipIds: [], type: "remove" }, context),
    null,
  );
  assert.equal(
    describeTimelineEdit({ placements: [], type: "move" }, context),
    null,
  );
});

test("an unknown clip id still produces a sentence rather than throwing", () => {
  assert.equal(
    describeTimelineEdit({ at: 2, clipId: "ghost", type: "split" }, context),
    "Split Clip at 00:00:02:00.",
  );
});

test("a refused edit says why", () => {
  assert.equal(describeRefusedEdit(clips[0], "locked"), "title is locked.");
  assert.equal(
    describeRefusedEdit(clips[0], "playhead-outside"),
    "The playhead is not over title.",
  );
  assert.equal(
    describeRefusedEdit(null, "no-selection"),
    "Select a clip first.",
  );
});

test("a split needs the playhead strictly inside the clip", () => {
  const target = clip("a", "v1", 2, 4);
  assert.equal(playheadInsideClip(target, 3), true);
  assert.equal(playheadInsideClip(target, 2), false);
  assert.equal(playheadInsideClip(target, 6), false);
});
