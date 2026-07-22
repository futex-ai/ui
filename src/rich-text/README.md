# Rich Text

Cross-platform block rich-text editor for React Native and React Native Web.
The public component edits rich content in place on web, iOS, and Android while
reporting canonical markdown through `onChangeMarkdown`.

## Responsibilities

- Render a labelled rich-text editing frame with the shared theme, typography
  scale, focus ring, placeholder, and read-only state.
- Keep a pure block document model for paragraphs, headings, lists, checklist
  items, quotes, code blocks, dividers, and inline marks.
- Parse and serialize the supported markdown subset, including checklist items,
  fenced code blocks, soft breaks, inline marks, and round-trip normalization.
- Apply block prefix shortcuts (`# `, `- `, `1. `, `> `, ` ``` `, `---`)
  through the pure model instead of direct DOM surgery.
- Provide a web slash menu for block conversion and caller-supplied commands.
- Toggle inline bold, italic, strike, and code marks over selected text, with
  typed delimiter autoformat for the same mark set.
- Maintain bounded undo/redo history for model operations and coalesced typing.
- Manage the web `contentEditable` document imperatively; React renders the
  frame, label, and placeholder only.
- Render native content as independently editable, auto-growing blocks with
  attributed inline spans, semantic list/checklist chrome, and a
  keyboard-adjacent formatting toolbar.
- Reconcile native text changes, including replacement, autocorrect, paste, and
  composition, through the shared document model without exposing raw markdown
  as the editing surface.

## Components

- `RichTextEditor` — the public editor. Web uses an imperative
  `contentEditable` surface; native uses block-level `TextInput` surfaces and a
  mobile formatting toolbar.

## Usage

```tsx
import { RichTextEditor } from "@firna/ui/rich-text";

<RichTextEditor
  label="Description"
  onChangeMarkdown={setDescription}
  placeholder="Write a summary..."
  testID="description-editor"
  value={description}
/>;
```

On native, the exact `testID` remains on the first editable block for backwards
compatible typing automation. The outer field uses `${testID}-field`; remaining
blocks use `${testID}-block-N`.

### Markdown Contract

The editor accepts and emits the supported markdown subset:

````md
# Heading

Paragraph with **bold**, _italic_, ~~strike~~, and `code`.

- Bullet
- [x] Checklist item

> Quote

```
code block
```
````

Inline content is normalized when it leaves the editor: adjacent spans with the
same marks are merged, mark order is canonical, numbered-list runs are
renumbered, and unsupported markdown constructs such as links, tables, raw HTML,
and setext headings remain plain paragraph text.

### Editing Contract

Enter splits blocks and preserves list/checklist continuation rules; Backspace
at a block start demotes or merges it. Markdown block prefixes and inline
delimiters apply while typing. Selected text can be marked bold, italic,
strikethrough, or inline code. On native, toggling a mark at a collapsed caret
sets the marks for subsequent text.

Native structural edits transfer first-responder focus to their target block on
the next animation frame, after the originating input event settles. A delayed
blur from the previous block is ignored once another block owns the caret, so
Enter keeps the keyboard and formatting toolbar available on the new line.
On iOS, each editable block uses a unique, pre-mounted accessory host; only the
active host renders the controls.

Character and word insert/delete edits are coalesced as typing. Destructive
browser edits and native replacement edits record model snapshots so undo can
restore the pre-edit document and any stale redo branch is cleared. Inline
autoformat removes only the typed delimiters, retaining marks already present
on the content. Continued native typing keeps the pre-rule typing marks instead
of extending the delimiter-applied mark. An input-rule transformation records
the literal markdown as its first undo target, and unchanged model results do
not create undo entries.

### Mobile Toolbar

On iOS the horizontally scrollable toolbar is attached with
`InputAccessoryView` through the active block's unique accessory host; Android
renders the same toolbar at the editor's bottom edge while a block is focused.
It exposes block insertion/conversion,
undo/redo, inline marks, divider insertion, and keyboard dismissal with
44-point controls. `slashExtraItems` remains web-only and is ignored on native.

## Accessibility

- The editable web root is a `role="textbox"` with `aria-multiline="true"`;
  each native text block is a named multiline input.
- A visible `label` names the editor; without one, the accessible fallback is
  `Rich text editor`.
- Checklist controls expose checkbox role, checked state, disabled state, and a
  44-point native target.
- Native toolbar buttons expose names plus selected and disabled states.
- The frame uses the shared focus-ring convention so keyboard focus remains
  visible without changing layout.
