import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("table renders an optional header row driven by columns", () => {
  const source = readSource("../../src/table/Table.tsx");

  // The header row is omitted entirely when `headless` is set.
  assert.match(source, /headless \? null :/);
  assert.match(
    source,
    /style=\{\[styles\.th, headerTextAlignStyle\(col\.align, styles\)\]\}/,
  );
  assert.match(source, /\{col\.label\}/);
});

test("table sizes columns by fixed width or flex share", () => {
  const source = readSource("../../src/table/Table.tsx");

  // A fixed `width` wins; otherwise the column shares space by `flex`.
  assert.match(source, /col\.width !== undefined/);
  assert.match(source, /\{ width: col\.width \}/);
  assert.match(source, /\{ flex: col\.flex \?\? 1, minWidth: 0 \}/);
});

test("table renders plain static rows without an onRowPress", () => {
  const source = readSource("../../src/table/Table.tsx");

  assert.match(source, /if \(onRowPress\) \{/);
  // The non-pressable branch is a plain View carrying the last-row border reset
  // and the optional per-row style override.
  assert.match(
    source,
    /styles\.row,\s*last \? styles\.rowLast : null,\s*rowStyle\?\.\(row, index\),/,
  );
});

test("table applies an optional per-row style to both row kinds", () => {
  const source = readSource("../../src/table/Table.tsx");

  // The documented per-row container style hook.
  assert.match(
    source,
    /rowStyle\?: \(row: Row, index: number\) => StyleProp<ViewStyle>/,
  );
  // Pressable rows receive it as customStyle, layered under the interactive
  // states (hover / pressed / focus) so press feedback still wins.
  assert.match(source, /customStyle=\{rowStyle\?\.\(row, index\)\}/);
  assert.match(
    source,
    /last \? styles\.rowLast : null,\s*customStyle,\s*hovered && !disabled/,
  );
});

test("table makes rows pressable buttons when given onRowPress", () => {
  const source = readSource("../../src/table/Table.tsx");

  // The pressable row mirrors the shared button: button semantics, a disabled
  // state, the focus ring, the hidden web outline, and per-state hover/press.
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ disabled \}\}/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /useFocusRing/);
  assert.match(source, /focus\.focused \? styles\.rowFocused : null/);
  assert.match(source, /hideWebOutlineView/);
  assert.match(
    source,
    /style=\{\(\{ hovered, pressed \}: PressableHoverState\) =>/,
  );
  assert.match(source, /hovered && !disabled \? styles\.rowHover : null/);
  assert.match(source, /pressed && !disabled \? styles\.rowPressed : null/);
  assert.match(source, /disabled \? styles\.rowDisabled : null/);
});

test("table cell text helper supports bold, muted, and numeric variants", () => {
  const source = readSource("../../src/table/Table.tsx");
  const stylesSource = readSource("../../src/table/tableStyles.ts");

  assert.match(source, /export function TableCell/);
  assert.match(source, /bold \? styles\.tdBold : null/);
  assert.match(source, /muted \? styles\.tdMuted : null/);
  assert.match(source, /numeric \? styles\.tdNumeric : null/);
  assert.match(stylesSource, /tdBold: \{ fontWeight: "700" \}/);
});

test("table supports the shared size scale", () => {
  const source = readSource("../../src/table/Table.tsx");
  const stylesSource = readSource("../../src/table/tableStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createTableStyles\(theme, size\)/);
  // Each size sets a distinct body-row vertical padding.
  assert.match(stylesSource, /sm: \{[\s\S]*?rowPaddingVertical: 8/);
  assert.match(stylesSource, /md: \{[\s\S]*?rowPaddingVertical: 12/);
  assert.match(stylesSource, /lg: \{[\s\S]*?rowPaddingVertical: 14/);
});

test("table styles are driven by shared theme tokens", () => {
  const stylesSource = readSource("../../src/table/tableStyles.ts");

  assert.match(stylesSource, /backgroundColor: theme\.colors\.bg/);
  assert.match(stylesSource, /borderBottomColor: theme\.colors\.border/);
  assert.match(stylesSource, /color: theme\.colors\.ink/);
  assert.match(stylesSource, /color: theme\.colors\.muted/);
  assert.match(stylesSource, /theme\.fonts\.sans/);
  // The hover wash and inset focus ring use shared tokens.
  assert.match(
    stylesSource,
    /rowHover: \{ backgroundColor: theme\.colors\.soft \}/,
  );
  assert.match(stylesSource, /rowFocused: \{[\s\S]*?theme\.colors\.primary/);
  // Numbers get tabular figures for aligned amount columns.
  assert.match(
    stylesSource,
    /tdNumeric: \{[\s\S]*?fontVariant: \["tabular-nums"\]/,
  );
});

test("table renders busy skeleton rows while loading", () => {
  const source = readSource("../../src/table/Table.tsx");

  assert.match(source, /loading = false/);
  assert.match(source, /loadingRowCount = 6/);
  // The busy state is announced on the container (aria-busy + accessibilityState).
  assert.match(source, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(
    source,
    /accessibilityState=\{loading \? \{ busy: true \} : undefined\}/,
  );
  // Placeholder rows render skeleton bars per column, sharing one pulse, and are
  // hidden from assistive technology.
  assert.match(source, /<SkeletonPulseProvider>/);
  assert.match(source, /<SkeletonBar/);
  assert.match(source, /Array\.from\(\{ length: loadingRowCount \}\)/);
});

test("table has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const tableSource = readSource("../../src/table/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/table"/);
  assert.match(tableSource, /Table/);
  assert.match(packageJson, /"\.\/table"/);
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
