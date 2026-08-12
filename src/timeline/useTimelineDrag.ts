/**
 * Native counterpart of `useTimelineDrag.web.ts`.
 *
 * React Native has no document-level pointer stream, so touch editing is driven
 * by a `PanResponder` mounted on the lane stack instead: the responder owns the
 * gesture from the first touch, classifies it exactly as the web hook does, and
 * runs the same pure resolvers in `timelineEditModel`. Only the plumbing
 * differs — every rule is shared.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { PanResponder, type GestureResponderEvent } from "react-native";

import {
  resolveMove,
  resolveRoll,
  resolveSlip,
  resolveSplit,
  resolveTrim,
  type TimelineSnapContext,
} from "./timelineEditModel";
import { clipGrabZone } from "./timelineDragDom";
import {
  IDLE_DRAG_STATE,
  type TimelineDragKind,
  type TimelineDragOptions,
  type TimelineDragState,
  type UseTimelineDrag,
} from "./timelineDragTypes";
import {
  boundaryAtTime,
  clipAtTime,
  clipRect,
  nearestTrackAtY,
} from "./timelineLayout";
import { marqueeSelection } from "./timelineSelection";
import { snapCandidates, snapToleranceSeconds } from "./timelineSnap";
import { xToTime } from "./timelineTime";
import type { TimelineClipData, TimelineEdit } from "./timelineTypes";

/** Points a touch must travel before it becomes a drag rather than a tap. */
const TOUCH_THRESHOLD = 6;
/** How close to a cut a touch must land for the roll tool to take it, in px. */
const ROLL_TOLERANCE_PX = 20;

type Session = {
  kind: TimelineDragKind;
  originX: number;
  originY: number;
  clipIds: readonly string[];
  clip: TimelineClipData | null;
  rightClip: TimelineClipData | null;
  snap: TimelineSnapContext | undefined;
  lastEdit: TimelineEdit | null;
  lastSelection: string[] | null;
};

export function useTimelineDrag(options: TimelineDragOptions): UseTimelineDrag {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sessionRef = useRef<Session | null>(null);
  const suppressRef = useRef(false);
  const [dragState, setDragState] =
    useState<TimelineDragState>(IDLE_DRAG_STATE);

  const begin = useCallback((x: number, y: number) => {
    const current = optionsRef.current;
    const lane = nearestTrackAtY(current.layouts, y);
    if (!current.enabled || !lane) {
      return;
    }
    const time = xToTime(x, current.pixelsPerSecond);
    const clip = clipAtTime(current.clips, lane.trackId, time);
    const trackLocked = current.tracks.some(
      (track) => track.id === lane.trackId && track.locked,
    );

    if (current.tool === "razor") {
      if (clip && !trackLocked) {
        const edit = resolveSplit(clip, time, current.fps);
        if (edit) {
          suppressRef.current = true;
          current.onEdit?.(edit);
        }
      }
      return;
    }

    const kind = classify({ clip, current, lane, trackLocked, x, time });
    if (!kind) {
      return;
    }
    sessionRef.current = {
      clip: kind.clip,
      clipIds: kind.clipIds,
      kind: kind.kind,
      lastEdit: null,
      lastSelection: null,
      originX: x,
      originY: y,
      rightClip: kind.rightClip,
      snap: current.snapping
        ? {
            candidates: snapCandidates({
              clips: current.clips,
              duration: current.duration,
              excludeClipIds: kind.clipIds,
              markers: current.markers,
              playheadTime: current.playheadTime,
            }),
            tolerance: snapToleranceSeconds(current.pixelsPerSecond),
          }
        : undefined,
    };
  }, []);

  const update = useCallback((x: number, y: number) => {
    const session = sessionRef.current;
    const current = optionsRef.current;
    if (!session) {
      return;
    }
    const deltaTime = xToTime(x - session.originX, current.pixelsPerSecond);

    if (session.kind === "marquee") {
      const marquee = {
        fromTime: xToTime(session.originX, current.pixelsPerSecond),
        fromY: session.originY,
        toTime: xToTime(x, current.pixelsPerSecond),
        toY: y,
      };
      const top = Math.min(marquee.fromY, marquee.toY);
      const bottom = Math.max(marquee.fromY, marquee.toY);
      session.lastSelection = marqueeSelection(current.clips, {
        fromTime: marquee.fromTime,
        toTime: marquee.toTime,
        trackIds: current.layouts
          .filter((lane) => lane.top + lane.height >= top && lane.top <= bottom)
          .map((lane) => lane.trackId),
      });
      setDragState({
        draggedIds: session.lastSelection,
        kind: "marquee",
        marquee,
        preview: null,
        snapTarget: null,
      });
      return;
    }

    const result = resolveForKind(session, current, deltaTime, y);
    session.lastEdit = result.edit;
    setDragState({
      draggedIds: session.clipIds,
      kind: session.kind,
      marquee: null,
      preview: result.edit,
      snapTarget: result.snapTarget,
    });
  }, []);

  const end = useCallback((commit: boolean) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    setDragState(IDLE_DRAG_STATE);
    if (!session || !commit) {
      return;
    }
    suppressRef.current = true;
    if (session.kind === "marquee") {
      if (session.lastSelection) {
        optionsRef.current.onSelectionChange?.(session.lastSelection);
      }
      return;
    }
    if (session.lastEdit) {
      optionsRef.current.onEdit?.(session.lastEdit);
    }
  }, []);

  const responder = useMemo(
    () =>
      PanResponder.create({
        // Claim the gesture only once the touch has actually travelled, so a
        // tap still reaches the clip's own press handler underneath.
        onMoveShouldSetPanResponder: (_event, gesture) =>
          optionsRef.current.enabled &&
          Math.hypot(gesture.dx, gesture.dy) > TOUCH_THRESHOLD,
        onPanResponderGrant: (event: GestureResponderEvent) =>
          begin(event.nativeEvent.locationX, event.nativeEvent.locationY),
        onPanResponderMove: (event: GestureResponderEvent) =>
          update(event.nativeEvent.locationX, event.nativeEvent.locationY),
        onPanResponderRelease: () => end(true),
        onPanResponderTerminate: () => end(false),
      }),
    [begin, end, update],
  );

  const consumePressSuppression = useCallback(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return true;
    }
    return false;
  }, []);

  const bindLanes = useMemo(
    () => ({ ref: () => undefined, ...responder.panHandlers }),
    [responder],
  );

  return {
    bindLanes,
    consumePressSuppression,
    dragState,
    selectsOnPress: true,
  };
}

