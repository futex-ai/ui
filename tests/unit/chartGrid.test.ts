import assert from "node:assert/strict";
import test from "node:test";

import { sharedExtent } from "../../src/chart/chartFacets";
import {
  TEXTURE_ANGLES,
  texturePatternId,
  textureFill,
} from "../../src/chart/chartTextureModel";

test("small multiples share one domain across every facet", () => {
  // Facets on independent scales look comparable while being nothing of the
  // sort — that is the failure mode small multiples exist to avoid.
  const extent = sharedExtent([
    { data: [1, 2, 3] },
    { data: [10, 40] },
    { data: [5] },
  ]);
  assert.deepEqual(extent, [0, 40]);
});

test("the shared domain ignores gaps and survives empty input", () => {
  assert.deepEqual(sharedExtent([{ data: [null, 5] }]), [0, 5]);
  assert.deepEqual(sharedExtent([]), [0, 1]);
  assert.deepEqual(sharedExtent([{ data: [null] }]), [0, 1]);
});

test("a shared domain spanning negatives includes them", () => {
  assert.deepEqual(sharedExtent([{ data: [-20, 5] }]), [-20, 5]);
});

test("texture uses only the two permitted angles", () => {
  // Horizontal and vertical are excluded on purpose: they read as gridlines
  // and as bars respectively.
  assert.deepEqual([...TEXTURE_ANGLES], [45, 135]);
});

test("texture pattern ids are safe as SVG fragment references", () => {
  assert.equal(texturePatternId("simple"), "chart-texture-simple");
  // Ids come from caller data (API responses, CSV headers), so anything that
  // would break a url(#...) reference or inject markup is sanitised away.
  const hostile = texturePatternId('a b"/><script>');
  assert.match(hostile, /^chart-texture-[a-zA-Z0-9_-]+$/);
  for (const char of [" ", '"', "<", ">", "/"]) {
    assert.ok(!hostile.includes(char), `"${char}" survived sanitisation`);
  }
});

test("texture is off unless explicitly enabled", () => {
  assert.equal(textureFill("s", "#123456", false), "#123456");
  assert.equal(textureFill("s", "#123456", true), "url(#chart-texture-s)");
});
