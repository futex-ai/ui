/**
 * The contract between {@link Timeline} and its two drag implementations
 * (`useTimelineDrag.web.ts` for the pointer, `useTimelineDrag.ts` for native
 * touch). Keeping the types here means the platform files cannot drift apart,
 * and the component depends on neither of them directly.
 */
import type { TimelineTrackLayout } from "./timelineLayout";
import type {
  TimelineClipData,
  TimelineEdit,
  TimelineMarker,
  TimelineTool,
  TimelineTrack,
} from "./timelineTypes";

/** What the current gesture is doing. */
export type TimelineDragKind =
  | "marquee"
  | "move"
  | "roll"
  | "slip"
  | "trim-end"
  | "trim-start";

/** The marquee's swept region, in content coordinates. */
export type TimelineMarqueeRect = {
  fromTime: number;
  fromY: number;
  toTime: number;
  toY: number;
};

/**
 * The live state of a gesture. `preview` is the edit the gesture *would*
 * commit; the timeline runs it through `applyTimelineEdits` to render exactly
 * what the drop will produce, so there is no separate ghost representation that
 * could disagree with the result.
 */
export type TimelineDragState = {
  kind: TimelineDragKind | null;
  preview: TimelineEdit | null;
  /** Time to draw the snap indicator at, when an edge caught one. */
  snapTarget: number | null;
  marquee: TimelineMarqueeRect | null;
  draggedIds: readonly string[];
};

/** The idle state, shared so identity never churns between renders. */
export const IDLE_DRAG_STATE: TimelineDragState = Object.freeze({
  draggedIds: Object.freeze([]) as readonly string[],
  kind: null,
  marquee: null,
  preview: null,
  snapTarget: null,
});

export type TimelineDragOptions = {
  /** Drags are off entirely without an `onEdit` handler. */
  enabled: boolean;
  clips: readonly TimelineClipData[];
  tracks: readonly TimelineTrack[];
  layouts: readonly TimelineTrackLayout[];
  markers: readonly TimelineMarker[];
  duration: number;
  playheadTime: number;
  pixelsPerSecond: number;
  fps: number;
  tool: TimelineTool;
  selectedClipIds: readonly string[];
  /** Push later clips aside instead of overlapping them. */
  ripple: boolean;
  /** Snap to clip edges, markers, the playhead, zero, and the project end. */
  snapping: boolean;
  /** Width of the grab zone at each clip edge, in px. */
  handleWidth: number;
  onEdit?: (edit: TimelineEdit) => void;
  onSelectionChange?: (clipIds: string[]) => void;
};

export type UseTimelineDrag = {
  /** Spread onto the lane stack so the drag can measure it. */
  bindLanes: { ref: (node: unknown) => void };
  dragState: TimelineDragState;
  /**
   * Whether the timeline should resolve selection in the clip's `onPress`.
   *
   * `false` on web: the pointer stream is the only place modifier keys are
   * legible, so the drag hook selects on `pointerdown` — which is also when an
   * editor should select, so a drag begins with the right clips in hand. `true`
   * on native, where a tap is the whole story.
   */
  selectsOnPress: boolean;
  /**
   * `true` once, immediately after a committed drag, so the clip's own press
   * handler can swallow the click the drag produced.
   */
  consumePressSuppression: () => boolean;
};
