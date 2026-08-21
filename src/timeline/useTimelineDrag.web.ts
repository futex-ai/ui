/**
 * Pointer editing for the web timeline.
 *
 * The gesture starts from a **capture-phase** `pointerdown` on the document,
 * because react-native-web's `Pressable` calls `stopPropagation()` in its press
 * responder and a handler on the clip itself would never see the grab. A small
 * travel threshold separates a drag from a click, and a committed drag sets a
 * suppression flag so the clip's own `onPress` fires once and is swallowed.
 *
 * All of the *rules* live in `timelineEditModel`; this file only turns pointer
 * positions into the gestures those resolvers take, and reports the resulting
 * edit. Nothing here mutates clips — the timeline stays controlled.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  resolveMove,
  resolveRoll,
  resolveSlip,
  resolveSplit,
  resolveTrim,
  type TimelineSnapContext,
} from "./timelineEditModel";
import {
  clipGrabZone,
  isInsideLanes,
  type LanesNode,
  toContentPoint,
} from "./timelineDragDom";
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
import { marqueeSelection, resolveClipSelection } from "./timelineSelection";
import { snapCandidates, snapToleranceSeconds } from "./timelineSnap";
import { xToTime } from "./timelineTime";
import type { TimelineClipData, TimelineEdit } from "./timelineTypes";

/** Pixels the pointer must travel before a press becomes a drag. */
const DRAG_THRESHOLD = 4;
/** How close to a cut the pointer must be for the roll tool to take it, in px. */
const ROLL_TOLERANCE_PX = 12;

/** An in-flight pointer gesture. */
type Session = {
  kind: TimelineDragKind;
  /** Content-space origin of the grab. */
  originX: number;
  originY: number;
  /** Viewport origin, for the travel threshold. */
  startX: number;
  startY: number;
  moved: boolean;
  clipIds: readonly string[];
  /** The clip an edge/slip/roll gesture is acting on. */
  clip: TimelineClipData | null;
  /** The right-hand clip of a roll. */
  rightClip: TimelineClipData | null;
  snap: TimelineSnapContext | undefined;
  lastEdit: TimelineEdit | null;
  lastSelection: string[] | null;
};

