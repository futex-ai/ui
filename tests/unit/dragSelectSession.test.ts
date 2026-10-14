import assert from "node:assert/strict";
import test from "node:test";

import { dragSelectableClaimPress } from "../../src/drag-select/dragSelectablePress";
import { startDragSelectableSession } from "../../src/drag-select/dragSelectableSession";

import {
  attached,
  fakeSessionEnv,
  stackedRows,
} from "./dragSelectSessionFakes";

const press = { x: 300, y: 25 };

function startSession(threshold = 4) {
  const fake = fakeSessionEnv();
  const session = startDragSelectableSession(
    { pointerId: 1, press, threshold },
    fake.env,
  );
  return { fake, session };
}

test("drag-select provider uses the configured movement threshold", () => {
  const { fake } = startSession(24);
  assert.deepEqual(fake.lastRender(), {
    box: null,
    matchedTargets: [],
    moved: false,
  });

  attached(fake).move({ x: press.x + 20, y: press.y }, 1);
  assert.equal(fake.calls.measures, 0);
  assert.equal(fake.lastRender()?.moved, false);

  attached(fake).move({ x: press.x + 24, y: press.y }, 1);
  assert.equal(fake.calls.measures, 1);
  assert.equal(fake.lastRender()?.moved, true);
});

test("drag-select measures the targets at the start, not at the press", () => {
  const { fake } = startSession();
  assert.equal(fake.calls.measures, 0);

  attached(fake).move({ x: 300, y: 80 }, 1);
  attached(fake).move({ x: 300, y: 120 }, 1);
  attached(fake).move({ x: 300, y: 160 }, 1);

  assert.equal(fake.calls.measures, 1);
  assert.deepEqual(
    fake.lastRender()?.matchedTargets.map((target) => target.id),
    ["row_1", "row_2", "row_3", "row_4"],
  );
});

test("drag-select release before the start changes nothing", () => {
  const { fake } = startSession();
  attached(fake).move({ x: 302, y: 26 }, 1);
  attached(fake).release({ x: 302, y: 26 }, 1);

  assert.deepEqual(fake.calls.commits, []);
  assert.equal(fake.calls.suppressedClicks, 0);
  assert.equal(fake.calls.ends, 1);
  assert.equal(fake.calls.removedListeners, 1);
  assert.equal(fake.lastRender(), null);
});

test("drag-select release after the start commits and swallows the click", () => {
  const { fake } = startSession();
  attached(fake).move({ x: 300, y: 120 }, 1);
  attached(fake).release({ x: 310, y: 130 }, 1);

  assert.deepEqual(fake.calls.commits, [["row_1", "row_2", "row_3"]]);
  assert.equal(fake.calls.orderedMeasures, 1);
  assert.equal(fake.calls.suppressedClicks, 1);
  assert.equal(fake.calls.removedEscapes, 1);
  assert.equal(fake.calls.ends, 1);
  assert.equal(fake.lastRender(), null);
});

test("drag-select keeps the start point on the scrolled content", () => {
  const { fake } = startSession();
  attached(fake).move({ x: 300, y: 40 }, 1);
  fake.setAnchor({ left: 0, scrollLeft: 0, scrollTop: 400, top: 0 });
  fake.setTargets(stackedRows(-400));
  attached(fake).scroll();

  assert.equal(fake.calls.measures, 2);
  assert.equal(fake.lastRender()?.box?.top, press.y - 400);
  attached(fake).release({ x: 300, y: 60 }, 1);

  assert.deepEqual(fake.calls.commits, [
    stackedRows().map((target) => target.id),
  ]);
});

test("drag-select keeps the start point when an ancestor moves the container", () => {
  const { fake } = startSession();
  attached(fake).move({ x: 300, y: 40 }, 1);
  fake.setAnchor({ left: 0, scrollLeft: 0, scrollTop: 0, top: -100 });
  attached(fake).scroll();

  assert.equal(fake.lastRender()?.box?.top, press.y - 100);
});

test("drag-select Escape cancels a started drag and still swallows the click", () => {
  const { fake } = startSession();
  attached(fake).move({ x: 300, y: 120 }, 1);
  assert.equal(fake.calls.escapes.length, 1);

  fake.calls.escapes[0]();
  assert.equal(fake.lastRender(), null);
  assert.equal(fake.calls.removedEscapes, 1);
  assert.equal(fake.calls.ends, 0);

  attached(fake).move({ x: 300, y: 300 }, 1);
  assert.equal(fake.lastRender(), null);
  attached(fake).release({ x: 300, y: 300 }, 1);

  assert.deepEqual(fake.calls.commits, []);
  assert.equal(fake.calls.suppressedClicks, 1);
  assert.equal(fake.calls.ends, 1);
});

test("drag-select provider cancels stale pointer streams", () => {
  const cancelled = startSession();
  attached(cancelled.fake).move({ x: 300, y: 120 }, 1);
  attached(cancelled.fake).cancel();
  assert.deepEqual(cancelled.fake.calls.commits, []);
  assert.equal(cancelled.fake.calls.suppressedClicks, 0);
  assert.equal(cancelled.fake.calls.ends, 1);
  assert.equal(cancelled.fake.handlers(), null);

  const interrupted = startSession();
  attached(interrupted.fake).move({ x: 300, y: 120 }, 1);
  attached(interrupted.fake).interrupt();
  assert.deepEqual(interrupted.fake.calls.commits, []);
  assert.equal(interrupted.fake.calls.ends, 1);
  assert.equal(interrupted.fake.lastRender(), null);

  const armed = startSession();
  armed.session.cancel();
  assert.equal(armed.fake.calls.ends, 1);
  assert.equal(armed.fake.handlers(), null);

  const disabled = startSession();
  attached(disabled.fake).move({ x: 300, y: 120 }, 1);
  disabled.session.cancel();
  assert.equal(disabled.fake.lastRender(), null);
  assert.equal(disabled.fake.calls.ends, 0);
  attached(disabled.fake).release({ x: 300, y: 120 }, 1);
  assert.deepEqual(disabled.fake.calls.commits, []);
  assert.equal(disabled.fake.calls.suppressedClicks, 1);

  const stopped = startSession();
  attached(stopped.fake).move({ x: 300, y: 120 }, 1);
  stopped.session.stop();
  assert.equal(stopped.fake.calls.suppressedClicks, 0);
  assert.equal(stopped.fake.calls.ends, 1);
  stopped.session.stop();
  assert.equal(stopped.fake.calls.ends, 1);
});

test("drag-select ignores the moves and the release of other pointers", () => {
  const { fake } = startSession();
  attached(fake).move({ x: 300, y: 200 }, 2);
  assert.equal(fake.calls.measures, 0);
  attached(fake).release({ x: 300, y: 200 }, 2);
  assert.equal(fake.calls.ends, 0);

  attached(fake).move({ x: 300, y: 200 }, 1);
  attached(fake).release({ x: 300, y: 200 }, 1);
  assert.equal(fake.calls.commits.length, 1);
});

test("drag-select gives a press to the innermost active provider", () => {
  const press = {};
  assert.equal(dragSelectableClaimPress(press, true), true);
  assert.equal(dragSelectableClaimPress(press, true), false);

  const inactiveInner = {};
  assert.equal(dragSelectableClaimPress(inactiveInner, false), false);
  assert.equal(dragSelectableClaimPress(inactiveInner, true), true);
});
