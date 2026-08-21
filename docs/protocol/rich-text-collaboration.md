# Rich Text Collaboration Protocol

## Status

Implemented on React Native Web, iOS, and Android as a presentation layer over
the existing `RichTextEditor`, plus two composable surfaces:
`RichTextPresenceBar` and `RichTextCollabRail`.

## Purpose

Show a document being worked on by more than one person: who is in it and where
their carets are, which words are proposed to be added or removed, and which
words are being discussed.

This layer is **visual only**. It draws the session it is handed and reports
intent back through callbacks. It never syncs, merges, rebases, re-anchors, or
resolves anything, and accepting a change or resolving a thread does not edit
the document — the consumer applies that edit and passes down the new state.
That boundary is deliberate: transport and conflict resolution belong to the
app (or its CRDT), not to a shared UI package.

The paired mobile and desktop presentation is captured in
[the collaboration mockup](../mockups/rich-text-collaboration.html). The
underlying editor contract is [rich-text-editor.md](rich-text-editor.md).

## Public Contract

`RichTextEditor` accepts the collaboration overlay alongside its existing props:

- `collaborators` — everyone who can appear. Order fixes colour assignment.
- `localCollaboratorId` — the viewer. Their own presence entry draws no remote
  caret, and the rail names them "You".
- `suggestions` — tracked changes as `{ id, authorId, kind, range }`.
- `commentThreads` — threads as `{ id, range, comments[] }`.
- `presence` — live selections as `{ collaboratorId, selection }`.
- `activeCommentThreadId` — the thread drawn as selected.
- `onSelectCommentThread` — fired when a comment anchor is picked.

Every one is optional. With none supplied the editor renders exactly as before
and does no annotation work at all.

### Ranges

A `RichTextRange` is `{ from: DocPosition, to: DocPosition }` over the same
block/offset positions the editor already uses for selection, with `from`
inclusive and `to` exclusive. Endpoints may be supplied in either order and are
clamped to the block they land in; a range spanning blocks covers the
intermediate blocks end to end. A presence caret is drawn at `to`, the moving
end of the selection.

Ranges are **not** re-anchored when the document changes. Text the consumer
edits underneath a range will shift what that range covers; keeping ranges in
step with edits is the consumer's job, the same as it is for the document
itself.

### Status

Only `pending` suggestions and unresolved threads are drawn in the document and
listed in the rail. `accepted` / `rejected` suggestions and resolved threads are
kept in the arrays so a consumer can hold history without filtering, and the
rail's `includeResolved` opts them back into the list.

## Document Overlay Contract

The overlay is projected onto the document by one pure function,
`annotateRichTextDocument`, before any platform draws it. Per block it returns:

- **runs** — a tiling of the block's plain text from `0` to its text length
  with no gaps or overlaps. Each run carries the thread ids over it, whether one
  of them is active, which collaborators' selections cover it, and the tracked
  change on it. Undecorated blocks still tile, so a renderer never special-cases
  them.
- **carets** — remote caret offsets. Every caret offset is also a run boundary,
  so a renderer emits carets between runs rather than splitting text twice.

Deterministic resolution rules, so the same session always draws the same way:

- Overlapping tracked changes collapse to one mark per run. A deletion wins over
  an insertion — the stronger claim on the text is that it is leaving — and ties
  between the same kind break on `id`, never on array order.
- Overlapping comment threads are all reported, in the order supplied, and nest
  outermost-first so the tint deepens where discussions overlap.
- Where several collaborators' selections cover the same run, the first one's
  tint is drawn.

## Visual Language

| Thing                 | Drawn as                                                       |
| --------------------- | -------------------------------------------------------------- |
| Insertion             | Underline in the author's accent, text in their `*Deep` colour |
| Deletion              | Strikethrough in the author's accent, text in `muted`          |
| Comment anchor        | Amber `soft` tint with a 2px amber underline                   |
| Active comment anchor | The same, plus a 1px inset amber ring                          |
| Live selection        | The collaborator's accent at 22% alpha                         |
| Remote caret          | 2px accent bar with a name flag above it                       |
| Collaborator identity | Avatar disc filled with their accent                           |

Collaborator colour comes from the theme's accent families — `primary`, then
`rose`, then `amber` — so a session recolours with the theme rather than
shipping its own palette. Amber is last on purpose: it is the highlighter tone
comment anchors use, so a two-person session's carets stay clearly distinct from
"there is a discussion here". A collaborator can pin a slot with `tone`, and an
author who is not in `collaborators` is drawn in neutral ink rather than
borrowing someone else's colour.

