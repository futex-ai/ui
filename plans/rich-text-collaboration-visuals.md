# Rich Text Collaboration Visuals

Add the visual layer for a rich-text document worked on by more than one
person: history tracking ("track changes"), comment threads, and live editing
for two users.

The layer is presentation only. It draws the session it is handed and reports
intent back through callbacks — it never syncs, merges, re-anchors, or resolves
anything, and accepting a change does not edit the document. Transport and
conflict resolution belong to the consuming app (or its CRDT), not to a shared
UI package.

Contract: [docs/protocol/rich-text-collaboration.md](../docs/protocol/rich-text-collaboration.md).
Mockup: [docs/mockups/rich-text-collaboration.html](../docs/mockups/rich-text-collaboration.html).

## Milestone 1 — Pure collaboration model (complete)

Types and the pure projection every platform renders from, so the resolution
rules live in one testable place instead of being re-derived per platform.

- [x] `richTextCollabTypes.ts`: collaborators, suggestions, comment threads,
      presence, ranges, and the props shape both editors accept.
- [x] `richTextCollabModel.ts`: project the overlay onto the document as a
      per-block tiling of runs plus caret offsets; clip ranges to blocks;
      resolve overlaps deterministically; read range text for previews.
- [x] `richTextCollabPalette.ts`: assign collaborator colours from the theme's
      accent families, leaving amber to comment anchors; neutral ink for an
      author outside the roster.
- [x] `richTextCollabRailModel.ts`: order suggestions and threads into one
      document-ordered list, with word summaries and preview truncation.
- [x] Unit tests for run tiling, cross-block ranges, status filtering, overlap
      resolution, caret boundary alignment, local-viewer suppression, palette
      assignment, and rail ordering.

## Milestone 2 — Web decorations (complete)

Draw the overlay inside the existing `contentEditable` surface without letting
it leak into the document model.

- [x] Split the DOM renderer: `domStyle.web.ts` for raw style application,
      `domInline.web.ts` for inline content, `domDecoration.web.ts` for the
      decoration elements.
- [x] Render `ins` / `del` / `mark` / selection tint per run, and remote carets
      as zero-width non-editable markers with a name flag.
- [x] Make the serializer see through `data-rt-deco` wrappers, so a tracked
      deletion's `<del>` never becomes `~~strikethrough~~`, and read code-block
      text through an editable-only walk.
- [x] Thread the overlay through `RichTextEditor.web.tsx`, re-anchoring the
      local selection when the overlay changes under a focused editor.
- [x] Report the comment thread under the caret and under a pointer click.

## Milestone 3 — Collaboration surfaces (complete)

The two composable surfaces beside the editor, cross-platform.

- [x] `RichTextPresenceBar`: tinted avatar discs plus a sentence naming who is
      live.
- [x] `RichTextCollabRail` + `RichTextCollabCard` / `RichTextCollabCardBody`:
      one document-ordered list of tracked changes and threads, with accept,
      reject, resolve, and reply.
- [x] `richTextCollabStyles.ts`, carrying selection as a uniform border plus a
      soft fill rather than an edge strip.

## Milestone 4 — Native decorations (complete)

- [x] `nativeRichTextInline.tsx`: run-sliced attributed text carrying the
      tracked-change, comment, and live-selection styling over each run's own
      inline marks.
- [x] Per-block remote-presence initials discs, because a native `TextInput`
      cannot host a caret marker inside its own text.
- [x] Thread the overlay through the native editor and surface.

## Milestone 5 — Docs, stories, and verification (complete)

- [x] Protocol doc and a mobile + desktop mockup.
- [x] `RichText/Collaboration` stories: a live two-user session (light, dark,
      read-only) and an empty session.
- [x] Component README and root README updates.
- [x] Browser tests for the semantic `ins`/`del`/`mark` output, the remote
      caret and its flag, caret movement, rail ↔ anchor selection, accepting a
      change, and markdown safety while typing inside a tracked deletion.
- [x] `npm run verify` green, including the Storybook axe sweep with no new
      baseline entries.
- [x] `git add -A`, Conventional Commit, push the branch, then
      `cargo xtask review` against `origin/main`.

## Deferred

- Re-anchoring ranges as the document is edited. Out of scope for a visual
  layer: it is the mapping half of a collaboration engine and belongs with
  whatever owns the document's change stream.
- A "clean view" that hides tracked deletions. The web surface serializes the
  document back out of its own DOM, so hiding text there would drop it from the
  model on the next edit; this needs a rendered/serialized split first.
- On-device native rendering pass for the decoration styles (Android's nested
  `Text` decoration support is weaker than iOS's).
