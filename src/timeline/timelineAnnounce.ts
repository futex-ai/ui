/**
 * Spoken descriptions of a committed edit.
 *
 * An edit that only shows up as clips shifting on screen is invisible to a
 * screen-reader user, so every one is narrated through the shared `announce`
 * live region (WCAG 2.1 — 4.1.3 Status Messages, AA). Building the sentences
 * here keeps them pure and testable, and keeps the wording consistent between
 * the pointer, the touch, and the keyboard paths.
 */
import { formatClock, formatTimecode } from "./timelineTime";
import {
  clipEnd,
  type TimelineClipData,
  type TimelineEdit,
  type TimelineTrack,
} from "./timelineTypes";

/** Everything the sentences need to name what moved and where it went. */
export type TimelineAnnounceContext = {
  clips: readonly TimelineClipData[];
  tracks: readonly TimelineTrack[];
  fps: number;
};

function labelOf(context: TimelineAnnounceContext, clipId: string): string {
  return context.clips.find((clip) => clip.id === clipId)?.label ?? "Clip";
}

function trackNameOf(
  context: TimelineAnnounceContext,
  trackId: string,
): string {
  return context.tracks.find((track) => track.id === trackId)?.name ?? trackId;
}

/**
 * A sentence describing what an edit did, or `null` for an edit with nothing
 * worth saying (an empty removal). Positions are spoken as timecode and lengths
 * as a clock duration, matching what the clips themselves publish.
 */
export function describeTimelineEdit(
  edit: TimelineEdit,
  context: TimelineAnnounceContext,
): string | null {
  switch (edit.type) {
    case "move": {
      if (edit.placements.length === 0) {
        return null;
      }
      if (edit.placements.length === 1) {
        const [placement] = edit.placements;
        const clip = context.clips.find(
          (entry) => entry.id === placement.clipId,
        );
        const moved =
          clip && clip.trackId !== placement.trackId
            ? ` on ${trackNameOf(context, placement.trackId)}`
            : "";
        return `Moved ${labelOf(context, placement.clipId)} to ${formatTimecode(
          placement.start,
          context.fps,
        )}${moved}.`;
      }
      const earliest = Math.min(
        ...edit.placements.map((placement) => placement.start),
      );
      return `Moved ${edit.placements.length} clips to ${formatTimecode(
        earliest,
        context.fps,
      )}.`;
    }
    case "trim": {
      const edge = edit.edge === "start" ? "head" : "tail";
      return `Trimmed the ${edge} of ${labelOf(context, edit.clipId)}. Now ${formatTimecode(
        edit.start,
        context.fps,
      )} to ${formatTimecode(edit.start + edit.duration, context.fps)}, ${formatClock(
        edit.duration,
      )} long.`;
    }
    case "slip":
      return `Slipped ${labelOf(context, edit.clipId)} to source ${formatTimecode(
        edit.sourceIn,
        context.fps,
      )}.`;
    case "roll":
      return `Rolled the cut between ${labelOf(
        context,
        edit.leftClipId,
      )} and ${labelOf(context, edit.rightClipId)} to ${formatTimecode(
        edit.boundary,
        context.fps,
      )}.`;
    case "split":
      return `Split ${labelOf(context, edit.clipId)} at ${formatTimecode(
        edit.at,
        context.fps,
      )}.`;
    case "remove": {
      if (edit.clipIds.length === 0) {
        return null;
      }
      return edit.clipIds.length === 1
        ? `Removed ${labelOf(context, edit.clipIds[0])}.`
        : `Removed ${edit.clipIds.length} clips.`;
    }
    default:
      return null;
  }
}

/**
 * The sentence spoken when an editing key could not do anything — silence would
 * read as the key not being handled at all.
 */
export function describeRefusedEdit(
  clip: TimelineClipData | null,
  reason: "locked" | "no-selection" | "playhead-outside",
): string {
  switch (reason) {
    case "locked":
      return `${clip?.label ?? "That clip"} is locked.`;
    case "playhead-outside":
      return `The playhead is not over ${clip?.label ?? "a clip"}.`;
    default:
      return "Select a clip first.";
  }
}

/** Whether the playhead sits inside a clip, so a split has somewhere to cut. */
export function playheadInsideClip(
  clip: TimelineClipData,
  playheadTime: number,
): boolean {
  return playheadTime > clip.start && playheadTime < clipEnd(clip);
}