export function useTimelineDrag(options: TimelineDragOptions): UseTimelineDrag {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const lanesRef = useRef<LanesNode>(null);
  const sessionRef = useRef<Session | null>(null);
  const detachRef = useRef<(() => void) | null>(null);
  const suppressRef = useRef(false);
  const [dragState, setDragState] =
    useState<TimelineDragState>(IDLE_DRAG_STATE);

  const buildSnap = useCallback(
    (excludeClipIds: readonly string[]): TimelineSnapContext | undefined => {
      const current = optionsRef.current;
      if (!current.snapping) {
        return undefined;
      }
      return {
        candidates: snapCandidates({
          clips: current.clips,
          duration: current.duration,
          excludeClipIds,
          markers: current.markers,
          playheadTime: current.playheadTime,
        }),
        tolerance: snapToleranceSeconds(current.pixelsPerSecond),
      };
    },
    [],
  );

  /** Resolves the gesture at the current pointer position into a preview. */
  const resolve = useCallback((session: Session, x: number, y: number) => {
    const current = optionsRef.current;
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
      const trackIds = current.layouts
        .filter((lane) => lane.top + lane.height >= top && lane.top <= bottom)
        .map((lane) => lane.trackId);
      session.lastSelection = marqueeSelection(current.clips, {
        fromTime: marquee.fromTime,
        toTime: marquee.toTime,
        trackIds,
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

    const result = (() => {
      if (session.kind === "move") {
        const lane = nearestTrackAtY(current.layouts, y);
        const originLane = nearestTrackAtY(current.layouts, session.originY);
        const deltaTrack =
          lane && originLane ? lane.index - originLane.index : 0;
        return resolveMove({
          clips: current.clips,
          deltaTime,
          deltaTrack,
          draggedIds: session.clipIds,
          fps: current.fps,
          lockedTrackIds: current.tracks
            .filter((track) => track.locked)
            .map((track) => track.id),
          ripple: current.ripple,
          snap: session.snap,
          trackOrder: current.layouts.map((lane_) => lane_.trackId),
        });
      }
      if (session.kind === "slip" && session.clip) {
        return {
          edit: resolveSlip({
            clip: session.clip,
            deltaTime,
            fps: current.fps,
          }),
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
    })();

    session.lastEdit = result.edit;
    setDragState({
      draggedIds: session.clipIds,
      kind: session.kind,
      marquee: null,
      preview: result.edit,
      snapTarget: result.snapTarget,
    });
  }, []);

  const finish = useCallback((commit: boolean) => {
    detachRef.current?.();
    detachRef.current = null;
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session || !session.moved) {
      return; // A plain click: leave the clip's own press to fire.
    }
    setDragState(IDLE_DRAG_STATE);
    suppressRef.current = true;
    if (!commit) {
      return;
    }
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

  const attach = useCallback(() => {
    if (typeof document === "undefined") {
      return;
    }
    const onMove = (event: PointerEvent) => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }
      if (!session.moved) {
        const travelled = Math.hypot(
          event.clientX - session.startX,
          event.clientY - session.startY,
        );
        if (travelled <= DRAG_THRESHOLD) {
          return;
        }
        session.moved = true;
      }
      const point = toContentPoint(
        lanesRef.current,
        event.clientX,
        event.clientY,
      );
      if (!point) {
        return;
      }
      event.preventDefault();
      resolve(session, point.x, point.y);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    document.addEventListener("pointermove", onMove, true);
    document.addEventListener("pointerup", onUp, true);
    document.addEventListener("pointercancel", onCancel, true);
    window.addEventListener("blur", onCancel);
    detachRef.current = () => {
      document.removeEventListener("pointermove", onMove, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("pointercancel", onCancel, true);
      window.removeEventListener("blur", onCancel);
    };
  }, [finish, resolve]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }
    const onPointerDown = (event: PointerEvent) => {
      suppressRef.current = false;
      const current = optionsRef.current;
      if (
        !current.enabled ||
        event.button !== 0 ||
        event.pointerType === "touch"
      ) {
        return;
      }
      if (!isInsideLanes(lanesRef.current, event.target)) {
        return;
      }
      const point = toContentPoint(
        lanesRef.current,
        event.clientX,
        event.clientY,
      );
      const lane = point ? nearestTrackAtY(current.layouts, point.y) : null;
      if (!point || !lane) {
        return;
      }
      const time = xToTime(point.x, current.pixelsPerSecond);
      const clip = clipAtTime(current.clips, lane.trackId, time);
      const trackLocked = current.tracks.some(
        (track) => track.id === lane.trackId && track.locked,
      );

      // The razor commits on the press itself: there is nothing to preview,
      // and requiring a drag to cut would be a strange thing to ask of it.
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

      // Selection resolves on the press, not the release: modifier keys are
      // only legible here, and a drag has to begin with the right clips already
      // in hand or shift-dragging a group would move just one of them.
      let selection: readonly string[] = current.selectedClipIds;
      const additive = event.metaKey || event.ctrlKey;
      if (clip) {
        selection = resolveClipSelection(
          current.selectedClipIds,
          clip,
          current.clips,
          {
            additive,
            range: event.shiftKey,
          },
        );
      } else if (!additive && !event.shiftKey) {
        selection = [];
      }
      if (!sameIds(selection, current.selectedClipIds)) {
        current.onSelectionChange?.([...selection]);
      }

      const session = startSession({
        clip,
        current,
        lane,
        point,
        selection,
        time,
        trackLocked,
      });
      if (!session) {
        return;
      }
      session.snap = buildSnap(session.clipIds);
      session.startX = event.clientX;
      session.startY = event.clientY;
      sessionRef.current = session;
      attach();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      detachRef.current?.();
    };
  }, [attach, buildSnap]);

  const consumePressSuppression = useCallback(() => {
    if (suppressRef.current) {
      suppressRef.current = false;
      return true;
    }
    return false;
  }, []);

  const bindLanes = useMemo(
    () => ({
      ref: (node: unknown) => {
        lanesRef.current = (node as LanesNode) ?? null;
      },
    }),
    [],
  );

  return {
    bindLanes,
    consumePressSuppression,
    dragState,
    selectsOnPress: false,
  };
}

/** Order-insensitive id-set comparison, to avoid redundant selection reports. */
function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

/** Chooses which gesture a grab begins, or `null` when it begins none. */
function startSession({
  clip,
  current,
  lane,
  point,
  selection,
  time,
  trackLocked,
}: {
  clip: TimelineClipData | null;
  current: TimelineDragOptions;
  lane: { index: number; trackId: string };
  point: { x: number; y: number };
  /** The selection as it stands *after* this press resolved it. */
  selection: readonly string[];
  time: number;
  trackLocked: boolean;
}): Session | null {
  const base: Omit<Session, "kind" | "clipIds"> = {
    clip,
    lastEdit: null,
    lastSelection: null,
    moved: false,
    originX: point.x,
    originY: point.y,
    rightClip: null,
    snap: undefined,
    startX: 0,
    startY: 0,
  };

  if (current.tool === "roll") {
    const pair = boundaryAtTime(
      current.clips,
      lane.trackId,
      time,
      xToTime(ROLL_TOLERANCE_PX, current.pixelsPerSecond),
    );
    return pair && !trackLocked
      ? {
          ...base,
          clip: pair.left,
          clipIds: [pair.left.id, pair.right.id],
          kind: "roll",
          rightClip: pair.right,
        }
      : null;
  }

  // An empty patch of lane sweeps a marquee, whatever the tool.
  if (!clip) {
    return { ...base, clipIds: [], kind: "marquee" };
  }
  if (trackLocked || clip.locked) {
    return null;
  }
  if (current.tool === "slip") {
    return { ...base, clipIds: [clip.id], kind: "slip" };
  }

  const rect = clipRect(clip, current.layouts, current.pixelsPerSecond);
  const zone = rect
    ? clipGrabZone(point.x, rect.left, rect.width, current.handleWidth)
    : "body";
  if (zone !== "body") {
    return {
      ...base,
      clipIds: [clip.id],
      kind: zone === "start" ? "trim-start" : "trim-end",
    };
  }
  // Dragging a clip that is part of the selection moves the whole selection.
  return {
    ...base,
    clipIds: selection.includes(clip.id) ? selection : [clip.id],
    kind: "move",
  };
}
