import assert from "node:assert/strict";
import test from "node:test";

import {
  assetDurationLabel,
  describeAsset,
  filterAssets,
  groupAssets,
  type MediaAsset,
} from "../../src/video-editor/mediaBinModel";

const assets: MediaAsset[] = [
  {
    badge: "ProRes",
    duration: 22,
    group: "Footage",
    id: "harbour",
    kind: "video",
    name: "Harbour wide",
  },
  {
    duration: 40,
    group: "Footage",
    id: "interview",
    kind: "video",
    name: "Interview A",
  },
  {
    duration: 120,
    group: "Audio",
    id: "music",
    kind: "audio",
    name: "Music bed",
  },
  { id: "logo", kind: "image", name: "Logo card" },
];

test("an empty query matches everything, as a copy", () => {
  const all = filterAssets(assets, "");
  assert.equal(all.length, 4);
  assert.notEqual(all, assets);
  assert.deepEqual(filterAssets(assets, "   "), all);
});

test("filtering is case-insensitive across name, group, and badge", () => {
  assert.deepEqual(
    filterAssets(assets, "INTERVIEW").map((asset) => asset.id),
    ["interview"],
  );
  // The group name finds everything filed under it.
  assert.deepEqual(
    filterAssets(assets, "footage").map((asset) => asset.id),
    ["harbour", "interview"],
  );
  // So does a badge, which is where a codec or a take number lives.
  assert.deepEqual(
    filterAssets(assets, "prores").map((asset) => asset.id),
    ["harbour"],
  );
});

test("a query matching nothing returns nothing rather than everything", () => {
  assert.deepEqual(filterAssets(assets, "zzz"), []);
});

test("groups keep the order they were first seen in, not alphabetical order", () => {
  const groups = groupAssets(assets);
  assert.deepEqual(
    groups.map((group) => group.title),
    ["Footage", "Audio", "Media"],
  );
  assert.deepEqual(
    groups[0].assets.map((asset) => asset.id),
    ["harbour", "interview"],
  );
});

test("ungrouped assets collect under the caller's fallback title", () => {
  const groups = groupAssets([assets[3]], "Loose");
  assert.deepEqual(
    groups.map((group) => group.title),
    ["Loose"],
  );
});

test("grouping an empty bin yields no groups", () => {
  assert.deepEqual(groupAssets([]), []);
});

test("an asset is spoken with its kind, length, and badge", () => {
  assert.equal(describeAsset(assets[0]), "Harbour wide, video, 0:22, ProRes");
  assert.equal(describeAsset(assets[2]), "Music bed, audio, 2:00");
  // A still has no length to announce.
  assert.equal(describeAsset(assets[3]), "Logo card, image");
});

test("only assets with a real length carry a duration badge", () => {
  assert.equal(assetDurationLabel(assets[0]), "0:22");
  assert.equal(assetDurationLabel(assets[3]), null);
  assert.equal(
    assetDurationLabel({ duration: 0, id: "x", kind: "image", name: "x" }),
    null,
  );
});
