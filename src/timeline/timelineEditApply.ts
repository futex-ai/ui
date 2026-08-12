/**
 * The canonical reducer for {@link TimelineEdit}s.
 *
 * The timeline is controlled — it reports edits and never mutates — but ripple
 * and magnetic behaviour is exactly the maths nobody should have to reimplement,
 * so it ships here as a pure function. A consumer's handler is usually one line:
 * `setClips((clips) => applyTimelineEdits(clips, [edit], { tracks }))`.
 *
 * The drag itself also runs edits through this function to render its live
 * preview, so what you see mid-drag is what the consumer will get.
 */
import {
  clipEnd,
  clipSourceIn,
  type TimelineClipData,
  type TimelineEdit,
  type TimelineMoveEdit,
  type TimelineRemoveEdit,
  type TimelineRollEdit,
  type TimelineSplitEdit,
  type TimelineTrack,
  type TimelineTrimEdit,
} from "./timelineTypes";

export type ApplyTimelineEditsOptions = {
  /**
   * Tracks, so lanes flagged `magnetic` can collapse their gaps once the edit
   * has landed. Omit and no lane is magnetic.
   */
  tracks?: readonly TimelineTrack[];
  /**
   * Id for the right-hand half of a split. Defaults to `"<id>-2"`; the left
   * half always keeps the original id so a selection survives the cut.
   */
  splitId?: (clip: TimelineClipData) => string;
};

/** Applies `edits` in order and returns a new array; `clips` is never mutated. */
export function applyTimelineEdits(
  clips: readonly TimelineClipData[],
  edits: readonly TimelineEdit[],
  options: ApplyTimelineEditsOptions = {},
): TimelineClipData[] {
  let next: TimelineClipData[] = clips.map((clip) => ({ ...clip }));
  for (const edit of edits) {
    next = applyOne(next, edit, options);
  }
  return collapseMagnetic(next, options.tracks);
}

function applyOne(
  clips: TimelineClipData[],
  edit: TimelineEdit,
  options: ApplyTimelineEditsOptions,
): TimelineClipData[] {
  switch (edit.type) {
    case "move":
      return applyMove(clips, edit);
    case "trim":
      return applyTrim(clips, edit);
    case "slip":
      return clips.map((clip) =>
        clip.id === edit.clipId ? { ...clip, sourceIn: edit.sourceIn } : clip,
      );
    case "roll":
      return applyRoll(clips, edit);
    case "split":
      return applySplit(clips, edit, options);
    case "remove":
      return applyRemove(clips, edit);
    default:
      return clips;
  }
}

/**
 * Places every clip at its new position. With `ripple`, the clips already on a
 * destination track that begin at or after the insertion point are pushed later
 * by the total length landing there — so a drop inserts rather than overlaps.
 */
function applyMove(
  clips: TimelineClipData[],
  edit: TimelineMoveEdit,
): TimelineClipData[] {
  const placements = new Map(
    edit.placements.map((placement) => [placement.clipId, placement]),
  );
  const placed = clips.map((clip) => {
    const placement = placements.get(clip.id);
    return placement
      ? { ...clip, start: placement.start, trackId: placement.trackId }
      : clip;
  });
  if (!edit.ripple) {
    return placed;
  }

  const perTrack = new Map<string, { insert: number; span: number }>();
  for (const placement of edit.placements) {
    const clip = clips.find((entry) => entry.id === placement.clipId);
    if (!clip) {
      continue;
    }
    const current = perTrack.get(placement.trackId);
    perTrack.set(placement.trackId, {
      insert: current
        ? Math.min(current.insert, placement.start)
        : placement.start,
      span: (current?.span ?? 0) + clip.duration,
    });
  }
  return placed.map((clip) => {
    if (placements.has(clip.id)) {
      return clip;
    }
    const entry = perTrack.get(clip.trackId);
    return entry && clip.start >= entry.insert
      ? { ...clip, start: clip.start + entry.span }
      : clip;
  });
}

/**
 * Retimes one clip's edge. With `ripple`, everything later on the same track
 * moves by the same amount the clip's end did, so the cut after it keeps its
 * relative position instead of leaving a gap or an overlap.
 */
