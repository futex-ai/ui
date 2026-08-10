import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("button exposes button semantics and a disabled state", () => {
  const source = readSource("../../src/button/Button.tsx");

  // `button` remains the announced role unless the caller re-points it.
  assert.match(source, /role = "button"/);
  assert.match(source, /accessibilityRole=\{semantics\.accessibilityRole\}/);
  // The disabled state is exposed alongside the `busy` state (which keeps the
  // button focusable while blocking activation and announces `aria-busy`).
  assert.match(source, /accessibilityState=\{semantics\.accessibilityState\}/);
  // react-native-web ignores `accessibilityState` on a Pressable, so the literal
  // `aria-*` mirror is what actually reaches the DOM on web.
  assert.match(source, /\{\.\.\.semantics\.ariaProps\}/);
  // A button without an onPress is a read-only disabled control.
  assert.match(source, /disabledState = disabled \|\| !onPress/);
  assert.match(source, /disabled=\{disabledState\}/);
});

test("button takes a caller role with the state that role must carry", () => {
  const source = readSource("../../src/button/Button.tsx");
  const semanticsSource = readSource("../../src/button/buttonSemantics.ts");

  // The role union covers the single-activation roles only, and excludes `link`
  // (a re-roled button has no href, so a real link should be an anchor).
  assert.match(
    semanticsSource,
    /export type ButtonRole =\s*\|\s*"button"\s*\|\s*"checkbox"\s*\|\s*"menuitem"\s*\|\s*"radio"\s*\|\s*"switch"\s*\|\s*"tab";/,
  );
  assert.doesNotMatch(semanticsSource, /\|\s*"link"/);
  // The role and its state are resolved by the pure semantics module, and a
  // pairing ARIA rejects is reported through the shared dev warning.
  assert.match(source, /const semantics = buttonSemantics\(semanticsInput\)/);
  assert.match(
    source,
    /for \(const warning of buttonSemanticsWarnings\(semanticsInput\)\)/,
  );
  assert.match(source, /devWarn\(warning\)/);
  // Spacebar activation is wired for the roles react-native-web leaves unbound.
  assert.match(source, /const keyProps = buttonSpaceKeyProps\(\{/);
  assert.match(source, /\{\.\.\.keyProps\}/);
});

test("button shows the shared tone-independent focus glow and hides the web outline", () => {
  const source = readSource("../../src/button/Button.tsx");

  // The focus indicator is the library's shared soft glow (`useFocusRing` →
  // `focusRingStyle`) — the same box-shadow ring input / switch / radio /
  // segmented use — applied on top of every tone so it stays visible even on
  // `primary` (whose border already matches the theme primary), with the
  // browser's default outline suppressed.
  assert.match(source, /useFocusRing/);
  assert.match(source, /focus\.focused \? focus\.focusRingStyle : null/);
  // The outline reset is web-only and skipped when the ring is disabled, so the
  // UA outline returns as the focus affordance.
  assert.match(source, /focus\.webOutlineReset/);
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

  // primary -> onSolid, danger -> rose, ghost -> primaryDeep, secondary -> ink.
  assert.match(source, /tone === "primary"\s*\?\s*theme\.colors\.onSolid/);
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

  // The style prop is a Pressable callback reading react-native-web's hovered /
  // pressed flags.
  assert.match(
    source,
    /style=\{\(\{ hovered, pressed \}: PressableHoverState\) =>/,
  );
  // Every tone has a hover style, gated off while the button is disabled or
  // busy (a busy button blocks activation, so its hover affordance is hidden).
  for (const tone of ["primary", "secondary", "ghost", "plain", "danger"]) {
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

test("button adds a borderless neutral `plain` tone with hover + pressed washes", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // `plain` joins the tone union and layers a transparent base like `ghost`.
  assert.match(
    source,
    /"danger" \| "ghost" \| "plain" \| "primary" \| "secondary"/,
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
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  assert.match(
    source,
    /export type ButtonShape = "circle" \| "rounded" \| "square"/,
  );
  assert.match(source, /shape = "rounded"/);
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
  assert.match(source, /inline\?: boolean;/);
  assert.match(source, /inline = false/);
  assert.match(
    source,
    /const inlineChip =\s*inline && !block && shape === "rounded" && minTouchTarget == null/,
  );
  assert.match(source, /inlineChip \? styles\.inline : null/);
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

test("button renders a caller-supplied iconNode as-is, not inside Text", () => {
  const source = readSource("../../src/button/Button.tsx");

  // iconNode takes precedence over a lucide icon and renders in a bare centred
  // View (never a <Text>), hidden from assistive tech on web. Pointer events are
  // disabled on that decorative wrapper so a caller-supplied focusable SVG
  // cannot take click focus away from the outer button.
  assert.match(source, /iconNode\?: ReactNode;/);
  assert.match(source, /iconNode != null \? \(/);
  assert.match(
    source,
    /aria-hidden=\{Platform\.OS === "web" \? true : undefined\}/,
  );
  assert.match(source, /pointerEvents="none"/);
  assert.match(source, /style=\{styles\.iconNode\}/);
  // The bare node is rendered directly (no <Text> wrapper).
  assert.match(source, />\s*\{iconNode\}\s*<\/View>/);
  // The icon-only union accepts either a lucide `icon` or an `iconNode`.
  assert.match(source, /\{ icon: LucideIcon \} \| \{ iconNode: ReactNode \}/);
});

test("button exposes its pressable for imperative focus", () => {
  const source = readSource("../../src/button/Button.tsx");

  // Named `buttonRef` rather than a forwarded `ref`, matching InputFrame's
  // `inputRef`. Callers need it to aim a modal's `initialFocusRef` at a footer
  // action — most often the safe one on a destructive confirmation.
  assert.match(source, /buttonRef\?: Ref<View>;/);
  assert.match(source, /ref=\{buttonRef\}/);
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
