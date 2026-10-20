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

test("public sheet entrypoint exports the component, its text input, and the sizing helper", () => {
  const source = readSource("../../src/sheet/index.ts");

  assert.match(source, /\.\/Sheet"/);
  assert.match(source, /\.\/SheetTextInput"/);
  assert.match(source, /sheetModel/);
  // The internal shell is not part of the public surface.
  assert.doesNotMatch(source, /BottomSheetShell/);
});

// The native sheet renders only on a device, so these native contracts are
// pinned in the source, like the shell test above.
test("the native sheet lets a tap reach a row while the keyboard is open", () => {
  const shellSource = readSource("../../src/sheet/BottomSheetShell.tsx");

  assert.match(
    shellSource,
    /<BottomSheetScrollView[\s\S]*?keyboardShouldPersistTaps="handled"/,
  );
});

test("the native sheet text input lifts the sheet only inside a sheet", () => {
  const native = readSource("../../src/sheet/SheetTextInput.tsx");
  const web = readSource("../../src/sheet/SheetTextInput.web.tsx");

  // Inside a gorhom sheet, gorhom's input sets the keyboard target that lifts
  // the sheet. Outside one, where gorhom's input throws, a plain input renders.
  assert.match(native, /BottomSheetTextInput/);
  assert.match(native, /useBottomSheetInternal\(true\) !== null/);
  assert.match(native, /if \(!insideSheet\)[\s\S]*?<TextInput /);
  assert.doesNotMatch(web, /@gorhom\/bottom-sheet/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
