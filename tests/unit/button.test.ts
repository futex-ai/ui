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
  // The web backend drops `accessibilityState` rather than translating it, so
  // the literal `aria-*` mirror is what actually reaches the DOM on web.
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
  // Spacebar activation is wired for the roles the web backend leaves unbound.
  assert.match(source, /const keyProps = buttonSpaceKeyProps\(\{/);
  assert.match(source, /\{\.\.\.keyProps\}/);
});

test("button exposes the shared CSS focus marker and variables", () => {
  const source = readSource("../../src/button/Button.tsx");

  // CSS, rather than render-time focus state, paints the shared glow.
  assert.match(source, /useFocusRing/);
  assert.match(source, /\.\.\.focus\.focusRingProps/);
  assert.match(source, /focus\.focusRingVariables/);
  assert.doesNotMatch(source, /focus\.focusVisible \? focus\.focusRingStyle/);
});

test("button renders an optional leading icon tinted and sized with the button", () => {
  // The slot markup lives in `ButtonContent`; `Button` resolves the tone colour
  // and the per-size diameter and hands them down.
  const source = readSource("../../src/button/ButtonContent.tsx");

  // The icon is conditional, shares the tone's label colour, and uses the
  // per-size icon diameter. On web the decorative glyph is hidden from
  // assistive technology with `aria-hidden` (WCAG 2.1 — 1.1.1 decorative
  // content): the visible label, or the required `accessibilityLabel` on an
  // icon-only button, is the authoritative accessible name.
  assert.match(
    source,
    /<Icon aria-hidden color=\{color\} size=\{iconSize\} \/>/,
  );
  assert.match(source, /<Icon color=\{color\} size=\{iconSize\} \/>/);
  assert.match(
    readSource("../../src/button/Button.tsx"),
    /iconSize=\{\s*touchFace \? touchControlMetrics\.iconSize : buttonIconSize\(size\)\s*\}/,
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

test("button renders a caller-supplied iconNode as-is, not inside Text", () => {
  const source = readSource("../../src/button/buttonProps.ts");
  const contentSource = readSource("../../src/button/ButtonContent.tsx");

  // iconNode takes precedence over a lucide icon and renders in a bare centred
  // View (never a <Text>), hidden from assistive tech on web. Pointer events are
  // disabled on that decorative wrapper so a caller-supplied focusable SVG
  // cannot take click focus away from the outer button. The trailing slot is
  // the same decorative contract, so both share one wrapper.
  assert.match(source, /iconNode\?: ReactNode;/);
  assert.match(contentSource, /iconNode != null \? \(/);
  assert.match(
    contentSource,
    /aria-hidden=\{Platform\.OS === "web" \? true : undefined\}/,
  );
  assert.match(contentSource, /pointerEvents="none"/);
  assert.match(contentSource, /style=\{styles\.iconNode\}/);
  // The bare node is rendered directly (no <Text> wrapper).
  assert.match(contentSource, />\s*\{children\}\s*<\/View>/);
  assert.match(
    contentSource,
    /<DecorativeSlot styles=\{styles\}>\{iconNode\}<\/DecorativeSlot>/,
  );
  // The no-visible-label union accepts a lucide `icon`, an `iconNode`, or a
  // caller-owned `content` card.
  assert.match(
    source,
    /\{ icon: IconComponent \}\s*\|\s*\{ iconNode: ReactNode \}\s*\|\s*\{ content: ReactNode \}/,
  );
});

test("button exposes its pressable for imperative focus", () => {
  const source = readSource("../../src/button/Button.tsx");

  // Named `buttonRef` rather than a forwarded `ref`, matching InputFrame's
  // `inputRef`. Callers need it to aim a modal's `initialFocusRef` at a footer
  // action — most often the safe one on a destructive confirmation.
  assert.match(
    readSource("../../src/button/buttonProps.ts"),
    /buttonRef\?: Ref<View>;/,
  );
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
