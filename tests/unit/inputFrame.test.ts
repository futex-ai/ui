import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("input frame wires invalid + required a11y and the focus ring", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  // The props and the suffix adornment moved out of InputFrame.tsx; the
  // absence checks below still cover them.
  const frameSources = [
    source,
    readSource("../../src/input/inputFrameProps.ts"),
    readSource("../../src/input/SuffixAdornment.tsx"),
  ].join("\n");

  assert.match(source, /aria-invalid=\{invalid\}/);
  assert.match(source, /aria-required=\{required\}/);
  // The whole box gets the CSS focus ring; the inner input is marked as its
  // focus target so the fallback outline also lands on the visible frame.
  // The ring is outset by default and inset (offset -2) when `focusRingInset` is
  // set, so a chrome-less field inside an overflow:hidden ancestor stays visible.
  // `focusIndicator` (or the theme's default) picks the marker: the glow, the
  // UA outline on that frame, or no focus styling at all.
  assert.match(
    source,
    /useFocusRing\(\{[\s\S]*?focusRingInset \? \{ offset: -2 \} : \{\}[\s\S]*?indicator: focusIndicator[\s\S]*?\}\)/,
  );
  assert.match(source, /target: "descendant"/);
  assert.match(source, /\.\.\.focus\.focusRingProps/);
  assert.match(source, /\.\.\.focus\.focusTargetProps/);
  // `none` drops the focus border with the ring; an explicit `active` stays.
  assert.match(
    source,
    /borderActive =\s*active \|\| \(focus\.focused && focus\.indicator !== "none"\)/,
  );
  assert.match(source, /styles\.input,/);
  assert.doesNotMatch(frameSources, /focus\.ringEnabled \? hideWebOutline/);
  // The nested clear button keeps the browser's own outline: the frame's CSS
  // glow follows only the marked input, so hiding the outline would leave the
  // focused clear action with no indicator at all (WCAG 2.1 — 2.4.7).
  assert.doesNotMatch(frameSources, /hideWebOutlineView/);
  assert.match(
    source,
    /accessibilityLabel=\{clearLabel\}[\s\S]*?style=\{styles\.iconButton\}/,
  );
});

test("input frame border precedence is invalid, then active, else default", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

  assert.match(
    source,
    /invalid \? styles\.boxInvalid : borderActive \? styles\.boxActive : null/,
  );
});

test("input frame renders an accessible clear button gated on a value", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

  assert.match(
    source,
    /showClear = clearable && \(clearVisible \?\? Boolean\(props\.value\)\)/,
  );
  assert.match(source, /\{showClear \?/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /CircleX/);
  // Default clear behaviour empties the field via onChangeText, then returns
  // focus to the input.
  assert.match(source, /props\.onChangeText\?\.\(""\)/);
  assert.match(source, /internalRef\.current\?\.focus\(\)/);
});

test("input frame renders prefix and suffix icons", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

  assert.match(source, /prefixIcon: PrefixIcon/);
  assert.match(
    source,
    /<PrefixIcon color=\{theme\.colors\.muted\} size=\{iconSize\}/,
  );
  assert.match(source, /suffixIcon: SuffixIcon/);
  assert.match(source, /<SuffixAdornment/);
});

