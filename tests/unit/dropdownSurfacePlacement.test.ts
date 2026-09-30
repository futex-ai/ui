import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  dropdownMeasuringPlacement,
  dropdownPlacement,
} from "../../src/dropdown/dropdownGeometry";

const viewport = { height: 800, width: 1200 };
const ANCHOR_HEIGHT = 40;
/** Default gap to the anchor plus the default viewport margin. */
const EDGE_ALLOWANCE = 6 + 8;

/** An anchor with exactly `below` / `above` px of usable room on each side. */
function anchorWithRoom(below: number, above: number) {
  const y = above + EDGE_ALLOWANCE;
  const height = viewport.height - below - EDGE_ALLOWANCE - y;
  return { height, width: 200, x: 300, y };
}

test("a measured popup opens below when its whole height fits there", () => {
  const placement = dropdownPlacement(
    anchorWithRoom(300, 400),
    viewport,
    {},
    undefined,
    278,
  );

  assert.equal(placement.side, "bottom");
  assert.equal(placement.maxHeight, 300);
});

test("a measured popup flips above when only part of it fits below", () => {
  const anchor = anchorWithRoom(200, 400);

  // 200px clears the unmeasured 140px guess, which kept a taller popup below
  // and clipped it; its measured height sends it above, where it all fits.
  assert.equal(dropdownPlacement(anchor, viewport).side, "bottom");
  const placement = dropdownPlacement(anchor, viewport, {}, undefined, 278);
  assert.equal(placement.side, "top");
  assert.equal(placement.maxHeight, 320);
});

test("a short measured popup stays below with less room than the guess", () => {
  const anchor = anchorWithRoom(120, 400);

  assert.equal(dropdownPlacement(anchor, viewport).side, "top");
  assert.equal(
    dropdownPlacement(anchor, viewport, {}, undefined, 110).side,
    "bottom",
  );
});

test("a measured popup needs no more room than it may grow to", () => {
  // A long list measures taller than `maxHeight` but clamps there anyway, so
  // `maxHeight` of room below is enough.
  const placement = dropdownPlacement(
    anchorWithRoom(320, 400),
    viewport,
    { maxHeight: 320 },
    undefined,
    900,
  );

  assert.equal(placement.side, "bottom");
  assert.equal(placement.maxHeight, 320);
});

test("minHeight raises the room a measured popup needs below", () => {
  const anchor = anchorWithRoom(100, 400);

  assert.equal(
    dropdownPlacement(anchor, viewport, {}, undefined, 60).side,
    "bottom",
  );
  assert.equal(
    dropdownPlacement(anchor, viewport, { minHeight: 120 }, undefined, 60).side,
    "top",
  );
});

test("a measured popup that fits neither side takes the roomier one, clamped", () => {
  const above = dropdownPlacement(
    anchorWithRoom(150, 200),
    viewport,
    {},
    undefined,
    278,
  );
  const below = dropdownPlacement(
    anchorWithRoom(200, 150),
    viewport,
    {},
    undefined,
    278,
  );

  assert.equal(above.side, "top");
  assert.equal(above.maxHeight, 200);
  assert.equal(below.side, "bottom");
  assert.equal(below.maxHeight, 200);
});

test("the measuring placement is clamped only by maxHeight", () => {
  const anchor = anchorWithRoom(90, 120);

  assert.equal(dropdownPlacement(anchor, viewport).maxHeight, 120);
  assert.equal(dropdownMeasuringPlacement(anchor, viewport).maxHeight, 320);
  assert.equal(
    dropdownMeasuringPlacement(anchor, viewport, { maxHeight: 220 }).maxHeight,
    220,
  );
});

test("every web portal surface is placed by its measured height", () => {
  for (const path of [
    "../../src/dropdown/DropdownPortal.web.tsx",
    "../../src/dropdown/ComboboxPopover.web.tsx",
    "../../src/rich-text/SlashMenu.web.tsx",
  ]) {
    const source = readSource(path);
    assert.match(source, /useDropdownSurfacePlacement\(\s*surfaceRef,/, path);
    assert.doesNotMatch(source, /dropdownPlacement\(/, path);
  }
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
