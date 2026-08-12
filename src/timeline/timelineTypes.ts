/**
 * The timeline's data and edit vocabulary.
 *
 * Everything here is plain data with no `react-native` imports, so the pure
 * model modules that build on it (`timelineTime`, `timelineLayout`,
 * `timelineSnap`, `timelineEditModel`, `timelineSelection`) stay directly
 * testable under `node --test`.
 *
 * Time is **seconds** everywhere in the public API. `fps` exists only to
 * quantize positions onto frame boundaries and to format timecode for display,
 * so a consumer never has to think in frames unless it wants to.
 */

/** What a track carries. Drives the header icon and the default clip tone. */
export type TimelineTrackKind = "audio" | "effect" | "title" | "video";

/**
 * Clip tone vocabulary, sharing the badge's four-tone palette so a timeline
 * reads as part of the same system. Tone is carried by a tinted fill, a uniform
 * border, and the label color — never by an edge bar.
 */
export type TimelineClipTone = "amber" | "neutral" | "primary" | "rose";

/**
 * The active pointer tool.
 *
 * - `select` drags clips and trims their edges.
 * - `razor` splits the clip under the pointer.
 * - `slip` slides a clip's source window without moving it on the timeline.
 * - `roll` drags the shared boundary between two adjacent clips.
 */
export type TimelineTool = "razor" | "roll" | "select" | "slip";

export type TimelineTrack = {
  /** Stable identity; clips reference it via `trackId`. */
  id: string;
  /** Header label. */
  name: string;
  /** Drives the header icon and the default tone of clips on the track. */
  kind: TimelineTrackKind;
  /** Lane height in px. Defaults to the `size` scale's track height. */
  height?: number;
  /** Dim the lane and hide it from the program output. */
  hidden?: boolean;
  /** Bar edits: clips on the track cannot be moved, trimmed, or removed. */
  locked?: boolean;
  /**
   * Collapse gaps on this track after an edit, so clips stay butted together
   * (the "magnetic" timeline). Applied by {@link applyTimelineEdits}.
   */
  magnetic?: boolean;
  /** Audio muted. Presentational — the library plays nothing. */
  muted?: boolean;
  /** Audio soloed. Presentational. */
  soloed?: boolean;
};

export type TimelineClipData = {
  /** Stable identity. */
  id: string;
  /** The track this clip sits on. */
  trackId: string;
  /** Position of the clip's first frame on the timeline, in seconds. */
  start: number;
  /** Length on the timeline, in seconds. */
  duration: number;
  /** Primary label drawn in the clip. */
  label: string;
  /** Overrides the tone the clip would inherit from its track kind. */
  tone?: TimelineClipTone;
  /**
   * Offset into the source media of the clip's first frame, in seconds.
   * Defaults to `0`. Trimming the head advances it; slipping changes it alone.
   */
  sourceIn?: number;
  /**
   * Total length of the source media, in seconds. When set it bounds trimming
   * and slipping, so a clip can never expose media that does not exist.
   */
  sourceDuration?: number;
  /**
   * Normalised `0..1` audio peaks sampled evenly across the **whole source**,
   * so trimming reveals a different window of the same array. Supplied by the
   * consumer; nothing here decodes audio.
   */
  peaks?: readonly number[];
  /**
   * Filmstrip frame URIs sampled evenly across the whole source, following the
   * same windowing rule as `peaks`.
   */
  thumbnails?: readonly string[];
  /** Bar edits for this clip alone. */
  locked?: boolean;
};

/** A named point on the ruler. Markers are snap targets. */
export type TimelineMarker = {
  id: string;
  label?: string;
  /** Position in seconds. */
  time: number;
  tone?: TimelineClipTone;
};

/** Where one clip lands after a move. */
export type TimelineClipPlacement = {
  clipId: string;
  /** New timeline position of the clip's first frame, in seconds. */
  start: number;
  /** Track the clip lands on — may differ from the one it came from. */
  trackId: string;
};

/** Clips moved to new positions, optionally rippling the clips downstream. */
export type TimelineMoveEdit = {
  type: "move";
  placements: readonly TimelineClipPlacement[];
  /** Shift later clips on each touched track by the same delta. */
  ripple?: boolean;
};

/** One clip's edge dragged, changing its length and source window. */
export type TimelineTrimEdit = {
  type: "trim";
  clipId: string;
  /** Which edge moved. */
  edge: "end" | "start";
  /** Resulting length, in seconds. */
  duration: number;
  /** Close or open the gap the trim leaves by shifting later clips. */
  ripple?: boolean;
  /** Resulting offset into the source, in seconds. */
  sourceIn: number;
  /** Resulting timeline position, in seconds. */
  start: number;
};

/** A clip's source window slid without moving the clip on the timeline. */
export type TimelineSlipEdit = {
  type: "slip";
  clipId: string;
  /** Resulting offset into the source, in seconds. */
  sourceIn: number;
};

/**
 * The shared boundary between two adjacent clips moved: the left clip's tail
 * and the right clip's head change by equal and opposite amounts, so the pair
 * occupies exactly the same span afterwards.
 */
export type TimelineRollEdit = {
  type: "roll";
  /** New timeline position of the boundary, in seconds. */
  boundary: number;
  leftClipId: string;
  rightClipId: string;
};

/** A razor cut, producing two clips that together fill the original span. */
export type TimelineSplitEdit = {
  type: "split";
  /** Cut position on the timeline, in seconds. */
  at: number;
  clipId: string;
};

/** Clips deleted, optionally closing the gap they leave behind. */
export type TimelineRemoveEdit = {
  type: "remove";
  clipIds: readonly string[];
  /** Pull later clips on each touched track back over the gap. */
  ripple?: boolean;
};

/**
 * The result of one gesture, described as an outcome rather than an intent so a
 * consumer can apply it without re-deriving anything. {@link applyTimelineEdits}
 * is the canonical reducer.
 */
export type TimelineEdit =
  | TimelineMoveEdit
  | TimelineRemoveEdit
  | TimelineRollEdit
  | TimelineSlipEdit
  | TimelineSplitEdit
  | TimelineTrimEdit;

/** The end of a clip on the timeline, in seconds. */
export function clipEnd(clip: TimelineClipData): number {
  return clip.start + clip.duration;
}

/** A clip's source offset, defaulting to the head of the media. */
export function clipSourceIn(clip: TimelineClipData): number {
  return clip.sourceIn ?? 0;
}
