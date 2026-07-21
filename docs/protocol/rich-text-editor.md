# Rich Text Editor Protocol

## Status

Implemented on React Native Web, iOS, and Android through one public
`RichTextEditor` and shared markdown document model.

## Purpose

`RichTextEditor` is a small, block-first editor for notes, descriptions, and
other structured text. It edits rich content in place while keeping canonical
markdown as the only public value format. Web and native surfaces must accept
and emit the same document without platform-specific conversion by consumers.

The paired mobile and desktop presentation is captured in
[the rich-text editor mockup](../mockups/rich-text-editor.html).

## Public Contract

- `value` is controlled markdown. An omitted value is an empty document.
- `onChangeMarkdown` receives canonical markdown after each committed edit.
- `label`, `placeholder`, `autoFocus`, `readOnly`, `minHeight`, `maxHeight`,
  `disableFocusRing`, and `testID` behave on both platform families.
- The exact `testID` targets the web editable root and the first non-divider
  native block. Native additionally exposes `${testID}-field` on the outer
  field and `${testID}-block-N` on remaining blocks.
- `slashExtraItems` extends the caret menu on web. Native accepts the prop for
  API compatibility; mobile block and formatting actions live in the keyboard
  toolbar.
- Incoming markdown that differs from the editor's last emitted value replaces
  the local document. Echoing the emitted value back must not reset focus,
  selection, or typing marks.

## Shared Document Contract

Both implementations use the block model and markdown mapping documented by
the component README:

- paragraphs, headings 1–3, bulleted lists, numbered lists, checklists,
  blockquotes, code blocks, and dividers;
- bold, italic, strikethrough, and inline-code marks;
- one canonical non-empty document with normalized adjacent inline spans;
- numbered-list runs serialized from 1, checklist state serialized as GFM, and
  unsupported markdown retained as plain text.

There is no native-only persistence format and no HTML bridge. Native edits
must be applied through the same pure model operations used by web so markdown
round trips remain equivalent.

## Native Editing Contract

### Blocks

- Each text block is an independently focusable, auto-growing native text
  input. Block chrome renders outside the input: bullets, numbers, checklist
  controls, quote rule, and code surface.
- Inline spans render with native attributed text so existing marks remain
  visible while the block is being edited.
- Enter splits the current block at the selection. Heading and quote
  continuations become paragraphs; list and checklist items continue their
  list; Enter on an empty list, checklist, or quote exits to a paragraph.
- Enter inside a code block inserts a newline. A code block is converted or
  exited with the block toolbar rather than silently changing its contents.
- Backspace at the start of a block follows the shared merge/demotion rules.
  Backspace immediately after a prefix conversion restores its literal prefix.
- Tapping a checklist control toggles its checked state without moving the text
  caret.
- Markdown-style block prefixes (`# `, `- `, `1. `, `[ ] `, `> `, fenced code,
  and `---`) apply the same conversions as web.

### Inline editing

- The editor reconciles native plain-text changes against the previous block
  text and selection, preserving marks outside the changed range.
- Replacement text uses an explicitly selected typing-mark set when present;
  otherwise it inherits the adjacent span's marks.
- A toolbar mark action toggles the selected text. With a collapsed caret it
  changes the marks used for subsequently inserted text.
- Inline delimiter autoformat removes the opening and closing delimiters while
  retaining the content's existing spans, then adds the requested mark. A mark
  already present across the whole range remains present.
- Native autocorrect, composition, selection replacement, and paste may replace
  more than one character; reconciliation must treat them as one edit rather
  than assuming single-key input.

### Keyboard toolbar

- While an editable block has focus, mobile exposes 44-point actions for
  inserting a block, undo/redo, changing the current block type, toggling
  inline marks, and dismissing the keyboard.
- iOS presents the bar through `InputAccessoryView`, immediately above the
  software keyboard. Android renders the same bar at the bottom edge of the
  editor while the keyboard is visible, compatible with the platform's normal
  resize behavior.
- The action row scrolls horizontally on narrow devices and keeps the active
  block/mark state visible. Toolbar presses retain the current editor selection.
- Undo and redo use the editor's bounded model history rather than relying on a
  platform text input's private history. Input-rule transformations create a
  literal pre-transform snapshot, so the first undo restores the delimiters;
  model results equal to the current canonical document create no history item.

## Read-only Contract

Read-only native documents render styled text blocks rather than editable text
inputs. Checklist state remains visible but cannot be toggled, the toolbar is
absent, and no change callback fires.

## Accessibility

- The visible label names the editor and is included in native block input
  labels. Without one, the fallback name is `Rich text editor`.
- Block labels include their semantic kind and position, while heading output
  retains heading semantics in read-only mode.
- Checklist controls expose `checkbox`, checked, and disabled state with a
  minimum 44-by-44-point target.
- Every toolbar action is a named button with selected and disabled state where
  applicable. Meaning never depends on icon shape or color alone.
- Dynamic Type/font scaling remains enabled for editor text and toolbar labels.

## Verification

- Pure unit tests cover native edit inference, mark preservation, prefix rules,
  Enter splitting, Backspace merging, checklist actions, and history targets.
- Web browser coverage remains unchanged and must stay green.
- Native Storybook includes editable, prefilled, and read-only examples using
  the package's `react-native` export condition.
- The native package must typecheck/build and the on-device Storybook bundle
  must be smoke-tested for both iOS and Android resolution when the local SDKs
  are available.