function applyTrim(
  clips: TimelineClipData[],
  edit: TimelineTrimEdit,
): TimelineClipData[] {
  const target = clips.find((clip) => clip.id === edit.clipId);
  if (!target) {
    return clips;
  }
  const previousEnd = clipEnd(target);
  const delta = edit.start + edit.duration - previousEnd;
  return clips.map((clip) => {
    if (clip.id === edit.clipId) {
      return {
        ...clip,
        duration: edit.duration,
        sourceIn: edit.sourceIn,
        start: edit.start,
      };
    }
    return edit.ripple &&
      clip.trackId === target.trackId &&
      clip.start >= previousEnd
      ? { ...clip, start: clip.start + delta }
      : clip;
  });
}

/**
 * Moves the boundary two adjacent clips share. The pair keeps the exact span it
 * had — one clip gains precisely what the other gives up — and the right clip's
 * source window slides with its head so its content stays put.
 */
function applyRoll(
  clips: TimelineClipData[],
  edit: TimelineRollEdit,
): TimelineClipData[] {
  const right = clips.find((clip) => clip.id === edit.rightClipId);
  return clips.map((clip) => {
    if (clip.id === edit.leftClipId) {
      return { ...clip, duration: edit.boundary - clip.start };
    }
    if (clip.id === edit.rightClipId && right) {
      return {
        ...clip,
        duration: clipEnd(right) - edit.boundary,
        sourceIn: clipSourceIn(right) + (edit.boundary - right.start),
        start: edit.boundary,
      };
    }
    return clip;
  });
}

/** Cuts one clip in two at `at`; together the halves fill the original span. */
function applySplit(
  clips: TimelineClipData[],
  edit: TimelineSplitEdit,
  options: ApplyTimelineEditsOptions,
): TimelineClipData[] {
  const index = clips.findIndex((clip) => clip.id === edit.clipId);
  if (index < 0) {
    return clips;
  }
  const clip = clips[index];
  if (edit.at <= clip.start || edit.at >= clipEnd(clip)) {
    return clips;
  }
  const left: TimelineClipData = { ...clip, duration: edit.at - clip.start };
  const right: TimelineClipData = {
    ...clip,
    duration: clipEnd(clip) - edit.at,
    id: options.splitId?.(clip) ?? `${clip.id}-2`,
    sourceIn: clipSourceIn(clip) + (edit.at - clip.start),
    start: edit.at,
  };
  return [...clips.slice(0, index), left, right, ...clips.slice(index + 1)];
}

/**
 * Deletes clips. With `ripple`, each survivor is pulled back by the total length
 * removed earlier on its own track, closing the gaps in one pass rather than
 * one-at-a-time (which would double-count overlapping removals).
 */
function applyRemove(
  clips: TimelineClipData[],
  edit: TimelineRemoveEdit,
): TimelineClipData[] {
  const removedIds = new Set(edit.clipIds);
  const removed = clips.filter((clip) => removedIds.has(clip.id));
  const kept = clips.filter((clip) => !removedIds.has(clip.id));
  if (!edit.ripple) {
    return kept;
  }
  return kept.map((clip) => {
    let shift = 0;
    for (const gone of removed) {
      if (gone.trackId === clip.trackId && gone.start < clip.start) {
        shift += gone.duration;
      }
    }
    return shift > 0 ? { ...clip, start: clip.start - shift } : clip;
  });
}

/**
 * Butts the clips on every `magnetic` track together, preserving their order and
 * the position of the first clip. Non-magnetic tracks keep their gaps.
 */
function collapseMagnetic(
  clips: TimelineClipData[],
  tracks: readonly TimelineTrack[] | undefined,
): TimelineClipData[] {
  const magnetic = new Set(
    (tracks ?? []).filter((track) => track.magnetic).map((track) => track.id),
  );
  if (magnetic.size === 0) {
    return clips;
  }
  const next = [...clips];
  for (const trackId of magnetic) {
    const ordered = next
      .filter((clip) => clip.trackId === trackId)
      .sort((a, b) => a.start - b.start);
    let cursor = ordered[0]?.start ?? 0;
    for (const clip of ordered) {
      const index = next.findIndex((entry) => entry.id === clip.id);
      next[index] = { ...clip, start: cursor };
      cursor += clip.duration;
    }
  }
  return next;
}
