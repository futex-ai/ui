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
  // The touch target scales with the size, staying >= 40px at the smallest.
  assert.match(stylesSource, /height: sizing\.touchTarget/);
  assert.match(stylesSource, /width: sizing\.touchTarget/);
  assert.match(stylesSource, /md: \{[\s\S]*?touchTarget: 44/);
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
  // `md` preserves the original 40×24 track, 3px inset, and 19px on-position.
  assert.match(stylesSource, /md: \{[\s\S]*?trackWidth: 40/);
  assert.match(stylesSource, /md: \{[\s\S]*?trackHeight: 24/);
  assert.match(stylesSource, /md: \{[\s\S]*?inset: 3/);
  assert.match(stylesSource, /md: \{[\s\S]*?knobOn: 19/);
  // The knob carries a 1px control border (border-box sizing), so the
  // on-position is pulled in by that border to stay flush against the far
  // track edge; the knobOn style is driven by that compensated offset.
  assert.match(stylesSource, /const knobOn = sizing\.knobOn - BORDER;/);
  assert.match(stylesSource, /knobOn: \{ left: knobOn \}/);
});

test("switch supports the shared size scale", () => {
  const source = readSource("../../src/switch/Switch.tsx");
  const stylesSource = readSource("../../src/switch/switchStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createSwitchStyles\(theme, size\)/);
  // Each size sets a distinct track width.
  assert.match(stylesSource, /sm: \{[\s\S]*?trackWidth: 32/);
  assert.match(stylesSource, /md: \{[\s\S]*?trackWidth: 40/);
  assert.match(stylesSource, /lg: \{[\s\S]*?trackWidth: 48/);
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
