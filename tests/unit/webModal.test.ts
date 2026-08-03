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
  // The web frame uses a DOM portal; the native portal stays a no-op because the
  // native frame renders through a React Native `Modal` instead.
  assert.doesNotMatch(
    nativePortalFallback,
    /createPortal|document\.body|<Modal|from "react-native"/,
  );
  assert.match(nativePortalFallback, /return null/);
});

test("native modal frame renders an RN Modal sheet with native a11y containment", () => {
  const nativeSource = readSource("../../src/modal/WebModalFrame.tsx");

  assert.match(nativeSource, /from "react-native"/);
  assert.match(nativeSource, /<Modal/);
  assert.match(nativeSource, /animationType=/);
  assert.match(nativeSource, /onRequestClose=/);
  assert.match(nativeSource, /accessibilityViewIsModal/);
  assert.match(nativeSource, /webModalCanClose/);
  // No DOM APIs leak into the native build.
  assert.doesNotMatch(nativeSource, /createPortal|document\.body/);
});

test("native modal bottom sheet delegates to the shared sheet shell", () => {
  const nativeSource = readSource("../../src/modal/WebModalFrame.tsx");

  // The gorhom bottom-sheet mechanics now live in the shared shell, so the modal
  // reuses them instead of re-implementing the gesture/backdrop wiring.
  assert.match(nativeSource, /BottomSheetShell/);
  assert.doesNotMatch(nativeSource, /@gorhom\/bottom-sheet/);
});

test("native modal keeps non-scrolling sheet bodies out of a parent scroller", () => {
  const nativeSource = readSource("../../src/modal/WebModalFrame.tsx");
  const shellSource = readSource("../../src/sheet/BottomSheetShell.tsx");

  assert.match(nativeSource, /scroll=\{scroll\}/);
  assert.match(shellSource, /BottomSheetView/);
  assert.match(
    shellSource,
    /scroll \? \([\s\S]*<BottomSheetScrollView[\s\S]*<BottomSheetView/,
  );
});

test("web modal opens focus on caller content rather than the close button", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");

  // An explicit `initialFocusRef` still wins; otherwise the frame picks the
  // first focusable the caller rendered, skipping the close button even though
  // it comes first in DOM order, and only then falls back to close/surface.
  assert.match(
    source,
    /initialFocusTargetRef\.current\?\.current \?\?\s*webModalInitialFocusTarget\(surfaceRef, closeButtonRef\)/,
  );
  assert.match(source, /\(element\) => element !== closeButton/);
  assert.match(source, /return callerControl \?\? closeButton \?\? surface/);
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
