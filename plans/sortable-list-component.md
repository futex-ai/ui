# SortableList component

A new `@firna/ui` primitive: a drag-and-drop **sortable list**. Like the existing
[`List`](../src/list/README.md) it is generic over its data (`items` / `itemKey`
/ `renderItem`), but it makes the rows **reorderable** by pointer and keyboard,
with an optional grab **handle** at the start or end of each row and a choice of
**vertical** (default) or **horizontal** flow. It ports the proven
[`Kanban`](../src/kanban/README.md) card-drag machinery down to one list on one
axis.

**Visual reference:** a vertical stack of workflow-status rows (a coloured dot,
title, a status tag, and the row's own up / down / archive controls). Those row
controls are consumer content; the primitive supplies the reorder behaviour and
the optional grab handle. The living spec is the Storybook story
(`src/stories/sortableList.stories.tsx`).

**Status:** M1 delivered — `npm run verify` green. M2 (native drag / touch
reordering) deferred as a follow-up.

---

## Goal

Ship a cross-platform (React Native + React Native Web) `SortableList` primitive
that:

- Renders generic row content via `renderItem`, keyed by `itemKey` (List parity).
- Reorders rows by **pointer** (mouse / pen) and **keyboard** on the web,
  reporting each committed move through a controlled `onReorder(move)` callback
  (removed-item index semantics, like `Kanban.onCardMove`).
- Offers an optional grab **handle** (`"start"` / `"end"`) that is the sole drag
  / keyboard / focus target so the rest of the row stays interactive; with no
  handle the whole row is the drag surface.
- Flows `vertical` (default) or `horizontal` via `orientation`.
- Meets the WCAG 2.1 AA bar the library holds: `list` / `listitem` semantics, a
  named focusable drag target, live-region announcements, and no new axe
  violations.

## Architecture

Mirrors the Kanban file split, collapsing the column dimension:

- `sortableListModel.ts` — pure, React-free geometry + bookkeeping (removed-item
  index semantics on one axis) + `applySortableMove`. Unit-tested directly.
- `sortableListDom.ts` — web DOM measuring by `data-testid` (rows + handles).
- `sortableListTypes.ts` — the platform-split hook contract + testid prefixes.
- `useSortableListDrag.web.ts` — the web pointer + keyboard drag engine.
- `useSortableListDrag.ts` — the inert native no-op (same signature).
- `sortableListStyles.ts` — themed styles + the grab-cursor casts.
- `SortableRow.tsx` — the row, the grab handle, and the drop preview (internal).
- `SortableList.tsx` — the public component (drag wiring, flow, floating clone).

## Milestones

### M1 — Web sortable list + optional handle + both orientations ✅

At the end: a shipped `SortableList` reorderable by pointer and keyboard on the
web, with an optional start/end handle and vertical/horizontal flow; native
renders inertly. `npm run verify` green.

- [x] Pure model (`sortableListModel.ts`) with removed-item semantics, both axes,
      arrow mapping, `applySortableMove`.
- [x] Web DOM measuring (`sortableListDom.ts`) for rows and handles.
- [x] Platform-split drag hook: web pointer + keyboard (`.web.ts`), inert native
      (`.ts`), shared contract (`sortableListTypes.ts`).
- [x] Component + row + handle + preview + floating clone; `list` / `listitem`
      semantics; the shared focus ring and hidden web outline.
- [x] Themed styles across the `ControlSize` scale; `gap` prop.
- [x] Exports wired: `src/index.ts`, `src/sortable-list/index.ts`,
      `package.json` `exports`, and the `packageExports` key array.
- [x] `testID` forwarded on the root and added to `testIDForwarding.test.ts`;
      `GripVertical` / `GripHorizontal` added to `package-smoke-stubs.mjs`.
- [x] Unit tests: pure model (`sortableListDrag.test.ts`) + component source
      assertions (`sortableList.test.ts`).
- [x] Storybook story (`sortableList.stories.tsx`) covering handle + interactive
      rows, whole-row drag, horizontal, custom handle + frozen row, and sizes.
- [x] Component `README.md`; this plan; `plans/README.md` entry.
- [x] `npm run verify` and `cargo xtask check` green.

### M2 — Native drag + touch reordering (deferred)

Reordering is currently pointer + physical-keyboard only, so native and mobile
web have no drag path (the row's own controls are the interim reorder route).
A follow-up should add a gesture-driven native reorder (react-native-gesture-
handler + reanimated) and a handle-gated touch drag on the web, plus RTL support
for the horizontal axis. Track here when scheduled.

- [ ] Native pan-gesture reorder from the grab handle.
- [ ] Handle-gated touch drag on the web (avoids scroll conflict).
- [ ] RTL horizontal support (flip the arrow mapping + reading order).
