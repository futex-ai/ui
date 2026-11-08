import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
  const source = readSource("../../src/input/inputSizing.ts");

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

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
