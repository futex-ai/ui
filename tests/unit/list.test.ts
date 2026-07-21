import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("list draws a separator between items but never after the last", () => {
  const source = readSource("../../src/list/List.tsx");

  // The headline behaviour: the separator is gated on not being the last item.
  assert.match(source, /const last = index === items\.length - 1;/);
  assert.match(
    source,
    /separators && !last \? \(\s*<Separator inset=\{separatorInset\} styles=\{styles\} \/>/,
  );
});

test("list separators default on and can be turned off", () => {
  const source = readSource("../../src/list/List.tsx");

  assert.match(source, /separators = true/);
  assert.match(source, /separators\?: boolean;/);
});

test("list supports an optional separator inset", () => {
  const source = readSource("../../src/list/List.tsx");

  assert.match(source, /separatorInset\?: number;/);
  assert.match(source, /inset !== undefined \? \{ marginLeft: inset \} : null/);
});

test("list exposes list / listitem semantics with a presentational separator", () => {
  const source = readSource("../../src/list/List.tsx");

  // The container is a list; each item is a listitem; the divider is removed
  // from the accessibility tree so the list only owns its listitem children.
  assert.match(source, /role="list"/);
  assert.match(source, /<View role="listitem" style=\{styles\.item\}>/);
  assert.match(source, /accessibilityRole="none"/);
  assert.match(source, /aria-hidden/);
  assert.match(source, /role="none"/);
});

test("list renders plain static items without an onItemPress", () => {
  const source = readSource("../../src/list/List.tsx");

  assert.match(source, /onItemPress \? \(/);
  assert.match(source, /<View role="listitem" style=\{styles\.item\}>/);
});

test("list makes items pressable buttons when given onItemPress", () => {
  const source = readSource("../../src/list/List.tsx");

  // The pressable item mirrors the shared button / table row: a listitem
  // wrapper around a button, a disabled state, the focus ring, the hidden web
  // outline, and per-state hover / press.
  assert.match(source, /function PressableListItem/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ disabled \}\}/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /useFocusRing/);
  assert.match(
    source,
    /focus\.focused && focus\.ringEnabled \? styles\.itemFocused : null/,
  );
  assert.match(source, /focus\.webOutlineReset/);
  assert.match(
    source,
    /style=\{\(\{ hovered, pressed \}: PressableHoverState\) =>/,
  );
  assert.match(source, /hovered && !disabled \? styles\.itemHover : null/);
  assert.match(source, /pressed && !disabled \? styles\.itemPressed : null/);
  assert.match(source, /disabled \? styles\.itemDisabled : null/);
});

test("list item lays out leading, title, description, and trailing slots", () => {
  const source = readSource("../../src/list/ListItem.tsx");

  assert.match(source, /export function ListItem/);
  assert.match(source, /leading != null \?/);
  assert.match(source, /trailing != null \?/);
  // A string/number title or description gets the themed text; nodes render raw.
  assert.match(
    source,
    /isText\(title\) \? <Text style=\{styles\.itemTitle\}>\{title\}<\/Text> : title/,
  );
  assert.match(source, /isText\(description\) \?/);
  assert.match(
    source,
    /typeof value === "string" \|\| typeof value === "number"/,
  );
});

test("list item makes only the title column pressable, leaving trailing free", () => {
  const source = readSource("../../src/list/ListItem.tsx");
  const stylesSource = readSource("../../src/list/listStyles.ts");

  // `onPress` wraps ONLY the title/description column in a button; leading and
  // trailing stay outside the press target so a trailing control (a toggle)
  // remains independently interactive.
  assert.match(source, /onPress\?: \(\) => void;/);
  assert.match(source, /function PressableTitle/);
  assert.match(source, /onPress \? \(\s*<PressableTitle/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ disabled \}\}/);
  // The button still owns the shared focus ring + hidden outline + pressed dim.
  assert.match(source, /useFocusRing/);
  assert.match(source, /focus\.focused \? focus\.focusRingStyle : null/);
  assert.match(source, /focus\.webOutlineReset/);
  assert.match(
    source,
    /pressed && !disabled \? styles\.itemMainPressed : null/,
  );
  // A rich-node title with no accessibilityLabel is a dev-warned nameless button.
  assert.match(
    source,
    /accessibilityLabel \?\? \(isText\(title\) \? String\(title\) : undefined\)/,
  );
  assert.match(source, /if \(onPress && !resolvedName\)/);
  assert.match(source, /devWarn\(/);
  assert.match(stylesSource, /itemMainPressed: \{ opacity: 0\.6 \}/);
});

test("list supports the shared size scale", () => {
  const source = readSource("../../src/list/List.tsx");
  const stylesSource = readSource("../../src/list/listStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createListStyles\(theme, size\)/);
  // Each size sets a distinct item vertical padding.
  assert.match(stylesSource, /sm: \{[\s\S]*?paddingVertical: 10/);
  assert.match(stylesSource, /md: \{[\s\S]*?paddingVertical: 14/);
  assert.match(stylesSource, /lg: \{[\s\S]*?paddingVertical: 18/);
});

test("list styles are driven by shared theme tokens", () => {
  const stylesSource = readSource("../../src/list/listStyles.ts");

  assert.match(stylesSource, /color: theme\.colors\.ink/);
  assert.match(stylesSource, /color: theme\.colors\.muted/);
  assert.match(stylesSource, /theme\.fonts\.sans/);
  // The divider uses the decorative border token.
  assert.match(
    stylesSource,
    /separator: \{ backgroundColor: theme\.colors\.border, height: 1 \}/,
  );
  // The hover wash and inset focus ring use shared tokens.
  assert.match(
    stylesSource,
    /itemHover: \{ backgroundColor: theme\.colors\.soft \}/,
  );
  assert.match(stylesSource, /itemFocused: \{[\s\S]*?theme\.colors\.primary/);
});

test("list renders busy skeleton items while loading", () => {
  const source = readSource("../../src/list/List.tsx");

  assert.match(source, /loading = false/);
  assert.match(source, /loadingItemCount = 6/);
  // The loading branch is a busy list of decorative placeholder items.
  assert.match(source, /if \(loading\) \{/);
  assert.match(source, /aria-busy/);
  assert.match(source, /accessibilityState=\{\{ busy: true \}\}/);
  // Each placeholder item mirrors the ListItem anatomy (leading circle, title /
  // description bars, trailing chip) and shares one pulse.
  assert.match(source, /<SkeletonPulseProvider>/);
  assert.match(
    source,
    /<SkeletonCircle diameter=\{SKELETON_AVATAR_DIAMETER\} \/>/,
  );
  assert.match(source, /Array\.from\(\{ length: loadingItemCount \}\)/);
  // The separator rule still holds between placeholder items.
  assert.match(source, /separators && !last \?/);
});

test("list has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const listSource = readSource("../../src/list/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/list"/);
  assert.match(listSource, /List/);
  assert.match(listSource, /ListItem/);
  assert.match(packageJson, /"\.\/list"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
