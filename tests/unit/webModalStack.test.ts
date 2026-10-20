/** DOM integration contracts that complement the pure stack model tests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LIVE_OVERLAY_ATTRIBUTE,
  LIVE_OVERLAY_DATA_SET,
} from "../../src/liveOverlay";
import {
  getWebModalRoot,
  WEB_MODAL_ROOT_ATTRIBUTE,
} from "../../src/modal/webModalRoot";
import {
  pushWebModalLayer,
  removeWebModalLayer,
  topWebModalLayer,
  type WebModalLayer,
} from "../../src/modal/webModalStack";
import { createDomProps } from "../../src/primitives/dom/domProps";

test("live-overlay dataSet key produces the shared DOM attribute", () => {
  const { props } = createDomProps(
    { dataSet: LIVE_OVERLAY_DATA_SET },
    { defaultElement: "div" },
  );
  assert.equal(LIVE_OVERLAY_ATTRIBUTE, "data-firna-live-overlay");
  assert.deepEqual(props, { [LIVE_OVERLAY_ATTRIBUTE]: "" });
});

test("root and stack are harmless without document", () => {
  const reads: string[] = [];
  const layer: WebModalLayer = {
    parent: null,
    root: () => {
      reads.push("root");
      return null;
    },
    surface: () => {
      reads.push("surface");
      return null;
    },
    initialFocusTarget: () => {
      reads.push("focus");
      return null;
    },
    requestClose: () => {
      reads.push("close");
    },
  };
  assert.equal(typeof document, "undefined");
  assert.equal(getWebModalRoot(), null);
  pushWebModalLayer(layer);
  removeWebModalLayer(layer);
  assert.equal(topWebModalLayer(), null);
  assert.deepEqual(reads, []);
});

test("modal root reuses connected or existing nodes and creates an unstyled div", () => {
  const source = readSource("../../src/modal/webModalRoot.ts");
  assert.equal(WEB_MODAL_ROOT_ATTRIBUTE, "data-firna-modal-root");
  assert.match(source, /root\?\.isConnected/);
  assert.match(
    source,
    /document\.querySelector<HTMLElement>\(`\[\$\{WEB_MODAL_ROOT_ATTRIBUTE\}\]`\)/,
  );
  assert.match(source, /document\.createElement\("div"\)/);
  assert.match(source, /root\.setAttribute\(WEB_MODAL_ROOT_ATTRIBUTE, ""\)/);
  assert.match(source, /document\.body\.appendChild\(root\)/);
  assert.doesNotMatch(source, /\.style|className/);
});

test("push snapshots the opener before marking anything inert", () => {
  const source = readSource("../../src/modal/webModalStack.ts");
  const snapshot = source.indexOf(
    "const activeElement = document.activeElement;",
  );
  const record = source.indexOf("const pushed = pushWebModalStack(");
  const marking = source.indexOf('node.setAttribute("inert", "")');
  assert.ok(snapshot >= 0 && snapshot < record && record < marking);
  assert.match(source, /activeElement !== document\.body/);
  assert.match(source, /activeElement !== document\.documentElement/);
  assert.match(
    source,
    /if \(pushed\.isTop\) \{\s*focusWebModalElement\(layer\.initialFocusTarget\(\)\)/,
  );
});

test("page nodes exclude the shared root and every marked live overlay", () => {
  const source = readSource("../../src/modal/webModalStack.ts");
  assert.match(source, /Array\.from\(document\.body\.children\)/);
  assert.match(
    source,
    /node instanceof HTMLElement &&\s*node !== root &&\s*!node\.hasAttribute\(LIVE_OVERLAY_ATTRIBUTE\)/,
  );
  assert.match(source, /for \(const node of pushed\.newlyMarked\)/);
  assert.match(source, /inert: node\.getAttribute\("inert"\)/);
  assert.match(source, /ariaHidden: node\.getAttribute\("aria-hidden"\)/);
  assert.match(source, /restoreAttribute\(node, "inert", prior\.inert\)/);
  assert.match(
    source,
    /restoreAttribute\(node, "aria-hidden", prior\.ariaHidden\)/,
  );
});

test("captured roots survive ref cleanup and follow model insertBefore moves", () => {
  const source = readSource("../../src/modal/webModalStack.ts");
  const removal = source.slice(
    source.indexOf("export function removeWebModalLayer"),
    source.indexOf("export function topWebModalLayer"),
  );
  assert.match(source, /layerRoots\.set\(layer, layer\.root\(\)\)/);
  assert.match(
    removal,
    /layerRoots\.get\(removedLayer\)\?\.contains\(element\)/,
  );
  assert.doesNotMatch(removal, /\.root\(\)/);
  assert.match(
    source,
    /if \(layer === top\) \{\s*root\.removeAttribute\("inert"\);\s*root\.removeAttribute\("aria-hidden"\)/,
  );
  assert.match(
    source,
    /root\.setAttribute\("inert", ""\);\s*root\.setAttribute\("aria-hidden", "true"\)/,
  );
  assert.match(source, /webModalRootMoves\(roots, currentOrder\)/);
  assert.match(source, /container\.insertBefore\(root, before\)/);
});

test("one capture-phase Tab listener follows first push and last removal", () => {
  const source = readSource("../../src/modal/webModalStack.ts");
  assert.equal(source.match(/document\.addEventListener/g)?.length, 1);
  assert.equal(source.match(/document\.removeEventListener/g)?.length, 1);
  assert.match(
    source,
    /if \(pushed\.pageLock === "lock"\) \{\s*document\.addEventListener\("keydown", handleKeyDown, true\)/,
  );
  assert.match(
    source,
    /if \(removal\.pageLock === "unlock"\) \{\s*document\.removeEventListener\("keydown", handleKeyDown, true\)/,
  );
  assert.match(
    source,
    /if \(event\.key === "Tab"\) \{\s*trapWebModalFocus\(event, topWebModalLayer\(\)\?\.surface\(\) \?\? null\)/,
  );
  assert.doesNotMatch(source, /event\.key === "Escape"/);
});

test("removal applies released nodes and layer roots before restoring focus", () => {
  const source = readSource("../../src/modal/webModalStack.ts");
  const removal = source.slice(
    source.indexOf("export function removeWebModalLayer"),
  );
  const release = removal.indexOf("restorePageNode(node)");
  const apply = removal.indexOf("applyLayerRoots()");
  const stop = removal.indexOf("document.removeEventListener");
  const restore = removal.indexOf("webModalRestoreCandidates(removal)");
  assert.ok(release >= 0 && release < apply && apply < stop && stop < restore);
  assert.match(
    source,
    /!element\.isConnected \|\| element\.closest\("\[inert\]"\)/,
  );
  assert.match(
    source,
    /focusWebModalElement\(element\);\s*return document\.activeElement === element/,
  );
  assert.match(
    removal,
    /if \(tryRestoreElement\(candidate\.element\)\) \{\s*return/,
  );
  assert.match(
    removal,
    /focusWebModalElement\(candidate\.layer\.initialFocusTarget\(\)\)/,
  );
});

test("stack modules remain internal to the modal implementation", () => {
  const source = readSource("../../src/modal/index.ts");
  assert.doesNotMatch(
    source,
    /webModalStack|webModalRoot|webModalFocusTrap|liveOverlay/,
  );
});

function readSource(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