Comment anchors are the one thing **not** drawn in the commenter's colour:
several people can comment on the same words and a run of text can carry only
one tint, so the anchor colour means "there is a discussion here" and the rail
card carries who.

## Web Editing Contract

Decorations are rendered into the same `contentEditable` tree as the document,
which makes two invariants load-bearing:

- Every decoration wrapper carries `data-rt-deco`. The serializer treats such an
  element as transparent — it serializes the children and contributes no mark —
  so a tracked deletion's `<del>` never comes back as `~~strikethrough~~`
  markdown, and no wrapper can drop text.
- A remote caret marker is `contenteditable="false"` and `aria-hidden`. Both the
  serializer and the block-offset walker already skip non-editable subtrees, so
  the marker contributes no text and no offset. Code blocks read their text
  through the same editable-only walk, so a caret inside one cannot leak its
  name flag into the code.

Semantics are real: insertions are `<ins>`, deletions are `<del>`, and comment
anchors are `<mark>`, each with a `title` naming the author where one applies.

Re-rendering the document tree discards the DOM selection, so an overlay change
arriving while the editor has focus re-anchors the local selection afterwards: a
collaborator's caret appearing must never move the local one.

The caret's name flag sits above the caret and overlaps its top by 3px, so a
caret on the document's first line still fits inside the editor body's 10px top
padding instead of being sheared by the frame's clip.

## Native Editing Contract

- Runs are drawn as attributed `Text` inside the block's `TextInput`: underline,
  strikethrough, tint, and colour, layered over the run's own inline marks.
- A native text input owns its contents, so a remote caret cannot be drawn
  inside the line the way it is on web. Instead each block reports the carets in
  it as initials discs beside the text, labelled "<name> is editing here".
- Pressing a commented run fires `onSelectCommentThread` with the innermost
  thread.
- Android's nested-`Text` decoration support is weaker than iOS's; where a run's
  own mark and a decoration both set `textDecorationLine`, the innermost wins.

## Composition Contract

`RichTextEditor` draws only what belongs inside the document. The presence bar
and the review rail are separate exported components so a consumer owns the
layout — a side rail on a wide screen, a stacked list on a phone.

`RichTextCollabRail` puts suggestions and comment threads in one list ordered by
position in the document, so a reviewer works top to bottom instead of switching
between two panels. Ties break on kind then id, so the list is stable across
renders. Card previews are read out of the `value` markdown the consumer already
holds; a suggestion may override with `preview` when its range no longer matches
the text.

## Accessibility

- Nothing depends on colour alone (WCAG 2.1 — 1.4.1). A change is captioned in
  words ("Robin suggested deleting text"), a live session is captioned in words
  ("Cal and Robin are editing"), and every `<ins>` / `<del>` carries a `title`
  naming its author.
- Remote caret markers are hidden from assistive tech. They carry no document
  text, and announcing a name mid-sentence would interrupt reading; the presence
  bar is the accessible account of who is in the document.
- Presence avatar discs are decorative — the sentence beside them names
  everyone, so a screen reader does not hear each name twice.
- A rail card's summary region is the one pressable area, so selecting an entry
  never nests a button inside a button (4.1.2). Accept, reject, resolve, and
  reply are siblings, each with a visible label.
- The rail is the keyboard path to a thread: comment anchors are pointer
  targets, and moving the caret into an anchor also reports its thread, but no
  anchor is a tab stop inside the text.
- `placeholder` is held to 4.5:1 on `surface` only, so a card whose fill is a
  selection or resolved tint steps its timestamp up to body ink (1.4.3).

## Verification

- Pure unit tests cover run tiling, cross-block ranges, status filtering,
  overlap resolution, caret placement and boundary alignment, local-viewer
  suppression, palette assignment, and rail ordering and previews.
- Browser tests cover the semantic `ins`/`del`/`mark` output, the remote caret
  and its flag, caret movement between blocks, rail selection round-tripping to
  the anchor, accepting a change, the read-only path, and — most importantly —
  that typing inside a tracked deletion does not turn it into a strike mark.
- The Storybook axe sweep covers the collaboration stories in light and dark,
  including a selected card, with no baseline entries.
- The native decoration path is covered by the shared pure model; on-device
  rendering is a manual pass.
