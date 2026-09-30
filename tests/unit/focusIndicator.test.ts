import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("../../src", import.meta.url));

function readSource(path: string): string {
  return readFileSync(join(srcDir, path), "utf8");
}

/** Every non-story component source, keyed by its path under `src`. */
function componentSources(): [string, string][] {
  return readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .filter((path) => /\.tsx?$/.test(path) && !path.startsWith("stories"))
    .map((path) => [path, readSource(path)]);
}

test("ring-bearing controls forward focusIndicator into the hook", () => {
  // `focusIndicator` replaced the boolean `disableFocusRing`, which could only
  // fall back to the browser outline and never turn focus styling off.
  const callers = componentSources().filter(([, source]) =>
    /useFocusRing\(/.test(source),
  );
  assert.ok(callers.length > 30, "expected the ring-bearing controls");
  for (const [path, source] of componentSources()) {
    assert.doesNotMatch(source, /disableFocusRing/, path);
    assert.doesNotMatch(source, /useFocusRing\(\{[^}]*\bdisabled:/, path);
  }
  const forwarded = callers.filter(([, source]) =>
    /indicator: (?:props\.)?focusIndicator/.test(source),
  );
  assert.ok(
    forwarded.length >= 30,
    "each public focusIndicator prop reaches useFocusRing as `indicator`",
  );
});

test("none drops the focus-only borders and highlights", () => {
  // `none` means the control changes nothing visible on focus. Each of these
  // recolors a border or lights a handle on focus, so each gates it on the
  // resolved indicator while explicit state (`active`, an open popover) stays.
  assert.match(
    readSource("input/InputFrame.tsx"),
    /borderActive =\s*active \|\| \(focus\.focused && focus\.indicator !== "none"\)/,
  );
  assert.match(
    readSource("date/DateTrigger.tsx"),
    /field\.open \|\| \(focus\.focused && focus\.indicator !== "none"\)/,
  );
  assert.match(
    readSource("dropdown/ComboboxMultiSelect.tsx"),
    /focus\.focused && focus\.indicator !== "none"\s*\? styles\.controlActive/,
  );
  assert.match(
    readSource("data-grid/dataGridSelectEditors.tsx"),
    /focus\.focused && focus\.indicator !== "none"\s*\? inputStyles\.boxActive/,
  );
  assert.match(
    readSource("data-grid/DataGridResizeHandle.tsx"),
    /hovered \|\|\s*active \|\|\s*\(focus\.focused && focus\.indicator !== "none"\)/,
  );
});

test("the native rich text frame drops its focus border for none", () => {
  // `editorFocused` also shows the native toolbar, so only the border is gated.
  assert.match(
    readSource("rich-text/RichTextEditor.tsx"),
    /focusBorder=\{focus\.indicator !== "none"\}/,
  );
  const surface = readSource("rich-text/NativeRichTextEditorSurface.tsx");
  assert.match(
    surface,
    /editorFocused && focusBorder \? styles\.frameFocused : null/,
  );
  assert.match(surface, /visible: editorFocused/);
});
