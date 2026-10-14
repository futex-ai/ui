/**
 * One drag-select gesture, from the accepted press to the release or a
 * cancel. The session owns the rules of the gesture: the threshold, the
 * anchored start point, the measurements, the text-selection block, the
 * commit, and the swallowed click. It reaches the DOM only through `DragSelectableSessionEnv`, so unit
 * tests drive it with fakes.
 */
import {
  dragSelectableBoundsForBox,
  dragSelectableBox,
  hasDragSelectableMoved,
  type DragSelectableBox,
  type DragSelectablePoint,
} from "./dragSelectableModel";
import type { DragSelectableMeasuredTarget } from "./dragSelectableDom";
import type { DragSelectableDragMode } from "./dragSelectableOptionTypes";
import {
  dragSelectableAnchoredPoint,
  type DragSelectableAnchorFrame,
} from "./dragSelectableScrollAnchor";
import type { DragSelectableTargetSnapshot } from "./dragSelectableTypes";

/** What the provider renders for an armed or started gesture. */
export type DragSelectableActiveDrag = {
  /** The full hit box in viewport coordinates, or `null` before the start. */
  box: DragSelectableBox | null;
  /** The targets that the box intersects. */
  matchedTargets: DragSelectableTargetSnapshot[];
  /** How the drag will change the selection. */
  mode: DragSelectableDragMode;
  /** Whether the pointer moved the threshold distance. */
  moved: boolean;
};

/** The DOM listeners of a session call these handlers. */
export type DragSelectableSessionHandlers = {
  /** `pointercancel` of any pointer. */
  cancel: () => void;
  /** The window lost focus, or the page became hidden. */
  interrupt: () => void;
  /** `pointermove` at a viewport point. */
  move: (point: DragSelectablePoint, pointerId: number | undefined) => void;
  /** `pointerup` at a viewport point. */
  release: (point: DragSelectablePoint, pointerId: number | undefined) => void;
  /** A scroll anywhere in the document. */
  scroll: () => void;
};

/** The side effects that a session needs. */
export type DragSelectableSessionEnv = {
  /** Blocks text selection; returns the function that restores it. */
  blockTextSelection: () => () => void;
  /** Receives the hit ids of a completed drag, in document order. */
  commit: (hitIds: string[]) => void;
  /** Runs once when the session ends, whatever the cause. */
  end: () => void;
  /** Ends the library `Pressable` presses that the pointer started. */
  endPresses: (pointerId: number | undefined) => void;
  /** Attaches the listeners that drive the session; returns the remover. */
  listen: (handlers: DragSelectableSessionHandlers) => () => void;
  /** Measures the enabled targets in viewport coordinates. */
  measureTargets: () => DragSelectableMeasuredTarget[];
  /** Measures the enabled targets in document order. */
  measureTargetsInOrder: () => DragSelectableMeasuredTarget[];
  /** Pushes an Escape layer; returns the remover. */
  pushEscape: (onEscape: () => void) => () => void;
  /** Reads the current frame of the press's scroll container. */
  readAnchor: () => DragSelectableAnchorFrame;
  /** Draws the gesture, or clears it with `null`. */
  render: (drag: DragSelectableActiveDrag | null) => void;
  /** Swallows the next click. */
  suppressClick: () => void;
};

/** The accepted press that starts a session. */
export type DragSelectableSessionInput = {
  mode: DragSelectableDragMode;
  pointerId: number | undefined;
  press: DragSelectablePoint;
  /** Block text selection from the start to the release. */
  preventTextSelection: boolean;
  threshold: number;
};

/** The controls of a running session. */
export type DragSelectableSession = {
  /**
   * Cancels without a commit. A started drag keeps waiting for the release,
   * so that it can swallow the click; an armed press ends at once.
   */
  cancel: () => void;
  /** Ends at once, without a commit and without a swallowed click. */
  stop: () => void;
};

type Phase = "armed" | "started" | "cancelled";

/** Arms a session for an accepted press and starts listening. */
export function startDragSelectableSession(
  input: DragSelectableSessionInput,
  env: DragSelectableSessionEnv,
): DragSelectableSession {
  const origin = env.readAnchor();
  const armed: DragSelectableActiveDrag = {
    box: null,
    matchedTargets: [],
    mode: input.mode,
    moved: false,
  };
  let phase: Phase = "armed";
  let pointer = input.press;
  let targets: DragSelectableMeasuredTarget[] = [];
  let removeEscape: (() => void) | null = null;
  let removeListeners: (() => void) | null = null;
  let restoreTextSelection: (() => void) | null = null;
  let ended = false;

  const ownsPointer = (pointerId: number | undefined) =>
    input.pointerId === undefined ||
    pointerId === undefined ||
    pointerId === input.pointerId;

  const hitBox = () =>
    dragSelectableBox(
      dragSelectableAnchoredPoint(input.press, origin, env.readAnchor()),
      pointer,
    );

  const draw = () => {
    if (phase !== "started") {
      env.render(phase === "armed" ? armed : null);
      return;
    }
    const box = hitBox();
    env.render({
      box,
      matchedTargets: dragSelectableBoundsForBox(targets, box).map(
        (target) => ({ data: target.data, id: target.id }),
      ),
      mode: input.mode,
      moved: true,
    });
  };

  const releaseDragEffects = () => {
    removeEscape?.();
    removeEscape = null;
  };

  const end = () => {
    if (ended) {
      return;
    }
    ended = true;
    releaseDragEffects();
    restoreTextSelection?.();
    restoreTextSelection = null;
    removeListeners?.();
    removeListeners = null;
    env.render(null);
    env.end();
  };

  const cancel = () => {
    if (ended || phase === "cancelled") {
      return;
    }
    if (phase === "armed") {
      end();
      return;
    }
    phase = "cancelled";
    releaseDragEffects();
    draw();
  };

  const start = () => {
    phase = "started";
    targets = env.measureTargets();
    if (input.preventTextSelection) {
      restoreTextSelection = env.blockTextSelection();
    }
    env.endPresses(input.pointerId);
    removeEscape = env.pushEscape(cancel);
    draw();
  };

  const handlers: DragSelectableSessionHandlers = {
    cancel: end,
    interrupt: end,
    move: (point, pointerId) => {
      if (!ownsPointer(pointerId) || phase === "cancelled") {
        return;
      }
      pointer = point;
      if (phase === "started") {
        draw();
      } else if (hasDragSelectableMoved(input.press, point, input.threshold)) {
        start();
      }
    },
    release: (point, pointerId) => {
      if (!ownsPointer(pointerId)) {
        return;
      }
      const startedPhase = phase;
      pointer = point;
      const box = startedPhase === "started" ? hitBox() : null;
      end();
      if (startedPhase === "armed") {
        return;
      }
      env.suppressClick();
      if (box) {
        env.commit(
          dragSelectableBoundsForBox(env.measureTargetsInOrder(), box).map(
            (target) => target.id,
          ),
        );
      }
    },
    scroll: () => {
      if (phase === "started") {
        targets = env.measureTargets();
        draw();
      }
    },
  };

  removeListeners = env.listen(handlers);
  draw();
  return { cancel, stop: end };
}
