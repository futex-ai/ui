import assert from "node:assert/strict";
import test from "node:test";

import {
  describeDelta,
  deltaTone,
  formatDelta,
  formatStatValue,
  winLoss,
} from "../../src/chart/statValue";

test("delta tone is direction times whether up is good", () => {
  // Revenue rising is good; churn rising is not. Colouring by direction alone
  // would paint a rising error rate green.
  assert.equal(deltaTone(5, "up-is-good"), "good");
  assert.equal(deltaTone(-5, "up-is-good"), "bad");
  assert.equal(deltaTone(5, "down-is-good"), "bad");
  assert.equal(deltaTone(-5, "down-is-good"), "good");
});

test("no change is neutral, not a win", () => {
  assert.equal(deltaTone(0), "neutral");
  assert.equal(deltaTone(0, "down-is-good"), "neutral");
  assert.equal(deltaTone(Number.NaN), "neutral");
});

test("a delta always carries an explicit sign", () => {
  assert.equal(formatDelta({ value: 1200 }), "+1,200");
  assert.equal(formatDelta({ value: -1200 }), "−1,200");
  assert.equal(formatDelta({ value: 0 }), "0");
  assert.equal(formatDelta({ value: 0.125, percent: true }), "+12.5%");
  assert.equal(formatDelta({ value: -0.4, percent: true }), "−40%");
  assert.equal(formatDelta({ value: Number.NaN }), "—");
});

test("stat values compact by default and honour a custom format", () => {
  assert.equal(formatStatValue(1284), "1,284");
  assert.equal(formatStatValue(42_100), "42.1K");
  assert.equal(
    formatStatValue(1234, (v) => `$${v}`),
    "$1234",
  );
});

test("win-loss discards magnitude and keeps gaps", () => {
  assert.deepEqual(winLoss([3, -2, 0, null, 8]), [1, -1, 0, null, 1]);
  // A different baseline reclassifies without touching magnitude.
  assert.deepEqual(winLoss([3, 5, 7], 5), [-1, 0, 1]);
});

test("a delta's spoken direction is its sign, never its tone", () => {
  // Churn falling is *down* and *an improvement* at once. Deriving the spoken
  // direction from the tone would announce a falling number as "up".
  const falling = { value: -0.31, percent: true, period: "vs last month" };
  const spoken = describeDelta(
    falling,
    deltaTone(falling.value, "down-is-good"),
  );
  assert.ok(spoken.startsWith("down "), spoken);
  assert.ok(spoken.includes("an improvement"), spoken);

  const rising = { value: 0.18, percent: true };
  const bad = describeDelta(rising, deltaTone(rising.value, "down-is-good"));
  assert.ok(bad.startsWith("up "), bad);
  assert.ok(bad.includes("a decline"), bad);
});

test("an unchanged delta says so without a direction or a quality", () => {
  const spoken = describeDelta(
    { value: 0, period: "vs last month" },
    "neutral",
  );
  assert.equal(spoken, "unchanged vs last month");
});
