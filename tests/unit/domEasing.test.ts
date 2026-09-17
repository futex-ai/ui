import assert from "node:assert/strict";
import test from "node:test";

import { bezier } from "../../src/primitives/dom/animated/bezier";
import { Easing } from "../../src/primitives/dom/animated/Easing";

/**
 * The timing curves, transcribed from React Native's `Easing` and `bezier`.
 * The library uses exactly three — `linear`, `out(quad)` and `inOut(ease)` —
 * but the whole table is exported, so the shape of each is pinned.
 */

const near = (actual: number, expected: number, tolerance = 1e-6) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  );

test("every curve starts at 0 and ends at 1", () => {
  const curves = {
    circle: Easing.circle,
    cubic: Easing.cubic,
    ease: Easing.ease,
    linear: Easing.linear,
    quad: Easing.quad,
    sin: Easing.sin,
  };
  for (const [name, curve] of Object.entries(curves)) {
    near(curve(0), 0, 1e-9);
    near(curve(1), 1, 1e-6);
    assert.ok(curve(0.5) > 0 && curve(0.5) < 1, `${name} stays in range`);
  }
});

test("linear is the identity and quad is its square", () => {
  assert.equal(Easing.linear(0.37), 0.37);
  assert.equal(Easing.quad(0.5), 0.25);
  assert.equal(Easing.cubic(0.5), 0.125);
});

test("out mirrors a curve and inOut halves it in each direction", () => {
  const outQuad = Easing.out(Easing.quad);
  assert.equal(outQuad(0), 0);
  assert.equal(outQuad(1), 1);
  // Decelerating: most of the distance is covered early.
  assert.equal(outQuad(0.5), 0.75);

  const inOutQuad = Easing.inOut(Easing.quad);
  assert.equal(inOutQuad(0.5), 0.5);
  near(inOutQuad(0.25), 0.125);
  near(inOutQuad(0.75), 0.875);
});

test("in hands the curve back unchanged", () => {
  assert.equal(Easing.in(Easing.quad), Easing.quad);
});

test("a bézier reproduces its control points", () => {
  // `Easing.ease` is bezier(0.42, 0, 1, 1): slow to start, linear to finish.
  const ease = bezier(0.42, 0, 1, 1);
  assert.equal(ease(0), 0);
  assert.equal(ease(1), 1);
  assert.ok(ease(0.5) < 0.5, "ease lags a linear curve at the midpoint");
  near(ease(0.5), Easing.ease(0.5), 1e-9);

  // A bézier whose control points lie on the diagonal is linear.
  const linear = bezier(0.5, 0.5, 0.5, 0.5);
  assert.equal(linear(0.3), 0.3);

  assert.throws(() => bezier(-1, 0, 1, 1), /bezier x values/);
});

test("the step and shape curves match React Native's table", () => {
  near(Easing.step0(0), 0, 0);
  assert.equal(Easing.step0(0.1), 1);
  assert.equal(Easing.step1(0.9), 0);
  assert.equal(Easing.step1(1), 1);
  assert.equal(Easing.poly(3)(0.5), 0.125);
  assert.equal(Easing.exp(1), 1);
  assert.equal(Easing.bounce(1), 1);
  near(Easing.back()(0), 0, 0);
  near(Easing.elastic()(0), 0, 0);
});
