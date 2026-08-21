import assert from "node:assert/strict";
import test from "node:test";

import {
  bezierValueAt,
  curveSamples,
  insertKeyframe,
  keyframeAtTime,
  moveKeyframe,
  normaliseValue,
  removeKeyframe,
  sortKeyframes,
  trackRange,
  valueAt,
  type Keyframe,
  type KeyframeTrack,
} from "../../src/video-editor/keyframeCurve";

function keyframe(
  id: string,
  time: number,
  value: number,
  extra: Partial<Keyframe> = {},
): Keyframe {
  return { id, time, value, ...extra };
}

const linear: Keyframe[] = [
  keyframe("a", 0, 0),
  keyframe("b", 2, 100),
  keyframe("c", 4, 50),
];

test("keyframes sort by time without mutating the input", () => {
  const unordered = [linear[2], linear[0], linear[1]];
  assert.deepEqual(
    sortKeyframes(unordered).map((entry) => entry.id),
    ["a", "b", "c"],
  );
  assert.equal(unordered[0].id, "c");
});

test("a linear segment interpolates between its ends", () => {
  assert.equal(valueAt(linear, 0), 0);
  assert.equal(valueAt(linear, 1), 50);
  assert.equal(valueAt(linear, 2), 100);
  assert.equal(valueAt(linear, 3), 75);
  assert.equal(valueAt(linear, 4), 50);
});

test("the value holds flat outside the keyframed range", () => {
  // An animation does not extrapolate off its ends.
  assert.equal(valueAt(linear, -10), 0);
  assert.equal(valueAt(linear, 99), 50);
});

test("an empty track has no value at all", () => {
  assert.equal(valueAt([], 1), null);
});

test("a single keyframe holds its value everywhere", () => {
  const single = [keyframe("only", 3, 42)];
  assert.equal(valueAt(single, 0), 42);
  assert.equal(valueAt(single, 3), 42);
  assert.equal(valueAt(single, 100), 42);
});

test("a hold segment keeps the earlier value until the next keyframe", () => {
  const held = [
    keyframe("a", 0, 10, { interpolation: "hold" }),
    keyframe("b", 4, 90),
  ];
  assert.equal(valueAt(held, 0), 10);
  assert.equal(valueAt(held, 3.9), 10);
  // The step lands exactly on the next keyframe, not before it.
  assert.equal(valueAt(held, 4), 90);
});

test("interpolation is per-segment, read from the keyframe it leaves", () => {
  const mixed = [
    keyframe("a", 0, 0, { interpolation: "hold" }),
    keyframe("b", 2, 100),
    keyframe("c", 4, 0),
  ];
  // Held out of `a`, then linear out of `b`.
  assert.equal(valueAt(mixed, 1), 0);
  assert.equal(valueAt(mixed, 3), 50);
});

test("a bezier segment eases rather than running straight", () => {
  const eased = [
    keyframe("a", 0, 0, { interpolation: "bezier" }),
    keyframe("b", 2, 100),
  ];
  // It still passes exactly through both ends.
  assert.ok(Math.abs((valueAt(eased, 0) ?? -1) - 0) < 1e-6);
  assert.ok(Math.abs((valueAt(eased, 2) ?? -1) - 100) < 1e-6);
  // With flat default handles the midpoint is still halfway, but the quarter
  // point lags a linear ramp — that is the ease.
  assert.ok(Math.abs((valueAt(eased, 1) ?? 0) - 50) < 0.5);
  assert.ok((valueAt(eased, 0.5) ?? 0) < 25);
  assert.ok((valueAt(eased, 1.5) ?? 0) > 75);
});

test("a bezier is monotonic when its handles are", () => {
  const eased = [
    keyframe("a", 0, 0, { interpolation: "bezier" }),
    keyframe("b", 4, 100),
  ];
  let previous = -1;
  for (let time = 0; time <= 4; time += 0.1) {
    const value = valueAt(eased, time) ?? 0;
    assert.ok(value >= previous - 1e-9, `dipped at ${time}`);
    previous = value;
  }
});

