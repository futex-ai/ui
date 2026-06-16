import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  dispatchEscape,
  pushEscapeLayer,
  removeEscapeLayer,
  topEscapeLayer,
  type EscapeLayer,
} from "../../src/escapeLayer";

function trackedLayer(log: string[], name: string): EscapeLayer {
  return { onEscape: () => log.push(name) };
}

test("escape layer dispatch is a no-op with no open layers", () => {
  assert.equal(topEscapeLayer(), null);
  assert.equal(dispatchEscape(), false);
});

test("escape routes only to the top-most (most recently opened) layer", () => {
  const log: string[] = [];
  const modal = trackedLayer(log, "modal");
  const dropdown = trackedLayer(log, "dropdown");

  pushEscapeLayer(modal);
  pushEscapeLayer(dropdown);

  // The dropdown sits above the modal, so Escape closes the dropdown only —
  // this is the modal-with-nested-dropdown bug fix.
  assert.equal(topEscapeLayer(), dropdown);
  assert.equal(dispatchEscape(), true);
  assert.deepEqual(log, ["dropdown"]);

  // With the dropdown removed the modal becomes the top layer and now closes.
  removeEscapeLayer(dropdown);
  assert.equal(topEscapeLayer(), modal);
  assert.equal(dispatchEscape(), true);
  assert.deepEqual(log, ["dropdown", "modal"]);

  removeEscapeLayer(modal);
  assert.equal(topEscapeLayer(), null);
  assert.equal(dispatchEscape(), false);
});

test("removing a buried layer leaves the stack order intact", () => {
  const log: string[] = [];
  const a = trackedLayer(log, "a");
  const b = trackedLayer(log, "b");
  const c = trackedLayer(log, "c");

  pushEscapeLayer(a);
  pushEscapeLayer(b);
  pushEscapeLayer(c);

  // Removing the middle layer keeps c on top.
  removeEscapeLayer(b);
  assert.equal(topEscapeLayer(), c);

  removeEscapeLayer(c);
  assert.equal(topEscapeLayer(), a);

  removeEscapeLayer(a);
  assert.equal(topEscapeLayer(), null);
});

test("removing an unknown layer is harmless", () => {
  const log: string[] = [];
  const known = trackedLayer(log, "known");
  const stranger = trackedLayer(log, "stranger");

  pushEscapeLayer(known);
  removeEscapeLayer(stranger);
  assert.equal(topEscapeLayer(), known);

  removeEscapeLayer(known);
  assert.equal(topEscapeLayer(), null);
});

test("modal and dropdown route Escape through the shared layer stack", () => {
  const modalSource = readSource("../../src/modal/WebModalFrame.web.tsx");
  const dismissSource = readSource("../../src/dropdown/useDropdownDismiss.ts");

  // The modal no longer closes itself from its own Escape keydown handler; it
  // registers a layer instead, and its keydown listener only traps Tab focus.
  assert.match(modalSource, /pushEscapeLayer\(layer\)/);
  assert.match(modalSource, /onEscape: \(\) => requestClose\("escape"\)/);
  assert.doesNotMatch(modalSource, /event\.key === "Escape"/);

  // Dropdown surfaces register a layer that closes on Escape and no longer own
  // a private Escape keydown listener.
  assert.match(dismissSource, /pushEscapeLayer\(layer\)/);
  assert.match(dismissSource, /onEscape: \(\) => onCloseRef\.current\(\)/);
  assert.doesNotMatch(dismissSource, /event\.key !== "Escape"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
