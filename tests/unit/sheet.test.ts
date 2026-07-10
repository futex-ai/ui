import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  SHEET_VIEWPORT_RATIO,
  sheetMaxHeight,
} from "../../src/sheet/sheetModel";

test("sheet body cap clamps to ~70% of the viewport", () => {
  // No explicit cap → just the viewport fraction.
  assert.equal(sheetMaxHeight(undefined, 1000), 700);
  // An explicit cap smaller than the fraction wins.
  assert.equal(sheetMaxHeight(360, 1000), 360);
  // An explicit cap larger than the fraction is clamped down to it.
  assert.equal(sheetMaxHeight(900, 1000), 700);
  // Rounded to a whole pixel and never negative.
  assert.equal(
    sheetMaxHeight(undefined, 933),
    Math.round(933 * SHEET_VIEWPORT_RATIO),
  );
  assert.equal(sheetMaxHeight(-50, 1000), 0);
});

test("native sheet composes the shared bottom-sheet shell, not gorhom directly", () => {
  const source = readSource("../../src/sheet/Sheet.tsx");
  const shellSource = readSource("../../src/sheet/BottomSheetShell.tsx");

  assert.match(source, /BottomSheetShell/);
  assert.match(source, /sheetMaxHeight/);
  assert.match(source, /sheetRef\.current\?\.close\(\)/);
  // The gorhom / gesture-handler wiring lives in the shell, not the sheet.
  assert.doesNotMatch(source, /@gorhom\/bottom-sheet/);
  assert.match(shellSource, /@gorhom\/bottom-sheet/);
  assert.match(shellSource, /enablePanDownToClose/);
  assert.match(shellSource, /GestureHandlerRootView/);
  assert.match(shellSource, /maxDynamicContentSize/);
});

test("web sheet reuses the modal frame bottom-sheet placement", () => {
  const source = readSource("../../src/sheet/Sheet.web.tsx");

  assert.match(source, /WebModalFrame/);
  assert.match(source, /placement="bottom-sheet"/);
  assert.doesNotMatch(source, /@gorhom\/bottom-sheet/);
});

test("public sheet entrypoint exports the component and sizing helper only", () => {
  const source = readSource("../../src/sheet/index.ts");

  assert.match(source, /\.\/Sheet/);
  assert.match(source, /sheetModel/);
  // The internal shell is not part of the public surface.
  assert.doesNotMatch(source, /BottomSheetShell/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
