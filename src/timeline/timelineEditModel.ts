/**
 * Turns a drag gesture into a {@link TimelineEdit}.
 *
 * Every resolver is pure: it takes the clips, a pointer delta in seconds, and
 * the snapping context, and returns the edit the gesture would commit (or
 * `null` when the gesture cannot legally do anything). The drag hooks own the
 * pointer plumbing; all of the *rules* — frame quantization, source-media
 * limits, minimum lengths, clamping to the start of the timeline — live here so
 * they are testable without a DOM and identical on both platforms.
 */
import { snapOffset, type TimelineSnapOffset } from "./timelineSnap";
import { frameDuration, quantizeToFrame } from "./timelineTime";
import {
  clipEnd,
  clipSourceIn,
  type TimelineClipData,
  type TimelineMoveEdit,
  type TimelineRollEdit,
  type TimelineSlipEdit,
  type TimelineSplitEdit,
  type TimelineTrimEdit,
} from "./timelineTypes";

/** Snapping context shared by every resolver. Omit to disable snapping. */
export type TimelineSnapContext = {
  candidates: readonly number[];
  /** Tolerance in seconds — see `snapToleranceSeconds`. */
  tolerance: number;
};

/** An edit plus the snap target to draw an indicator at, if one caught. */
export type TimelineEditResult<TEdit> = {
  edit: TEdit | null;
  snapTarget: number | null;
};

const NO_SNAP: TimelineSnapOffset = { delta: 0, target: null };

function resolveSnap(
  edges: readonly number[],
  snap: TimelineSnapContext | undefined,
): TimelineSnapOffset {
  return snap ? snapOffset(edges, snap.candidates, snap.tolerance) : NO_SNAP;
}

export type TimelineMoveGesture = {
  clips: readonly TimelineClipData[];
  /** Ids being dragged. Clips that are locked are dropped from the move. */
  draggedIds: readonly string[];
  /** Pointer travel along the timeline, in seconds. */
  deltaTime: number;
  /**
   * How many lanes the pointer has crossed. Applied to every dragged clip and
   * clamped so the selection keeps its shape instead of collapsing at an edge.
   */
  deltaTrack: number;
  /** Track ids in lane order. */
  trackOrder: readonly string[];
  /** Ids of tracks that refuse edits. */
  lockedTrackIds?: readonly string[];
  fps: number;
  snap?: TimelineSnapContext;
  ripple?: boolean;
};

/**
 * Resolves a clip move. The time delta is quantized to a frame, offered to the
 * snapper against every moving edge, then clamped so no clip is pushed before
 * zero — as one rigid group, so the selection's internal spacing is preserved.
 */
export function resolveMove(
  gesture: TimelineMoveGesture,
): TimelineEditResult<TimelineMoveEdit> {
  const locked = new Set(gesture.lockedTrackIds ?? []);
  const dragged = gesture.clips.filter(
    (clip) =>
      gesture.draggedIds.includes(clip.id) &&
      !clip.locked &&
      !locked.has(clip.trackId),
  );
  if (dragged.length === 0) {
    return { edit: null, snapTarget: null };
  }

  const quantized = quantizeToFrame(gesture.deltaTime, gesture.fps);
  const edges = dragged.flatMap((clip) => [
    clip.start + quantized,
    clipEnd(clip) + quantized,
  ]);
  const snap = resolveSnap(edges, gesture.snap);
  // Clamping after snapping keeps the group rigid: a snap that would push the
  // leading clip before zero is absorbed here rather than deforming the group.
  const earliest = Math.min(...dragged.map((clip) => clip.start));
  const delta = Math.max(quantized + snap.delta, -earliest);

  const trackDelta = clampTrackDelta(gesture, dragged);
  const placements = dragged.map((clip) => ({
    clipId: clip.id,
    start: delta === 0 ? clip.start : clip.start + delta,
    trackId:
      gesture.trackOrder[
        gesture.trackOrder.indexOf(clip.trackId) + trackDelta
      ] ?? clip.trackId,
  }));

  const moved = placements.some(
    (placement, index) =>
      placement.start !== dragged[index].start ||
      placement.trackId !== dragged[index].trackId,
  );
  return {
    edit: moved ? { placements, ripple: gesture.ripple, type: "move" } : null,
    snapTarget: delta === quantized + snap.delta ? snap.target : null,
  };
}

/** Limits the lane delta so no clip in the group falls off either end. */
function clampTrackDelta(
  gesture: TimelineMoveGesture,
  dragged: readonly TimelineClipData[],
): number {
  const indices = dragged.map((clip) =>
    gesture.trackOrder.indexOf(clip.trackId),
  );
  if (indices.some((index) => index < 0)) {
    return 0;
  }
  const lowest = Math.min(...indices);
  const highest = Math.max(...indices);
  return Math.max(
    -lowest,
    Math.min(gesture.deltaTrack, gesture.trackOrder.length - 1 - highest),
  );
}

export type TimelineTrimGesture = {
  clip: TimelineClipData;
  edge: "end" | "start";
  /** Pointer travel along the timeline, in seconds. */
  deltaTime: number;
  fps: number;
  snap?: TimelineSnapContext;
  ripple?: boolean;
};

