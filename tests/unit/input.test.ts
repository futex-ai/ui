import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("input frame wires invalid + required a11y and the focus ring", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

  assert.match(source, /aria-invalid=\{invalid\}/);
  assert.match(source, /aria-required=\{required\}/);
  // The whole box gets the sage focus ring; the inner input hides its outline.
  assert.match(source, /const focus = useFocusRing\(\)/);
  assert.match(source, /borderActive = focus\.focused \|\| active/);
  assert.match(source, /styles\.input,/);
  assert.match(source, /hideWebOutline/);
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
  const stylesSource = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createInputStyles\(theme, size\)/);
  assert.match(source, /inputIconSize\(size\)/);
  // Each size sets a distinct box height (and scales the input/icons with it).
  assert.match(stylesSource, /sm: \{[\s\S]*?boxHeight: 32/);
  assert.match(stylesSource, /md: \{[\s\S]*?boxHeight: 40/);
  assert.match(stylesSource, /lg: \{[\s\S]*?boxHeight: 48/);
});

test("a pressable suffix icon without a label is a mouse-only affordance", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

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

test("input composes the frame with a label, error, and hint", () => {
  const source = readSource("../../src/input/Input.tsx");

  assert.match(source, /isInvalid = Boolean\(error\) \|\| invalid/);
  assert.match(source, /<InputFrame/);
  assert.match(source, /invalid=\{isInvalid\}/);
  assert.match(source, /required=\{required\}/);
  // The visible label names the input for assistive tech.
  assert.match(source, /accessibilityLabel=\{accessibilityLabel \?\? label\}/);
  // Required marker + label row, error message, hint message.
  assert.match(
    source,
    /\{required \? <Text style=\{styles\.required\}> \*<\/Text> : null\}/,
  );
  assert.match(
    source,
    /\{error \? <Text style=\{styles\.error\}>\{error\}<\/Text> : null\}/,
  );
  assert.match(
    source,
    /\{hint \? <Text style=\{styles\.hint\}>\{hint\}<\/Text> : null\}/,
  );
});

test("input styles are driven by shared theme tokens", () => {
  const source = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /backgroundColor: theme\.colors\.surface/);
  assert.match(source, /borderColor: theme\.colors\.border2/);
  assert.match(source, /borderRadius: theme\.radii\.md/);
  assert.match(source, /boxActive: \{ borderColor: theme\.colors\.primary \}/);
  assert.match(source, /boxInvalid: \{ borderColor: theme\.colors\.rose \}/);
});

test("input has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const inputSource = readSource("../../src/input/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/input"/);
  assert.match(inputSource, /Input/);
  assert.match(inputSource, /InputFrame/);
  assert.match(packageJson, /"\.\/input"/);
});

test("the date web trigger reuses the shared InputFrame", () => {
  const source = readSource("../../src/date/DateTrigger.tsx");

  // The web trigger no longer hand-rolls its own TextInput + icons; it renders
  // the shared box and supplies only the date behaviour.
  assert.match(
    source,
    /import \{ InputFrame, inputIconSize \} from "\.\.\/input"/,
  );
  assert.match(source, /<InputFrame/);
  assert.match(source, /suffixIcon=\{CalendarDays\}/);
  assert.match(source, /onSuffixIconPress=\{\(\) => field\.setOpen\(true\)\}/);
  assert.match(source, /clearAccessibilityLabel=\{`Clear \$\{label\}`\}/);
  assert.match(source, /active=\{field\.open \|\| editing\}/);
  // The trigger box and its native icons scale with the shared size prop.
  assert.match(source, /size=\{size\}/);
  // Clear visibility tracks the committed ISO value, not the typed buffer.
  assert.match(source, /clearVisible=\{Boolean\(field\.value\)\}/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
