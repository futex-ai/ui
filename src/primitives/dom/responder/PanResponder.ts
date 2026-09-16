/**
 * `PanResponder`: several touches reconciled into one gesture.
 *
 * A transcription of React Native's `PanResponder` as `react-native-web` 0.21.2
 * vendors it. It is a thin wrapper over the responder handlers that adds a
 * `gestureState` computed from the touch history — cumulative rather than
 * per-touch, so two fingers moving five pixels the same way report five, not
 * ten.
 *
 * The one web-specific piece is `onClickCapture`: a browser fires `click` after
 * a mouse gesture, and a pan that just finished must not also activate whatever
 * is under the cursor, so the click is cancelled for 250 ms after a release.
 *
 * `InteractionManager` is not ported — on that backend it is a bookkeeping
 * counter no consumer reads, and the seam's `PanResponderInstance` type does
 * not expose `getInteractionHandle`.
 */
import type {
  GestureResponderEvent,
  PanResponderCallbacks,
  PanResponderGestureState,
  PanResponderInstance,
  PanResponderStatic,
} from "../../types";

import type { ResponderEvent } from "./createResponderEvent";
import type { TouchHistory } from "./touchHistory";
import {
  currentCentroidX,
  currentCentroidXOfTouchesChangedAfter,
  currentCentroidY,
  currentCentroidYOfTouchesChangedAfter,
  previousCentroidXOfTouchesChangedAfter,
  previousCentroidYOfTouchesChangedAfter,
} from "./touchHistoryMath";

/** The public gesture state plus the timestamp bookkeeping it needs. */
type GestureState = PanResponderGestureState & {
  /** Every field accounts for touch moves up to this timestamp. */
  _accountsForMovesUpTo: number;
};

/** How long a click stays cancelled after a pan releases. */
const CLICK_CANCEL_MS = 250;

type InteractionState = { shouldCancelClick: boolean; timeout: number | null };

function initializeGestureState(gestureState: GestureState): void {
  gestureState.moveX = 0;
  gestureState.moveY = 0;
  gestureState.x0 = 0;
  gestureState.y0 = 0;
  gestureState.dx = 0;
  gestureState.dy = 0;
  gestureState.vx = 0;
  gestureState.vy = 0;
  gestureState.numberActiveTouches = 0;
  gestureState._accountsForMovesUpTo = 0;
}

/**
 * Accumulates the change in centroid of the touches that moved since the last
 * accounted timestamp, rather than tracking one centroid over time — which is
 * what keeps `dx` correct when one of three fingers stops moving.
 */
function updateGestureStateOnMove(
  gestureState: GestureState,
  touchHistory: TouchHistory,
): void {
  const movedAfter = gestureState._accountsForMovesUpTo;
  gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
  gestureState.moveX = currentCentroidXOfTouchesChangedAfter(
    touchHistory,
    movedAfter,
  );
  gestureState.moveY = currentCentroidYOfTouchesChangedAfter(
    touchHistory,
    movedAfter,
  );
  const prevX = previousCentroidXOfTouchesChangedAfter(
    touchHistory,
    movedAfter,
  );
  const x = currentCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
  const prevY = previousCentroidYOfTouchesChangedAfter(
    touchHistory,
    movedAfter,
  );
  const y = currentCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
  const nextDX = gestureState.dx + (x - prevX);
  const nextDY = gestureState.dy + (y - prevY);

  const dt = touchHistory.mostRecentTimeStamp - movedAfter;
  gestureState.vx = (nextDX - gestureState.dx) / dt;
  gestureState.vy = (nextDY - gestureState.dy) / dt;

  gestureState.dx = nextDX;
  gestureState.dy = nextDY;
  gestureState._accountsForMovesUpTo = touchHistory.mostRecentTimeStamp;
}

function clearInteractionTimeout(interactionState: InteractionState) {
  if (interactionState.timeout != null) {
    clearTimeout(interactionState.timeout);
    interactionState.timeout = null;
  }
}

function setInteractionTimeout(interactionState: InteractionState) {
  interactionState.timeout = setTimeout(() => {
    interactionState.shouldCancelClick = false;
  }, CLICK_CANCEL_MS) as unknown as number;
}

/** A responder event, as the seam's public gesture type. */
function asGestureEvent(event: ResponderEvent): GestureResponderEvent {
  return event as unknown as GestureResponderEvent;
}