/**
 * Resolves an edge drag. A trim can never invert the clip (one frame is the
 * floor), expose media before the source's head, or run past its tail — the
 * handle simply stops, which is how an editor communicates that a clip is at
 * the end of its media.
 */
export function resolveTrim(
  gesture: TimelineTrimGesture,
): TimelineEditResult<TimelineTrimEdit> {
  const { clip, edge, fps } = gesture;
  if (clip.locked) {
    return { edit: null, snapTarget: null };
  }
  const frame = frameDuration(fps);
  const sourceIn = clipSourceIn(clip);
  const end = clipEnd(clip);
  const quantized = quantizeToFrame(gesture.deltaTime, fps);

  if (edge === "start") {
    const proposed = clip.start + quantized;
    const snap = resolveSnap([proposed], gesture.snap);
    // The head can only retreat as far as the media it has left above it.
    const lowest = Math.max(0, clip.start - sourceIn);
    const start = clamp(proposed + snap.delta, lowest, end - frame);
    if (start === clip.start) {
      return { edit: null, snapTarget: null };
    }
    return {
      edit: {
        clipId: clip.id,
        duration: end - start,
        edge,
        ripple: gesture.ripple,
        sourceIn: sourceIn + (start - clip.start),
        start,
        type: "trim",
      },
      snapTarget: start === proposed + snap.delta ? snap.target : null,
    };
  }

  const proposed = end + quantized;
  const snap = resolveSnap([proposed], gesture.snap);
  const highest = clip.sourceDuration
    ? clip.start + (clip.sourceDuration - sourceIn)
    : Number.POSITIVE_INFINITY;
  const next = clamp(proposed + snap.delta, clip.start + frame, highest);
  if (next === end) {
    return { edit: null, snapTarget: null };
  }
  return {
    edit: {
      clipId: clip.id,
      duration: next - clip.start,
      edge,
      ripple: gesture.ripple,
      sourceIn,
      start: clip.start,
      type: "trim",
    },
    snapTarget: next === proposed + snap.delta ? snap.target : null,
  };
}

/**
 * Slides a clip's source window while it stays put on the timeline. Dragging
 * right shows earlier material, so `sourceIn` moves against the pointer.
 * Requires a known `sourceDuration` — without one there is no window to slide
 * inside.
 */
export function resolveSlip(gesture: {
  clip: TimelineClipData;
  deltaTime: number;
  fps: number;
}): TimelineSlipEdit | null {
  const { clip, fps } = gesture;
  if (clip.locked || !clip.sourceDuration) {
    return null;
  }
  const latest = clip.sourceDuration - clip.duration;
  if (latest <= 0) {
    return null;
  }
  const sourceIn = clamp(
    clipSourceIn(clip) - quantizeToFrame(gesture.deltaTime, fps),
    0,
    latest,
  );
  return sourceIn === clipSourceIn(clip)
    ? null
    : { clipId: clip.id, sourceIn, type: "slip" };
}

/**
 * Drags the boundary two touching clips share. Both source windows bound it:
 * the left clip can only grow into media it still has, and the right clip's
 * head cannot retreat past the start of its own source.
 */
export function resolveRoll(gesture: {
  left: TimelineClipData;
  right: TimelineClipData;
  deltaTime: number;
  fps: number;
  snap?: TimelineSnapContext;
}): TimelineEditResult<TimelineRollEdit> {
  const { fps, left, right } = gesture;
  if (left.locked || right.locked) {
    return { edit: null, snapTarget: null };
  }
  const frame = frameDuration(fps);
  const boundary = clipEnd(left);
  const proposed = boundary + quantizeToFrame(gesture.deltaTime, fps);
  const snap = resolveSnap([proposed], gesture.snap);

  const leftLimit = left.sourceDuration
    ? left.start + (left.sourceDuration - clipSourceIn(left))
    : Number.POSITIVE_INFINITY;
  const rightLimit = right.start - clipSourceIn(right);
  const next = clamp(
    proposed + snap.delta,
    Math.max(left.start + frame, rightLimit),
    Math.min(clipEnd(right) - frame, leftLimit),
  );
  if (next === boundary) {
    return { edit: null, snapTarget: null };
  }
  return {
    edit: {
      boundary: next,
      leftClipId: left.id,
      rightClipId: right.id,
      type: "roll",
    },
    snapTarget: next === proposed + snap.delta ? snap.target : null,
  };
}

/**
 * A razor cut. Refused on a locked clip, and on a cut that would leave a
 * zero-length half — a frame is the smallest thing the timeline can hold.
 */
export function resolveSplit(
  clip: TimelineClipData,
  at: number,
  fps: number,
): TimelineSplitEdit | null {
  if (clip.locked) {
    return null;
  }
  const frame = frameDuration(fps);
  const cut = quantizeToFrame(at, fps);
  if (cut < clip.start + frame || cut > clipEnd(clip) - frame) {
    return null;
  }
  return { at: cut, clipId: clip.id, type: "split" };
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}
