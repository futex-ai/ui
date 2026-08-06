import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("status dot borrows the badge tone vocabulary instead of restating it", () => {
  const stylesSource = readSource("../../src/status-dot/statusDotStyles.ts");

  // Aliasing BadgeTone (rather than repeating the four members) is what makes
  // the two vocabularies impossible to drift apart.
  assert.match(
    stylesSource,
    /import type \{ BadgeTone \} from "\.\.\/badge\/badgeStyles"/,
  );
  assert.match(stylesSource, /export type StatusDotTone = BadgeTone/);
});

test("status dot tones resolve to the mid accents, not the soft/deep pairs", () => {
  const stylesSource = readSource("../../src/status-dot/statusDotStyles.ts");

  assert.match(stylesSource, /case "neutral":\s*return colors\.ink2/);
  assert.match(stylesSource, /case "primary":\s*return colors\.primary/);
  assert.match(stylesSource, /case "warning":\s*return colors\.amber/);
  assert.match(stylesSource, /case "danger":\s*return colors\.rose/);
});

test("status dot sizes follow the control-size scale with md at the workflow 9px", () => {
  const componentSource = readSource("../../src/status-dot/StatusDot.tsx");
  const stylesSource = readSource("../../src/status-dot/statusDotStyles.ts");

  assert.match(
    stylesSource,
    /const STATUS_DOT_SIZES: Record<ControlSize, number>/,
  );
  assert.match(stylesSource, /sm: 7,\s*md: 9,\s*lg: 11,/);
  assert.match(componentSource, /size = "md"/);
  assert.match(componentSource, /tone = "neutral"/);
  assert.match(componentSource, /pulse = false/);
  // A circle, radius from the theme rather than a hardcoded half-diameter.
  assert.match(stylesSource, /borderRadius: theme\.radii\.pill/);
  assert.match(stylesSource, /height: diameter,\s*width: diameter,/);
  // The visible circle fills the box rather than being the box, so the halo can
  // sit between them.
  assert.match(
    stylesSource,
    /fill: \{[\s\S]*?height: "100%",\s*width: "100%",/,
  );
});

test("status dot is decorative until a caller names it", () => {
  const source = readSource("../../src/status-dot/StatusDot.tsx");

  // No label means nothing to announce, so it hides on both platforms rather
  // than reporting as an unnamed image.
  assert.match(source, /const decorative = label === undefined/);
  assert.match(source, /accessibilityElementsHidden=\{decorative\}/);
  assert.match(source, /accessibilityLabel=\{label\}/);
  assert.match(
    source,
    /accessibilityRole=\{decorative \? undefined : "image"\}/,
  );
  assert.match(source, /aria-hidden=\{decorative \|\| undefined\}/);
  assert.match(
    source,
    /importantForAccessibility=\{decorative \? "no-hide-descendants" : undefined\}/,
  );
});

test("status dot layers a custom color over the resolved tone", () => {
  const source = readSource("../../src/status-dot/StatusDot.tsx");

  assert.match(
    source,
    /const fill = color \?\? resolveStatusDotColor\(theme\.colors, tone\)/,
  );
});

test("the pulse is a swelling halo, not a fade of the dot itself", () => {
  const source = readSource("../../src/status-dot/PulseHalo.tsx");

  // Reproduces the design system's `mcpulse` keyframes: a 1.6s cycle whose halo
  // starts at the dot's edge at 50% opacity and swells to 3-and-a-bit times the
  // dot as it fades out, resting for the remainder of the cycle.
  assert.match(source, /const PULSE_DURATION = 1600/);
  assert.match(source, /const HALO_OPACITY = 0\.5/);
  assert.match(source, /const HALO_SCALE = 20 \/ 6/);
  assert.match(source, /const SWELL = 0\.7/);
  assert.match(
    source,
    /outputRange: \[HALO_OPACITY, 0, 0\]/,
    "the halo fades out; the dot's own opacity never changes",
  );
  assert.match(source, /outputRange: \[1, HALO_SCALE, HALO_SCALE\]/);
  // Taken out of flow, so a ping never resizes the dot or the pill around it.
  assert.match(source, /position: "absolute"/);
});

test("the pulse honours reduced motion and stops on unmount", () => {
  const source = readSource("../../src/status-dot/PulseHalo.tsx");

  // Reduced motion drops the halo entirely rather than merely slowing it, so
  // the dot is simply solid.
  assert.match(source, /if \(reduceMotion\) \{\s*return null;/);
  assert.match(source, /loop\.stop\(\)/);
  // Native driver everywhere but web, matching the spinner.
  assert.match(source, /useNativeDriver: Platform\.OS !== "web"/);
});

test("badge and status dot share the halo rather than duplicating it", () => {
  const badgeSource = readSource("../../src/badge/Badge.tsx");
  const dotSource = readSource("../../src/status-dot/StatusDot.tsx");
  const workflowSource = readSource("../../src/workflow/WorkflowNode.tsx");

  assert.match(
    badgeSource,
    /import \{ PulseHalo \} from "\.\.\/status-dot\/PulseHalo"/,
  );
  assert.match(dotSource, /import \{ PulseHalo \} from "\.\/PulseHalo"/);
  // `pulse` is meaningless without a dot to ping.
  assert.match(badgeSource, /\{pulse \? <PulseHalo color=\{resolvedDotColor\}/);
  // The halo is an earlier sibling of the fill, so it paints behind the dot.
  assert.match(
    dotSource,
    /\{pulse \? <PulseHalo color=\{fill\} \/> : null\}\s*<View\s*style=\{\[styles\.fill/,
  );
  // The workflow keeps its run-status API and delegates the rendering.
  assert.match(
    workflowSource,
    /import \{ StatusDot \} from "\.\.\/status-dot"/,
  );
  assert.match(workflowSource, /pulse=\{status === "running"\}/);
  // No second Animated.loop survives in the graph.
  assert.ok(!/Animated\.loop/.test(workflowSource));
});

test("status dot has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const dotSource = readSource("../../src/status-dot/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/status-dot"/);
  assert.match(dotSource, /export \* from "\.\/StatusDot"/);
  assert.match(dotSource, /export \* from "\.\/statusDotStyles"/);
  assert.match(packageJson, /"\.\/status-dot"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
