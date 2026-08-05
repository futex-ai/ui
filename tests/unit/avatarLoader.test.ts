import assert from "node:assert/strict";
import test from "node:test";

import { avatarLoaderSize } from "../../src/avatar/avatarLoader";
import { dotGridGeometry } from "../../src/loader/loaderGeometry";

test("the loader grid takes half the avatar box", () => {
  assert.equal(avatarLoaderSize(24), 12);
  assert.equal(avatarLoaderSize(32), 16);
  assert.equal(avatarLoaderSize(48), 24);
  assert.equal(avatarLoaderSize(64), 32);
});

test("the loader grid box is always whole pixels", () => {
  // The grid divides its box across three tracks, so a fractional box would
  // land the dots off-centre.
  assert.equal(avatarLoaderSize(25), 13);
  assert.equal(avatarLoaderSize(31), 16);
  assert.ok(Number.isInteger(avatarLoaderSize(37)));
});

test("the loader grid never outgrows a tiny avatar", () => {
  // `dotGridGeometry` reserves a whole pixel per gap before splitting the rest
  // across three tracks, so below six pixels the grid would overflow its box.
  assert.equal(avatarLoaderSize(8), 6);
  assert.equal(avatarLoaderSize(1), 6);
});

test("the loader grid fits inside the disc at every size", () => {
  for (const size of [12, 16, 24, 32, 40, 48, 64, 96]) {
    const { extent } = dotGridGeometry(avatarLoaderSize(size));
    assert.ok(
      extent <= size,
      `grid extent ${extent} overflows the ${size}px avatar box`,
    );
    // A circle is the tightest case: the grid has to clear the curve, not just
    // the bounding box, so it must fit the inscribed square (`size / √2`).
    assert.ok(
      extent <= size / Math.SQRT2,
      `grid extent ${extent} overflows the ${size}px circle's inscribed square`,
    );
  }
});
