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

test("web modal portals into the shared root and leaves focus to the stack", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");
  const focusSource = readSource("../../src/modal/webModalFocusTrap.ts");
  const portalSource = readSource("../../src/modal/WebModalPortal.web.tsx");
  const nativePortalFallback = readSource("../../src/modal/WebModalPortal.tsx");

  // The public portal stays a `document.body` portal for page content, while
  // the frame portals straight into the shared modal root.
  assert.match(portalSource, /createPortal/);
  assert.match(portalSource, /document\.body/);
  assert.match(source, /const root = visible \? getWebModalRoot\(\) : null/);
  assert.match(
    source,
    /createPortal\(\s*<WebModalLayerContext\.Provider value=\{layer\}>\s*\{modal\}\s*<\/WebModalLayerContext\.Provider>,\s*root,\s*\)/,
  );
  assert.doesNotMatch(source, /from "\.\/WebModalPortal"/);
  // The stack owns page inertness, the single Tab trap, and focus restore, so
  // the frame installs no keydown listener and marks nothing inert itself.
  assert.doesNotMatch(
    source,
    /document\.addEventListener|trapWebModalFocus|previousFocusRef|setAttribute\("inert"/,
  );
  assert.match(focusSource, /surface\.contains\(activeElement\)/);
  assert.match(source, /ref=\{layerRef\}/);
  assert.match(source, /role="dialog"/);
  // The web frame uses a DOM portal; the native portal stays a no-op because the
  // native frame renders through a React Native `Modal` instead.
  assert.doesNotMatch(
    nativePortalFallback,
    /createPortal|document\.body|<Modal|from "\.\.\/primitives\/reactNative"/,
  );
  assert.match(nativePortalFallback, /return null/);
});

test("web modal joins the stack in a passive effect with a parent-layer link", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");
  const hook = readSource("../../src/modal/useWebModalLayer.ts");

  assert.match(source, /const layer = useWebModalLayer\(\{/);
  // One stable layer per frame instance, linked to the enclosing frame, so a
  // nested dialog that registers first still ends up above its parent.
  assert.match(hook, /const parent = useContext\(WebModalLayerContext\)/);
  assert.match(hook, /const \[layer\] = useState<WebModalLayer>\(\(\) => \(\{/);
  // A passive effect, never a layout effect: an overlay that closes in the
  // same update returns focus in its passive cleanup, which React runs before
  // this push, so the push records that trigger as the dialog's opener.
  assert.match(
    hook,
    /useEffect\(\(\) => \{\s*if \(!visible\) \{\s*return;\s*\}\s*pushWebModalLayer\(layer\);\s*return \(\) => \{\s*removeWebModalLayer\(layer\);\s*\};\s*\}, \[layer, visible\]\)/,
  );
  assert.doesNotMatch(hook, /useLayoutEffect/);
  assert.match(hook, /root: \(\) => hostElement\(layerRef\)/);
  assert.match(hook, /surface: \(\) => hostElement\(surfaceRef\)/);
  assert.match(
    hook,
    /requestClose: \(source\) => requestCloseRef\.current\(source\)/,
  );
});

test("native modal frame renders an RN Modal sheet with native a11y containment", () => {
  const nativeSource = readSource("../../src/modal/WebModalFrame.tsx");

  assert.match(nativeSource, /from "\.\.\/primitives\/reactNative"/);
  assert.match(nativeSource, /<Modal/);
  assert.match(nativeSource, /animationType=/);
  assert.match(nativeSource, /onRequestClose=/);
  assert.match(nativeSource, /accessibilityViewIsModal/);
  assert.match(nativeSource, /webModalCanClose/);
  // No DOM APIs leak into the native build, and neither native modal file
  // reaches the web modal stack, its root, or React DOM.
  assert.doesNotMatch(nativeSource, /createPortal|document\.body/);
  for (const native of [
    nativeSource,
    readSource("../../src/modal/WebModalPortal.tsx"),
  ]) {
    assert.doesNotMatch(
      native,
      /webModalStack|webModalRoot|useWebModalLayer|react-dom/,
    );
  }
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
  const hook = readSource("../../src/modal/useWebModalLayer.ts");
  const focusSource = readSource("../../src/modal/webModalFocusTrap.ts");

  // An explicit `initialFocusRef` still wins; otherwise the frame picks the
  // first focusable the caller rendered, skipping the close button even though
  // it comes first in DOM order, and only then falls back to close/surface.
  assert.match(
    hook,
    /initialFocusTargetRef\.current\?\.current \?\?\s*webModalInitialFocusTarget\(\s*hostElement\(surfaceRef\),\s*hostElement\(closeButtonRef\),?\s*\)/,
  );
  assert.match(focusSource, /\(element\) => element !== closeButton/);
  assert.match(
    focusSource,
    /return callerControl \?\? closeButton \?\? surface/,
  );
});

test("web modal focus restore lifecycle is decoupled from close callback changes", () => {
  const source = readSource("../../src/modal/WebModalFrame.web.tsx");
  const hook = readSource("../../src/modal/useWebModalLayer.ts");

  assert.match(source, /onCloseRef\.current = onClose/);
  assert.match(source, /webModalCanClose\(closePolicyRef\.current, source\)/);
  assert.match(source, /}, \[visible\]\)/);
  // A new close callback never re-pushes the stack layer, which would move
  // focus: the layer reads the latest callback through a ref.
  assert.match(hook, /requestCloseRef\.current = requestClose/);
  assert.match(hook, /}, \[layer, visible\]\)/);
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
