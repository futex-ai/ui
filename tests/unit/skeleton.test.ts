import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("skeleton placeholders are decorative on every platform", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  // The loading state is announced by the busy container, so each placeholder
  // is kept off the accessibility tree on web, iOS, and Android.
  assert.match(source, /aria-hidden/);
  assert.match(source, /accessibilityElementsHidden/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
});

test("skeleton sweeps a white sheen drawn with react-native-svg", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  // The sheen is real SVG geometry (a horizontal transparent → white →
  // transparent gradient) so it renders identically on iOS, Android, and web —
  // the same reason the Spinner uses react-native-svg.
  assert.match(
    source,
    /import Svg, \{ Defs, LinearGradient, Rect, Stop \} from "react-native-svg"/,
  );
  assert.match(source, /<LinearGradient id=\{gradientId\}/);
  assert.match(source, /stopOpacity=\{SKELETON_SHEEN_OPACITY\}/);
  assert.match(source, /fill=\{`url\(#\$\{gradientId\}\)`\}/);
  // The sheen is translated across the placeholder's measured width.
  assert.match(source, /onLayout/);
  assert.match(source, /transform: \[\{ translateX \}\]/);
  assert.match(source, /outputRange: \[-width, width\]/);
});

test("skeleton runs an Animated sweep loop and stops it on unmount", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  assert.match(source, /Animated\.loop\(/);
  assert.match(source, /Animated\.timing\(progress, \{/);
  assert.match(source, /easing: Easing\.inOut\(Easing\.ease\)/);
  assert.match(source, /useNativeDriver: Platform\.OS !== "web"/);
  assert.match(source, /loop\.start\(\)/);
  assert.match(source, /return \(\) => loop\.stop\(\)/);
});

test("skeleton honours reduced motion with a static placeholder", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  assert.match(source, /useReducedMotion/);
  // Both the standalone leaf path and the shared provider skip the loop, and a
  // reduced-motion placeholder renders no sweeping sheen.
  assert.match(source, /if \(shared \|\| reducedMotion\) \{/);
  assert.match(source, /animate: !reducedMotion/);
  assert.match(source, /const value = reducedMotion \? null : progress/);
  assert.match(source, /animate && width > 0 \?/);
});

test("skeleton shares one sweep across a group via context", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  assert.match(source, /SkeletonPulseContext = createContext/);
  assert.match(source, /export function SkeletonPulseProvider/);
  // A group provides the shared sweep so its children shimmer in unison.
  assert.match(source, /export function SkeletonGroup/);
  assert.match(source, /<SkeletonPulseProvider>/);
});

test("skeleton placeholder fill and radius come from shared theme tokens", () => {
  const stylesSource = readSource("../../src/skeleton/skeletonStyles.ts");

  // A faint `soft` base, clipped so the sheen stays inside the rounded shape.
  assert.match(
    stylesSource,
    /placeholder: \{ backgroundColor: theme\.colors\.soft, overflow: "hidden" \}/,
  );
  // The radius token resolves against the shared radii scale.
  assert.match(
    stylesSource,
    /typeof radius === "number" \? radius : theme\.radii\[radius\]/,
  );
});

test("skeleton has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const skeletonSource = readSource("../../src/skeleton/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/skeleton"/);
  assert.match(skeletonSource, /Skeleton/);
  assert.match(packageJson, /"\.\/skeleton"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
