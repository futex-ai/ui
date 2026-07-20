import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("segmented control exposes radio semantics and checked state", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");

  assert.match(source, /accessibilityRole="radiogroup"/);
  assert.match(source, /accessibilityRole="radio"/);
  assert.match(
    source,
    /accessibilityState=\{\{ checked: selected, disabled \}\}/,
  );
  assert.match(source, /aria-checked=\{selected\}/);
});

test("segment name defaults to the label and is overridable", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");

  assert.match(
    source,
    /accessibilityLabel=\{option\.accessibilityLabel \?\? option\.label\}/,
  );
});

test("segmented control keeps report and filter variants", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  assert.match(source, /"outline" \| "pill"/);
  assert.match(source, /"content" \| "equal"/);
  // The pill (tab-track) variant is the default; the outline filter-pill
  // variant is opt-in. Segments hug their labels by default; equal-width is
  // opt-in.
  assert.match(source, /variant = "pill"/);
  assert.match(source, /sizing = "content"/);
  for (const key of [
    "cellSelected",
    "contentSegment",
    "pillActive",
    "rowWrap",
    "track",
  ]) {
    assert.match(stylesSource, new RegExp(`\\b${key}:`));
  }
});

test("segmented pill selection slides between options", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  // Each pill is measured so the thumb can be placed over the selected box.
  assert.match(source, /onLayout=\{/);
  assert.match(source, /event\.nativeEvent\.layout/);
  assert.match(source, /setPillRects/);
  // A single absolutely-positioned thumb carries the raised `pillActive` look.
  assert.match(stylesSource, /\bpillThumb:/);
  assert.match(stylesSource, /position: "absolute"/);
  assert.match(source, /styles\.pillThumb/);
  assert.match(source, /testID="segmentedThumb"/);
  // The slide is a web-only CSS transition, dropped under reduced motion, like
  // the Switch knob.
  assert.match(source, /useReducedMotion/);
  assert.match(source, /transition: THUMB_TRANSITION/);
  assert.match(source, /THUMB_TRANSITION = `left \$\{THUMB_SLIDE\}/);
  // The slide is opt-outable via the `animated` prop (default true), and gated
  // on the prop, reduce-motion, and web together.
  assert.match(source, /animated\?: boolean;/);
  assert.match(source, /animated = true,/);
  assert.match(
    source,
    /const slide = animated && !reducedMotion && Platform\.OS === "web";/,
  );
  // The thumb is decorative — kept off the accessibility tree.
  assert.match(source, /aria-hidden/);
  // Measurements are keyed by option value (not array index), so a reorder does
  // not point the thumb at a different pill.
  assert.match(source, /onMeasure\(option\.value,/);
  // The thumb fades with the pill when a disabled option is the selected value.
  assert.match(source, /thumbDisabled \? styles\.disabled/);
});

test("segmented control supports the shared size scale", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  assert.match(source, /size = "md"/);
  assert.match(source, /createSegmentedControlStyles\(theme, size\)/);
  // Each size sets a distinct cell type scale; `md` preserves the original 12/13.
  assert.match(stylesSource, /sm: \{[\s\S]*?cellFontSize: 11/);
  assert.match(stylesSource, /md: \{[\s\S]*?cellFontSize: 12/);
  assert.match(stylesSource, /md: \{[\s\S]*?pillFontSize: 13/);
  assert.match(stylesSource, /lg: \{[\s\S]*?cellFontSize: 14/);
});

test("segmented selected states are driven by shared theme tokens", () => {
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  assert.match(stylesSource, /theme\.colors\.primarySoft/);
  assert.match(stylesSource, /theme\.colors\.primaryDeep/);
  assert.match(stylesSource, /theme\.colors\.surface/);
  assert.match(stylesSource, /theme\.fonts\.sans/);
});

test("segmented control renders an info button after the label from labelInfo", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  // The shared ⓘ affordance is reused from the input package, not re-built.
  assert.match(source, /import \{ LabelInfo \} from "\.\.\/input"/);
  // The label + ⓘ share one row; the ⓘ renders only when `labelInfo` is set.
  assert.match(source, /<View style=\{styles\.labelRow\}>/);
  assert.match(
    source,
    /\{labelInfo \? \([\s\S]*?<LabelInfo[\s\S]*?info=\{labelInfo\}[\s\S]*?\) : null\}/,
  );
  // The button's default accessible name derives from the visible label.
  assert.match(source, /More information about \$\{label\}/);
  // `labelInfo` without a `label` has nowhere to anchor: a dev-warned no-op.
  assert.match(source, /if \(labelInfo && !label\)/);
  assert.match(source, /devWarn\(/);
  assert.match(stylesSource, /labelRow: \{[\s\S]*?flexDirection: "row"/);
});

test("segmented options accept a leading lucide icon or a caller node", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");
  const stylesSource = readSource(
    "../../src/segmented/segmentedControlStyles.ts",
  );

  // The option carries an optional lucide `icon` (tinted) and an `iconNode`
  // escape hatch (rendered as-is, winning over `icon`).
  assert.match(source, /icon\?: LucideIcon;/);
  assert.match(source, /iconNode\?: ReactNode;/);
  assert.match(
    source,
    /option\.iconNode != null \? \(\s*option\.iconNode\s*\) : OptionIcon \? \(/,
  );
  // The lucide glyph is tinted to the resolved segment text colour and sized to
  // the control via the shared helper.
  assert.match(source, /<OptionIcon color=\{iconTint\} size=\{iconSize\} \/>/);
  assert.match(source, /const iconSize = segmentIconSize\(size\)/);
  assert.match(stylesSource, /export function segmentIconSize\(/);
  // The icon wrapper is hidden from assistive tech on web (the label names it).
  assert.match(
    source,
    /aria-hidden=\{Platform\.OS === "web" \? true : undefined\}/,
  );
  assert.match(stylesSource, /segmentIcon: \{ alignItems: "center"/);
  // Each pill/cell is a row so the icon sits beside the label.
  assert.match(stylesSource, /flexDirection: "row",\s*gap: sizing\.iconGap/);
});

test("segmented iconOnly hides labels while keeping the accessible name", () => {
  const source = readSource("../../src/segmented/SegmentedControl.tsx");

  assert.match(source, /iconOnly\?: boolean;/);
  assert.match(source, /iconOnly = false,/);
  // The visible label is dropped only when the segment actually has an icon.
  assert.match(source, /const showLabel = !iconOnly \|\| leadingIcon == null;/);
  assert.match(source, /\{showLabel \? \(/);
  // The accessible name still comes from the (hidden) label / its override.
  assert.match(
    source,
    /accessibilityLabel=\{option\.accessibilityLabel \?\? option\.label\}/,
  );
  // A label-only option under iconOnly is a dev-warned no-op, not a silent box.
  assert.match(source, /if \(iconOnly && options\.some\(/);
  assert.match(source, /devWarn\(/);
});

test("segmented control has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const segmentedSource = readSource("../../src/segmented/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/segmented"/);
  assert.match(segmentedSource, /SegmentedControl/);
  assert.match(packageJson, /"\.\/segmented"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