function create(config: PanResponderCallbacks): PanResponderInstance {
  const interactionState: InteractionState = {
    shouldCancelClick: false,
    timeout: null,
  };
  const gestureState: GestureState = {
    _accountsForMovesUpTo: 0,
    dx: 0,
    dy: 0,
    moveX: 0,
    moveY: 0,
    numberActiveTouches: 0,
    // Useful for debugging; stable while a touch remains on screen.
    stateID: Math.random(),
    vx: 0,
    vy: 0,
    x0: 0,
    y0: 0,
  };

  const panHandlers = {
    onClickCapture(event: {
      preventDefault: () => void;
      stopPropagation: () => void;
    }): void {
      // Browsers cancel a click natively when a non-mouse pointer moves; for a
      // mouse pan we have to do it ourselves, or the drop target activates.
      if (interactionState.shouldCancelClick) {
        event.stopPropagation();
        event.preventDefault();
      }
    },

    onStartShouldSetResponder(event: ResponderEvent): boolean {
      return config.onStartShouldSetPanResponder == null
        ? false
        : config.onStartShouldSetPanResponder(
            asGestureEvent(event),
            gestureState,
          );
    },

    onStartShouldSetResponderCapture(event: ResponderEvent): boolean {
      // The state resets whenever the first touch of a gesture goes down.
      if (event.nativeEvent.touches.length === 1) {
        initializeGestureState(gestureState);
      }
      gestureState.numberActiveTouches = event.touchHistory.numberActiveTouches;
      return config.onStartShouldSetPanResponderCapture == null
        ? false
        : config.onStartShouldSetPanResponderCapture(
            asGestureEvent(event),
            gestureState,
          );
    },

    onMoveShouldSetResponder(event: ResponderEvent): boolean {
      return config.onMoveShouldSetPanResponder == null
        ? false
        : config.onMoveShouldSetPanResponder(
            asGestureEvent(event),
            gestureState,
          );
    },

    onMoveShouldSetResponderCapture(event: ResponderEvent): boolean {
      const { touchHistory } = event;
      // The responder system also dispatches "shouldSet" to the current
      // responder; the geometry of a multi-touch move was already folded in on
      // the first of them, so later ones are dropped.
      if (
        gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp
      ) {
        return false;
      }
      updateGestureStateOnMove(gestureState, touchHistory);
      return config.onMoveShouldSetPanResponderCapture == null
        ? false
        : config.onMoveShouldSetPanResponderCapture(
            asGestureEvent(event),
            gestureState,
          );
    },

    onResponderGrant(event: ResponderEvent): boolean {
      clearInteractionTimeout(interactionState);
      interactionState.shouldCancelClick = true;
      gestureState.x0 = currentCentroidX(event.touchHistory);
      gestureState.y0 = currentCentroidY(event.touchHistory);
      gestureState.dx = 0;
      gestureState.dy = 0;
      config.onPanResponderGrant?.(asGestureEvent(event), gestureState);
      return config.onShouldBlockNativeResponder == null
        ? true
        : config.onShouldBlockNativeResponder(
            asGestureEvent(event),
            gestureState,
          );
    },

    onResponderReject(event: ResponderEvent): void {
      config.onPanResponderReject?.(asGestureEvent(event), gestureState);
    },

    onResponderRelease(event: ResponderEvent): void {
      config.onPanResponderRelease?.(asGestureEvent(event), gestureState);
      setInteractionTimeout(interactionState);
      initializeGestureState(gestureState);
    },

    onResponderStart(event: ResponderEvent): void {
      gestureState.numberActiveTouches = event.touchHistory.numberActiveTouches;
      config.onPanResponderStart?.(asGestureEvent(event), gestureState);
    },

    onResponderMove(event: ResponderEvent): void {
      const { touchHistory } = event;
      if (
        gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp
      ) {
        return;
      }
      updateGestureStateOnMove(gestureState, touchHistory);
      config.onPanResponderMove?.(asGestureEvent(event), gestureState);
    },

    onResponderEnd(event: ResponderEvent): void {
      gestureState.numberActiveTouches = event.touchHistory.numberActiveTouches;
      config.onPanResponderEnd?.(asGestureEvent(event), gestureState);
    },

    onResponderTerminate(event: ResponderEvent): void {
      config.onPanResponderTerminate?.(asGestureEvent(event), gestureState);
      setInteractionTimeout(interactionState);
      initializeGestureState(gestureState);
    },

    onResponderTerminationRequest(event: ResponderEvent): boolean {
      return config.onPanResponderTerminationRequest == null
        ? true
        : config.onPanResponderTerminationRequest(
            asGestureEvent(event),
            gestureState,
          );
    },
  };

  return {
    panHandlers,
  } as unknown as PanResponderInstance;
}

export const PanResponder: PanResponderStatic = { create };

/** Exposed for the unit tests: the gesture maths, without the DOM. */
export const panResponderInternals = {
  initializeGestureState,
  updateGestureStateOnMove,
};

export type { GestureState };
