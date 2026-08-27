import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("selector dropdown keeps keyboard navigation active while open", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");
  const navigationSource = readSource(
    "../../src/dropdown/useDropdownSelectorNavigation.ts",
  );

  assert.match(selectorSource, /useDropdownSelectorNavigation/);
  assert.match(selectorSource, /activeId=\{navigation\.activeId\}/);
  assert.match(selectorSource, /onActiveIdChange=\{navigation\.setActiveId\}/);
  assert.match(navigationSource, /document\.addEventListener\("keydown"/);
  assert.match(navigationSource, /open \? activeId : selectedId/);
});

test("selector map variant supports invalid styling without error copy", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");
  const stylesSource = readSource(
    "../../src/dropdown/dropdownSelectorStyles.ts",
  );

  assert.match(selectorSource, /invalid: invalidProp = false/);
  assert.match(
    selectorSource,
    /invalid && variant === "map" \? styles\.mapInvalid : null/,
  );
  assert.match(stylesSource, /if \(variant === "map"\) return 210/);
});

test("selector labels are part of the accessible trigger name", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  assert.match(selectorSource, /selectorAccessibleLabel/);
  assert.match(selectorSource, /accessibilityLabel=\{accessibleLabel\}/);
});

test("selector exposes its trigger for imperative focus", () => {
  const selectorSource = readSource("../../src/dropdown/DropdownSelector.tsx");

  // Async forms need to move focus to the first field after their loading
  // placeholder is replaced. The selector keeps its own anchor ref for portal
  // placement while forwarding the same pressable to the caller.
  assert.match(selectorSource, /triggerRef\?: Ref<View>;/);
  assert.match(selectorSource, /const setTriggerRef = useCallback\(/);
  assert.match(selectorSource, /anchorRef\.current = node;/);
  assert.match(selectorSource, /ref=\{setTriggerRef\}/);
});

test("shared dropdown hover support bridges trigger and portal surface", () => {
  const modelSource = readSource("../../src/dropdown/dropdownPortalModel.ts");
  const webPortalSource = readSource(
    "../../src/dropdown/DropdownPortal.web.tsx",
  );
  const hoverSource = readSource("../../src/dropdown/useDropdownHover.ts");

  assert.match(modelSource, /surfaceHoverProps\?:/);
  assert.match(
    webPortalSource,
    /onPointerEnter=\{surfaceHoverProps\?\.onHoverIn\}/,
  );
  assert.match(
    webPortalSource,
    /onPointerLeave=\{surfaceHoverProps\?\.onHoverOut\}/,
  );
  assert.match(hoverSource, /triggerHoverProps/);
  assert.match(hoverSource, /surfaceHoverProps/);
  assert.match(hoverSource, /setTimeout/);
  assert.match(hoverSource, /clearTimeout/);
});

test("web dropdown portal is non-modal so the trigger keeps hover while open", () => {
  const webPortalSource = readSource(
    "../../src/dropdown/DropdownPortal.web.tsx",
  );
  const layerSource = readSource("../../src/dropdown/DropdownWebLayer.tsx");

  assert.doesNotMatch(webPortalSource, /<Modal/);
  assert.doesNotMatch(webPortalSource, /<Pressable/);
  assert.match(webPortalSource, /<DropdownWebLayer zIndex=\{zIndex\}>/);
  assert.match(webPortalSource, /useDropdownDismiss/);
  assert.match(layerSource, /createPortal/);
  assert.match(layerSource, /pointerEvents="box-none"/);
  assert.match(layerSource, /pointerEvents: "box-none"/);
});

test("web dropdown dismissal is document-level instead of a scrim", () => {
  const dismissSource = readSource("../../src/dropdown/useDropdownDismiss.ts");

  // Outside presses are still detected with a document-level pointerdown
  // listener (no scrim).
  assert.match(dismissSource, /dropdownShouldClose/);
  assert.match(
    dismissSource,
    /document\.addEventListener\("pointerdown", handlePointerDown, true\)/,
  );

  // Escape is no longer owned by a private keydown listener here; it goes
  // through the shared escape-layer stack so a menu opened inside a modal
  // dismisses without also closing the modal.
  assert.doesNotMatch(dismissSource, /addEventListener\("keydown"/);
  assert.match(dismissSource, /pushEscapeLayer\(layer\)/);
  assert.match(dismissSource, /removeEscapeLayer\(layer\)/);
  assert.match(dismissSource, /onEscape: \(\) => onCloseRef\.current\(\)/);
});

test("web dropdown dismissal keeps a nested overlay from closing its ancestor", () => {
  const dismissSource = readSource("../../src/dropdown/useDropdownDismiss.ts");

  // The open portal registers itself on the shared dismiss-layer stack and
  // treats descendant surfaces (e.g. a menu opened inside a popover, which
  // renders in its own sibling portal) as inside itself, so a press on a nested
  // option is not an outside press for the ancestor overlay.
  assert.match(dismissSource, /pushDropdownDismissLayer\(dismissLayer\)/);
  assert.match(dismissSource, /removeDropdownDismissLayer\(dismissLayer\)/);
  assert.match(dismissSource, /dropdownSurfacesAbove\(dismissLayer\)/);
  assert.match(dismissSource, /\.\.\.descendantSurfaces/);
});

test("web dropdown portal rescues hover when the surface mounts under a fast pointer", () => {
  const webPortalSource = readSource(
    "../../src/dropdown/DropdownPortal.web.tsx",
  );

  assert.match(
    webPortalSource,
    /document\.addEventListener\("pointermove", recordPoint, true\)/,
  );
  assert.match(webPortalSource, /dropdownPointWithinRects/);
  assert.match(webPortalSource, /getBoundingClientRect/);
  assert.match(webPortalSource, /onMouseEnter: surfaceHoverProps\.onHoverIn/);
  assert.match(webPortalSource, /onMouseLeave: surfaceHoverProps\.onHoverOut/);
});

test("native dropdown portal keeps the modal scrim close path", () => {
  const nativePortalSource = readSource(
    "../../src/dropdown/DropdownPortal.tsx",
  );

  assert.match(nativePortalSource, /<Modal animationType="none"/);
  assert.match(nativePortalSource, /onRequestClose=\{onClose\}/);
  assert.match(nativePortalSource, /accessibilityLabel="Close dropdown"/);
  assert.doesNotMatch(nativePortalSource, /document\.addEventListener/);
});

test("public dropdown entrypoint exports selector and layer helpers", () => {
  const source = readSource("../../src/dropdown/index.ts");

  assert.match(source, /DropdownSelector/);
  assert.match(source, /dropdownLayers/);
  assert.match(source, /dropdownGeometry/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
