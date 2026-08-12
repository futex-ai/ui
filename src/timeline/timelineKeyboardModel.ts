/**
 * Keyboard model for the timeline.
 *
 * The lanes are a single Tab stop with a roving focus, the way every other
 * composite widget in the library works (WCAG 2.1 — 2.1.1 Keyboard, A; 2.4.3
 * Focus Order, A). Arrow keys walk clips in two dimensions: along a track by
 * time, and across tracks to whichever clip is nearest in time. Resolution is
 * pure so it can be unit tested without a DOM.
 */
import { clipsOnTrack, type TimelineTrackLayout } from "./timelineLayout";
import { clipEnd, type TimelineClipData } from "./timelineTypes";

/** The clip a navigation key should move focus to, or `null` to ignore it. */
export function nextFocusedClipId(
  key: string,
  currentClipId: string | null,
  clips: readonly TimelineClipData[],
  trackOrder: readonly string[],
): string | null {
  if (clips.length === 0) {
    return null;
  }
  const current = clips.find((clip) => clip.id === currentClipId) ?? null;
  if (!current) {
    // Nothing focused yet: any navigation key adopts the earliest clip.
    return key.startsWith("Arrow") || key === "Home" || key === "End"
      ? [...clips].sort((a, b) => a.start - b.start)[0].id
      : null;
  }

  const sameTrack = clipsOnTrack(clips, current.trackId);
  const index = sameTrack.findIndex((clip) => clip.id === current.id);

  switch (key) {
    case "ArrowRight":
      return index >= 0 && index < sameTrack.length - 1
        ? sameTrack[index + 1].id
        : null;
    case "ArrowLeft":
      return index > 0 ? sameTrack[index - 1].id : null;
    case "Home":
      return sameTrack.length > 0 ? sameTrack[0].id : null;
    case "End":
      return sameTrack.length > 0 ? sameTrack[sameTrack.length - 1].id : null;
    case "ArrowDown":
    case "ArrowUp":
      return nearestOnAdjacentTrack(
        current,
        clips,
        trackOrder,
        key === "ArrowDown" ? 1 : -1,
      );
    default:
      return null;
  }
}

/**
 * Walks outward from the current track in `direction` until a track with clips
 * is found, then picks the clip whose span is closest to the current clip's
 * start — so moving between tracks lands where the eye expects rather than at
 * the start of the lane.
 */
function nearestOnAdjacentTrack(
  current: TimelineClipData,
  clips: readonly TimelineClipData[],
  trackOrder: readonly string[],
  direction: 1 | -1,
): string | null {
  const from = trackOrder.indexOf(current.trackId);
  if (from < 0) {
    return null;
  }
  for (
    let index = from + direction;
    index >= 0 && index < trackOrder.length;
    index += direction
  ) {
    const candidates = clipsOnTrack(clips, trackOrder[index]);
    if (candidates.length === 0) {
      continue;
    }
    let best = candidates[0];
    let bestDistance = distanceToSpan(current.start, best);
    for (const candidate of candidates) {
      const distance = distanceToSpan(current.start, candidate);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    return best.id;
  }
  return null;
}

/** Zero while `time` is inside the clip, otherwise the gap to its nearer edge. */
function distanceToSpan(time: number, clip: TimelineClipData): number {
  if (time < clip.start) {
    return clip.start - time;
  }
  const end = clipEnd(clip);
  return time > end ? time - end : 0;
}

/** Track ids in render order, for the two-dimensional walk above. */
export function trackOrderOf(
  layouts: readonly TimelineTrackLayout[],
): string[] {
  return layouts.map((layout) => layout.trackId);
}
