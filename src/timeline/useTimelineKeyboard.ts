/**
 * Keyboard editing for the timeline.
 *
 * A pointer is not the only way to cut a sequence, and a timeline that can only
 * be edited by dragging is unusable with a keyboard or a screen reader (WCAG
 * 2.1 — 2.1.1 Keyboard, A). This hook turns an editing key press into the same
 * {@link TimelineEdit} a drag would produce, by running the same resolvers, and
 * narrates the result through the shared live region (4.1.3 Status Messages,
 * AA).
 */
import { useCallback } from "react";

import { announce } from "../announcer";

import {
  describeRefusedEdit,
  describeTimelineEdit,
  playheadInsideClip,
} from "./timelineAnnounce";
import { resolveMove, resolveSplit, resolveTrim } from "./timelineEditModel";
import {
  keyToEditIntent,
  type TimelineKeyModifiers,
} from "./timelineKeyboardModel";
import type {
  TimelineClipData,
  TimelineEdit,
  TimelineTrack,
} from "./timelineTypes";

export type TimelineKeyboardOptions = {
  clips: readonly TimelineClipData[];
  tracks: readonly TimelineTrack[];
  /** Track ids in lane order, for the move resolver. */
  trackOrder: readonly string[];
  selectedClipIds: readonly string[];
  /** The clip the roving focus is on — the target of a trim or a split. */
  focusedClipId: string | null;
  playheadTime: number;
  fps: number;
  ripple: boolean;
  onEdit?: (edit: TimelineEdit) => void;
};

export type TimelineKeyboardResult = {
  /**
   * Handles an editing key. Returns `true` when the key was an editing key —
   * whether or not it produced an edit — so the caller stops before falling
   * through to focus navigation.
   */
  handleEditKey: (key: string, modifiers: TimelineKeyModifiers) => boolean;
};

export function useTimelineKeyboard(
  options: TimelineKeyboardOptions,
): TimelineKeyboardResult {
  const {
    clips,
    focusedClipId,
    fps,
    onEdit,
    playheadTime,
    ripple,
    selectedClipIds,
    trackOrder,
    tracks,
  } = options;

  const commit = useCallback(
    (edit: TimelineEdit | null) => {
      if (!edit) {
        return;
      }
      onEdit?.(edit);
      const sentence = describeTimelineEdit(edit, { clips, fps, tracks });
      if (sentence) {
        announce(sentence);
      }
    },
    [clips, fps, onEdit, tracks],
  );

  const handleEditKey = useCallback(
    (key: string, modifiers: TimelineKeyModifiers): boolean => {
      const intent = keyToEditIntent(key, modifiers, fps);
      if (!intent || !onEdit) {
        return false;
      }
      const focused = clips.find((clip) => clip.id === focusedClipId) ?? null;
      // Group edits follow the same rule as a drag: the focused clip carries the
      // whole selection when it belongs to it, and acts alone when it does not.
      // Without this, arrowing focus onto a clip and pressing Delete would
      // silently delete a different clip — whichever was still selected.
      const selection = focused
        ? selectedClipIds.includes(focused.id)
          ? selectedClipIds
          : [focused.id]
        : selectedClipIds;

      switch (intent.type) {
        case "nudge": {
          if (selection.length === 0) {
            announce(describeRefusedEdit(null, "no-selection"));
            return true;
          }
          commit(
            resolveMove({
              clips,
              deltaTime: intent.deltaTime,
              deltaTrack: 0,
              draggedIds: selection,
              fps,
              lockedTrackIds: tracks
                .filter((track) => track.locked)
                .map((track) => track.id),
              ripple,
              trackOrder,
            }).edit,
          );
          return true;
        }
        case "trim": {
          if (!focused) {
            announce(describeRefusedEdit(null, "no-selection"));
            return true;
          }
          if (focused.locked) {
            announce(describeRefusedEdit(focused, "locked"));
            return true;
          }
          commit(
            resolveTrim({
              clip: focused,
              deltaTime: intent.deltaTime,
              edge: intent.edge,
              fps,
              ripple,
            }).edit,
          );
          return true;
        }
        case "split": {
          if (!focused) {
            announce(describeRefusedEdit(null, "no-selection"));
            return true;
          }
          if (!playheadInsideClip(focused, playheadTime)) {
            announce(describeRefusedEdit(focused, "playhead-outside"));
            return true;
          }
          commit(resolveSplit(focused, playheadTime, fps));
          return true;
        }
        default: {
          if (selection.length === 0) {
            announce(describeRefusedEdit(null, "no-selection"));
            return true;
          }
          const removable = selection.filter((id) => {
            const clip = clips.find((entry) => entry.id === id);
            return (
              clip &&
              !clip.locked &&
              !tracks.some((track) => track.id === clip.trackId && track.locked)
            );
          });
          commit(
            removable.length > 0
              ? { clipIds: removable, ripple, type: "remove" }
              : null,
          );
          if (removable.length === 0) {
            announce(describeRefusedEdit(focused, "locked"));
          }
          return true;
        }
      }
    },
    [
      clips,
      commit,
      focusedClipId,
      fps,
      onEdit,
      playheadTime,
      ripple,
      selectedClipIds,
      trackOrder,
      tracks,
    ],
  );

  return { handleEditKey };
}
