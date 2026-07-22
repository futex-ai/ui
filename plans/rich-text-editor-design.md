# Rich Text Editor — detailed design

Implementation-level design for
[plans/rich-text-editor-component.md](rich-text-editor-component.md). The plan
holds scope and milestones; this doc holds the contracts implementers build
against and reviewers audit against. Obligations are numbered per milestone
(§M1.x, §M2.x, §M3.x, §M4.x).

---

## D1. Document model (`src/rich-text/richTextModel.ts`, pure, DOM-free)

```ts
export type InlineMark = "bold" | "italic" | "strike" | "code";

/** Run of text sharing one mark set. `text` may contain "\n" = soft line break. */
export type InlineSpan = { marks: readonly InlineMark[]; text: string };

export type RichTextBlock =
  | {
      spans: InlineSpan[];
      type:
        | "paragraph"
        | "heading1"
        | "heading2"
        | "heading3"
        | "bullet"
        | "numbered"
        | "quote";
    }
  | { checked: boolean; spans: InlineSpan[]; type: "check" }
  | { code: string; type: "codeBlock" }
  | { type: "divider" };

export type RichTextDocument = RichTextBlock[];

/** Caret/selection endpoint: block index + plain-text offset within the block. */
export type DocPosition = { block: number; offset: number };
```

Invariants (enforced by `normalizeDocument`):

- **D1.1** A document is never empty — minimum is `[{ type: "paragraph", spans: [] }]`.
- **D1.2** Adjacent spans with identical mark sets are merged; empty-text spans dropped.
- **D1.3** Mark arrays are stored in canonical order `bold, italic, strike, code`.
- **D1.4** `divider` never ends the document — normalize appends an empty
  paragraph after a trailing divider (so there is always a caret target).

Pure operations (all return new documents; all unit-tested in node):

- `normalizeDocument`, `emptyDocument`, `spansText(spans): string`,
  `splitSpans(spans, offset)`, `sliceSpans(spans, from, to)`.
- `splitBlock(doc, pos)` — Enter semantics. Continuation types: bullet→bullet,
  numbered→numbered, check→check (new item unchecked), paragraph→paragraph,
  heading→**paragraph**, quote→**paragraph**. Enter on an **empty** bullet /
  numbered / check / quote block converts it to a paragraph instead of
  splitting ("exit the list"). Enter inside `codeBlock` inserts `"\n"`; Enter
  when the caret is at the end of a codeBlock whose code ends with `"\n"`
  removes that trailing newline and inserts a paragraph after (exit).
- `insertSoftBreak(doc, pos)` — Shift+Enter: inserts `"\n"` into any text
  block, codeBlock included. Unlike Enter, a soft break NEVER exits the code
  block — only Enter's trailing-newline rule does.
- `mergeBackward(doc, pos)` — Backspace-at-block-start semantics:
  bullet / numbered / check / quote → demote the block to paragraph (content
  kept). heading / paragraph → merge spans into the previous text block; if
  the previous block is a divider, delete the divider instead; if previous is
  a codeBlock, append plain text to its code. codeBlock at offset 0 →
  convert to paragraph (code becomes one unmarked span). First block, start
  of doc → no-op (except the demotions above).
- `deleteForward(doc, pos)` — mirror of `mergeBackward` at block end.
- `deleteRange(doc, from, to)` — removes a cross-block selection: keeps the
  head of `from.block`, the tail of `to.block`, merges tails per
  `mergeBackward` text rules, drops whole blocks in between.
- `insertText(doc, pos, text)` / `insertBlocks(doc, pos, blocks)` (paste).
- `turnInto(doc, index, type)` — block conversion. spans↔code: to codeBlock =
  `spansText` (marks dropped); from codeBlock = one unmarked span. turnInto
  the current type is a no-op except heading levels (which switch level).
  `turnInto(…, "divider")` is invalid (dividers are inserted, not converted) —
  dev-warn and no-op.
- `toggleMarkInRange(doc, from, to, mark)` (M3) — if every character in the
  range carries the mark, remove it from the range; else add it. codeBlock and
  divider blocks in the range are untouched.

## D2. Markdown mapping (`markdownSerialize.ts` / `markdownParse.ts`, pure)

Serialization:

