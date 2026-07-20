import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("input frame wires invalid + required a11y and the focus ring", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

  assert.match(source, /aria-invalid=\{invalid\}/);
  assert.match(source, /aria-required=\{required\}/);
  // The whole box gets the sage focus ring; the inner input hides its outline.
  // The ring is outset by default and inset (offset -2) when `focusRingInset` is
  // set, so a chrome-less field inside an overflow:hidden ancestor stays visible.
  assert.match(
    source,
    /const focus = useFocusRing\(focusRingInset \? \{ offset: -2 \} : \{\}\)/,
  );
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

test("input frame plain variant drops border/fill/padding, keeps the ring", () => {
  const source = readSource("../../src/input/InputFrame.tsx");
  const stylesSource = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /variant\?: "framed" \| "plain" \| "seamless"/);
  assert.match(source, /variant = "framed"/);
  assert.match(source, /const plain = variant === "plain"/);
  // The plain style layers before the active/invalid border so their border
  // colour is inert against the zeroed border width.
  assert.match(source, /plain \? styles\.boxPlain : null/);
  assert.match(
    stylesSource,
    /boxPlain: \{\s*backgroundColor: "transparent",\s*borderWidth: 0,\s*paddingHorizontal: 0,\s*\}/,
  );
  // The focus ring is still applied on focus (the plain box only strips chrome).
  assert.match(source, /focus\.focused \? focus\.focusRingStyle : null/);
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

test("input frame auto-grows a multiline field between numberOfLines and maxLines", () => {
  const source = readSource("../../src/input/InputFrame.tsx");

  // Auto-grow is gated on multiline + a maxLines cap above the numberOfLines
  // (min rows) floor, which defaults to two rows (one for a seamless field).
  assert.match(
    source,
    /const minRows = props\.numberOfLines \?\? \(seamlessMultiline \? 1 : 2\)/,
  );
  assert.match(
    source,
    /autoGrowEnabled =\s*seamlessMultiline \|\| \(multiline && maxLines != null && maxLines > minRows\)/,
  );
  // The row bounds convert to pixels via the shared helper and drive the hook.
  assert.match(
    source,
    /const maxRows = maxLines \?\? \(seamlessMultiline \? Infinity : minRows\)/,
  );
  assert.match(source, /autoGrowTextareaBounds\(size, minRows, maxRows\)/);
  assert.match(source, /useAutoGrowTextarea\(\{/);
  assert.match(source, /nodeRef: internalRef/);
  // The measured height style is layered over the fixed textarea min-height, and
  // native measurement is forwarded through onContentSizeChange.
  assert.match(source, /autoGrow\.style,/);
  assert.match(source, /autoGrow\.onContentSizeChange\?\.\(event\)/);
  assert.match(source, /props\.onContentSizeChange\?\.\(event\)/);
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
  // The focus ring still paints on focus (seamless only strips chrome), and a
  // chrome-less field can opt into an inset ring so an overflow:hidden ancestor
  // does not clip its only focus indicator (WCAG 2.4.7).
  assert.match(source, /focus\.focused \? focus\.focusRingStyle : null/);
  assert.match(
    source,
    /useFocusRing\(focusRingInset \? \{ offset: -2 \} : \{\}\)/,
  );
});

test("auto-grow hooks omit maxHeight when uncapped so a seamless field never scrolls", () => {
  const nativeSource = readSource("../../src/input/useAutoGrowTextarea.ts");
  const webSource = readSource("../../src/input/useAutoGrowTextarea.web.ts");

  // An Infinity max grows to fit all content: the applied style drops maxHeight
  // (both builds) so the field never scrolls / never renders an invalid height.
  for (const source of [nativeSource, webSource]) {
    assert.match(
      source,
      /Number\.isFinite\(maxHeight\)\s*\?\s*\{ lineHeight, minHeight, maxHeight, height \}\s*:\s*\{ lineHeight, minHeight, height \}/,
    );
  }
});

test("auto-grow bounds derive min/max pixel heights from the row counts", () => {
  const source = readSource("../../src/input/inputStyles.ts");

  assert.match(source, /textareaLineHeight: 18/);
  assert.match(source, /textareaLineHeight: 20/);
  assert.match(source, /textareaLineHeight: 22/);
  assert.match(source, /export function autoGrowTextareaBounds\(/);
  assert.match(source, /minHeight: lowRows \* lineHeight/);
  assert.match(source, /maxHeight: highRows \* lineHeight/);
});

test("native auto-grow stores raw content size and clamps at render", () => {
  const source = readSource("../../src/input/useAutoGrowTextarea.ts");

  assert.match(source, /onContentSizeChange = useCallback\(/);
  // The event stores the RAW content height; the clamp happens at render so a
  // later bounds change (maxLines / numberOfLines) re-derives the applied height.
  assert.match(
    source,
    /setContentHeight\(event\.nativeEvent\.contentSize\.height\)/,
  );
  assert.match(
    source,
    /const height = clamp\(contentHeight, minHeight, maxHeight\)/,
  );
  // Disabled fields render no extra height style.
  assert.match(source, /if \(!enabled\) \{\s*return \{ style: null \};/);
});

test("web auto-grow resets to auto before reading scrollHeight so it can shrink", () => {
  const source = readSource("../../src/input/useAutoGrowTextarea.web.ts");

  // The collapse-measure-restore dance: scrollHeight is pinned to clientHeight
  // (and floored by min-height) otherwise, so a naive read grows but never
  // shrinks below the min. Both height and min-height are neutralised.
  assert.match(source, /useLayoutEffect\(/);
  assert.match(source, /node\.style\.height = "auto"/);
  assert.match(source, /node\.style\.minHeight = "0px"/);
  assert.match(source, /const content = node\.scrollHeight/);
  assert.match(source, /node\.style\.height = appliedHeight/);
  // Raw content is stored and clamped at render (mirrors the native build).
  assert.match(source, /setContentHeight\(content\)/);
  assert.match(
    source,
    /const height = clamp\(contentHeight, minHeight, maxHeight\)/,
  );
  // Re-measures on value change and — via a width-only ResizeObserver — on
  // re-wrap from a resize/rotation, ignoring height-only notifications.
  assert.match(source, /\[enabled, value, nodeRef\]/);
  assert.match(source, /new ResizeObserver\(/);
  assert.match(source, /if \(width === lastWidth\) \{\s*return;/);
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
  assert.match(source, /focus\.focused \? focus\.focusRingStyle : null/);
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
