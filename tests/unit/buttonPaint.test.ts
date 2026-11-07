/**
 * How the button paints: its label colour, its tone, hover, and pressed
 * layers, its shapes, and its inline chip. `buttonPaint.ts` holds them, so that
 * `LinkButton` paints with the same functions.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("button label colour follows the tone", () => {
  const source = readSource("../../src/button/Button.tsx");
  const paintSource = readSource("../../src/button/buttonPaint.ts");

  // primary -> onSolid, danger -> rose, ghost -> primaryDeep, secondary -> ink.
  assert.match(paintSource, /tone === "primary"\s*\?\s*theme\.colors\.onSolid/);
  assert.match(paintSource, /theme\.colors\.rose/);
  assert.match(paintSource, /theme\.colors\.primaryDeep/);
  assert.match(paintSource, /theme\.colors\.ink/);
  assert.match(
    readSource("../../src/button/ButtonContent.tsx"),
    /style=\{\[styles\.label, \{ color \}, labelStyle\]\}/,
  );
  assert.match(source, /color=\{labelColor\}/);
});

test("button tone and block styles layer over the base button", () => {
  const source = readSource("../../src/button/buttonPaint.ts");

  assert.match(source, /tone === "primary" \? styles\.primary : null/);
  assert.match(source, /tone === "ghost" \? styles\.ghost : null/);
  assert.match(source, /tone === "danger" \? styles\.danger : null/);
  assert.match(source, /block \? styles\.block : null/);
});

test("button shows a per-tone hover state, suppressed when disabled", () => {
  const source = readSource("../../src/button/Button.tsx");
  const paintSource = readSource("../../src/button/buttonPaint.ts");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // The style prop is a Pressable callback reading the web backend's hovered /
  // pressed flags.
  assert.match(
    source,
    /style=\{\(\{ hovered = false, pressed \}: PressableHoverState\) =>/,
  );
  // Every tone has a hover style, gated off while the button is disabled or
  // busy (a busy button blocks activation, so its hover affordance is hidden).
  for (const tone of ["primary", "secondary", "ghost", "plain", "danger"]) {
    assert.match(
      paintSource,
      new RegExp(`hovered && !disabledState && !busy && tone === "${tone}"`),
    );
  }
  // Hover treatments are theme tokens: the filled tone deepens, the neutral and
  // ghost tones gain a soft / accent wash, and danger firms its border to full
  // rose (keeping its fill so the rose label stays legible).
  assert.match(
    stylesSource,
    /primaryHover: \{[\s\S]*?backgroundColor: theme\.colors\.primaryDeep/,
  );
  assert.match(
    stylesSource,
    /secondaryHover: \{[\s\S]*?backgroundColor: theme\.colors\.soft/,
  );
  assert.match(
    stylesSource,
    /ghostHover: \{[\s\S]*?backgroundColor: theme\.colors\.primarySoft/,
  );
  assert.match(
    stylesSource,
    /dangerHover: \{[\s\S]*?borderColor: theme\.colors\.rose/,
  );
});

test("button adds a borderless neutral `plain` tone with hover + pressed washes", () => {
  const source = readSource("../../src/button/buttonPaint.ts");
  const propsSource = readSource("../../src/button/buttonProps.ts");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // `plain` joins the tone union and layers a transparent base like `ghost`.
  assert.match(
    propsSource,
    /export type ButtonTone =\s*\| "danger"\s*\| "ghost"\s*\| "onMedia"\s*\| "plain"\s*\| "primary"\s*\| "secondary";/,
  );
  assert.match(source, /tone === "plain" \? styles\.plain : null/);
  // The borderless tones (ghost + plain) take a pressed wash deeper than hover.
  assert.match(
    source,
    /pressed && !disabledState && !busy && tone === "ghost"\s*\? styles\.ghostPressed/,
  );
  assert.match(
    source,
    /pressed && !disabledState && !busy && tone === "plain"\s*\? styles\.plainPressed/,
  );
  assert.match(
    stylesSource,
    /plain: \{ backgroundColor: "transparent", borderColor: "transparent" \}/,
  );
  assert.match(
    stylesSource,
    /plainHover: \{ backgroundColor: theme\.colors\.soft \}/,
  );
  assert.match(
    stylesSource,
    /plainPressed: \{ backgroundColor: theme\.colors\.bg2 \}/,
  );
  assert.match(
    stylesSource,
    /ghostPressed: \{ backgroundColor: theme\.colors\.primaryBorder \}/,
  );
});

test("button renders square / circle icon-only shapes with a min tap target", () => {
  const source = readSource("../../src/button/buttonPaint.ts");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  assert.match(
    readSource("../../src/button/buttonProps.ts"),
    /export type ButtonShape = "circle" \| "rounded" \| "square"/,
  );
  assert.match(readSource("../../src/button/Button.tsx"), /shape = "rounded"/);
  // The 1:1 box derives from the per-size track height, floored at minTouchTarget.
  assert.match(
    source,
    /Math\.max\(buttonHeight\(size\), minTouchTarget \?\? 0\)/,
  );
  assert.match(
    source,
    /shape === "circle" \? \{ borderRadius: theme\.radii\.pill \}/,
  );
  // A bare minTouchTarget floors the tap target without forcing the aspect ratio.
  assert.match(source, /minHeight: minTouchTarget, minWidth: minTouchTarget/);
  // The shape override layers after `block` so a fixed square wins full-width.
  assert.match(source, /shapeStyle,/);
  assert.match(
    stylesSource,
    /export function buttonHeight\(size: ControlSize\)/,
  );
});

test("button renders a compact, line-height-neutral inline chip", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // The `inline` prop is declared, defaulted off, and gated to a plain text-flow
  // chip (rounded shape, no `block` / `minTouchTarget`) before it layers into the
  // style array — so its negative margin never leaks into the fixed-size layouts.
  assert.match(
    readSource("../../src/button/buttonProps.ts"),
    /inline\?: boolean;/,
  );
  assert.match(source, /inline = false/);
  assert.match(
    source,
    /const inlineChip =\s*inline && !block && shape === "rounded" && minTouchTarget == null/,
  );
  assert.match(
    readSource("../../src/button/buttonPaint.ts"),
    /inlineChip \? styles\.inline : null/,
  );
  // The inline style drops the fixed track height (`"auto"`, so the box hugs the
  // label) and collapses its margin box to the label line height by pulling the
  // tight padding — plus the 1px base border — back off with a negative
  // `marginVertical`.
  assert.match(stylesSource, /inline: \{[\s\S]*?height: "auto"/);
  assert.match(
    stylesSource,
    /marginVertical: -\(sizing\.inlinePaddingVertical \+ 1\)/,
  );
  assert.match(
    stylesSource,
    /paddingHorizontal: sizing\.inlinePaddingHorizontal/,
  );
  assert.match(stylesSource, /paddingVertical: sizing\.inlinePaddingVertical/);
  // Each size carries its own compact inline padding.
  for (const size of ["sm", "md", "lg"]) {
    assert.match(
      stylesSource,
      new RegExp(`${size}: \\{[\\s\\S]*?inlinePaddingVertical: \\d`),
    );
  }
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