- **D2.1** heading1–3 → `# ` / `## ` / `### `; bullet → `- `; numbered →
  `N. ` renumbered from 1 per contiguous run; check → `- [ ] ` / `- [x] `;
  quote → `> ` on every line; divider → `---`; codeBlock → ` ``` ` fence
  (fence grows to ` ` ```` if the code contains a triple backtick).
- **D2.2** Blocks are separated by one blank line, EXCEPT consecutive blocks
  of the same list kind (bullet / numbered / check runs) which are separated
  by a single newline.
- **D2.3** Soft breaks (`"\n"` in spans) serialize as a backslash hard break
  (`\` + newline); inside quote blocks the continuation line keeps its `> `
  prefix.
- **D2.4** Inline marks: `**bold**`, `*italic*`, `~~strike~~`, `` `code` ``,
  nested outer→inner in canonical order. Code spans use double-backtick
  delimiters when the text itself contains a backtick.
- **D2.5** Escaping: in plain text escape `\`` \ * _ ~ [ ] ` ``; additionally
escape at line start: `#`, `>`, `-`, `+`, and `N.`/`N)` numbering patterns.
  Nothing is escaped inside codeBlock fences.

Parsing (same subset, tolerant):

- **D2.6** Recognized line prefixes, in test order: fence, `---`/`***`/`___`
  (divider), `#{1,3} `, `- [ ]`/`- [x]`, `- `/`* `/`+ `, `\d+[.)] `, `> `.
  Everything else is paragraph text. Setext headings, 4-space-indent code,
  tables, raw HTML: NOT recognized — their lines flow through as paragraph
  text verbatim (no data loss).
- **D2.7** Inline: backtick code binds first, then `**`, `*`, `~~`; backslash
  escapes; unmatched delimiters stay literal text. Links/images are NOT
  parsed — `[text](url)` remains literal text.
- **D2.8** Round-trip obligations (unit-tested):
  `parse(serialize(doc))` deep-equals `normalizeDocument(doc)`, and
  `serialize(parse(md))` is idempotent (serializing again is identity).

## D3. DOM contract (web only)

`domRender.web.ts` (doc → DOM) and `domSerialize.web.ts` (DOM → doc). The
contentEditable root's children are managed **imperatively** — never React
children.

Block mapping (each block element carries `data-rt` for round-tripping):

- paragraph `<p data-rt="p">` · heading `<h1|h2|h3 data-rt="h1|h2|h3">`
- bullet run `<ul data-rt="ul">` / numbered run `<ol data-rt="ol">` /
  check run `<ul data-rt="checklist">` — one `<li data-rt="li">` per block;
  contiguous same-kind blocks share one wrapper (the render layer groups,
  the serializer flattens).
- check `<li>` starts with
  `<span data-rt="checkbox" contenteditable="false" role="checkbox" aria-checked tabindex="-1">`
  followed by `<span data-rt="checktext">` holding the inline content. The
  checkbox carries `aria-label` = the item's plain text (fallback "Checklist
  item") so the toggle has a non-empty accessible name (WCAG 4.1.2).
- quote `<blockquote data-rt="quote">` · codeBlock
  `<pre data-rt="code"><code>` · divider
  `<div data-rt="divider" contenteditable="false"><hr></div>`.

Inline mapping: text nodes wrapped in `<strong>` / `<em>` / `<s>` / `<code>`
nested in canonical order; soft break → `<br>`; an empty text block contains a
single `<br>` so it keeps height and accepts the caret.

`domSerialize` is **tolerant**: unknown elements contribute their text
content; `b`→bold, `i`→italic, `strike`/`del`→strike, style-only spans are
unwrapped. It never throws on arbitrary DOM. Styling comes from the shared
theme (`useSharedUiTheme` + `typographyStyles` sizes for h1–h3/body/code),
applied via a per-editor generated class + injected stylesheet OR inline
styles set by domRender — implementer's choice, but no global selectors that
could leak outside the editor root.

`domSelection.web.ts`: `currentBlockIndex(root, node)`,
`docPositionFromDom(root, sel)` / `domRangeFromDocPosition(root, pos)`
(offsets count `<br>` as one char and skip `contenteditable="false"`
subtrees), `isAtBlockStart/End`, `caretRect(sel)` (collapsed-range fallback:
measure a temporary zero-width span when `getClientRects()` is empty).

## D4. Editor architecture (web)

- **D4.1** Semi-controlled: the DOM is the live source of truth between
  events. Every committed mutation runs tolerant-serialize → markdown → emit
  `onChangeMarkdown` (only when the markdown actually changed). A
  `lastEmittedRef` guards the `value` prop: when `value` !== last emitted,
  parse + full re-render; caret goes to document end if the editor has focus,
  untouched otherwise.
- **D4.2** Structural ops go through the model:
  DOM → doc (serialize) → pure op → render(doc) → restore caret from the
  op's resulting `DocPosition`. Full re-render per structural op is
  acceptable v1 (docs are small); plain typing inside a block is left to the
  browser.
