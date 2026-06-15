import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("segmented control exposes radio semantics and checked state", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");

  assert.match(source, /accessibilityRole="radiogroup"/);
  assert.match(source, /accessibilityRole="radio"/);
  assert.match(
    source,
    /accessibilityState=\{\{ checked: selected, disabled \}\}/,
  );
  assert.match(source, /aria-checked=\{selected\}/);
});

test("segmented control keeps report and filter variants", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  assert.match(source, /"outline" \| "pill"/);
  assert.match(source, /"content" \| "equal"/);
  // Segments hug their labels by default; equal-width is opt-in.
  assert.match(source, /sizing = "content"/);
  for (const key of [
    "cellSelected",
    "contentSegment",
    "pillActive",
    "rowWrap",
    "track",
  ]) {
    assert.match(stylesSource, new RegExp(`\\b${key}:`));
  }
});

test("segmented control supports the shared size scale", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  assert.match(source, /size = "md"/);
  assert.match(source, /createSegmentedControlStyles\(theme, size\)/);
  // Each size sets a distinct cell type scale; `md` preserves the original 12/13.
  assert.match(stylesSource, /sm: \{[\s\S]*?cellFontSize: 11/);
  assert.match(stylesSource, /md: \{[\s\S]*?cellFontSize: 12/);
  assert.match(stylesSource, /md: \{[\s\S]*?pillFontSize: 13/);
  assert.match(stylesSource, /lg: \{[\s\S]*?cellFontSize: 14/);
});

test("segmented selected states are driven by shared theme tokens", () => {
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  assert.match(stylesSource, /theme\.colors\.primarySoft/);
  assert.match(stylesSource, /theme\.colors\.primaryDeep/);
  assert.match(stylesSource, /theme\.colors\.surface/);
  assert.match(stylesSource, /theme\.fonts\.sans/);
});

test("segmented control has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const segmentedSource = readSource("../../src/segmented/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/segmented"/);
  assert.match(segmentedSource, /SegmentedControl/);
  assert.match(packageJson, /"\.\/segmented"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
