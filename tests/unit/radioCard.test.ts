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

test("radio card handles space key activation on web", () => {
  const source = readSource("../../src/radio/RadioCard.tsx");

  assert.match(source, /keyProps = Platform\.OS === "web"/);
  assert.match(source, /onKeyDown: handleKeyDown/);
  assert.match(source, /\{\.\.\.keyProps\}/);
  assert.match(source, /key !== " " && key !== "Spacebar"/);
  assert.match(source, /event\.preventDefault\?\.\(\)/);
  assert.match(source, /onPress\?\.\(\)/);
});

test("radio card visuals are driven by shared theme tokens", () => {
  const stylesSource = readSource("../../src/radio/radioCardStyles.ts");

  // ≥3:1 control boundary token (WCAG 2.1 — 1.4.11) for the card edge and the
  // empty radio ring; replaces the decorative `border` divider token.
  assert.match(stylesSource, /theme\.colors\.controlBorder/);
  assert.match(stylesSource, /theme\.colors\.primarySoft/);
  assert.match(stylesSource, /theme\.colors\.primary/);
  // `ink2` (darker than `muted`) so ≤12px body text clears 4.5:1 on the tinted
  // `primarySoft` surface of a checked card (WCAG 2.1 — 1.4.3).
  assert.match(stylesSource, /theme\.colors\.ink2/);
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
