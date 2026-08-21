import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FPS,
  formatClock,
  formatRulerLabel,
  formatTimecode,
  frameDuration,
  framesToSeconds,
  parseTimecode,
  quantizeToFrame,
  secondsToFrames,
  tickStep,
  tickTimes,
  timeToX,
  xToTime,
} from "../../src/timeline/timelineTime";

test("frames and seconds convert both ways", () => {
  assert.equal(framesToSeconds(30, 30), 1);
  assert.equal(framesToSeconds(15, 30), 0.5);
  assert.equal(secondsToFrames(1, 30), 30);
  assert.equal(secondsToFrames(0.5, 30), 15);
  assert.equal(frameDuration(25), 0.04);
});

test("a non-positive or non-finite frame rate falls back to the default", () => {
  assert.equal(secondsToFrames(1, 0), DEFAULT_FPS);
  assert.equal(secondsToFrames(1, -5), DEFAULT_FPS);
  assert.equal(secondsToFrames(1, Number.NaN), DEFAULT_FPS);
});

test("quantizing snaps to the nearest frame boundary", () => {
  assert.equal(quantizeToFrame(0.51, 30), 15 / 30);
  assert.equal(quantizeToFrame(0.49, 30), 15 / 30);
  // Already on a boundary: unchanged rather than drifting by a float epsilon.
  assert.equal(quantizeToFrame(2, 30), 2);
});

test("timecode formats as HH:MM:SS:FF", () => {
  assert.equal(formatTimecode(0, 30), "00:00:00:00");
  assert.equal(formatTimecode(4.4, 30), "00:00:04:12");
  assert.equal(formatTimecode(3661.5, 30), "01:01:01:15");
  assert.equal(formatTimecode(-1, 30), "-00:00:01:00");
});

test("timecode fields can be dropped for compact rulers", () => {
  assert.equal(formatTimecode(65, 30, { showHours: false }), "01:05:00");
  assert.equal(formatTimecode(65, 30, { showFrames: false }), "00:01:05");
  // Without an hours field the minutes accumulate rather than wrapping.
  assert.equal(
    formatTimecode(3661, 30, { showFrames: false, showHours: false }),
    "61:01",
  );
});

test("clock durations drop the frame field and the empty hour", () => {
  assert.equal(formatClock(64), "1:04");
  assert.equal(formatClock(3723), "1:02:03");
  assert.equal(formatClock(0), "0:00");
});

test("timecode parses right to left, as an editor's field does", () => {
  assert.equal(parseTimecode("12", 30), 12 / 30);
  assert.equal(parseTimecode("04:12", 30), 4 + 12 / 30);
  assert.equal(parseTimecode("01:04:12", 30), 64 + 12 / 30);
  assert.equal(parseTimecode("02:01:04:12", 30), 7264 + 12 / 30);
  assert.equal(parseTimecode("-04:12", 30), -(4 + 12 / 30));
});

test("unparseable timecode returns null rather than a wrong number", () => {
  assert.equal(parseTimecode("", 30), null);
  assert.equal(parseTimecode("abc", 30), null);
  assert.equal(parseTimecode("1:2:3:4:5", 30), null);
  assert.equal(parseTimecode("1:-2", 30), null);
});

test("time maps to pixels through the zoom scalar", () => {
  assert.equal(timeToX(2, 60), 120);
  assert.equal(xToTime(120, 60), 2);
  // A zero zoom cannot divide; report the origin instead of Infinity.
  assert.equal(xToTime(120, 0), 0);
});

test("tick spacing keeps labels at least the minimum distance apart", () => {
  // Tight zoom: whole minutes, because a second would be 2px.
  assert.equal(tickStep(2, 30).major, 60);
  // Roomy zoom: individual frames become addressable.
  const frames = tickStep(4000, 30);
  assert.ok(frames.major < 1);
  // Every ladder rung clears the minimum label spacing it was chosen for.
  for (const pps of [1, 5, 20, 60, 200, 900, 5000]) {
    assert.ok(
      tickStep(pps, 30).major * pps >= 76 || tickStep(pps, 30).major === 7200,
    );
  }
});

test("minor ticks subdivide the major step, or collapse onto it", () => {
  const coarse = tickStep(60, 30);
  assert.equal(coarse.minor, coarse.major / 5);
  // At the finest rung a fifth of a frame is not addressable, so there are no
  // minor ticks and the caller draws only the majors.
  const finest = tickStep(100_000, 30);
  assert.equal(finest.minor, finest.major);
});

test("tick times are the multiples of the step inside the range", () => {
  assert.deepEqual(tickTimes(0, 10, 5), [0, 5, 10]);
  assert.deepEqual(tickTimes(3, 12, 5), [5, 10]);
  assert.deepEqual(tickTimes(0, -1, 5), []);
  assert.deepEqual(tickTimes(0, 10, 0), []);
  // A pathological zoom must not try to materialise millions of ticks.
  assert.deepEqual(tickTimes(0, 1_000_000, 0.001), []);
});

test("ruler labels only show frames once the ruler is that zoomed in", () => {
  assert.equal(formatRulerLabel(4.4, 30, 0.5), "00:04:12");
  assert.equal(formatRulerLabel(64, 30, 5), "1:04");
});
