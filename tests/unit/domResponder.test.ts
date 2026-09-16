import assert from "node:assert/strict";
import test from "node:test";

import { panResponderInternals } from "../../src/primitives/dom/responder/PanResponder";
import {
  ResponderTouchHistoryStore,
  type ResponderTouch,
} from "../../src/primitives/dom/responder/touchHistory";
import {
  currentCentroidX,
  currentCentroidXOfTouchesChangedAfter,
  NO_CENTROID,
} from "../../src/primitives/dom/responder/touchHistoryMath";
import {
  getLowestCommonAncestor,
  isPrimaryPointerDown,
} from "../../src/primitives/dom/responder/utils";

/**
 * The pure halves of the ported responder system: the path arithmetic the
 * negotiation walks, the touch bank `PanResponder` reads, and the gesture state
 * it computes from it.
 */

function touch(
  identifier: number,
  pageX: number,
  pageY: number,
  timestamp: number,
): ResponderTouch {
  return {
    force: 0,
    identifier,
    locationX: undefined,
    locationY: undefined,
    pageX,
    pageY,
    target: null,
    timestamp,
  };
}

function record(
  store: ResponderTouchHistoryStore,
  type: string,
  changed: ResponderTouch[],
  active: ResponderTouch[] = changed,
) {
  store.recordTouchTrack(type, { changedTouches: changed, touches: active });
}

test("the lowest common ancestor is the first shared entry", () => {
  // Paths run innermost-first, so the shared tail is the ancestry.
  assert.equal(getLowestCommonAncestor([3, 2, 1], [4, 2, 1]), 2);
  assert.equal(getLowestCommonAncestor([5, 4, 3, 2, 1], [2, 1]), 2);
  assert.equal(getLowestCommonAncestor([1], [1]), 1);
  // Different roots cannot share an ancestor inside the responder system.
  assert.equal(getLowestCommonAncestor([3, 2], [4, 1]), null);
  assert.equal(getLowestCommonAncestor([], [1]), null);
});

test("only a primary, unmodified pointer opens a gesture", () => {
  const mouseDown = {
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    type: "mousedown",
  };
  assert.equal(isPrimaryPointerDown(mouseDown), true);
  assert.equal(
    isPrimaryPointerDown({ ...mouseDown, button: 2, buttons: 2 }),
    false,
  );
  assert.equal(isPrimaryPointerDown({ ...mouseDown, ctrlKey: true }), false);
  assert.equal(isPrimaryPointerDown({ ...mouseDown, altKey: true }), false);
  // A move only counts while the button is still down.
  assert.equal(
    isPrimaryPointerDown({ ...mouseDown, buttons: 0, type: "mousemove" }),
    false,
  );
  // Touch always counts, whatever the synthesized button says.
  assert.equal(isPrimaryPointerDown({ type: "touchstart" }), true);
});

test("the touch bank remembers where each touch started and moved", () => {
  const store = new ResponderTouchHistoryStore();
  record(store, "touchstart", [touch(0, 10, 20, 100)]);
  const history = store.touchHistory;
  assert.equal(history.numberActiveTouches, 1);
  assert.equal(history.indexOfSingleActiveTouch, 0);
  assert.equal(history.touchBank[0].startPageX, 10);
  assert.equal(history.touchBank[0].currentPageX, 10);

  record(store, "touchmove", [touch(0, 30, 20, 116)]);
  assert.equal(history.touchBank[0].previousPageX, 10);
  assert.equal(history.touchBank[0].currentPageX, 30);
  assert.equal(history.mostRecentTimeStamp, 116);

  record(store, "touchend", [touch(0, 30, 20, 132)], []);
  assert.equal(history.touchBank[0].touchActive, false);
  assert.equal(history.numberActiveTouches, 0);
});

test("the centroid averages the touches that moved after a timestamp", () => {
  const store = new ResponderTouchHistoryStore();
  const first = touch(0, 0, 0, 100);
  const second = touch(1, 100, 0, 100);
  record(store, "touchstart", [first], [first]);
  record(store, "touchstart", [second], [first, second]);
  const history = store.touchHistory;
  assert.equal(history.numberActiveTouches, 2);
  assert.equal(currentCentroidX(history), 50);

  // Only one finger moves, so only it counts towards the moved centroid.
  record(store, "touchmove", [touch(0, 40, 0, 116)], [first, second]);
  assert.equal(currentCentroidXOfTouchesChangedAfter(history, 110), 40);
  // Nothing moved after this timestamp at all.
  assert.equal(
    currentCentroidXOfTouchesChangedAfter(history, 200),
    NO_CENTROID,
  );
});

test("a gesture accumulates the change in centroid, not the centroid", () => {
  const store = new ResponderTouchHistoryStore();
  record(store, "touchstart", [touch(0, 10, 10, 0)]);

  const gestureState = {
    _accountsForMovesUpTo: 0,
    dx: 0,
    dy: 0,
    moveX: 0,
    moveY: 0,
    numberActiveTouches: 0,
    stateID: 1,
    vx: 0,
    vy: 0,
    x0: 0,
    y0: 0,
  };

  record(store, "touchmove", [touch(0, 30, 50, 10)]);
  panResponderInternals.updateGestureStateOnMove(
    gestureState,
    store.touchHistory,
  );
  assert.equal(gestureState.dx, 20);
  assert.equal(gestureState.dy, 40);
  assert.equal(gestureState.moveX, 30);
  assert.equal(gestureState.vx, 2);

  record(store, "touchmove", [touch(0, 35, 50, 20)]);
  panResponderInternals.updateGestureStateOnMove(
    gestureState,
    store.touchHistory,
  );
  // Cumulative, so the second move adds to the first rather than replacing it.
  assert.equal(gestureState.dx, 25);
  assert.equal(gestureState.dy, 40);
  assert.equal(gestureState.vy, 0);

  panResponderInternals.initializeGestureState(gestureState);
  assert.equal(gestureState.dx, 0);
  assert.equal(gestureState._accountsForMovesUpTo, 0);
});
