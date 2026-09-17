import assert from "node:assert/strict";
import test from "node:test";

import { AnimatedValue } from "../../src/primitives/dom/animated/AnimatedValue";
import { timing } from "../../src/primitives/dom/animated/compositions";
import { Easing } from "../../src/primitives/dom/animated/Easing";
import {
  colorToRgba,
  createInterpolation,
  findRange,
} from "../../src/primitives/dom/animated/interpolation";

/**
 * `Animated`'s interpolation table, transcribed from React Native's
 * `AnimatedInterpolation`. Every shape the library actually drives is pinned
 * here: numeric ranges (the animated border's `strokeDashoffset`, the loader
 * wave's 25-point curves), `"0deg"` → `"360deg"`, and `"0%"` → `"100%"`.
 */

test("a numeric range maps linearly between its endpoints", () => {
  const interpolate = createInterpolation({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  assert.equal(interpolate(0), 0);
  assert.equal(interpolate(0.25), 25);
  assert.equal(interpolate(1), 100);
});

test("a range extends past its ends unless told to clamp", () => {
  const extend = createInterpolation({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  assert.equal(extend(2), 20);
  assert.equal(extend(-1), -10);

  const clamp = createInterpolation({
    extrapolate: "clamp",
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  assert.equal(clamp(2), 10);
  assert.equal(clamp(-1), 0);

  // `identity` hands the input straight back rather than mapping it.
  const identity = createInterpolation({
    extrapolateLeft: "identity",
    extrapolateRight: "clamp",
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  assert.equal(identity(-3), -3);
  assert.equal(identity(4), 10);
});

test("a multi-point range picks the segment the input falls in", () => {
  // The spinner's reduced-motion opacity curve: 1 → 0.3 → 1.
  const interpolate = createInterpolation({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.3, 1],
  });
  assert.equal(interpolate(0), 1);
  assert.ok(Math.abs(Number(interpolate(0.5)) - 0.3) < 1e-9);
  assert.equal(interpolate(1), 1);
  assert.ok(Math.abs(Number(interpolate(0.25)) - 0.65) < 1e-9);

  assert.equal(findRange(0.25, [0, 0.5, 1]), 0);
  assert.equal(findRange(0.75, [0, 0.5, 1]), 1);
  // Outside the range the nearest segment is used, and extrapolated.
  assert.equal(findRange(-5, [0, 0.5, 1]), 0);
  assert.equal(findRange(5, [0, 0.5, 1]), 1);
});

test("a near-discontinuous sawtooth segment stays finite", () => {
  // `loaderWaveMath.ts`'s wrap uses a 0.001-wide segment that snaps back.
  const interpolate = createInterpolation({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [4, 10, 0, 4],
  });
  assert.equal(interpolate(0), 4);
  assert.ok(Math.abs(Number(interpolate(0.499)) - 10) < 1e-9);
  assert.equal(interpolate(0.5), 0);
  assert.equal(interpolate(1), 4);
});

test("a string range interpolates every number inside the template", () => {
  const rotate = createInterpolation({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  assert.equal(rotate(0), "0deg");
  assert.equal(rotate(0.5), "180deg");
  assert.equal(rotate(1), "360deg");

  const width = createInterpolation({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });
  assert.equal(width(0.25), "25%");
});

test("an rgb range rounds its channels but not its alpha", () => {
  const colour = createInterpolation({
    inputRange: [0, 1],
    outputRange: ["rgba(0, 100, 200, 0)", "rgba(50, 150, 250, 0.5)"],
  });
  assert.equal(colour(0.5), "rgba(25, 125, 225, 0.25)");
});

test("the colour forms the backend parses normalise to rgba", () => {
  assert.equal(colorToRgba("#f00"), "rgba(255, 0, 0, 1)");
  assert.equal(colorToRgba("#ff000080"), "rgba(255, 0, 0, 0.5019607843137255)");
  assert.equal(colorToRgba("rgb(1, 2, 3)"), "rgba(1, 2, 3, 1)");
  assert.equal(colorToRgba("black"), "rgba(0, 0, 0, 1)");
  // Any other named colour is left alone: the 150-entry table is not vendored.
  assert.equal(colorToRgba("rebeccapurple"), "rebeccapurple");
});

test("two output strings of different shapes are rejected", () => {
  assert.throws(
    () =>
      createInterpolation({
        inputRange: [0, 1],
        outputRange: ["0deg", "rgb(1, 2, 3)"],
      }),
    /invalid pattern/,
  );
});

test("an easing bends the segment without moving its endpoints", () => {
  const eased = createInterpolation({
    easing: Easing.quad,
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  assert.equal(eased(0), 0);
  assert.equal(eased(1), 100);
  assert.equal(eased(0.5), 25);
});

/**
 * `timing`'s target. An animated `toValue` is read once, when the animation
 * starts: React Native's live `AnimatedTracking` is not ported.
 *
 * The driver is `requestAnimationFrame`, which Node does not have, so these
 * two stand it up on a timer for the length of the test.
 */
const scope = globalThis as unknown as {
  requestAnimationFrame?: (callback: () => void) => number;
  cancelAnimationFrame?: (handle: number) => void;
};
scope.requestAnimationFrame ??= (callback) =>
  setTimeout(callback, 16) as unknown as number;
scope.cancelAnimationFrame ??= (handle) =>
  clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);

test("an animated toValue is snapshotted when the animation starts", async () => {
  const target = new AnimatedValue(10);
  const value = new AnimatedValue(0);

  // Moving the target before the start is picked up.
  target.setValue(20);
  await new Promise<void>((resolve) =>
    timing(value, {
      duration: 1,
      easing: (t: number) => t,
      toValue: target,
      useNativeDriver: false,
    }).start(() => resolve()),
  );
  assert.equal(value.__getValue(), 20);

  // Moving it mid-run is not: the run keeps the number it started with.
  const second = new AnimatedValue(0);
  const settled = new Promise<void>((resolve) =>
    timing(second, {
      duration: 60,
      easing: (t: number) => t,
      toValue: target,
      useNativeDriver: false,
    }).start(() => resolve()),
  );
  target.setValue(999);
  await settled;
  assert.equal(second.__getValue(), 20);
});

test("an interpolation can be a target too, through the same snapshot", () => {
  const driver = new AnimatedValue(0.5);
  const interpolated = driver.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });
  const value = new AnimatedValue(0);
  // A zero duration settles synchronously, so the snapshot is observable here.
  timing(value, {
    duration: 0,
    toValue: interpolated,
    useNativeDriver: false,
  }).start();
  assert.equal(value.__getValue(), 50);
});