- **D4.3** `beforeinput` handling: `insertParagraph` → splitBlock;
  `insertLineBreak` → insertSoftBreak; `deleteContentBackward` collapsed at
  block start → mergeBackward; `deleteContentForward` collapsed at block end
  → deleteForward; any edit with a non-collapsed **cross-block** selection →
  deleteRange first, then apply the insertion via the model. Within-block
  edits stay native. M3 adds: `historyUndo`/`historyRedo`, `formatBold`/
  `formatItalic` interception.
- **D4.4** Prefix input rules run on `beforeinput` `insertText` of `" "`:
  when the block's text before the caret (caret at its end, no other content
  before it) equals a rule trigger, preventDefault and apply. Triggers:
  `#`/`##`/`###` → heading1–3, `-`/`*` → bullet, `1.` (any `\d+.`) →
  numbered, `[]`/`[ ]` → check, `>` → quote, ` ``` ` → codeBlock. `---` →
  divider applies on the third `-` (no space needed). Trigger matching lives
  in pure `inputRules.ts`. Not applied inside codeBlock. Backspace
  immediately after a rule fired reverts to the literal text; the revert is
  strictly one-shot — ANY subsequent input or selection movement disarms it
  (M3 undo generalizes this). Exception: the divider rule has no literal
  revert — the caret sits in the paragraph after the divider, and Backspace
  there simply deletes the divider via `mergeBackward`.
- **D4.5** IME: between `compositionstart`/`compositionend` all interception
  and rules are suspended; a single serialize+emit runs on compositionend.
- **D4.6** Paste (`paste` event): preventDefault, take `text/plain`, parse as
  markdown, `insertBlocks` at the caret (after deleteRange if a selection).
- **D4.7** Checkbox toggling: `mousedown` on `[data-rt="checkbox"]`
  preventDefaults (caret stays put) and toggles the model's `checked`, then
  render + emit. Disabled when `readOnly`.
- **D4.8** Frame: RN `View` wrapper (theme background, `minHeight`,
  `maxHeight` + `overflow: auto`); optional visible label row (Typography
  `label` variant) with the root also getting `aria-label`; placeholder is a
  pointer-events-none positioned overlay shown while the doc is one empty
  paragraph; focus ring follows `src/focusRing.ts` conventions on
  focus-visible. Root: `contenteditable` div, `role="textbox"`,
  `aria-multiline="true"`, `data-testid` from `testID`. `readOnly` renders
  `contenteditable="false"`.
- **D4.9** Undo (M3): custom stack of `{ doc, caret }`. Push before every
  model-applied op; for native typing, push when the previous push is >1s old
  or the previous op was non-typing. Redo cleared on new edits; cap 200.
  ⌘Z / ⇧⌘Z on keydown + `historyUndo`/`historyRedo` on beforeinput.

## D5. Slash menu (M2, web only)

- **D5.1** Open: `beforeinput` `insertText` `"/"` in a text block (not
  codeBlock) where the char before the caret is block start or whitespace.
  The `/` inserts natively; state records `{ blockIndex, slashOffset }` and
  the caret rect anchors the menu.
- **D5.2** Query = block text between `slashOffset + 1` and the caret,
  re-read from the DOM on every input/selectionchange. Close when: caret
  moves before/out of the query range or to another block, the `/` is gone,
  the query contains a space, blur, outside pointer-down, or Escape. Escape
  registers on the shared `escapeLayer` stack while open, so it closes the
  menu — not a parent modal.
- **D5.3** Filtering: case-insensitive substring over `label` + `keywords`,
  preserving section grouping; zero matches renders a single disabled "No
  results" row (menu stays open until a close condition).
- **D5.4** Built-in items (sections in order — icons are lucide, hints are
  `rightText`): **Text**: Text/paragraph (Pilcrow), Heading 1 (`Heading1`,
  ⌘⌥1), Heading 2 (⌘⌥2), Heading 3 (⌘⌥3) · **Lists**: Bulleted list
  (`List`, ⌘⇧8), Numbered list (`ListOrdered`, ⌘⇧9), Checklist
  (`ListChecks`, ⌘⇧7) · **Blocks**: Quote (`TextQuote`), Code block
  (`Code`), Divider (`Minus`). `slashExtraItems`
  (`{ id, label, icon, keywords?, section?, execute(commands) }`) append
  after, grouped under their `section` (default "Actions").
- **D5.5** Apply (Enter / Tab / click): delete `/` + query via the model,
  then: built-in block items → `turnInto` the current block (heading toggle
  rules per D1); Divider → if the block is now empty, replace it with a
  divider + following paragraph, else insert divider + paragraph after the
  block; caret lands in the paragraph. Extra items → invoke
  `execute(commands)` where `commands` exposes `turnInto`, `insertBlocks`,
  `toggleMark`, `getSelection` bound to the live editor.
- **D5.6** Keyboard while open: ↑/↓ move `activeId` (wrapping), Enter/Tab
  apply, all swallowed before the editor's own handlers. Focus NEVER leaves
  the editor: mimic `ComboboxPopover.web.tsx` — `DropdownWebLayer` + surface
  styled by `useDropdownSurfaceStyles` + `dropdownSurfaceRect(
dropdownPlacement(caretRect, viewport, { align: "start" }))`, rows rendered
  by `DropdownList` with a `listId`; the editor root carries `aria-controls`
  and `aria-activedescendant` via `dropdownRowDomId`. Anchor comes from a new
  `useCaretAnchor.web.ts` (caret rect in window coordinates, re-measured on
  scroll/resize like `useDropdownAnchor`) — do NOT reshape
  `useDropdownAnchor` itself.
- **D5.7** Block shortcuts (same milestone): ⌘⌥1/2/3 → heading1–3 (pressing
  the current level toggles back to paragraph), ⌘⇧7 → check, ⌘⇧8 → bullet,
  ⌘⇧9 → numbered — applied to the caret block (or every block a selection
  touches).

## D6. Native editor + public API

`RichTextEditor.tsx` (native) owns a controlled `RichTextDocument`, the active
block/selection, pending inline marks, input refs, and bounded history. It
renders one attributed, auto-growing `TextInput` per editable block through
`NativeRichTextBlock`; list markers, checklist controls, quote rules, divider,
and code chrome live outside the input. Read-only mode renders styled native
text rather than disabled inputs.

- **D6.1** `onChangeText` is reconciled against the previous block text and the
  selection captured before input. The inferred replacement range is removed,
  new text uses pending/inherited marks, and unaffected spans retain marks.
  A prefix/suffix fallback handles autocorrect, composition, paste, and other
  native replacements that widen beyond the captured selection.
- **D6.2** Newlines outside a code block split through the shared model. Empty
  list/checklist/quote blocks exit; headings continue as paragraphs. Newlines
  inside code blocks remain code text. Backspace at a collapsed block start
  uses shared merge/demotion behavior; the immediately preceding prefix rule
  can instead restore its literal trigger.
- **D6.3** Native supports the same block prefix and inline delimiter rules as
  web. Selecting text and choosing a mark applies it through
  `toggleMarkInRange`; choosing a mark at a caret updates pending marks for the
  next insertion. Delimiter rules delete only the delimiters, preserve all
  existing content spans, and add rather than remove an already-active mark.
  The post-rule caret retains the typing marks active before the delimiter rule
  so subsequent text does not extend the newly applied mark.
- **D6.4** The formatting row provides insert paragraph, undo/redo, block type,
  divider, inline mark, and keyboard-dismiss actions. iOS uses
  `InputAccessoryView`; each editable block receives a unique accessory ID and
  a fixed-height host before it can receive focus, while only the active host
  renders controls. Android renders one horizontally scrollable row at the
  editor's lower edge while focused. Targets are at least 44 points and expose
  named button state.
- **D6.5** External markdown replaces native state only when it differs from
  the last emitted value. A controlled echo does not reset focus, selection,
  pending marks, or history. `slashExtraItems` is accepted and ignored because
  mobile commands live in the toolbar.
- **D6.6** Native input-rule transformations are model history boundaries with
  an explicit snapshot of the literal delimiters and post-input caret. Their
  first undo restores that literal state. Canonically unchanged documents are
  not applied or added to history.
- **D6.7** A structural edit that targets another native block defers its
  first-responder transfer until the next animation frame so the originating
  input event can settle. A blur from the prior block is stale once the target
  block owns the active selection and must not clear editor focus or hide the
  keyboard-adjacent toolbar. The target block's iOS accessory host is therefore
  mounted and associated before the deferred transfer runs.

Public API (both platforms):

```ts
type RichTextEditorProps = {
  autoFocus?: boolean;
  label?: string;
  maxHeight?: number;
  minHeight?: number;
  onChangeMarkdown?: (markdown: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  slashExtraItems?: SlashMenuItem[];
  testID?: string;
  value?: string;
};
```

## D7. Plumbing obligations (every milestone keeps these green)

- **D7.1** Export subpath `./rich-text` added to package.json `exports`
  (types / react-native / import triple, mirroring `./input`), re-export from
  `src/index.ts`, entry in `tests/unit/packageExports.test.ts`.
- **D7.2** Every new lucide icon added to `scripts/package-smoke-stubs.mjs`.
- **D7.3** `testID` forwarded to the web root and native editor field; native
  block/toolbar identifiers derive from it; entry in
  `tests/unit/testIDForwarding.test.ts`.
- **D7.4** `src/rich-text/README.md` responsibilities doc in house style;
  stories in `src/stories/rich-text.stories.tsx` (story id = export name)
  with a live markdown readout panel (`data-testid="rich-text-markdown-out"`),
  plus editable, prefilled, and read-only native stories in
  `storybook-native/stories/RichTextEditor.stories.tsx`.
- **D7.5** Gate: `npm run verify` fully green (format, unit, typecheck,
  build, package smoke, storybook build, browser tests incl. axe).

## Milestone obligation checklists

### M1 — core editor + markdown pipeline

1. `richTextModel.ts` per D1 (all ops except `toggleMarkInRange`).
2. `markdownSerialize.ts` + `markdownParse.ts` per D2, with round-trip tests
   (D2.8) plus table-driven serialize and parse cases.
3. `domRender.web.ts`, `domSerialize.web.ts`, `domSelection.web.ts` per D3.
4. `RichTextEditor.web.tsx` per D4.1–D4.8 (no undo, no inline toggles).
5. `inputRules.ts` prefix rules per D4.4 with unit tests.
6. Native fallback + shared types per D6.
7. Plumbing per D7 (icons used so far; stories Playground / Prefilled /
   ReadOnly; browser tests: type `# Hello ` → h1 + readout shows `# Hello`;
   Enter/Backspace structure; checklist toggle updates readout; paste
   markdown; axe scan on the story).

