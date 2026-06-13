import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("radio card exposes radio semantics and checked state", () => {
  const source = readSource("../../src/radio/RadioCard.tsx");

  assert.match(source, /accessibilityRole="radio"/);
  assert.match(
    source,
    /accessibilityState=\{\{ checked, disabled: disabledState \}\}/,
  );
  assert.match(source, /aria-checked=\{checked\}/);
});

test("radio card keeps read-only disabled state and focus treatment", () => {
  const source = readSource("../../src/radio/RadioCard.tsx");
  const stylesSource = readSource("../../src/radio/radioCardStyles.ts");

  assert.match(source, /disabledState = disabled \|\| !onPress/);
  assert.match(source, /disabled=\{disabledState\}/);
  assert.match(source, /useFocusRing/);
  assert.match(source, /hideWebOutlineView/);
  assert.match(stylesSource, /radioDisabled: \{ opacity: 0\.6 \}/);
});

test("radio card visuals are driven by shared theme tokens", () => {
  const stylesSource = readSource("../../src/radio/radioCardStyles.ts");

  assert.match(stylesSource, /theme\.colors\.border/);
  assert.match(stylesSource, /theme\.colors\.primarySoft/);
  assert.match(stylesSource, /theme\.colors\.primary/);
  assert.match(stylesSource, /theme\.colors\.muted/);
  assert.match(stylesSource, /theme\.fonts\.sans/);
  assert.match(stylesSource, /theme\.radii\.lg/);
});

test("radio card has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const radioSource = readSource("../../src/radio/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/radio"/);
  assert.match(radioSource, /RadioCard/);
  assert.match(packageJson, /"\.\/radio"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
