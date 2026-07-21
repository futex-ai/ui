# Rich Text Editor component

A new `@firna/ui` primitive: a Notion / Linear–style **WYSIWYG block editor**
(`RichTextEditor`, `src/rich-text/`, exported as `@firna/ui/rich-text`). It
edits rich blocks in place and reports **markdown** on every change, with
markdown prefix shortcuts (`# `, `- `, `> `, …) and a caret-anchored `/` slash
menu for inserting/converting blocks.

**Visual reference:** Linear's slash-command menu (workspace screenshot
`.context/attachments/tEKrEL/Screenshot 2026-07-20 at 14.56.16.png`): Heading
1–3, Bulleted/Numbered/Check lists, Code block, Blockquote, etc., with
⌘-shortcut hints in the right column. Storybook stories are the living spec.

**Status:** M1–M4 delivered across web, iOS, and Android. M6 tracks active
post-review native editing hardening; remaining product ideas are tracked as
M5 backlog. Detailed contracts in
[rich-text-editor-design.md](rich-text-editor-design.md).

---

## Goal / scope (v1)

- **Blocks:** paragraph, heading 1–3, bulleted list, numbered list, checklist,
  blockquote, code block, divider.
- **Inline marks:** bold, italic, inline code, strikethrough.
- **Output:** GFM-flavored markdown via `onChangeMarkdown` on every edit
  (checklist = `- [ ]` / `- [x]`).
- **Quick entry:** prefix shortcuts at block start + `/` slash menu anchored at
  the caret.

Out of scope for v1: media/gif/file attach, diagrams, collapsible sections,
nested lists, links UI, tables, collaboration. The slash-menu API stays
extensible so host apps can add "Insert media…"-type items.

## Key decisions

1. **No external editor dependency.** No ProseMirror/Lexical/TipTap — the repo
   hand-rolls complex components (DataGrid, kanban, calendar), ships zero
   runtime deps beyond RN peers, and `test:package` stubs peers. A strict block
   model keeps hand-rolled contentEditable tractable.
2. **Platform-native views share one typed model.** Follow the `.web.tsx` split
   convention while keeping markdown and document operations platform-neutral:
   - `RichTextEditor.web.tsx` — real WYSIWYG (contentEditable).
   - `RichTextEditor.tsx` — native block editor built from attributed,
     auto-growing `TextInput` blocks and a keyboard-adjacent formatting bar.
     Consumers always exchange canonical markdown; neither renderer becomes the
     other platform's compatibility layer.
3. **Semi-controlled contentEditable, imperative DOM.** One contentEditable
   root whose block DOM is built by our own renderer — never React children
   (reconciliation fights user edits; raw-DOM precedent:
   `src/data-grid/dataGridDragDom.ts`). Every input serializes DOM → blocks →
   markdown and emits. Incoming `value` re-renders the document only when it
   differs from the last emitted markdown, so typing never resets the caret.
4. **Canonical DOM + custom undo.** Inline toggles use manual Range surround
   emitting only `<strong>/<em>/<code>/<s>` (no deprecated/inconsistent
   `execCommand`), plus a normalize pass stripping browser-injected markup.
   Imperative edits break native undo, so M3 adds a snapshot undo stack
   (blocks + selection, coalesced typing) intercepting ⌘Z/⇧⌘Z and
   `beforeinput` `historyUndo/historyRedo`.

## Public API

```tsx
<RichTextEditor
  value={markdown}                    // markdown in
  onChangeMarkdown={(md) => ...}      // markdown out, every edit
  label="Description"                 // accessible name, Input-style
  placeholder="Write, or type '/' for commands…"
  autoFocus?  readOnly?  minHeight?  maxHeight?
  slashExtraItems={[{ id, label, icon, keywords, section, execute(commands) }]}
  testID="editor"                     // forwarded to root (convention + test)
/>
```

`execute` receives an editor-commands handle (`setBlockType`, `insertBlock`,
`toggleInline`, …) so host apps can add custom slash items without the library
shipping media handling.

## File layout — `src/rich-text/`

