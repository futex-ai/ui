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

test("input frame supports multiline textarea geometry", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  const stylesSource = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /multiline = Boolean\(props\.multiline\)/);
  assert.match(source, /multiline \? styles\.boxMultiline : null/);
  assert.match(source, /multiline \? styles\.textareaInput : styles\.input/);
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
  // The visible label names the input for assistive tech. The accessible name
  // IS the visible text: the label <Text> carries `nativeID={labelId}` and the
  // input references it via `aria-labelledby` (not an `aria-label` copy) so the
  // name matches what is shown — WCAG 2.1 2.5.3 Label in Name / 1.3.1 (A). An
  // explicit `accessibilityLabel` still wins; the resolved visible name
  // (`accessibilityLabel ?? label`) feeds the clear button's label.
  assert.match(source, /const resolvedName = accessibilityLabel \?\? label/);
  assert.match(
    source,
    /<Text nativeID=\{labelId\} style=\{styles\.fieldLabel\}>/,
  );
  assert.match(
    source,
    /aria-labelledby=\{[\s\S]*?accessibilityLabel === undefined && label !== undefined[\s\S]*?\? labelId[\s\S]*?\}/,
  );
  // Required marker: visual-only `*`, hidden from AT (the state is conveyed
  // programmatically via `aria-required`) so it does not leak into the input's
  // accessible name — WCAG 2.1 1.3.1 Info and Relationships (A).
  assert.match(
    source,
    /\{required \? \([\s\S]*?<Text aria-hidden style=\{styles\.required\}>[\s\S]*?\{" \*"\}[\s\S]*?<\/Text>[\s\S]*?\) : null\}/,
  );
  // Error message: announced as an assertive live region without moving focus —
  // WCAG 2.1 4.1.3 Status Messages (AA) — and tied to the input via `errorId`.
  assert.match(
    source,
    /\{error \? \([\s\S]*?<Text[\s\S]*?accessibilityRole="alert"[\s\S]*?nativeID=\{errorId\}[\s\S]*?style=\{styles\.error\}[\s\S]*?>[\s\S]*?\{error\}[\s\S]*?<\/Text>[\s\S]*?\) : null\}/,
  );
  // Hint message: tied to the input via `hintId` (consumed by `aria-describedby`).
  assert.match(
    source,
    /\{hint \? \([\s\S]*?<Text nativeID=\{hintId\} style=\{styles\.hint\}>[\s\S]*?\{hint\}[\s\S]*?<\/Text>[\s\S]*?\) : null\}/,
  );
});

test("textarea composes the labelled input as multiline", () => {
  const source = readSource("../../src/input/Textarea.tsx");

  assert.match(source, /Omit<InputProps, "multiline">/);
  assert.match(source, /numberOfLines = 4/);
  assert.match(source, /<Input multiline numberOfLines=\{numberOfLines\}/);
});

test("input styles are driven by shared theme tokens", () => {
  const source = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /backgroundColor: theme\.colors\.surface/);
  // The resting box edge uses `controlBorder` (≥3:1 against surface) rather than
  // the decorative `border2` (~1.45:1) — WCAG 2.1 1.4.11 Non-text Contrast (AA).
  assert.match(source, /borderColor: theme\.colors\.controlBorder/);
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
  assert.match(inputSource, /Textarea/);
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
