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

  assert.match(dismissSource, /dropdownShouldClose/);
  assert.match(
    dismissSource,
    /document\.addEventListener\("pointerdown", handlePointerDown, true\)/,
  );
  assert.match(
    dismissSource,
    /document\.addEventListener\("keydown", handleKeyDown, true\)/,
  );
  assert.match(dismissSource, /event\.key !== "Escape"/);
  assert.match(dismissSource, /event\.stopPropagation\(\)/);
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