/** The shared resolver switch, minus the marquee (handled by the caller). */
function resolveForKind(
  session: Session,
  current: TimelineDragOptions,
  deltaTime: number,
  y: number,
) {
  if (session.kind === "move") {
    const lane = nearestTrackAtY(current.layouts, y);
    const originLane = nearestTrackAtY(current.layouts, session.originY);
    return resolveMove({
      clips: current.clips,
      deltaTime,
      deltaTrack: lane && originLane ? lane.index - originLane.index : 0,
      draggedIds: session.clipIds,
      fps: current.fps,
      lockedTrackIds: current.tracks
        .filter((track) => track.locked)
        .map((track) => track.id),
      ripple: current.ripple,
      snap: session.snap,
      trackOrder: current.layouts.map((entry) => entry.trackId),
    });
  }
  if (session.kind === "slip" && session.clip) {
    return {
      edit: resolveSlip({ clip: session.clip, deltaTime, fps: current.fps }),
      snapTarget: null,
    };
  }
  if (session.kind === "roll" && session.clip && session.rightClip) {
    return resolveRoll({
      deltaTime,
      fps: current.fps,
      left: session.clip,
      right: session.rightClip,
      snap: session.snap,
    });
  }
  if (session.clip) {
    return resolveTrim({
      clip: session.clip,
      deltaTime,
      edge: session.kind === "trim-start" ? "start" : "end",
      fps: current.fps,
      ripple: current.ripple,
      snap: session.snap,
    });
  }
  return { edit: null, snapTarget: null };
}

/** Which gesture a touch begins, mirroring the web hook's `startSession`. */
function classify({
  clip,
  current,
  lane,
  trackLocked,
  x,
  time,
}: {
  clip: TimelineClipData | null;
  current: TimelineDragOptions;
  lane: { index: number; trackId: string };
  trackLocked: boolean;
  x: number;
  time: number;
}): {
  clip: TimelineClipData | null;
  clipIds: readonly string[];
  kind: TimelineDragKind;
  rightClip: TimelineClipData | null;
} | null {
  if (current.tool === "roll") {
    const pair = boundaryAtTime(
      current.clips,
      lane.trackId,
      time,
      xToTime(ROLL_TOLERANCE_PX, current.pixelsPerSecond),
    );
    return pair && !trackLocked
      ? {
          clip: pair.left,
          clipIds: [pair.left.id, pair.right.id],
          kind: "roll",
          rightClip: pair.right,
        }
      : null;
  }
  if (!clip) {
    return { clip: null, clipIds: [], kind: "marquee", rightClip: null };
  }
  if (trackLocked || clip.locked) {
    return null;
  }
  if (current.tool === "slip") {
    return { clip, clipIds: [clip.id], kind: "slip", rightClip: null };
  }
  const rect = clipRect(clip, current.layouts, current.pixelsPerSecond);
  // Touch targets are larger than pointer ones, so the edge zone is widened.
  const zone = rect
    ? clipGrabZone(x, rect.left, rect.width, current.handleWidth * 1.6)
    : "body";
  if (zone !== "body") {
    return {
      clip,
      clipIds: [clip.id],
      kind: zone === "start" ? "trim-start" : "trim-end",
      rightClip: null,
    };
  }
  return {
    clip,
    clipIds: current.selectedClipIds.includes(clip.id)
      ? current.selectedClipIds
      : [clip.id],
    kind: "move",
    rightClip: null,
  };
}
