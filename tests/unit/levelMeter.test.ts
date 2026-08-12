import assert from "node:assert/strict";
import test from "node:test";

import {
  dbToFraction,
  describeLevel,
  fractionToDb,
  METER_MIN_DB,
  METER_PEAK_DB,
  METER_SCALE_TICKS,
  METER_WARN_DB,
  meterBands,
  zoneForDb,
} from "../../src/video-editor/levelMeterScale";

test("the scale spans silence to full scale", () => {
  assert.equal(dbToFraction(METER_MIN_DB), 0);
  assert.equal(dbToFraction(0), 1);
  assert.equal(dbToFraction(-100), 0);
  // Above 0dBFS is still full: a meter cannot show more than all of itself.
  assert.equal(dbToFraction(6), 1);
});

test("digital silence and bad readings land at the floor, not off the scale", () => {
  assert.equal(dbToFraction(Number.NEGATIVE_INFINITY), 0);
  assert.equal(dbToFraction(Number.NaN), 0);
  assert.equal(dbToFraction(Number.POSITIVE_INFINITY), 1);
});

test("the curve stretches the loud end where the detail is", () => {
  // -6dB is a tenth of the range in decibels but far more than a tenth of the
  // bar, which is the whole point of the curve.
  assert.ok(dbToFraction(-6) > 0.9);
  // -30dB is halfway down the decibel range but well under half the bar.
  assert.ok(dbToFraction(-30) < 0.75);
  // Still monotonic: louder is never shorter.
  let previous = -1;
  for (let db = METER_MIN_DB; db <= 0; db += 1) {
    const fraction = dbToFraction(db);
    assert.ok(fraction >= previous);
    previous = fraction;
  }
});

test("the scale round-trips through its inverse", () => {
  for (const db of [-60, -40, -18, -6, -1, 0]) {
    assert.ok(Math.abs(fractionToDb(dbToFraction(db)) - db) < 1e-9);
  }
});

test("a custom floor rescales the whole meter", () => {
  assert.equal(dbToFraction(-40, -40), 0);
  assert.equal(dbToFraction(0, -40), 1);
  // A positive "floor" is nonsense, so the default is used instead.
  assert.equal(dbToFraction(METER_MIN_DB, 12), 0);
});

test("zones split at the standard warning and peak levels", () => {
  assert.equal(zoneForDb(-30), "safe");
  assert.equal(zoneForDb(METER_WARN_DB), "warn");
  assert.equal(zoneForDb(-10), "warn");
  assert.equal(zoneForDb(METER_PEAK_DB), "peak");
  assert.equal(zoneForDb(-1), "peak");
});

test("a loud bar keeps its quiet zones rather than turning wholly red", () => {
  const bands = meterBands(-3);
  assert.deepEqual(
    bands.map((band) => band.zone),
    ["safe", "warn", "peak"],
  );
  // The bands tile the filled length with no gaps or overlaps.
  assert.equal(bands[0].start, 0);
  assert.equal(bands[0].end, bands[1].start);
  assert.equal(bands[1].end, bands[2].start);
  assert.ok(Math.abs(bands[2].end - dbToFraction(-3)) < 1e-9);
});

test("a quiet bar has only the safe zone, and silence has none", () => {
  assert.deepEqual(
    meterBands(-40).map((band) => band.zone),
    ["safe"],
  );
  assert.deepEqual(meterBands(METER_MIN_DB), []);
  assert.deepEqual(meterBands(Number.NEGATIVE_INFINITY), []);
});

test("a level is spoken with its channel and a real minus sign", () => {
  assert.equal(describeLevel("Left", -12), "Left, −12.0 dB");
  // A half rounds to the larger value, so -0.25 reads as -0.2 rather than
  // -0.3 — the JavaScript tie-break, pinned so it cannot drift silently.
  assert.equal(describeLevel("Right", -0.25), "Right, −0.2 dB");
  assert.equal(describeLevel("Left", 0), "Left, 0.0 dB");
  assert.equal(describeLevel("Left", Number.NEGATIVE_INFINITY), "Left, silent");
});

test("the scale ticks run quiet to loud, matching the bar's direction", () => {
  assert.deepEqual(
    [...METER_SCALE_TICKS],
    [...METER_SCALE_TICKS].sort((a, b) => a - b),
  );
  assert.equal(METER_SCALE_TICKS[0], METER_MIN_DB);
  assert.equal(METER_SCALE_TICKS[METER_SCALE_TICKS.length - 1], 0);
});
