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

test("skeleton runs an Animated pulse loop and stops it on unmount", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  assert.match(source, /Animated\.loop\(/);
  assert.match(source, /Animated\.sequence\(/);
  assert.match(source, /Animated\.timing\(progress/);
  assert.match(source, /easing: Easing\.inOut\(Easing\.ease\)/);
  assert.match(source, /useNativeDriver: Platform\.OS !== "web"/);
  assert.match(source, /loop\.start\(\)/);
  assert.match(source, /return \(\) => loop\.stop\(\)/);
  // The breathe animates opacity between the documented bounds.
  assert.match(
    source,
    /outputRange: \[SKELETON_OPACITY_MAX, SKELETON_OPACITY_MIN\]/,
  );
});

test("skeleton honours reduced motion with a static placeholder", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  assert.match(source, /useReducedMotion/);
  // Both the standalone leaf path and the shared provider skip the loop, and a
  // reduced-motion leaf renders the static opacity instead of an interpolation.
  assert.match(source, /if \(shared \|\| reducedMotion\) \{/);
  assert.match(source, /reducedMotion && !shared \? SKELETON_STATIC_OPACITY/);
  assert.match(source, /const value = reducedMotion \? null : progress/);
});

test("skeleton shares one pulse across a group via context", () => {
  const source = readSource("../../src/skeleton/Skeleton.tsx");

  assert.match(source, /SkeletonPulseContext = createContext/);
  assert.match(source, /export function SkeletonPulseProvider/);
  // A group provides the shared pulse so its children breathe in unison.
  assert.match(source, /export function SkeletonGroup/);
  assert.match(source, /<SkeletonPulseProvider>/);
});

test("skeleton placeholder fill and radius come from shared theme tokens", () => {
  const stylesSource = readSource("../../src/skeleton/skeletonStyles.ts");

  assert.match(
    stylesSource,
    /placeholder: \{ backgroundColor: theme\.colors\.border2 \}/,
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
