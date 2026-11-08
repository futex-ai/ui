import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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

test("input renders an info button after the label from labelInfo", () => {
  const source = readSource("../../src/input/Input.tsx");

  // The label + ⓘ share one row; the label <Text> keeps its own `nativeID` so
  // the input's accessible name stays the label text alone (not "Email + info").
  assert.match(source, /<View style=\{styles\.labelRow\}>/);
  assert.match(
    source,
    /<Text nativeID=\{labelId\} style=\{styles\.fieldLabel\}>/,
  );
  assert.match(
    source,
    /\{labelInfo \? \([\s\S]*?<LabelInfo[\s\S]*?info=\{labelInfo\}[\s\S]*?\) : null\}/,
  );
  // The button's default accessible name derives from the resolved visible name.
  assert.match(source, /More information about \$\{resolvedName\}/);
  // `labelInfo` without a `label` has nowhere to anchor, so it is a dev-warned
  // no-op rather than a silently-dropped prop.
  assert.match(source, /if \(labelInfo && label === undefined\)/);
  assert.match(source, /devWarn\(/);
});

test("label info exposes the detail on the button and reveals a visual-only bubble", () => {
  const source = readSource("../../src/input/LabelInfo.tsx");

  // The visible bubble reuses the shared Popover (portaled, so it escapes
  // overflow clipping) but purely as a sighted-user reveal: it must not steal
  // focus and its content is hidden from assistive tech (announced via the
  // button instead, so it is never read twice).
  assert.match(source, /import \{ Popover \} from "\.\.\/popover"/);
  assert.match(source, /<Popover/);
  assert.match(source, /manageFocus=\{false\}/);
  assert.match(source, /<Text aria-hidden style=\{styles\.labelInfoText\}>/);
  // The detail is the button's own accessible description, announced on focus
  // (WCAG 1.3.1 / 4.1.2): native reads `accessibilityHint`; web — where RNW
  // drops it — points a literal `aria-describedby` at a visually-hidden copy.
  assert.match(source, /accessibilityHint=\{info\}/);
  assert.match(
    source,
    /aria-describedby=\{isWeb \? descriptionId : undefined\}/,
  );
  assert.match(
    source,
    /<Text nativeID=\{descriptionId\} style=\{styles\.labelInfoDescription\}>/,
  );
  // The trigger is an accessible, keyboard-reachable button with its own ring.
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  assert.match(source, /\.\.\.focus\.focusRingProps/);
  assert.match(source, /focus\.focusRingVariables/);
  // The default glyph is lucide `Info`, overridable via the `icon` prop.
  assert.match(source, /icon: Icon = Info/);
});

test("textarea composes the labelled input as multiline", () => {
  const source = readSource("../../src/input/Textarea.tsx");

  assert.match(source, /Omit<InputProps, "multiline">/);
  assert.match(source, /numberOfLines = 4/);
  assert.match(source, /<Input multiline numberOfLines=\{numberOfLines\}/);
  // Auto-grow opt-in flows through: maxLines is a documented Textarea prop.
  assert.match(source, /maxLines\?: InputProps\["maxLines"\]/);
});

test("input styles are driven by shared theme tokens", () => {
  const source = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /backgroundColor: theme\.colors\.surface/);
  // The resting box edge uses `controlBorder` (a soft translucent-ink line)
  // rather than the decorative `border2`.
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
  assert.match(inputSource, /LabelInfo/);
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
