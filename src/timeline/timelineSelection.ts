/**
 * Selection resolution for the timeline: what a click, a modified click, or a
 * marquee should leave selected. Pure, so the same rules apply to the pointer,
 * the keyboard, and any consumer driving the selection itself.
 */
import { clipEnd, type TimelineClipData } from "./timelineTypes";

/** Modifier keys that were held when the clip was clicked. */
export type TimelineSelectionModifiers = {
  /** Cmd/Ctrl — add to or remove from the selection. */
  additive?: boolean;
  /** Shift — extend from the last selected clip on the same track. */
  range?: boolean;
};

/**
 * Resolves a click.
 *
 * A plain click replaces the selection. An additive click toggles just that
 * clip — including deselecting it, which is the only way to drop one clip from
 * a group. A range click extends along the clicked clip's own track from the
 * nearest already-selected clip there, so shift-clicking never sweeps in clips
 * from lanes you were not pointing at.
 */
export function resolveClipSelection(
  selected: readonly string[],
  clip: TimelineClipData,
  clips: readonly TimelineClipData[],
  modifiers: TimelineSelectionModifiers = {},
): string[] {
  if (modifiers.additive) {
    return selected.includes(clip.id)
      ? selected.filter((id) => id !== clip.id)
      : [...selected, clip.id];
  }

  if (modifiers.range) {
    const track = clips
      .filter((entry) => entry.trackId === clip.trackId)
      .sort((a, b) => a.start - b.start);
    const anchorIndex = nearestSelectedIndex(track, selected, clip.id);
    const clickedIndex = track.findIndex((entry) => entry.id === clip.id);
    if (anchorIndex >= 0 && clickedIndex >= 0) {
      const from = Math.min(anchorIndex, clickedIndex);
      const to = Math.max(anchorIndex, clickedIndex);
      const span = track.slice(from, to + 1).map((entry) => entry.id);
      return [...selected.filter((id) => !span.includes(id)), ...span];
    }
  }

  return [clip.id];
}

/** Index of the selected clip on this track nearest the clicked one. */
function nearestSelectedIndex(
  track: readonly TimelineClipData[],
  selected: readonly string[],
  clickedId: string,
): number {
  const clickedIndex = track.findIndex((entry) => entry.id === clickedId);
  let best = -1;
  let bestDistance = Number.POSITIVE_INFINITY;
  track.forEach((entry, index) => {
    if (entry.id === clickedId || !selected.includes(entry.id)) {
      return;
    }
    const distance = Math.abs(index - clickedIndex);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/** The time and track span a marquee covers. */
export type TimelineMarqueeRegion = {
  /** Earlier edge of the swept time range, in seconds. */
  fromTime: number;
  /** Later edge of the swept time range, in seconds. */
  toTime: number;
  /** Ids of every track the marquee touched. */
  trackIds: readonly string[];
};

/**
 * Every clip a marquee touches — overlap, not containment, so a sweep across
 * the middle of a long clip still catches it. `additive` unions with what was
 * already selected instead of replacing it.
 */
export function marqueeSelection(
  clips: readonly TimelineClipData[],
  region: TimelineMarqueeRegion,
  selected: readonly string[] = [],
  additive = false,
): string[] {
  const tracks = new Set(region.trackIds);
  const from = Math.min(region.fromTime, region.toTime);
  const to = Math.max(region.fromTime, region.toTime);
  const hits = clips
    .filter(
      (clip) =>
        tracks.has(clip.trackId) && clipEnd(clip) >= from && clip.start <= to,
    )
    .map((clip) => clip.id);
  if (!additive) {
    return hits;
  }
  return [...selected, ...hits.filter((id) => !selected.includes(id))];
}