| File                                                           | Role                                                                             |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `richTextModel.ts`                                             | Block/inline types + pure ops (splitBlock, mergeBlock, turnInto) — node-testable |
| `markdownSerialize.ts` / `markdownParse.ts`                    | blocks ↔ markdown, pure, GFM subset                                              |
| `inputRules.ts`                                                | pure prefix matching plus mark-preserving inline autoformat                      |
| `slashMenuModel.ts`                                            | item list + filter, pure                                                         |
| `domRender.web.ts` / `domSerialize.web.ts`                     | blocks → DOM, DOM → blocks, normalize pass                                       |
| `useEditorCommands.web.ts`                                     | toggleInline / setBlockType / caret+Range helpers                                |
| `useSlashMenu.web.ts`                                          | slash state machine (open on `/`, query, key routing)                            |
| `SlashMenu.web.tsx`                                            | caret-anchored surface reusing `DropdownList` + web dropdown layer               |
| `RichTextEditor.web.tsx` / `RichTextEditor.tsx`                | web contentEditable / native block-editor controllers                            |
| `NativeRichTextBlock.tsx`                                      | attributed native block inputs, list markers, checkboxes, read-only output       |
| `NativeRichTextToolbar.tsx`                                    | iOS input accessory and Android in-frame formatting actions                      |
| `nativeTextEdit.ts` / `nativeRichTextEditing.ts`               | native plain-text diff inference and attributed reconciliation                   |
| `nativeRichTextActions.ts`                                     | native pure structural and toolbar operations                                    |
| `nativeRichTextTestIDs.ts`                                     | stable field, primary-input, and secondary-block automation IDs                  |
| `useNativeRichTextCommands.ts` / `useNativeRichTextHistory.ts` | native event orchestration and bounded undo/redo                                 |
| `richTextStyles.ts` / `nativeRichTextStyles.ts`                | platform theme-derived typography, block, frame, and toolbar styles              |
| `index.ts`, `README.md`                                        | exports + responsibilities doc per repo convention                               |

## Behavior spec

**Prefix shortcuts** (applied on space at block start; Backspace immediately
after reverts to plain text): `#`/`##`/`###` → H1–3 · `-`/`*` → bullet · `1.` →
numbered · `[]`/`[ ]` → checklist · `>` → quote · ` ``` ` → code block · `---` →
divider.

**Structural keys:** Enter splits block (Enter on empty list item exits the
list); Shift+Enter soft-breaks; Backspace at block start merges into previous /
demotes heading/list to paragraph; ⌘B/⌘I/⌘E/⌘⇧S inline toggles; ⌘⌥1–3
headings, ⌘⇧7/8/9 checklist/bullet/numbered (Linear parity, shown as
`rightText` hints).

**Slash menu:** `/` at block start or after whitespace opens the menu anchored
to the caret rect (`Range.getBoundingClientRect()` fed into
`dropdownPlacement`; new `useCaretAnchor.web.ts` sibling of `useDropdownAnchor`
rather than reshaping it). Typing filters (label + keywords); ↑/↓ navigate with
focus staying in the editor (`aria-activedescendant` via `dropdownRowDomId`,
the ComboboxPopover pattern); Enter/Tab/click applies (deletes `/query`,
converts or inserts a block); Escape or Backspace past `/` closes, leaving text
intact. Escape routes through `dropdownDismissLayers`/`escapeLayer` so it
closes the menu, not a parent modal. Sections + dividers matching the
screenshot: Turn into (headings) · Lists · Blocks.

**Paste:** intercept, take `text/plain`, parse as markdown, insert blocks
(sanitized `text/html` handling later). **IME:** suspend input rules and slash
handling between compositionstart/end.

**Native mobile:** every block is an auto-growing native input with attributed
inline spans. Enter and Backspace route through the shared split/merge rules;
native autocorrect, selection replacement, paste, and composition reconcile as
range edits that retain unaffected marks. iOS attaches the 44-point action row
with `InputAccessoryView`; Android shows the same horizontally scrollable row
while an editor block has focus. A collapsed-caret inline action sets pending
marks for subsequent typing, matching mobile document editors.

## Reuse & conventions checklist

- `DropdownList` (leading `DropdownIconBox` icons, `rightText` shortcut hints —
  solid-highlight inversion applies), web dropdown portal layer,
  `dropdownPlacement`.
- lucide icons: Heading1/2/3, List, ListOrdered, ListChecks, Code, TextQuote,
  Minus, Pilcrow → **add each to `scripts/package-smoke-stubs.mjs`**.
- `useSharedUiTheme`, typography tokens, `focusRing.ts`, `announcer.ts`
  (announce block conversions), `devWarn.ts`.
- `testID` forwarded to root + entry in `tests/unit/testIDForwarding.test.ts`.
- Export subpath: package.json `exports` map + `packageExports.test.ts` +
  root `src/index.ts`.
- a11y: root `role="textbox"` + `aria-multiline`, named via `label`; menu is
  `role="listbox"`; checklist toggles are `contenteditable=false` checkboxes;
  must pass the axe sweep in `tests/browser/a11y.spec.ts`.
- RNW pitfalls: no `dataSet`, careful native a11y merging.

## Testing

- **Unit (node --test, DOM-free):** markdown parse/serialize round-trips,
  inputRules table, slash filtering, model ops (split/merge/turnInto).
- **Browser (Playwright on Storybook):** type `# Hello` → h1 + emitted markdown
  readout; slash open/filter/select/escape; ⌘B; Enter/Backspace structure;
  checklist toggle; paste markdown; axe scan.
