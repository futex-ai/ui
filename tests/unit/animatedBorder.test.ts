import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createAnimatedBorderTrail,
  resolveAnimatedBorderGeometry,
} from "../../src/animated-border/animatedBorderGeometry";

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
  // rounded-rect geometry stroked with react-native-svg. A circle/pill is just
  // the fully-rounded case of that rect, so one shape element covers every case.
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

test("animated border threads the shape into the geometry", () => {
  const source = readSource("../../src/animated-border/AnimatedBorder.tsx");

  // The shape defaults to a rounded rect and is passed straight into the single
  // geometry resolver, which turns `"circle"` into a fully-rounded rect (a true
  // circle when square, a stadium/pill when not).
  assert.match(source, /shape = "rounded-rect"/);
  assert.match(
    source,
    /resolveAnimatedBorderGeometry\(\{[\s\S]*?\bshape,[\s\S]*?\}\)/,
  );
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

test("resolveAnimatedBorderGeometry insets the stroke and clamps the radius", () => {
  const geo = resolveAnimatedBorderGeometry({
    borderRadius: 7,
    borderWidth: 1.2,
    height: 24,
    width: 24,
  });
  // The stroke is centered on the edge, so the rect is inset by half its width.
  assert.equal(geo.origin, 0.6);
  assert.equal(geo.rectWidth, 22.8);
  assert.equal(geo.rectHeight, 22.8);
  // Radius pulled in by half the stroke width and floored at 0.
  assert.equal(geo.radius, 6.4);
  // Straight edges (minus corners) plus the four quarter-circle corners.
  assertClose(geo.perimeter, 2 * (22.8 + 22.8) - 8 * 6.4 + 2 * Math.PI * 6.4);

  // The radius is clamped to half the shorter side, exactly as SVG clamps `rx`.
  const pill = resolveAnimatedBorderGeometry({
    borderRadius: 999,
    borderWidth: 2,
    height: 40,
    width: 200,
  });
  assert.equal(pill.radius, 19);
});

test("resolveAnimatedBorderGeometry shape=circle fully rounds the box", () => {
  // A square box traces a true circle: radius is the maximum (half the box),
  // `borderRadius` is ignored, and the perimeter is exactly the circumference.
  const disc = resolveAnimatedBorderGeometry({
    borderRadius: 0,
    borderWidth: 1.2,
    height: 24,
    shape: "circle",
    width: 24,
  });
  assert.equal(disc.radius, 11.4);
  assertClose(disc.perimeter, 2 * Math.PI * 11.4);

  // A non-square box traces an elongated stadium ("pill"): the radius is still
  // the maximum (half the SHORTER side), and the rect spans the FULL box — so
  // the trail follows the whole 72×40 outline, not a small centered circle
  // (the bug this fixes). The straight top/bottom edges make the perimeter
  // longer than a bare circle of the same radius.
  const pill = resolveAnimatedBorderGeometry({
    borderRadius: 0,
    borderWidth: 1.2,
    height: 40,
    shape: "circle",
    width: 72,
  });
  assert.equal(pill.radius, 19.4); // (40 - 1.2) / 2
  assert.equal(pill.rectWidth, 70.8); // spans the full width, not a 38.8 circle
  assert.equal(pill.rectHeight, 38.8);
  assert.ok(pill.perimeter > 2 * Math.PI * 19.4);
  assertClose(
    pill.perimeter,
    2 * (70.8 + 38.8) - 8 * 19.4 + 2 * Math.PI * 19.4,
  );

  // A degenerate (zero-size) box floors the radius and perimeter at 0.
  const empty = resolveAnimatedBorderGeometry({
    borderRadius: 0,
    borderWidth: 1.2,
    height: 0,
    shape: "circle",
    width: 0,
  });
  assert.equal(empty.radius, 0);
  assert.equal(empty.perimeter, 0);
});

test("createAnimatedBorderTrail fans a bright head into a fading tail", () => {
  const trail = createAnimatedBorderTrail(8, 3);
  assert.equal(trail.length, 8);

  // The head is the last layer: shortest dash, no lag, full opacity.
  const head = trail[trail.length - 1];
  assert.deepEqual(head, { dash: 3, key: "trail-1", lag: 0, opacity: 1 });

  // Earlier layers are one spacing longer and proportionally fainter.
  const oldest = trail[0];
  assert.deepEqual(oldest, {
    dash: 24,
    key: "trail-8",
    lag: 21,
    opacity: 1 / 8,
  });
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
  assert.match(borderSource, /animatedBorderGeometry/);
  assert.match(packageJson, /"\.\/animated-border"/);
});

function assertClose(actual: number, expected: number, epsilon = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`,
  );
}

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
