import assert from "node:assert/strict";
import test from "node:test";

import {
  isRecordingSnapshots,
  snapshotSweepShards,
} from "../browser/snapshotSharding";

test("the snapshot sweep is split into parallel worker-sized shards", () => {
  assert.deepEqual(snapshotSweepShards(false), [
    { index: 0, total: 4 },
    { index: 1, total: 4 },
    { index: 2, total: 4 },
    { index: 3, total: 4 },
  ]);
});

test("recording baselines is one complete, serial sweep", () => {
  assert.deepEqual(snapshotSweepShards(true), [{ index: 0, total: 1 }]);
});

test("only SNAPSHOT_UPDATE=1 switches the sweep into recording mode", () => {
  assert.equal(isRecordingSnapshots({ SNAPSHOT_UPDATE: "1" }), true);
  assert.equal(isRecordingSnapshots({ SNAPSHOT_UPDATE: "0" }), false);
  assert.equal(isRecordingSnapshots({ SNAPSHOT_UPDATE: "true" }), false);
  assert.equal(isRecordingSnapshots({}), false);
});
