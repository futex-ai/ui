import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("switch exposes switch semantics and checked state", () => {
  const source = readSource("../../src/switch/Switch.tsx");

  assert.match(source, /accessibilityRole="switch"/);
  assert.match(
    source,
    /accessibilityState=\{\{ checked: value, disabled: disabledState \}\}/,
  );
  assert.match(source, /aria-checked=\{value\}/);
});

test("switch keeps a real touch target and read-only disabled state", () => {
  const source = readSource("../../src/switch/Switch.tsx");
  const stylesSource = readSource("../../src/switch/switchStyles.ts");

  assert.match(source, /disabledState = disabled \|\| !onValueChange/);
  assert.match(source, /disabled=\{disabledState\}/);
  assert.match(source, /style=\{styles\.pressable\}/);
  assert.match(stylesSource, /height: 44/);
  assert.match(stylesSource, /width: 44/);
});

test("switch handles space key activation for web switch semantics", () => {
  const source = readSource("../../src/switch/Switch.tsx");

  assert.match(source, /keyProps = Platform\.OS === "web"/);
  assert.match(source, /onKeyDown: handleKeyDown/);
  assert.match(source, /\{\.\.\.keyProps\}/);
  assert.match(source, /key !== " " && key !== "Spacebar"/);
  assert.match(source, /event\.preventDefault\?\.\(\)/);
  assert.match(source, /toggle\(\)/);
});

test("switch knob animates between the off and on positions", () => {
  const source = readSource("../../src/switch/Switch.tsx");
  const stylesSource = readSource("../../src/switch/switchStyles.ts");

  assert.match(source, /transition: "left 0\.15s ease"/);
  assert.match(stylesSource, /width: 40/);
  assert.match(stylesSource, /height: 24/);
  assert.match(stylesSource, /left: 3/);
  assert.match(stylesSource, /knobOn: \{ left: 19 \}/);
});

test("switch states are driven by shared theme tokens", () => {
  const stylesSource = readSource("../../src/switch/switchStyles.ts");

  assert.match(stylesSource, /theme\.colors\.border2/);
  assert.match(stylesSource, /theme\.colors\.primary/);
  assert.match(stylesSource, /theme\.radii\.pill/);
});

test("switch has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const switchSource = readSource("../../src/switch/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/switch"/);
  assert.match(switchSource, /Switch/);
  assert.match(packageJson, /"\.\/switch"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