test("explicit handles steer the curve", () => {
  // The handle's `dx` stretches the *time* axis and its `dy` the value axis, so
  // front-loading the movement means a short, tall handle: pulled almost
  // straight up out of the keyframe rather than out along the curve.
  const steep = [
    keyframe("a", 0, 0, {
      interpolation: "bezier",
      outHandle: { dx: 0.2, dy: 90 },
    }),
    keyframe("b", 2, 100),
  ];
  assert.ok((valueAt(steep, 0.5) ?? 0) > 60);

  // The same handle laid flat along the time axis barely deflects the curve
  // from the linear ramp it would otherwise be.
  const shallow = [
    keyframe("a", 0, 0, {
      interpolation: "bezier",
      outHandle: { dx: 1.9, dy: 90 },
    }),
    keyframe("b", 2, 100),
  ];
  assert.ok(Math.abs((valueAt(shallow, 0.5) ?? 0) - 25) < 5);
});

test("a bezier evaluates at a time, not at a curve parameter", () => {
  const value = bezierValueAt(
    { time: 0, value: 0 },
    { time: 0, value: 100 },
    { time: 1, value: 0 },
    { time: 1, value: 100 },
    0.5,
  );
  assert.ok(Math.abs(value - 50) < 1e-6);
});

test("two keyframes at the same instant collapse to the newer one", () => {
  const next = insertKeyframe(linear, keyframe("b2", 2, 25));
  assert.deepEqual(
    next.map((entry) => entry.id),
    ["a", "b2", "c"],
  );
  assert.equal(valueAt(next, 2), 25);
});

test("inserting keeps the list ordered and leaves the original alone", () => {
  const next = insertKeyframe(linear, keyframe("mid", 1, 10));
  assert.deepEqual(
    next.map((entry) => entry.id),
    ["a", "mid", "b", "c"],
  );
  assert.equal(linear.length, 3);
});

test("moving a keyframe re-sorts, so it can cross its neighbours", () => {
  const next = moveKeyframe(linear, "a", 3, 5);
  assert.deepEqual(
    next.map((entry) => entry.id),
    ["b", "a", "c"],
  );
  assert.equal(next[1].value, 5);
});

test("removing a keyframe leaves the rest untouched", () => {
  assert.deepEqual(
    removeKeyframe(linear, "b").map((entry) => entry.id),
    ["a", "c"],
  );
  assert.deepEqual(removeKeyframe(linear, "ghost").length, 3);
});

test("hit testing finds the nearest keyframe within tolerance", () => {
  assert.equal(keyframeAtTime(linear, 2.05, 0.1)?.id, "b");
  assert.equal(keyframeAtTime(linear, 2.5, 0.1), null);
  // With two in range, the closer one wins.
  assert.equal(keyframeAtTime(linear, 3.6, 2)?.id, "c");
});

test("a track's range comes from its data unless it is declared", () => {
  const track: KeyframeTrack = {
    id: "t",
    keyframes: linear,
    label: "Opacity",
    propertyId: "opacity",
  };
  assert.deepEqual(trackRange(track), { max: 100, min: 0 });
  assert.deepEqual(trackRange({ ...track, max: 200, min: -50 }), {
    max: 200,
    min: -50,
  });
});

test("a flat track still gets a plottable range", () => {
  // Every value identical would otherwise divide by zero when normalised.
  const flat: KeyframeTrack = {
    id: "t",
    keyframes: [keyframe("a", 0, 7), keyframe("b", 2, 7)],
    label: "Level",
    propertyId: "level",
  };
  assert.deepEqual(trackRange(flat), { max: 8, min: 7 });
  const empty: KeyframeTrack = {
    id: "t",
    keyframes: [],
    label: "Level",
    propertyId: "level",
  };
  assert.deepEqual(trackRange(empty), { max: 1, min: 0 });
});

test("values normalise into 0..1 and clamp outside the range", () => {
  const range = { max: 100, min: 0 };
  assert.equal(normaliseValue(50, range), 0.5);
  assert.equal(normaliseValue(-20, range), 0);
  assert.equal(normaliseValue(500, range), 1);
  assert.equal(normaliseValue(1, { max: 5, min: 5 }), 0);
});

test("a curve samples evenly across the window", () => {
  const samples = curveSamples(linear, 0, 4, 5);
  assert.deepEqual(
    samples.map((sample) => sample.time),
    [0, 1, 2, 3, 4],
  );
  assert.deepEqual(
    samples.map((sample) => sample.value),
    [0, 50, 100, 75, 50],
  );
});

test("sampling degrades safely rather than producing a broken path", () => {
  assert.deepEqual(curveSamples([], 0, 4, 10), []);
  assert.deepEqual(curveSamples(linear, 0, 4, 1), []);
  assert.deepEqual(curveSamples(linear, 4, 0, 10), []);
});
