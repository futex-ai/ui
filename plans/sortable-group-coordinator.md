# Sortable group coordinator

Add **cross-list** drag-and-drop to `@firna/ui`. Today
[`SortableList`](../src/sortable-list/README.md) is strictly single-list: its
`onReorder` reports `{ key, fromIndex, toIndex }` with no notion of a source or
destination container, and its web drag hook measures only the rows inside its
own container. [`Kanban`](../src/kanban/README.md) does support cross-column
moves, but its board chrome is wrong for a plain stack of sections and its drag
engine is internal — `src/kanban/index.ts` exports neither `useKanbanCardDrag`
nor `kanbanDragModel`, and the geometry is hard-wired to columns laid out
across the x-axis.

This plan introduces a **coordinator**: a pure provider that several
`SortableList`s join, so an item can be dragged from one list into another by
pointer or keyboard. The consumer keeps ownership of the layout — the
coordinator renders no box of its own, so section titles, spacing, collapse
chrome, and empty states stay app code. It must serve both arrangements: a
vertical stack of sections (the motivating case — a "Workspace" list above a
"Personal" list, chats movable between them) and a horizontal row of lists (a
Kanban-like board without Kanban's chrome).

**Visual reference:** the Storybook story
(`src/stories/sortableList.stories.tsx`, `title: "SortableList/Examples"`) is
the living spec; this plan adds a stacked-sections example and a
row-of-lists example to that same title folder.

**Status:** M1 delivered — the drag engine now reasons about N groups behind the
unchanged single-list API, the ghost is portaled, and `npm run verify` is green.
M2 (the coordinator and cross-group moves) and M3 (`canDrop`, docs) are next.

---

## Goal

Ship a `SortableGroups` coordinator alongside the existing `SortableList` that:

- Reports every committed move as
  `{ key, fromGroupId, fromIndex, toGroupId, toIndex }` through one callback,
  keeping the controlled contract (the drag never mutates the consumer's data).
- **Preserves the current single-list API byte for byte.** A `SortableList`
  rendered without a coordinator behaves exactly as it does at v1.2.1;
  `SortableMove`, `onReorder`, and `applySortableMove` are unchanged.
- Works for any 2D arrangement of lists — stacked, side by side, or a grid —
  because the pointer hit test is rect containment with a nearest-rect fallback
  rather than the Kanban model's columns-across-x assumption.
- Crosses groups by keyboard in a spatially honest way, declared through a
  `groupFlow` prop.
- Lets the consumer bar a destination outright via `canDrop`, while leaving
  _confirmable_ destinations (e.g. moving a chat Workspace → Personal revokes
  teammates' access) to the app: because the list is controlled, the app can
  withhold the move, show its dialog, and apply on confirm — the lists snap
  back on their own because nothing mutated.
- Meets the WCAG 2.1 AA bar the library holds: `list` / `listitem` semantics, a
  named focusable drag target, live-region announcements that name the
  destination group, and no new axe violations.

## Public API

```tsx
import {
  applyGroupedSortableMove,
  SortableGroups,
  SortableList,
} from "@firna/ui/sortable-list";

<SortableGroups canDrop={allow} groupFlow="vertical" onMove={handleMove}>
  <SectionTitle>Workspace</SectionTitle>
  <SortableList
    accessibilityLabel="Workspace chats"
    groupId="workspace"
    items={groups.workspace}
    …
  />
  <SectionTitle>Personal</SectionTitle>
  <SortableList
    accessibilityLabel="Personal chats"
    groupId="personal"
    items={groups.personal}
    …
  />
</SortableGroups>;
```

```ts
/** How the groups sit relative to each other; picks the keyboard model. */
type SortableGroupFlow = "horizontal" | "vertical";

/** The committed cross-list move. Indices use removed-item semantics, as today. */
type SortableGroupMove = {
  key: string;
  fromGroupId: string;
  fromIndex: number;
  toGroupId: string;
  toIndex: number;
};

/** Splice the item out of its source group and into the destination group. */
function applyGroupedSortableMove<Item>(
  groups: Record<string, Item[]>,
  move: SortableGroupMove,
  itemKey: (item: Item, index: number) => string,
): Record<string, Item[]>;
```

Contract notes:

- `SortableGroups` renders a Fragment (plus, on web, the portaled drag ghost).
  It contributes no layout box, so it can wrap any subtree.
- `SortableList` gains exactly one prop, `groupId?: string`, which joins the
  enclosing coordinator. No coordinator, or no `groupId`, means today's
  behaviour.
- Inside a coordinator, `onMove` is the **single sink** for every committed
  move, including within-group ones; branch on `fromGroupId === toGroupId`. A
  list's own `onReorder` is ignored there and `devWarn`s once, so there is never
  an ambiguity about which callback fires.
- The coordinator's `onMove` is what enables dragging for its member lists, the
  way `onReorder` enables it for a standalone list.
- A list's `accessibilityLabel` doubles as the group name woven into
  announcements ("Workspace, position 2 of 5"), falling back to the `groupId`.
  No new label prop.
- `canDrop(move)` is consulted with each candidate target. Pointer: a rejected
  target is never adopted, so the drop preview never opens somewhere the item
  cannot land. Keyboard: rejected slots are stepped over in the direction of
  travel, a wholly-rejecting group is skipped, and if nothing is reachable the
  target holds.
- `groupFlow` declares how the groups sit relative to each other and picks the
  keyboard model:
  - `"vertical"` (default) — Up / Down step within a group and **overflow**
    into the adjacent group at its near end; Left / Right do nothing.
  - `"horizontal"` — Left / Right **jump** to the adjacent group at a clamped
    index; Up / Down stay within the group (Kanban parity).
  - Home / End stay group-local in both.
- Item keys must be unique across every group in one coordinator — the same
  rule Kanban already holds for card keys, required because `restoreFocus`
  falls back to a document-wide `querySelector` on the item `data-testid`.
  `devWarn` on duplicates.

## Architecture

The decisive choice is **one engine over N groups** rather than a second
coordinator engine beside the existing one. `useSortableListDrag.web.ts` and
`useKanbanCardDrag.web.ts` are already the same machinery written twice; a third
copy would drift. So the existing engine is generalised to an array of groups,
and the standalone list becomes a coordinator of one group under a private
implicit id. The single-list adapter derives `SortableMove` from the grouped
move by dropping the group ids.

New and changed files, all under `src/sortable-list/` unless noted:

- `sortableGroupModel.ts` — **new.** Pure, React-free multi-group geometry and
  bookkeeping, built on the existing single-axis primitives in
  `sortableListModel.ts` (`axisRange`, the midpoint scan, removed-item
  semantics): `groupAt` (rect containment, else nearest by edge distance),
  `liftedGroupDropTarget`, `keyboardGroupTarget` (both `groupFlow` models),
  `groupTargetToMove`, `describeGroupTarget`, `groupIndicatorIndex`, and
  `applyGroupedSortableMove`. Unit-tested directly.
- `sortableListModel.ts` — unchanged public surface; the single-list helpers
  stay exported for consumers and for the adapter.
- `useSortableDrag.web.ts` — **new.** The generalised pointer + keyboard engine
  over N groups, extracted from today's `useSortableListDrag.web.ts`.
- `sortableDragFocus.ts` — **new.** The focus-node registry, `restoreFocus`, and
  the committed-drag click suppression, lifted out of the engine so both stay
  near the repo's ~300-line file guide.
- `useSortableListDrag.web.ts` / `useSortableListDrag.ts` — thin adapters: one
  implicit group in, today's `UseSortableListDrag` contract out. The native file
  stays the inert no-op.
- `useSortableGroupDrag.web.ts` / `useSortableGroupDrag.ts` — **new.** Thin
  adapters from the coordinator's registered groups to the engine; the native
  file is the matching inert no-op.
- `sortableGroupContext.ts` — **new.** The React context: group registration
  (node, keys, orientation, label, preview publisher), the shared drag state,
  and the per-list accessors. Live values are read through refs so a pointer
  move does not re-render every member list.
- `SortableGroups.tsx` — **new.** The provider component: `groupFlow`,
  `onMove`, `canDrop`, the shared ghost.
- `SortableList.tsx` — gains `groupId`, consumes the coordinator when present,
  publishes its rendered row as the preview node while it owns the dragged item,
  and renders the preview when it owns the current target group.
- `src/dragGhostPortal.tsx` / `src/dragGhostPortal.web.tsx` — **new, shared.**
  A body-level portal for the viewport-positioned drag ghost, replacing the
  Kanban-local `KanbanDragGhostPortal` (deleted; `Kanban.tsx` imports the shared
  one).

Two supporting decisions:

- **Group order** is derived at grab time by sorting the measured group rects
  along `groupFlow`, so no explicit index prop is needed and conditionally
  rendered sections cannot scramble it. Registration order is the fallback when
  rects are unavailable (jsdom, tests).
- **The ghost is portaled to `document.body`.** `SortableList` renders its
  `position: fixed` ghost inline today, which breaks under a transformed or
  scrolling ancestor — Kanban already portals for exactly this reason. A drag
  that leaves its source list makes the bug certain, so the coordinator owns one
  portaled ghost and the standalone list gets the same treatment. The preview,
  by contrast, is rendered by the list that owns the target group, using the
  source group's published node through that list's own `SortableClone` styles,
  so the dashed slot opens in the destination while the source row lifts out.

## Non-goals

- Native drag stays an inert no-op, exactly as `SortableList` is today. Touch
  drag, drag-to-edge auto-scroll, and RTL remain on the
  [SortableList M2 backlog](sortable-list-component.md).
- The coordinator renders no empty-group drop zone. An empty group needs its own
  height to be a comfortable target (`style={{ minHeight: … }}`); the
  nearest-rect fallback still reaches a zero-height one. Documented, not built.
- No all-in-one `groups`-array component. The coordinator plus the existing list
  is the primitive; a convenience wrapper can follow if a second consumer wants
  one.

## Milestones

### M1 — Generalise the engine to N groups (no public change) ✅

At the end: the drag engine reasons about an array of groups, the standalone
list is a coordinator of one, and the ghost is portaled. No public API changed
and nothing new is exported.

- [x] Add `sortableGroupModel.ts` with the multi-group types
      (`SortableGroupLayout`, `MeasuredSortableGroup`, `MeasuredGroupItem`,
      `SortableGroupTarget`, `SortableGroupMove`), `groupAt`,
      `liftedGroupDropTarget`, `initialGroupTarget`, `groupTargetToMove`,
      `describeGroupTarget`, `groupIndicatorIndex`, reusing the
      `sortableListModel.ts` primitives.
- [x] Add `measureGroupRects` / `measureGroupItems` (and `GroupNode`) to
      `sortableListDom.ts`, tagging each measured row with its group.
- [x] Extract `sortableDragFocus.ts` (focus registry, `restoreFocus`, click
      suppression) from `useSortableListDrag.web.ts`.
- [x] Add `useSortableDrag.web.ts`: the pointer + keyboard engine over N groups,
      with a per-group container node, keys, handle mode, and orientation.
- [x] Reduce `useSortableListDrag.web.ts` to an adapter over the engine with one
      implicit group id; keep `useSortableListDrag.ts` inert.
- [x] Add the shared `src/dragGhostPortal.{tsx,web.tsx}`; render the
      `SortableList` ghost through it.
- [x] Move `Kanban.tsx` onto the shared portal and delete
      `src/kanban/KanbanDragGhostPortal.{tsx,web.tsx}`.
- [x] Unit tests for the new model and DOM helpers
      (`tests/unit/sortableGroupDrag.test.ts`, 24 cases: `groupAt` containment +
      nearest-rect on both arrangements, per-group orientation scanning, empty
      groups, move derivation, announcement phrasing, group measurement).
- [x] Add `tests/browser/sortable-list.spec.ts` — the behavioural guard for the
      refactor. **The plan assumed existing tests covered the drag; they did
      not.** `sortableList*.test.ts` only assert the pure model and the
      component source, and no browser spec touched the list, so the engine had
      no end-to-end coverage before this. The new spec drives real pointer
      drags, keyboard grabs, Escape-cancel, the horizontal axis, and the row's
      own controls; it was checked against a deliberately broken engine to
      confirm it can actually fail.
- [x] `tests/unit/sortableListDrag.test.ts` passes unedited. Two structural
      assertions did need repointing, both to file locations rather than
      behaviour: `sortableList.test.ts` asserted drag internals lived in
      `useSortableListDrag.web.ts` (they moved to the engine) and
      `kanban.test.ts` named the deleted Kanban-local ghost portal.
- [x] `npm run verify` green (606 unit tests, 205 browser tests including the
      axe scan).

### M2 — The coordinator: cross-group pointer and keyboard moves

At the end: several `SortableList`s inside a `SortableGroups` exchange items by
pointer and keyboard, with the preview opening in the destination group and
announcements naming it.

- [ ] Add `keyboardGroupTarget` to `sortableGroupModel.ts` covering both
      `groupFlow` models (vertical overflow at boundaries; horizontal jump with
      a clamped index) and group-local Home / End.
- [ ] Add `applyGroupedSortableMove` and export it.
- [ ] Add `sortableGroupContext.ts` with group registration, live refs, and the
      shared drag state.
- [ ] Add `useSortableGroupDrag.web.ts` / `.ts`.
- [ ] Add `SortableGroups.tsx` (`groupFlow`, `onMove`, the portaled shared
      ghost); render a Fragment so no layout box is introduced.
- [ ] Add `groupId` to `SortableList`; route drag wiring through the coordinator
      when present, publish the preview node while dragging, render the preview
      when this list owns the target group.
- [ ] `devWarn` on a duplicate `groupId`, on duplicate item keys across groups,
      and on `onReorder` passed alongside `groupId`.
- [ ] Announcements name the destination group on a group change (grab, arrow,
      drop), using `accessibilityLabel` then `groupId`.
- [ ] Exports wired in `src/sortable-list/index.ts` (`SortableGroups`,
      `SortableGroupMove`, `SortableGroupFlow`, `applyGroupedSortableMove`).
      `src/index.ts` needs no edit — it already star-exports the directory. No
      new package subpath either: the coordinator ships under `./sortable-list`,
      so `tests/unit/packageExports.test.ts` must still pass untouched.
- [ ] `SortableGroups` renders a Fragment and so has no host root to carry a
      `testID`. It is therefore _not_ added to `FORWARDING_FILES` in
      `tests/unit/testIDForwarding.test.ts`; add a short comment there recording
      why, so that list's "exhaustive on purpose" claim stays honest.
- [ ] Unit tests: cross-group keyboard stepping in both flows, boundary
      overflow, `applyGroupedSortableMove` (including move to an empty group and
      a within-group move through the grouped path), duplicate-key `devWarn`.
- [ ] Source-assertion test `tests/unit/sortableGroup.test.ts` in the style of
      `sortableList.test.ts`.
- [ ] Storybook: a stacked-sections example (Workspace / Personal chats) and a
      row-of-lists example, both under `title: "SortableList/Examples"`.
- [ ] Playwright coverage in `tests/browser/`: pointer drag from one group to
      another, keyboard cross-group move, and the resulting `onMove` payload.
- [ ] `npm run verify` green.

### M3 — canDrop, accessibility pass, and docs

At the end: destinations can be barred, the feature is axe-clean, and the docs
describe it.

- [ ] Add `canDrop` to `SortableGroups`, consulted through a ref.
- [ ] Pointer: never adopt a rejected target; the preview holds at the last
      accepted slot.
- [ ] Keyboard: step over rejected slots in the direction of travel, skip a
      wholly-rejecting group, hold when nothing is reachable.
- [ ] Unit tests for both rejection paths, including a group that rejects every
      index and a `canDrop` that rejects the item's own origin slot.
- [ ] Add the grouped stories to the axe scan in `tests/browser/a11y.spec.ts`;
      no new violations against `axe-baseline.json`.
- [ ] Manual screen-reader smoke of a cross-group keyboard move (grab, cross,
      drop, cancel) — the announcements must name the destination group.
- [ ] `src/sortable-list/README.md`: a "Groups" section covering the
      coordinator, the move contract, `groupFlow`, `canDrop`, the controlled
      confirmation pattern, the unique-key rule, and the empty-group note.
- [ ] Root `README.md` component list updated.
- [ ] `plans/README.md`: move this plan to Completed.
- [ ] `npm run verify` and `cargo xtask check` green.

## Verification and review

Per `AGENTS.md`, after each milestone's checks pass: `git add -A`, commit with
Conventional Commits (`feat(sortable-list): …`), push the branch, then run
`cargo xtask review` so an AI reviewer checks the local diff against
`origin/main`. Findings are reported back numbered, with severity, impact, and
lettered options — not auto-fixed.

The release is a minor (`1.3.0`) through release-please; nothing in this plan is
a breaking change.
