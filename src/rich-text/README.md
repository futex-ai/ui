# Rich Text

Block rich-text editor for React Native Web, with a React Native markdown
textarea fallback. The public component edits rich content in place on web and
reports canonical markdown through `onChangeMarkdown`.

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
- Maintain a web undo/redo stack for model operations and coalesced typing.
- Manage the web `contentEditable` document imperatively; React renders the
  frame, label, and placeholder only.
- Fall back to the shared `Textarea` on native platforms, editing raw markdown
  with the same `value` and `onChangeMarkdown` contract.

## Components

- `RichTextEditor` — the public editor. Web uses the block editor; native uses
  the markdown textarea fallback.

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

### Undo Contract

Native character and word insert/delete edits are coalesced as typing. Browser
owned destructive edits such as cut, drag/delete, drop, replacement text, and
IME composition record a model snapshot before the native mutation so undo can
restore the pre-edit document and stale redo is cleared.

### Native Fallback

On native platforms `RichTextEditor` renders `Textarea` and edits markdown
directly. `slashExtraItems` is accepted for API compatibility but ignored.

## Accessibility

- The editable web root is a `role="textbox"` with `aria-multiline="true"`.
- A visible `label` also names the textbox through `aria-label`; when no label
  is supplied the root falls back to `Rich text editor`.
- Checklist controls render as `contenteditable=false` checkboxes with
  `aria-checked`.
- The frame uses the shared focus-ring convention so keyboard focus remains
  visible without changing layout.