### M2 — slash menu + block shortcuts

1. `slashMenuModel.ts` (items, filter, sections) per D5.3–D5.4, unit-tested.
2. `useCaretAnchor.web.ts` + `SlashMenu.web.tsx` per D5.6.
3. `useSlashMenu.web.ts` state machine per D5.1–D5.2, D5.5.
4. `slashExtraItems` + `commands` handle per D5.5.
5. Block shortcuts per D5.7.
6. Stories: WithExtraSlashItems; browser tests: open via `/`, filter,
   arrow + Enter converts block, Escape leaves text intact, `/xyz` shows "No
   results", extra item executes; axe with menu open.

### M3 — inline formatting + undo

1. `toggleMarkInRange` per D1 + `useEditorCommands.web.ts` toggles restoring
   selection.
2. ⌘B / ⌘I / ⌘E / ⌘⇧S keydown + `formatBold`/`formatItalic` beforeinput
   interception.
3. Inline autoformat as-you-type: `**b**`, `*i*`, `` `c` ``, `~~s~~`
   (trigger-char scan per D4.4's pattern, pure rules in `inputRules.ts`,
   unit-tested; not inside codeBlock; suspended during IME).
4. Undo/redo per D4.9.
5. Browser tests: select + ⌘B round-trips `**…**` to the readout; autoformat
   fires and Backspace reverts; ⌘Z undoes a structural op and a rule
   application; markdown readout stays consistent throughout.

