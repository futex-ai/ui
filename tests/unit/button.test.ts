import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("button exposes button semantics and a disabled state", () => {
  const source = readSource("../../src/button/Button.tsx");

  assert.match(source, /accessibilityRole="button"/);
  // The disabled state is exposed alongside the `busy` state (which keeps the
  // button focusable while blocking activation and announces `aria-busy`).
  assert.match(
    source,
    /accessibilityState=\{\{ busy, disabled: disabledState \}\}/,
  );
  assert.match(source, /aria-busy=\{busy \|\| undefined\}/);
  // A button without an onPress is a read-only disabled control.
  assert.match(source, /disabledState = disabled \|\| !onPress/);
  assert.match(source, /disabled=\{disabledState\}/);
});

test("button shows a tone-independent focus ring and hides the web outline", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  assert.match(source, /useFocusRing/);
  assert.match(source, /focus\.focused \? styles\.focusRing : null/);
  assert.match(source, /hideWebOutlineView/);
  // The ring is a box-shadow (visible on the primary tone, whose border already
  // matches the theme primary), not just a border-colour change.
  assert.match(stylesSource, /focusRing: \{[\s\S]*?boxShadow:/);
  assert.match(stylesSource, /theme\.colors\.primary/);
});

test("button renders an optional leading icon tinted and sized with the button", () => {
  const source = readSource("../../src/button/Button.tsx");

  // The icon is conditional, shares the tone's label colour, and uses the
  // per-size icon diameter. On web the decorative glyph is hidden from
  // assistive technology with `aria-hidden` (WCAG 2.1 — 1.1.1 decorative
  // content): the visible label, or the required `accessibilityLabel` on an
  // icon-only button, is the authoritative accessible name.
  assert.match(
    source,
    /<Icon aria-hidden color=\{labelColor\} size=\{buttonIconSize\(size\)\} \/>/,
  );
  assert.match(
    source,
    /<Icon color=\{labelColor\} size=\{buttonIconSize\(size\)\} \/>/,
  );
});

test("button label colour follows the tone", () => {
  const source = readSource("../../src/button/Button.tsx");

  // primary -> white, danger -> rose, ghost -> primaryDeep, secondary -> ink.
  assert.match(source, /tone === "primary"\s*\?\s*"#fff"/);
  assert.match(source, /theme\.colors\.rose/);
  assert.match(source, /theme\.colors\.primaryDeep/);
  assert.match(source, /theme\.colors\.ink/);
  assert.match(
    source,
    /<Text style=\{\[styles\.label, \{ color: labelColor \}\]\}>/,
  );
});

test("button tone and block styles layer over the base button", () => {
  const source = readSource("../../src/button/Button.tsx");

  assert.match(source, /tone === "primary" \? styles\.primary : null/);
  assert.match(source, /tone === "ghost" \? styles\.ghost : null/);
  assert.match(source, /tone === "danger" \? styles\.danger : null/);
  assert.match(source, /block \? styles\.block : null/);
});

test("button shows a per-tone hover state, suppressed when disabled", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // The style prop is a Pressable callback reading react-native-web's hovered flag.
  assert.match(source, /style=\{\(\{ hovered \}: PressableHoverState\) =>/);
  // Every tone has a hover style, gated off while the button is disabled or
  // busy (a busy button blocks activation, so its hover affordance is hidden).
  for (const tone of ["primary", "secondary", "ghost", "danger"]) {
    assert.match(
      source,
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

test("button supports the shared size scale", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createButtonStyles\(theme, size\)/);
  assert.match(source, /buttonIconSize\(size\)/);
  // Each size sets a distinct track height.
  assert.match(stylesSource, /sm: \{[\s\S]*?height: 30/);
  assert.match(stylesSource, /md: \{[\s\S]*?height: 38/);
  assert.match(stylesSource, /lg: \{[\s\S]*?height: 46/);
});

test("button styles are driven by shared theme tokens", () => {
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  assert.match(stylesSource, /backgroundColor: theme\.colors\.surface/);
  // The resting edge of the (secondary/default) control uses the dedicated
  // `controlBorder` token (a soft translucent-ink line) rather than the
  // decorative low-contrast `border2`.
  assert.match(stylesSource, /borderColor: theme\.colors\.controlBorder/);
  assert.match(stylesSource, /borderRadius: theme\.radii\.md/);
  assert.match(
    stylesSource,
    /primary: \{[\s\S]*?backgroundColor: theme\.colors\.primary/,
  );
  assert.match(
    stylesSource,
    /danger: \{ borderColor: theme\.colors\.roseSoft \}/,
  );
  assert.match(stylesSource, /theme\.fonts\.sans/);
});

test("button has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const buttonSource = readSource("../../src/button/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/button"/);
  assert.match(rootSource, /export \* from "\.\/controlSize"/);
  assert.match(buttonSource, /Button/);
  assert.match(packageJson, /"\.\/button"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