test("input frame supports the shared size scale", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  const stylesSource = readSource("../../src/input/inputSizing.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createInputStyles\(theme, size\)/);
  assert.match(source, /inputIconSize\(size\)/);
  // Each size sets a distinct box height (and scales the input/icons with it).
  assert.match(stylesSource, /sm: \{[\s\S]*?boxHeight: 32/);
  assert.match(stylesSource, /md: \{[\s\S]*?boxHeight: 40/);
  assert.match(stylesSource, /lg: \{[\s\S]*?boxHeight: 48/);
});

test("input frame plain variant drops border/fill/padding, keeps the ring", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  const propsSource = readSource("../../src/input/inputFrameProps.ts");
  const stylesSource = readSource("../../src/input/inputStyles.ts");

  assert.match(propsSource, /variant\?: "framed" \| "plain" \| "seamless"/);
  assert.match(source, /variant = "framed"/);
  assert.match(source, /const plain = variant === "plain"/);
  // The plain style layers before the active/invalid border so their border
  // colour is inert against the zeroed border width.
  assert.match(source, /plain \? styles\.boxPlain : null/);
  assert.match(
    stylesSource,
    /boxPlain: \{\s*backgroundColor: "transparent",\s*borderWidth: 0,\s*paddingHorizontal: 0,\s*\}/,
  );
  // The plain box keeps the static CSS focus marker.
  assert.match(source, /\.\.\.focus\.focusRingProps/);
});

test("input frame supports multiline textarea geometry", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  const stylesSource = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /multiline = Boolean\(props\.multiline\)/);
  assert.match(source, /multiline \? styles\.boxMultiline : null/);
  // Framed/plain multiline uses the fixed-height textarea geometry (the seamless
  // branch of the same selection is covered by the seamless test).
  assert.match(
    source,
    /multiline\s*\?\s*seamless\s*\?\s*styles\.textareaSeamless\s*:\s*styles\.textareaInput/,
  );
  assert.match(
    stylesSource,
    /boxMultiline: \{[\s\S]*?alignItems: "flex-start"/,
  );
  assert.match(
    stylesSource,
    /textareaInput: \{[\s\S]*?minHeight: sizing\.textareaInputMinHeight/,
  );
  assert.match(stylesSource, /textAlignVertical: "top"/);
});

test("input frame seamless variant drops chrome, height, and padding, grows to fit", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  const stylesSource = readSource("../../src/input/inputStyles.ts");

  // Seamless is a third `variant` alongside framed/plain, flagged separately.
  assert.match(source, /const seamless = variant === "seamless"/);
  assert.match(source, /const seamlessMultiline = seamless && multiline/);
  // Its box strips the reserved height AND all padding, and the layer ORDER is
  // load-bearing: boxSeamless must sit AFTER boxMultiline (so its zeroed vertical
  // padding wins) and BEFORE the invalid/active border (so their colour is inert
  // against the zeroed border width). A reorder would re-introduce padding/border.
  assert.match(
    source,
    /multiline \? styles\.boxMultiline : null,[\s\S]*?seamless \? styles\.boxSeamless : null,[\s\S]*?invalid \? styles\.boxInvalid/,
  );
  assert.match(
    stylesSource,
    /boxSeamless: \{\s*backgroundColor: "transparent",\s*borderWidth: 0,\s*minHeight: 0,\s*paddingHorizontal: 0,\s*paddingVertical: 0,\s*\}/,
  );
  // The input uses the height-less seamless text styles (single-line + textarea).
  assert.match(source, /seamless\s*\?\s*styles\.textareaSeamless/);
  assert.match(source, /seamless\s*\?\s*styles\.inputSeamless/);
  // The single-line seamless input sets NO fixed height and NO fixed lineHeight
  // (the tail runs fontSize -> minWidth -> paddingVertical), so a larger caller
  // fontSize is never clipped by a too-short line box.
  assert.match(
    stylesSource,
    /inputSeamless: \{[\s\S]*?fontSize: sizing\.inputFontSize,\s*minWidth: 0,\s*paddingVertical: 0,\s*\}/,
  );
  assert.match(
    stylesSource,
    /textareaSeamless: \{[\s\S]*?minHeight: sizing\.textareaLineHeight/,
  );
  // The CSS focus marker survives seamless chrome, and a
  // chrome-less field can opt into an inset ring so an overflow:hidden ancestor
  // does not clip its only focus indicator (WCAG 2.4.7).
  assert.match(source, /focus\.focusRingVariables/);
  assert.match(
    source,
    /useFocusRing\(\{[\s\S]*?focusRingInset \? \{ offset: -2 \} : \{\}[\s\S]*?indicator: focusIndicator[\s\S]*?\}\)/,
  );
});

test("a pressable suffix icon without a label is a mouse-only affordance", () => {
  const source = readSource("../../src/input/SuffixAdornment.tsx");

  // Labelled + onPress -> accessible button; onPress alone -> aria-hidden,
  // tabIndex -1; neither -> decorative aria-hidden View.
  assert.match(source, /if \(!onPress\) \{/);
  assert.match(source, /aria-hidden style=\{style\}/);
  assert.match(source, /if \(label\) \{/);
  assert.match(
    source,
    /<Pressable aria-hidden onPress=\{onPress\} style=\{style\} tabIndex=\{-1\}>/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
