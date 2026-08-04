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
  // Space *only*: react-native-web's press responder already presses Enter for
  // every role (on keyup), so claiming Enter here as well toggles twice and the
  // key goes dead. The browser test pins the behaviour; this pins the cause.
  assert.doesNotMatch(source, /key !== "Enter"/);
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
  assert.match(
    stylesSource,
    /knobOn: \{\s*backgroundColor: theme\.colors\.onSolid,\s*borderColor: theme\.colors\.onSolid,\s*left: knobOn,\s*\}/,
  );
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

test("switch off-track edge softens the control border over its grey fill", () => {
  const stylesSource = readSource("../../src/switch/switchStyles.ts");

  // Border-box paints the knob's own white fill behind its edge, so the knob
  // takes `controlBorder` at face value — the weight the token is tuned for.
  assert.match(
    stylesSource,
    /borderColor: theme\.colors\.controlBorder,\n\s*borderRadius: sizing\.knobSize/,
  );
  // The track paints its edge over the grey `border2` fill, where the same tint
  // composites about twice as dark, so it halves the alpha instead.
  assert.match(stylesSource, /const TRACK_EDGE_ALPHA_SCALE = 0\.5;/);
  assert.match(
    stylesSource,
    /borderColor: scaleAlpha\(\s*theme\.colors\.controlBorder,\s*TRACK_EDGE_ALPHA_SCALE,?\s*\)/,
  );
  // A non-`rgba()` override (hex, named color) falls through unscaled.
  assert.match(stylesSource, /if \(!match\) return color;/);
  // On the saturated `primary` track the `onSolid` knob carries itself, so the
  // edge is matched to the knob's fill rather than tinted.
  assert.match(
    stylesSource,
    /knobOn: \{\s*backgroundColor: theme\.colors\.onSolid,\s*borderColor: theme\.colors\.onSolid,/,
  );
  // The off-position knob is the one scheme branch: white on the light themes,
  // a light `ink` knob over the dark themes' dark `border2` track.
  assert.match(
    stylesSource,
    /backgroundColor:\s*theme\.scheme === "dark" \? theme\.colors\.ink : theme\.colors\.onSolid,/,
  );
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
