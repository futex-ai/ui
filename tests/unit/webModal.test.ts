import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  WEB_MODAL_LAYERS,
  webModalClearsContent,
  webModalSurfaceClearsBackdrop,
} from "../../src/modal/modalLayers";
import {
  webModalCanClose,
  webModalMaxWidth,
} from "../../src/modal/webModalModel";

test("web modal layer order keeps content below modal and nested overlays above", () => {
  assert.equal(
    webModalClearsContent(WEB_MODAL_LAYERS.portal, WEB_MODAL_LAYERS.base),
    true,
  );
  assert.equal(
    webModalSurfaceClearsBackdrop(
      WEB_MODAL_LAYERS.surface,
      WEB_MODAL_LAYERS.backdrop,
    ),
    true,
  );
  assert.equal(WEB_MODAL_LAYERS.nestedOverlay > WEB_MODAL_LAYERS.surface, true);
});

test("web modal close policy honours disabled and non-dismissible states", () => {
  assert.equal(webModalCanClose({}, "escape"), true);
  assert.equal(webModalCanClose({ dismissible: false }, "escape"), false);
  assert.equal(webModalCanClose({ dismissible: false }, "backdrop"), false);
  assert.equal(webModalCanClose({ dismissible: false }, "closeButton"), true);
  assert.equal(webModalCanClose({ closeDisabled: true }, "closeButton"), false);
});

test("web modal size tokens are stable and ordered", () => {
  assert.equal(webModalMaxWidth("sm") < webModalMaxWidth("md"), true);
  assert.equal(webModalMaxWidth("md") < webModalMaxWidth("lg"), true);
});

test("web modal uses a document body portal with Escape and focus handling", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");
  const portalSource = readSource("../../src/modal/WebModalPortal.web.tsx");
  const nativeFallback = readSource("../../src/modal/WebModalFrame.tsx");
  const nativePortalFallback = readSource("../../src/modal/WebModalPortal.tsx");

  assert.match(portalSource, /createPortal/);
  assert.match(portalSource, /document\.body/);
  assert.match(source, /WebModalPortal/);
  assert.match(source, /document\.addEventListener\("keydown"/);
  assert.match(source, /surface\.contains\(activeElement\)/);
  assert.match(source, /previousFocusRef/);
  assert.match(source, /trapWebModalFocus/);
  assert.match(source, /event\.key === "Tab"/);
  assert.match(source, /role="dialog"/);
  assert.doesNotMatch(
    nativeFallback,
    /createPortal|document\.body|<Modal|from "react-native"/,
  );
  assert.doesNotMatch(
    nativePortalFallback,
    /createPortal|document\.body|<Modal|from "react-native"/,
  );
  assert.match(nativeFallback, /return null/);
  assert.match(nativePortalFallback, /return null/);
});

test("web modal focus restore lifecycle is decoupled from close callback changes", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");

  assert.match(source, /onCloseRef\.current = onClose/);
  assert.match(source, /webModalCanClose\(closePolicyRef\.current, source\)/);
  assert.match(source, /}, \[visible\]\)/);
});

test("web modal frame styles are theme-driven", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");
  const stylesSource = readSource("../../src/modal/webModalFrameStyles.ts");

  assert.match(source, /useSharedUiTheme/);
  assert.match(stylesSource, /theme\.colors\.surface/);
  assert.match(stylesSource, /theme\.radii\.lg/);
});

test("public modal entrypoint exports frame, portal, models, and layers", () => {
  const source = readSource("../../src/modal/index.ts");

  assert.match(source, /WebModalFrame/);
  assert.match(source, /WebModalPortal/);
  assert.match(source, /modalLayers/);
  assert.match(source, /webModalModel/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
