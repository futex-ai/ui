import assert from "node:assert/strict";
import test from "node:test";

import {
  accessibilitySweepShards,
  storiesForShard,
} from "../browser/a11ySharding";

test("the accessibility sweep is split into parallel CI-sized shards", () => {
  assert.deepEqual(accessibilitySweepShards(false), [
    { index: 0, total: 4 },
    { index: 1, total: 4 },
    { index: 2, total: 4 },
    { index: 3, total: 4 },
  ]);
});

test("baseline regeneration remains one complete, serial sweep", () => {
  assert.deepEqual(accessibilitySweepShards(true), [{ index: 0, total: 1 }]);
});

test("story shards are deterministic, balanced, and exhaustive", () => {
  const stories = Array.from({ length: 11 }, (_, index) => `story-${index}`);
  const shards = accessibilitySweepShards(false).map((shard) =>
    storiesForShard(stories, shard),
  );

  assert.deepEqual(shards, [
    ["story-0", "story-4", "story-8"],
    ["story-1", "story-5", "story-9"],
    ["story-2", "story-6", "story-10"],
    ["story-3", "story-7"],
  ]);
  assert.deepEqual(shards.flat().sort(), [...stories].sort());
  assert.equal(Math.max(...shards.map(({ length }) => length)), 3);
  assert.equal(Math.min(...shards.map(({ length }) => length)), 2);
});
