import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("animated border hides itself from assistive technology on both platforms", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  // Decorative motion: aria-hidden on web, and the native a11y props on iOS /
  // Android — never the web `importantForAccessibility` leaking onto the DOM.
  assert.match(source, /Platform\.OS === "web"/);
  assert.match(source, /"aria-hidden": true/);
  assert.match(source, /accessibilityElementsHidden: true/);
  assert.match(source, /importantForAccessibility: "no"/);
  // Pointer events pass through to the content the border overlays.
  assert.match(source, /pointerEvents="none"/);
});

test("animated border runs an Animated trail loop and stops on unmount", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  assert.match(source, /Animated\.loop\(/);
  assert.match(source, /Animated\.timing\(progress/);
  assert.match(source, /easing: Easing\.linear/);
  // An SVG attribute cannot run on the native driver, so the loop is JS-driven.
  assert.match(source, /useNativeDriver: false/);
  assert.match(source, /animation\.start\(\)/);
  assert.match(source, /return \(\) => animation\.stop\(\)/);
  // A (re)started lap resets progress to 0 so a restart after a size/duration
  // change runs a full 0 → 1 rather than racing the remainder at double speed.
  assert.match(
    source,
    /progress\.setValue\(0\);\n\s*const animation = Animated\.loop\(/,
  );
  // The trail moves by animating strokeDashoffset along the path.
  assert.match(source, /strokeDashoffset=\{progress\.interpolate\(/);
  assert.match(source, /outputRange: \[layer\.lag, layer\.lag - perimeter\]/);
  assert.match(
    source,
    /strokeDasharray=\{\[layer\.dash, perimeter - layer\.dash\]\}/,
  );
});

test("animated border draws the trail with react-native-svg rects", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  // CSS gradient borders cannot follow a corner radius, so the trail is real
  // rounded-rect geometry stroked with react-native-svg.
  assert.match(source, /import Svg, \{ Rect \} from "react-native-svg"/);
  assert.match(source, /Animated\.createAnimatedComponent\(DomSafeRect\)/);
  // The Animated wrapper's `collapsable` prop is stripped before it reaches the
  // SVG node / the DOM, and the wrapper carries a displayName for devtools.
  assert.match(source, /collapsable: _collapsable/);
  assert.match(source, /DomSafeRect\.displayName = "DomSafeRect"/);
  assert.match(source, /strokeLinecap="round"/);
  assert.match(source, /strokeOpacity=\{layer\.opacity\}/);
});

test("animated border builds the animated rect lazily and only once", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  // createAnimatedComponent is undefined when the package is merely imported
  // under Node (the package-export smoke test), so it must not run at module
  // load — build it on first render and cache it so the component identity
  // stays stable across renders.
  assert.match(source, /let cachedAnimatedRect[^=]*= null/);
  assert.match(source, /function getAnimatedRect\(\)/);
  assert.match(source, /if \(cachedAnimatedRect === null\)/);
  assert.match(source, /cachedAnimatedRect = createAnimatedRect\(\)/);
  assert.match(source, /const AnimatedRect = getAnimatedRect\(\)/);
});

test("animated border honours reduced motion with a static outline", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  assert.match(source, /useReducedMotion/);
  assert.match(source, /const reduceMotion = useReducedMotion\(\)/);
  // Reduced motion holds the trail still instead of looping it.
  assert.match(source, /if \(reduceMotion\)/);
  assert.match(source, /progress\.setValue\(0\)/);
  // …and renders a single calm, undashed outline rather than the moving trail:
  // a bare <Rect> (not the AnimatedRect, which carries key/strokeDasharray).
  assert.match(source, /reduceMotion \? \(/);
  assert.match(
    source,
    /<Rect\s+fill="none"\s+height=\{rectHeight\}\s+rx=\{radius\}\s+stroke=\{stroke\}\s+strokeWidth=\{borderWidth\}/,
  );
});

test("animated border resolves rectangle geometry and the trail layers", () => {
  const source = readSource(
    "../../src/animated-border/animatedBorderStyles.ts",
  );

  // The stroke is centered on the edge, so the rect is inset by half the width.
  assert.match(source, /const origin = borderWidth \/ 2/);
  assert.match(source, /Math\.max\(width - borderWidth, 0\)/);
  assert.match(source, /Math\.max\(height - borderWidth, 0\)/);
  // The radius is clamped to half the shorter side, exactly as SVG clamps `rx`,
  // so the perimeter matches the drawn path for large radii (pills).
  assert.match(
    source,
    /const maxRadius = Math\.min\(rectWidth, rectHeight\) \/ 2/,
  );
  assert.match(
    source,
    /Math\.min\(\s*Math\.max\(borderRadius - borderWidth \/ 2, 0\),\s*maxRadius,?\s*\)/,
  );
  // Straight edges (minus the corners) plus the four quarter-circle corners.
  assert.match(
    source,
    /2 \* \(rectWidth \+ rectHeight\) - 8 \* radius \+ 2 \* Math\.PI \* radius/,
  );
  // The head is the bright short segment; earlier layers are longer and fainter.
  assert.match(source, /const order = count - index/);
  assert.match(source, /const dash = order \* spacing/);
  assert.match(source, /lag: dash - spacing/);
  assert.match(source, /opacity: 1 \/ order/);
});

test("animated border color falls back to the shared theme primary", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  assert.match(source, /useSharedUiTheme/);
  assert.match(source, /color \?\? theme\.colors\.primary/);
});

test("animated border can wrap content or render on its own", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  // No children → a standalone, positionable border box.
  assert.match(source, /if \(children == null\)/);
  // With children → an overlay pinned over the wrapped content.
  assert.match(source, /animatedBorderStyles\.overlay/);
  assert.match(source, /testID="animated-border"/);
  // Both `width` / `height` and a square `size` shorthand are accepted.
  assert.match(source, /width \?\? size \?\? 0/);
  assert.match(source, /height \?\? size \?\? 0/);
});

test("animated border has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const borderSource = readSource("../../src/animated-border/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/animated-border"/);
  assert.match(borderSource, /AnimatedBorder/);
  assert.match(packageJson, /"\.\/animated-border"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
