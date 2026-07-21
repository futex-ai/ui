import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("kanban groups a flat cards array into columns by accessor", () => {
  const source = readSource("../../src/kanban/Kanban.tsx");

  // Cards are routed into their column's bucket once; an unmatched column id is
  // silently dropped via optional chaining (no throw).
  assert.match(source, /map\.get\(cardColumnId\(card, index\)\)\?\.push\(/);
  assert.match(source, /count=\{column\.count \?\? entries\.length\}/);
});

test("kanban scrolls its columns horizontally", () => {
  const source = readSource("../../src/kanban/Kanban.tsx");

  assert.match(source, /<ScrollView/);
  assert.match(source, /horizontal/);
  assert.match(source, /contentContainerStyle=\{styles\.boardRow\}/);
});

test("kanban announces a busy skeleton board while loading", () => {
  const source = readSource("../../src/kanban/Kanban.tsx");

  assert.match(source, /loading = false/);
  assert.match(source, /loadingCardCount = 3/);
  // The busy state is announced on the container (web aria-busy + native state).
  assert.match(source, /aria-busy=\{loading \|\| undefined\}/);
  assert.match(
    source,
    /accessibilityState=\{loading \? \{ busy: true \} : undefined\}/,
  );
  // One shared pulse drives every column's skeleton cards.
  assert.match(
    source,
    /<SkeletonPulseProvider>\{board\}<\/SkeletonPulseProvider>/,
  );
});

test("kanban board is a labelled group keeping the label valid", () => {
  const source = readSource("../../src/kanban/Kanban.tsx");

  // A role keeps the accessibility label valid (a bare labelled container trips
  // RNW's aria-prohibited-attr), and is omitted when there is no label.
  assert.match(source, /role=\{accessibilityLabel \? "group" : undefined\}/);
  assert.match(source, /accessibilityLabel=\{accessibilityLabel\}/);
  // The column width defaults to the mockup geometry.
  assert.match(source, /columnWidth = 286/);
});

test("kanban makes cards pressable buttons when given onCardPress", () => {
  const source = readSource("../../src/kanban/KanbanColumn.tsx");

  // A card with a press handler or a drag binding renders the interactive card.
  assert.match(source, /<PressableCard/);
  assert.match(source, /onCardPress\(entry\.card, entry\.index\)/);
  // The pressable card mirrors the shared button / table row.
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /accessibilityState=\{\{ disabled \}\}/);
  assert.match(source, /useFocusRing/);
  assert.match(
    source,
    /focus\.focused && focus\.ringEnabled \? styles\.cardFocused : null/,
  );
  assert.match(source, /focus\.webOutlineReset/);
  assert.match(source, /hovered && !disabled \? styles\.cardHover : null/);
  assert.match(source, /pressed && !disabled \? styles\.cardPressed : null/);
  assert.match(source, /disabled \? styles\.cardDisabled : null/);
});