- **Stories:** `rich-text.stories.tsx` (story id = export name) with a live
  markdown output panel; playground + readOnly + pre-seeded document stories.
  Native Storybook mirrors editable, prefilled, and read-only cases through the
  package's `react-native` export.
- **Native unit/smoke:** edit inference, autocorrect replacement, mark
  preservation, Enter/Backspace structure, prefix/inline rules, checklist and
  toolbar actions; TypeScript plus iOS/Android Expo export, with an iOS
  simulator interaction smoke when available.
- Gate: `npm run verify` (format, unit, typecheck, build, package smoke,
  storybook build, browser tests).

## Milestones

### M1 — Core web editor + markdown pipeline

- [x] Deliver the model, markdown/DOM mapping, structural keys, prefixes,
      placeholder, stories, and initial browser coverage.

### M2 — Slash menu

- [x] Deliver the caret anchor, dropdown-based command surface, keyboard
      routing, block shortcuts, and `slashExtraItems` extension contract.

### M3 — Inline formatting + undo

- [x] Deliver Range-based toggles, keyboard shortcuts, delimiter autoformat,
      paste-as-markdown, and bounded snapshot undo/redo.

### M4 — Native mobile rich editing

- [x] Replace the raw-markdown fallback with attributed, block-level native
      editing on iOS and Android.
- [x] Add native structural/input reconciliation and collapsed-caret marks.
- [x] Add the keyboard-adjacent block/inline toolbar and native accessibility.
- [x] Add pure native tests, native Storybook cases, platform exports, protocol
      documentation, and paired mobile/desktop mockups.
- [x] Run the focused tests, native smoke checks, and `cargo xtask check`.
- [x] Commit and push the complete diff before running `cargo xtask review`.
- [x] Run `cargo xtask review` against the pushed branch and report findings
      without automatically changing reviewed code.

### M5 — Post-v1 backlog

- [ ] Links and link editing.
- [ ] Nested lists.
- [ ] Code-block language selection.
- [ ] Drag handles and block reordering.

### M6 — Post-review native editing hardening

- [x] Add regressions for literal autoformat undo, nested mark preservation,
      and no-op Backspace history.
- [x] Record native input-rule transforms as model edits with literal snapshots.
- [x] Preserve existing inline spans while removing typed delimiters.
- [x] Skip native history commits when the canonical document is unchanged.
- [x] Run focused checks, native smoke checks, and `cargo xtask check`.
- [x] Commit and push the complete fix before repeating `cargo xtask review`.
- [x] Preserve the exact public `testID` on the first native editable block
      while keeping stable field and secondary-block identifiers.
- [x] Exit delimiter-applied inline marks before continued native typing while
      retaining marks that were explicitly active before the rule.
- [ ] Repeat `cargo xtask review` until no valid findings remain or the
      ten-cycle limit is reached.

## Risks

- contentEditable quirks (Safari selection, IME, browser-injected markup) — the
  normalize pass + browser tests are the mitigation; expect iteration here.
- Undo is the hardest hidden cost; scheduled in M3, not bolted on late.
- Caret-anchored dropdown is a new anchor mode for the dropdown stack — keep it
  additive (new hook) rather than reshaping `useDropdownAnchor`.
