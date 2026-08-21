/**
 * Geometry for the timeline: where each track lane sits vertically, where each
 * clip sits horizontally, and which clips are worth rendering at the current
 * scroll offset. Pure and `react-native`-free.
 */
import {
  clipEnd,
  type TimelineClipData,
  type TimelineTrack,
} from "./timelineTypes";
import { timeToX } from "./timelineTime";

/** A track's resolved vertical slot. */
export type TimelineTrackLayout = {
  /** Lane height in px. */
  height: number;
  /** Position in the visible track order. */
  index: number;
  /** Offset from the top of the lane stack, in px. */
  top: number;
  trackId: string;
};

/**
 * Stacks tracks into lanes, honouring each track's `height` override and the
 * gap between lanes. Hidden tracks keep their slot — hiding a video track dims
 * it rather than collapsing the board under it, which is what an editor does.
 */
export function trackLayouts(
  tracks: readonly TimelineTrack[],
  defaultHeight: number,
  gap = 0,
): TimelineTrackLayout[] {
  const layouts: TimelineTrackLayout[] = [];
  let top = 0;
  tracks.forEach((track, index) => {
    const height = track.height ?? defaultHeight;
    layouts.push({ height, index, top, trackId: track.id });
    top += height + gap;
  });
  return layouts;
}

/** Total height of the stacked lanes, excluding the trailing gap. */
export function tracksHeight(layouts: readonly TimelineTrackLayout[]): number {
  if (layouts.length === 0) {
    return 0;
  }
  const last = layouts[layouts.length - 1];
  return last.top + last.height;
}

/** The lane containing `y`, or `null` above/below the stack. */
export function trackAtY(
  layouts: readonly TimelineTrackLayout[],
  y: number,
): TimelineTrackLayout | null {
  for (const layout of layouts) {
    if (y >= layout.top && y < layout.top + layout.height) {
      return layout;
    }
  }
  return null;
}

/**
 * The lane nearest `y`, clamped to the ends of the stack. Used while dragging,
 * where the pointer can stray past the first or last lane and the clip should
 * still land somewhere sensible rather than nowhere.
 */
export function nearestTrackAtY(
  layouts: readonly TimelineTrackLayout[],
  y: number,
): TimelineTrackLayout | null {
  if (layouts.length === 0) {
    return null;
  }
  const hit = trackAtY(layouts, y);
  if (hit) {
    return hit;
  }
  return y < layouts[0].top ? layouts[0] : layouts[layouts.length - 1];
}

/** A clip's box in the lane stack's coordinate space. */
export type TimelineClipRect = {
  clipId: string;
  height: number;
  left: number;
  top: number;
  width: number;
};

/**
 * Places a clip. Returns `null` when the clip references a track that is not in
 * the layout, so a stale `trackId` renders nothing instead of throwing.
 */
export function clipRect(
  clip: TimelineClipData,
  layouts: readonly TimelineTrackLayout[],
  pixelsPerSecond: number,
): TimelineClipRect | null {
  const layout = layouts.find((entry) => entry.trackId === clip.trackId);
  if (!layout) {
    return null;
  }
  return {
    clipId: clip.id,
    height: layout.height,
    left: timeToX(clip.start, pixelsPerSecond),
    top: layout.top,
    // A sub-pixel clip would vanish; keep a hairline so it stays selectable.
    width: Math.max(1, timeToX(clip.duration, pixelsPerSecond)),
  };
}

/**
 * Clips overlapping `[viewStart, viewEnd]`. A long project is mostly off-screen
 * at any zoom, so culling to the visible window keeps the rendered node count
 * proportional to the viewport rather than to the project.
 */
export function visibleClips(
  clips: readonly TimelineClipData[],
  viewStart: number,
  viewEnd: number,
): TimelineClipData[] {
  return clips.filter(
    (clip) => clipEnd(clip) >= viewStart && clip.start <= viewEnd,
  );
}

/**
 * Width of the scrollable content: the longer of the declared duration and the
 * last clip's end, plus a trailing runway so there is always somewhere to drag
 * a clip to.
 */
export function contentWidth(
  clips: readonly TimelineClipData[],
  duration: number,
  pixelsPerSecond: number,
  trailingSeconds = 0,
): number {
  let end = duration;
  for (const clip of clips) {
    end = Math.max(end, clipEnd(clip));
  }
  return Math.max(0, timeToX(end + trailingSeconds, pixelsPerSecond));
}

/** A track's clips in timeline order. */
export function clipsOnTrack(
  clips: readonly TimelineClipData[],
  trackId: string,
): TimelineClipData[] {
  return clips
    .filter((clip) => clip.trackId === trackId)
    .sort((a, b) => a.start - b.start);
}

/**
 * The clip covering `time` on `trackId`, or `null` in a gap. The end is
 * exclusive so a razor exactly on a boundary cuts the clip that starts there
 * rather than the one that just ended.
 */
export function clipAtTime(
  clips: readonly TimelineClipData[],
  trackId: string,
  time: number,
): TimelineClipData | null {
  for (const clip of clips) {
    if (
      clip.trackId === trackId &&
      time >= clip.start &&
      time < clipEnd(clip)
    ) {
      return clip;
    }
  }
  return null;
}

/**
 * The pair of clips meeting at the boundary nearest `time` on a track, within
 * `tolerance` seconds — the target of a roll edit. Returns `null` unless two
 * clips actually touch there.
 */
export function boundaryAtTime(
  clips: readonly TimelineClipData[],
  trackId: string,
  time: number,
  tolerance: number,
): {
  boundary: number;
  left: TimelineClipData;
  right: TimelineClipData;
} | null {
  const ordered = clipsOnTrack(clips, trackId);
  for (let index = 0; index < ordered.length - 1; index += 1) {
    const left = ordered[index];
    const right = ordered[index + 1];
    const boundary = clipEnd(left);
    if (
      Math.abs(boundary - right.start) <= 1e-6 &&
      Math.abs(time - boundary) <= tolerance
    ) {
      return { boundary, left, right };
    }
  }
  return null;
}