test("kanban renders plain static cards without an onCardPress", () => {
  const source = readSource("../../src/kanban/KanbanColumn.tsx");

  // A card with neither a press handler nor a drag binding is a plain View
  // (still dimmable when it is the keyboard-grabbed card).
  assert.match(source, /if \(!onCardPress && !binding\) \{/);
  assert.match(
    source,
    /<View\s+key=\{key\}\s+style=\{\[styles\.card, grabbed \? styles\.cardGrabbed : null\]\}\s*>/,
  );
});

test("kanban column header shows a status chip, a count, and an optional add button", () => {
  const source = readSource("../../src/kanban/KanbanColumn.tsx");

  assert.match(
    source,
    /<KanbanChip color=\{column\.color\} tone=\{column\.tone\}>/,
  );
  // The visible count is hidden from AT (it is mirrored in the group label).
  assert.match(source, /style=\{styles\.count\}/);
  assert.match(
    source,
    /importantForAccessibility="no"[\s\S]{0,40}style=\{styles\.count\}/,
  );
  assert.match(source, /\{onColumnAdd \? \(/);
  // The column group is labelled with the title and a pluralised card count.
  assert.match(source, /\$\{count === 1 \? "card" : "cards"\}/);
  assert.match(source, /role=\{groupLabel \? "group" : undefined\}/);
});

test("kanban column renders skeleton placeholders while loading", () => {
  const source = readSource("../../src/kanban/KanbanColumn.tsx");

  assert.match(source, /Array\.from\(\{ length: loadingCardCount \}\)/);
  assert.match(source, /<SkeletonBar/);
  assert.match(source, /<SkeletonCircle/);
  // The empty-column placeholder renders only when there are no cards in flow
  // and no drop preview is targeting this column.
  assert.match(source, /flow\.length === 0 && previewIndex < 0 \?/);
  assert.match(source, /renderColumnEmpty\?\.\(column\) \?\? null/);
});

test("kanban chip resolves tones, custom colors, plain, and hidden icons", () => {
  const source = readSource("../../src/kanban/KanbanChip.tsx");

  // Precedence is plain > color > tone: `plain` short-circuits to a fill-less
  // muted chip; otherwise a literal `color` wins over the resolved `tone`.
  assert.match(
    source,
    /plain\s*\?\s*\{ backgroundColor: "transparent"[\s\S]*?:\s*\(color \?\? resolveBadgeColors\(theme\.colors, tone, "soft"\)\)/,
  );
  // The leading icon is decorative and removed from the accessibility tree.
  assert.match(source, /aria-hidden/);
  assert.match(source, /importantForAccessibility="no-hide-descendants"/);
  assert.match(source, /numberOfLines=\{1\}/);
});

test("kanban card wraps its title and lays out chips and footer slots", () => {
  const source = readSource("../../src/kanban/KanbanCard.tsx");

  // The title renders through the themed Text with no numberOfLines cap, so a
  // long title wraps (only the chips and footer text are single-line).
  assert.match(
    source,
    /isText\(title\) \? <Text style=\{styles\.cardTitle\}>\{title\}<\/Text> : title/,
  );
  assert.match(source, /<View style=\{styles\.chipsRow\}>\{chips\}<\/View>/);
  // The footer renders only when a slot is supplied, and pushes the date to the
  // right past a flexing spacer.
  assert.match(
    source,
    /const hasSlotFooter =\s*avatar != null \|\| meta != null \|\| date != null \|\| footer != null/,
  );
  assert.match(source, /\{hasSlotFooter \? \(/);
  assert.match(source, /<View style=\{styles\.footerSpacer\} \/>/);
  assert.match(source, /function isText\(/);
});

test("kanban styles are driven by shared theme tokens", () => {
  const source = readSource("../../src/kanban/kanbanStyles.ts");

  // The column is a soft-tinted rounded card; the card is a bordered surface.
  assert.match(source, /backgroundColor: theme\.colors\.soft/);
  assert.match(source, /backgroundColor: theme\.colors\.surface/);
  assert.match(source, /borderColor: theme\.colors\.border2/);
  assert.match(
    source,
    /cardPressed: \{ backgroundColor: theme\.colors\.bg2 \}/,
  );
  assert.match(source, /cardFocused: \{[\s\S]*?theme\.colors\.primary/);
  // The count and footer use the mono face; column / card / chip use lg / md / sm radii.
  assert.match(source, /fontFamily: theme\.fonts\.mono/);
  assert.match(source, /borderRadius: theme\.radii\.lg/);
  assert.match(source, /borderRadius: theme\.radii\.md/);
  assert.match(source, /borderRadius: theme\.radii\.sm/);
});

test("kanban supports the shared size scale", () => {
  const source = readSource("../../src/kanban/Kanban.tsx");
  const stylesSource = readSource("../../src/kanban/kanbanStyles.ts");

  assert.match(source, /size = "md"/);
  assert.match(source, /createKanbanStyles\(theme, size\)/);
  // Each size sets a distinct card padding, exposed to the avatar via a helper.
  assert.match(stylesSource, /sm: \{[\s\S]*?cardPadding: 9/);
  assert.match(stylesSource, /md: \{[\s\S]*?cardPadding: 11/);
  assert.match(stylesSource, /lg: \{[\s\S]*?cardPadding: 13/);
  assert.match(stylesSource, /export function kanbanAvatarDiameter/);
});

test("kanban has public root and subpath exports", () => {
  const rootSource = readSource("../../src/index.ts");
  const kanbanSource = readSource("../../src/kanban/index.ts");
  const packageJson = readSource("../../package.json");

  assert.match(rootSource, /export \* from "\.\/kanban"/);
  assert.match(kanbanSource, /Kanban/);
  assert.match(kanbanSource, /KanbanCard/);
  assert.match(kanbanSource, /KanbanChip/);
  assert.match(packageJson, /"\.\/kanban"/);
});

test("kanban wires drag-and-drop through onCardMove", () => {
  const board = readSource("../../src/kanban/Kanban.tsx");
  const column = readSource("../../src/kanban/KanbanColumn.tsx");

  // The board drives the platform drag hook, binds the hit-test container, and
  // renders the floating clone that rides the cursor.
  assert.match(board, /useKanbanCardDrag\(\{/);
  assert.match(board, /enabled: Boolean\(onCardMove\)/);
  assert.match(board, /ref=\{drag\.bindBoard\.ref\}/);
  assert.match(board, /ref=\{drag\.bindGhost\.ref\}/);
  assert.match(board, /styles\.cardGhost/);
  // Columns and cards carry the data-testids the pointer drag hit-tests, the
  // keyboard handler, a dimmed grabbed card, and the translucent card preview.
  assert.match(column, /testID=\{`kanban-column-\$\{column\.id\}`\}/);
  assert.match(column, /testID=\{binding\?\.testID\}/);
  assert.match(column, /onKeyDown: binding\.onKeyDown/);
  assert.match(column, /grabbed \? styles\.cardGrabbed : null/);
  assert.match(
    column,
    /<CardPreview node=\{previewNode\} styles=\{styles\} \/>/,
  );
});

function readSource(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}
