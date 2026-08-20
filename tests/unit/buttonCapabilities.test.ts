/**
 * The capabilities a consumer needed before it could stop hand-rolling a
 * `Pressable`: the press lifecycle, per-state styling, a tone for imagery, a
 * tap area independent of the visible box, and the label / slot hooks.
 *
 * Each test names the control that proved the gap, so a future change that
 * removes one of these can tell what it breaks.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("button exposes the whole press lifecycle, gated together by busy", () => {
  const source = readSource("../../src/button/Button.tsx");

  // Push-to-talk (a composer mic) needs the press to start and end, not just
  // fire: `onPressIn` / `onPressOut` / `onLongPress` / `delayLongPress`.
  for (const handler of ["onLongPress", "onPress", "onPressIn", "onPressOut"]) {
    assert.match(
      source,
      new RegExp(`${handler}=\\{busy \\? undefined : ${handler}\\}`),
      handler,
    );
  }
  assert.match(source, /delayLongPress=\{delayLongPress\}/);

  // The gesture event reaches the handler, so a menu trigger can open at the
  // pointer instead of wrapping the button in a View and measuring it. It is
  // optional because keyboard activation has no pointer — Space routes through
  // `activate` with no event at all.
  assert.match(
    source,
    /onPress\?: \(event\?: GestureResponderEvent\) => void;/,
  );
  assert.match(source, /activate: \(\) => onPress\?\.\(\)/);
});

test("every tone takes a pressed treatment, and style can react to state", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // The filled and bordered tones join the borderless ones in having press
  // feedback, so a press reads on every tone rather than only ghost / plain.
  for (const tone of ["primary", "secondary", "ghost", "plain", "danger"]) {
    assert.match(
      source,
      new RegExp(`pressed && !disabledState && !busy && tone === "${tone}"`),
      tone,
    );
  }
  // `primaryDeep` is already the darkest accent the theme contract defines, so
  // a pressed primary dims rather than deepening a second time; the neutral
  // tone mirrors `plain`, and danger keeps its fill and sharpens the edge.
  assert.match(stylesSource, /primaryPressed: \{ opacity: 0\.88 \}/);
  assert.match(
    stylesSource,
    /secondaryPressed: \{ backgroundColor: theme\.colors\.bg2 \}/,
  );
  assert.match(
    stylesSource,
    /dangerPressed: \{ borderColor: theme\.colors\.roseDeep \}/,
  );

  // A caller-supplied fill layers last and so erases the tone's own washes.
  // The functional `style` is how that caller puts press feedback back — the
  // navigator swipe tray dims its custom fills this way.
  assert.match(
    source,
    /style\?:\s*\| StyleProp<ViewStyle>\s*\| \(\(state: ButtonStateStyleArgs\) => StyleProp<ViewStyle>\);/,
  );
  assert.match(source, /typeof style === "function"/);
  for (const flag of ["busy", "disabled", "focused", "hovered", "pressed"]) {
    assert.match(
      source,
      new RegExp(
        `export type ButtonStateStyleArgs = \\{[\\s\\S]*?${flag}: boolean;`,
      ),
      flag,
    );
  }
});

test("the onMedia tone stays white in every scheme", () => {
  const source = readSource("../../src/button/Button.tsx");
  const stylesSource = readSource("../../src/button/buttonStyles.ts");

  // A control over photography (an image-preview close / download) has no
  // theme surface to sit on: every other tone disappears against the picture.
  assert.match(source, /\| "onMedia"/);
  assert.match(source, /tone === "onMedia" \? styles\.onMedia : null/);
  assert.match(
    source,
    /hovered && !disabledState && !busy && tone === "onMedia"/,
  );
  assert.match(
    source,
    /pressed && !disabledState && !busy && tone === "onMedia"/,
  );

  // The veils thicken rather than shifting hue, and the label is a fixed white
  // rather than `onSolid` — imagery is dark whichever scheme is mounted, so a
  // scheme-aware token would invert to dark text on dark media.
  assert.match(stylesSource, /fill: "rgba\(255, 255, 255, 0\.14\)"/);
  assert.match(stylesSource, /fillHover: "rgba\(255, 255, 255, 0\.2\)"/);
  assert.match(stylesSource, /fillPressed: "rgba\(255, 255, 255, 0\.24\)"/);
  assert.match(stylesSource, /label: "#ffffff"/);
  assert.match(source, /tone === "onMedia"\s*\?\s*onMediaLabelColor\(\)/);
  // Borderless: a hairline edge is invisible against a busy image.
  assert.match(stylesSource, /onMedia: \{[\s\S]*?borderColor: "transparent",/);
});

test("the tap area and the visible box are set independently", () => {
  const source = readSource("../../src/button/Button.tsx");

  // `hitSlop` grows the target without growing the control, so a compact glyph
  // can still meet a comfortable target (WCAG 2.1 — 2.5.5 / 2.5.8). The
  // navigator footer gear traded a 50px target for its visible 34px without it.
  assert.match(source, /hitSlop\?: number \| Insets;/);
  assert.match(source, /hitSlop=\{hitSlop\}/);
  // React Native reads `hitSlop` off the pressable, but react-native-web's
  // Pressable never reads the prop at all — only its legacy `Touchable` export
  // does — so on web the slop has to be drawn as an inset, transparent child
  // whose events bubble to the button. Without it the prop is silently inert
  // on the platform that asked for it.
  const expanderSource = readSource("../../src/button/HitSlopExpander.tsx");
  assert.match(source, /<HitSlopExpander hitSlop=\{hitSlop\} \/>/);
  assert.match(expanderSource, /Platform\.OS !== "web"/);
  assert.match(expanderSource, /expander: \{ position: "absolute" \}/);
  assert.match(expanderSource, /bottom: -insets\.bottom/);
  assert.match(expanderSource, /aria-hidden/);

  // `minTouchTarget` is a floor and can only grow the box, so a control a
  // design specs below the smallest size's 30px track was unreachable.
  // `boxSize` sets the 1:1 box outright, including below that floor.
  assert.match(source, /boxSize\?: number;/);
  assert.match(
    source,
    /boxSize \?\? Math\.max\(buttonHeight\(size\), minTouchTarget \?\? 0\)/,
  );
  // And a `minTouchTarget` below that floor is inert rather than wrong, so say
  // so in development instead of leaving a caller to wonder.
  assert.match(source, /minTouchTarget < buttonHeight\(size\)/);
  assert.match(source, /so it has no effect\. Use \` \+\s*"`boxSize`/);
});

test("the label and the row around it are open to the caller", () => {
  const source = readSource("../../src/button/Button.tsx");
  const contentSource = readSource("../../src/button/ButtonContent.tsx");

  // A single-line ellipsized label over arbitrary user text (an agent
  // instructions preview) needs `numberOfLines` on the library's own <Text>:
  // React Native ignores it on a nested one, so a caller cannot recover it.
  assert.match(source, /numberOfLines\?: number;/);
  assert.match(contentSource, /numberOfLines=\{numberOfLines\}/);
  // The caller's label style merges after the tone colour, so weight and colour
  // are reachable without nesting a <Text>.
  assert.match(source, /labelStyle\?: StyleProp<TextStyle>;/);
  assert.match(
    contentSource,
    /style=\{\[styles\.label, \{ color \}, labelStyle\]\}/,
  );

  // A trailing slot (a right-pinned chevron on a workspace selector) is the
  // same decorative contract as the leading one.
  assert.match(source, /trailing\?: ReactNode;/);
  assert.match(contentSource, /trailing != null \? \(/);

  // And a pressable card keeps the role, ring, and press handling while owning
  // its own layout outright.
  assert.match(source, /content\?: ReactNode;/);
  assert.match(
    contentSource,
    /if \(content != null\) \{\s*return <>\{content\}<\/>;/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