### M4 — native mobile rich editing

1. Replace the native markdown textarea with the block controller and surface
   per D6 while preserving the public API and shared markdown model.
2. Add pure native edit/action modules with unit coverage for replacement
   inference, attributed-span preservation, structural keys, input rules,
   checklist actions, and toolbar conversions.
3. Add native block, toolbar, styles, command, and history modules with the
   accessibility and platform behavior in D6.
4. Add native Storybook stories, generate its story index, typecheck the host,
   export both native bundles, and interaction-smoke the iOS story.
5. Update the component README, protocol, mockup, root documentation, and plan.
6. Run `cargo xtask check`, commit and push all files, then run
   `cargo xtask review` against the pushed diff without auto-fixing findings.

## Design decisions already settled (do not relitigate in implementation)

- No external editor/markdown dependency; everything hand-rolled in
  `src/rich-text/`.
- Imperative block DOM inside a contentEditable root; React never renders the
  document children (see `src/data-grid/dataGridDragDom.ts` for the raw-DOM
  precedent).
- Structural edits round-trip through the pure model (D4.2) — no incremental
  DOM surgery for splits/merges in v1.
- Web collapsed-caret mark toggles remain selection-only. Native implements
  pending marks because a keyboard toolbar must support formatting before text
  is inserted.
- Links, nested lists, code-block language, and drag handles are M5 backlog.
