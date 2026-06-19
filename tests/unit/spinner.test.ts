import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("spinner exposes progressbar semantics and a busy state", () => {
  const source = readSource("../../src/spinner/Spinner.tsx");

  assert.match(source, /accessibilityRole="progressbar"/);
  assert.match(source, /accessibilityState=\{\{ busy: true \}\}/);
  assert.match(source, /aria-busy/);
  assert.match(source, /accessibilityLabel = "Loading"/);
});

test("spinner runs an Animated rotation loop and stops on unmount", () => {
  const source = readSource("../../src/spinner/Spinner.tsx");

  assert.match(source, /Animated\.loop\(/);
  assert.match(source, /Animated\.timing\(rotation/);
  assert.match(source, /easing: Easing\.linear/);
  assert.match(source, /useNativeDriver: Platform\.OS !== "web"/);
  assert.match(source, /spin\.start\(\)/);
  assert.match(source, /return \(\) => spin\.stop\(\)/);
  // The loop honours the documented 800ms default for one full rotation.
  assert.match(source, /duration = 800/);
  // The interpolated rotation drives a transform on the inner ring only.
  assert.match(source, /outputRange: \["0deg", "360deg"\]/);
  assert.match(source, /transform: \[\{ rotate \}\]/);
});

test("spinner draws the ring with react-native-svg so the arc renders on iOS", () => {
  const source = readSource("../../src/spinner/Spinner.tsx");

  // The single-edge CSS border trick collapses to a uniform color on a circle
  // on iOS, so the moving arc must be real SVG geometry instead.
  assert.match(source, /from "react-native-svg"/);
  assert.match(source, /import Svg, \{ Circle \} from "react-native-svg"/);
  // A faint full-circle track sits under the accent leading arc.
  assert.match(source, /stroke=\{track\}/);
  assert.match(source, /stroke=\{accent\}/);
  // The accent arc is a dashed segment with a rounded cap.
  assert.match(
    source,
    /strokeDasharray=\{`\$\{arc\} \$\{circumference - arc\}`\}/,
  );
  assert.match(source, /strokeLinecap="round"/);
  assert.match(source, /strokeWidth=\{thickness\}/);
});

test("spinner resolves the shared size scale and explicit pixel diameters", () => {
  const source = readSource("../../src/spinner/Spinner.tsx");
  const stylesSource = readSource("../../src/spinner/spinnerStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /resolveSpinnerSize\(size\)/);
  // The preset diameters cover the full sm/md/lg scale.
  assert.match(stylesSource, /sm: 16/);
  assert.match(stylesSource, /md: 24/);
  assert.match(stylesSource, /lg: 32/);
  // A numeric size overrides the preset, and the thickness scales from it.
  assert.match(
    stylesSource,
    /typeof size === "number" \? size : SPINNER_DIAMETERS\[size\]/,
  );
  assert.match(
    stylesSource,
    /thickness: Math\.max\(2, Math\.round\(diameter \/ 8\)\)/,
  );
});

test("spinner colors fall back to shared theme tokens", () => {
  const source = readSource("../../src/spinner/Spinner.tsx");

  assert.match(source, /color \?\? theme\.colors\.primary/);
  assert.match(source, /trackColor \?\? theme\.colors\.border2/);
});

test("spinner has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const spinnerSource = readSource("../../src/spinner/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/spinner"/);
  assert.match(spinnerSource, /Spinner/);
  assert.match(packageJson, /"\.\/spinner"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
