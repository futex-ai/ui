import assert from "node:assert/strict";
import test from "node:test";

import {
  accessibilitySweepShards,
  storiesForShard,
} from "../browser/a11ySharding";

test("the accessibility sweep is split into parallel CI-sized shards", () => {
  assert.deepEqual(accessibilitySweepShards(false), [
    { index: 0, total: 16 },
    { index: 1, total: 16 },
    { index: 2, total: 16 },
    { index: 3, total: 16 },
    { index: 4, total: 16 },
    { index: 5, total: 16 },
    { index: 6, total: 16 },
    { index: 7, total: 16 },
    { index: 8, total: 16 },
    { index: 9, total: 16 },
    { index: 10, total: 16 },
    { index: 11, total: 16 },
    { index: 12, total: 16 },
    { index: 13, total: 16 },
    { index: 14, total: 16 },
    { index: 15, total: 16 },
  ]);
});

test("baseline regeneration remains one complete, serial sweep", () => {
  assert.deepEqual(accessibilitySweepShards(true), [{ index: 0, total: 1 }]);
});

test("story shards are deterministic, balanced, and exhaustive", () => {
  const stories = Array.from({ length: 35 }, (_, index) => `story-${index}`);
  const shards = accessibilitySweepShards(false).map((shard) =>
    storiesForShard(stories, shard),
  );

  assert.deepEqual(shards, [
    ["story-0", "story-16", "story-32"],
    ["story-1", "story-17", "story-33"],
    ["story-2", "story-18", "story-34"],
    ["story-3", "story-19"],
    ["story-4", "story-20"],
    ["story-5", "story-21"],
    ["story-6", "story-22"],
    ["story-7", "story-23"],
    ["story-8", "story-24"],
    ["story-9", "story-25"],
    ["story-10", "story-26"],
    ["story-11", "story-27"],
    ["story-12", "story-28"],
    ["story-13", "story-29"],
    ["story-14", "story-30"],
    ["story-15", "story-31"],
  ]);
  assert.deepEqual(shards.flat().sort(), [...stories].sort());
  assert.equal(Math.max(...shards.map(({ length }) => length)), 3);
  assert.equal(Math.min(...shards.map(({ length }) => length)), 2);
});
