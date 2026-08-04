import assert from "node:assert/strict";
import test from "node:test";

import { avatarBorderRadius } from "../../src/avatar/avatarRadius";

test("circle avatars are always half the diameter", () => {
  assert.equal(avatarBorderRadius(32, "circle", 0.25), 16);
  assert.equal(avatarBorderRadius(64, "circle", 0.25), 32);
  // The ratio is irrelevant to a circle.
  assert.equal(avatarBorderRadius(32, "circle", 0.4), 16);
});

test("square avatars scale their corner radius with size", () => {
  assert.equal(avatarBorderRadius(24, "square", 0.25), 6);
  assert.equal(avatarBorderRadius(32, "square", 0.25), 8);
  assert.equal(avatarBorderRadius(48, "square", 0.25), 12);
  assert.equal(avatarBorderRadius(64, "square", 0.25), 16);
});

test("square avatars honour a themed ratio", () => {
  assert.equal(avatarBorderRadius(40, "square", 0.1), 4);
  assert.equal(avatarBorderRadius(40, "square", 0.35), 14);
});

test("square avatars clamp a bad ratio into [0, 0.5]", () => {
  // Above 0.5 the box would read as a circle; below 0 it is not renderable.
  assert.equal(avatarBorderRadius(32, "square", 0.9), 16);
  assert.equal(avatarBorderRadius(32, "square", -1), 0);
  assert.equal(avatarBorderRadius(32, "square", Number.NaN), 0);
});
