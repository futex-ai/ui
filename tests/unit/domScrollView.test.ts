import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeScrollEvent,
  shouldEmitScrollEvent,
} from "../../src/primitives/dom/scrollEvents";
import { shouldDismissKeyboardOnRelease } from "../../src/primitives/dom/scrollViewHost";

/**
 * The scroll event shape a `ScrollView` reports with, transcribed from
 * `react-native-web`'s `ScrollViewBase`. Every field is a getter reading the
 * live node, which is what keeps `Timeline`'s handler — it reads
 * `layoutMeasurement.width` long after the event fired — correct.
 */

function node(over: Partial<Record<string, number>> = {}) {
  return {
    offsetHeight: 100,
    offsetWidth: 200,
    scrollHeight: 1000,
    scrollLeft: 5,
    scrollTop: 50,
    scrollWidth: 2000,
    ...over,
  };
}

test("a scroll event reports the offset, content and viewport", () => {
  const event = normalizeScrollEvent(node());
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  assert.equal(contentOffset.x, 5);
  assert.equal(contentOffset.y, 50);
  assert.equal(contentSize.width, 2000);
  assert.equal(contentSize.height, 1000);
  assert.equal(layoutMeasurement.width, 200);
  assert.equal(layoutMeasurement.height, 100);
  assert.equal(typeof event.timeStamp, "number");
});

test("the measurements are read when asked for, not when the event is made", () => {
  const scroller = node();
  const event = normalizeScrollEvent(scroller);
  scroller.scrollTop = 900;
  scroller.scrollHeight = 5000;
  // A handler that defers its work still sees where the scroller is now.
  assert.equal(event.nativeEvent.contentOffset.y, 900);
  assert.equal(event.nativeEvent.contentSize.height, 5000);
});

test("a throttle of zero reports nothing between the start and the settle", () => {
  // `scrollEventThrottle` defaults to 0, which is why every caller that wants a
  // stream of events passes 16.
  assert.equal(shouldEmitScrollEvent(0, 0, 1000), false);
  assert.equal(shouldEmitScrollEvent(1000, 16, 1000), false);
  assert.equal(shouldEmitScrollEvent(1000, 16, 1015), false);
  assert.equal(shouldEmitScrollEvent(1000, 16, 1016), true);
  assert.equal(shouldEmitScrollEvent(1000, 16, 1200), true);
});

/**
 * `scrollResponderHandleResponderRelease`'s keyboard rule. Only touch gestures
 * ever reach it — the lock is claimed from `onScrollShouldSetResponder`, which
 * answers `isTouching` — but the decision itself is pure.
 */

const field = { id: "field" };

function release(
  over: Partial<Parameters<typeof shouldDismissKeyboardOnRelease>[0]> = {},
) {
  return shouldDismissKeyboardOnRelease({
    becameResponderWhileAnimating: false,
    focusedField: field,
    keyboardShouldPersistTaps: undefined,
    observedScrollSinceBecomingResponder: false,
    target: { id: "row" },
    ...over,
  });
}

test("a tap that did not scroll closes the keyboard", () => {
  assert.equal(release(), true);
  // Nothing focused, nothing to dismiss.
  assert.equal(release({ focusedField: null }), false);
  // A tap on the field itself keeps it open.
  assert.equal(release({ target: field }), false);
  // A gesture that scrolled was not a tap.
  assert.equal(release({ observedScrollSinceBecomingResponder: true }), false);
  // Grabbing a still-animating scroller is not a tap either.
  assert.equal(release({ becameResponderWhileAnimating: true }), false);
});

test("any keyboardShouldPersistTaps value keeps the keyboard open", () => {
  // That backend tests the prop for truthiness and never compares the string,
  // so `"never"` persists taps exactly as `"always"` does.
  assert.equal(release({ keyboardShouldPersistTaps: "handled" }), false);
  assert.equal(release({ keyboardShouldPersistTaps: "always" }), false);
  assert.equal(release({ keyboardShouldPersistTaps: "never" }), false);
  assert.equal(release({ keyboardShouldPersistTaps: true }), false);
  // Falsy values leave the rule in force.
  assert.equal(release({ keyboardShouldPersistTaps: false }), true);
  assert.equal(release({ keyboardShouldPersistTaps: undefined }), true);
});
