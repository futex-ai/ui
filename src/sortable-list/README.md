# SortableList

A drag-and-drop **sortable** list for React Native and React Native Web. Like
[`List`](../list/README.md) it is generic over its data (`items` / `itemKey` /
`renderItem`), so a row can hold anything; unlike List it makes those rows
**reorderable** — by pointer (mouse / pen) or keyboard on the web. An optional
grab **handle** at the start or end of each row keeps the rest of the row
interactive, and the list can flow vertically (default) or horizontally. It
ports the proven [`Kanban`](../kanban/README.md) drag machinery down to one list
on one axis.

## Responsibilities

- Render `items` through a `renderItem` callback (any node), keyed by `itemKey`.
- Make rows draggable when given `onReorder`, staying **controlled**: report each
  committed move for the consumer to apply to its own data (the drag never
  mutates `items`). `applySortableMove` does the splice.
- Offer an optional grab `handle` — auto-placed at the `"start"` / `"end"` of the
  row, or `"custom"` to place it yourself inside your content (e.g. in a card) —
  as the sole drag / keyboard / focus target, so the rest of the row stays
  independently interactive; with no handle the whole row is the drag surface.
- Flow `vertical` (default) or `horizontal` via `orientation`.
- Support a full keyboard reorder on the web (Space to grab, arrow keys to move,
  Home / End to jump to the ends, Space / Enter to drop, Escape to cancel) with
  live-region announcements, plus a lifted floating clone and a dashed drop
  preview under the pointer.
- Expose `list` / `listitem` semantics and the shared `ControlSize` densities,
  driven by shared theme tokens.
- Exchange items with sibling lists through the `SortableGroups` coordinator —
  see [Groups](#groups-dragging-between-lists).

## Usage

```tsx
import { applySortableMove, SortableList } from "@firna/ui/sortable-list";

type Status = { id: string; name: string };

function StatusList() {
  const [items, setItems] = useState<Status[]>(initial);
  return (
    <SortableList<Status>
      accessibilityLabel="Workflow statuses"
      handle="start"
      itemKey={(s) => s.id}
      itemLabel={(s) => s.name}
      items={items}
      onReorder={(move) =>
        setItems((prev) => applySortableMove(prev, move, (s) => s.id))
      }
      renderItem={(status) => <StatusRow status={status} />}
    />
  );
}
```

### The reorder contract

Providing `onReorder` enables dragging (mirroring how `List.onItemPress` enables
pressability and `Kanban.onCardMove` enables card drag). The list is controlled:
apply the reported `move` to your own `items` **synchronously** and the list
re-renders from the new props. `move.toIndex` uses **removed-item semantics** —
the insertion index in the list with the moved item already spliced out — so
`applySortableMove(items, move, itemKey)` is all a consumer needs.

### Grab handle

Set `handle` to `"start"` or `"end"` to render a grab handle (a themed grip
glyph, or your own via `renderHandle`) in the row gutter, beside the content. The
handle is then the **only** drag / keyboard / focus target, so a row's own
controls (chevrons, an archive button) keep working. Omit `handle` to make the
whole row the drag surface — best for simple rows with no interactive content of
their own (a whole-row drag target plus interactive children would nest press
targets). `handleLabel` names the handle button (defaults to
`Reorder <itemLabel>`); `itemLabel` names the whole-row target and is woven into
the drag announcements.

#### Placing the handle inside your card

Set `handle="custom"` to place the grip yourself — e.g. **inside** your own card
rather than in the gutter. The list then hands the wired handle to `renderItem`
as its third argument, and you drop it wherever you like:

```tsx
<SortableList<Status>
  handle="custom"
  itemKey={(s) => s.id}
  itemLabel={(s) => s.name}
  items={items}
  onReorder={(move) => setItems((p) => applySortableMove(p, move, (s) => s.id))}
  renderItem={(status, index, handle) => (
    <Card>
      {handle}
      <StatusRow status={status} />
    </Card>
  )}
/>
```

The provided handle carries everything the gutter one does (the drag hit-test id,
the keyboard grab/move handler, the focus ring, and the grip glyph — customise it
with `renderHandle`), so pointer and keyboard reordering work identically. The
handle is `undefined` for the other modes.

### Orientation

`orientation` is `"vertical"` (default) or `"horizontal"`. Vertical hit-tests
row midpoints on the y-axis and steps with Up / Down; horizontal hit-tests on
the x-axis and steps with Left / Right. Horizontal assumes a left-to-right
reading order.

### Keyboard & accessibility

On the web every row (or its handle) is a focusable `button`. Focus one and
press **Space** to grab; the **arrow keys** move it along the axis and
**Home** / **End** jump to the ends; **Space** or **Enter** drops it and
**Escape** cancels. Moves are announced through the shared live region
(`Grabbed <name>. Position 2 of 5. …`). The dragged row lifts into an
`aria-hidden` clone (pointer) or dims in place while it keeps focus (keyboard),
and a dashed `aria-hidden` preview marks the drop slot.

### Disabled items

`itemDisabled(item, index)` freezes a row: it keeps its slot (so the drop math
stays correct) but is never a drag start or a keyboard target.

## Groups: dragging between lists

Wrap several lists in a `SortableGroups` coordinator and give each one a
`groupId`, and an item can be dragged out of one list and into another. The
coordinator is a **pure provider** — it renders its children and nothing else,
contributing no layout box — so the section titles, spacing, collapse chrome and
empty states around each list stay entirely yours.

```tsx
import {
  applyGroupedSortableMove,
  SortableGroups,
  SortableList,
} from "@firna/ui/sortable-list";

const [groups, setGroups] = useState({ personal: [], workspace: [] });

<SortableGroups
  groupFlow="vertical"
  onMove={(move) =>
    setGroups((prev) => applyGroupedSortableMove(prev, move, (c) => c.id))
  }
>
  <SectionTitle>Workspace</SectionTitle>
  <SortableList<Chat>
    accessibilityLabel="Workspace"
    groupId="workspace"
    handle="start"
    itemKey={(chat) => chat.id}
    itemLabel={(chat) => chat.name}
    items={groups.workspace}
    renderItem={(chat) => <ChatRow chat={chat} />}
  />
  <SectionTitle>Personal</SectionTitle>
  <SortableList<Chat>
    accessibilityLabel="Personal"
    groupId="personal"
    handle="start"
    itemKey={(chat) => chat.id}
    itemLabel={(chat) => chat.name}
    items={groups.personal}
    renderItem={(chat) => <ChatRow chat={chat} />}
  />
</SortableGroups>;
```

### The grouped move contract

`onMove` is the **single sink** for every committed move — across lists _and_
within one — so branch on `fromGroupId === toGroupId` if you need to tell them
apart:

```ts
type SortableGroupMove = {
  key: string;
  fromGroupId: string;
  fromIndex: number;
  toGroupId: string;
  toIndex: number;
};
```

Indices keep the same **removed-item semantics** as the single-list contract, so
`applyGroupedSortableMove(groups, move, itemKey)` — over a
`Record<groupId, Item[]>` — is all a consumer needs. Groups the move does not
touch keep their array identity, so memoised rows do not re-render.

A member list's own `onReorder` is ignored inside a coordinator (and warns in
development): the coordinator's `onMove` reports that list's moves too. Its
`accessibilityLabel` doubles as the group name in announcements
(`Roadmap review, Personal, position 2 of 2`), falling back to the `groupId`.

### Arrangement and the keyboard

`groupFlow` declares how the lists sit relative to each other, which is what
keeps the arrow keys spatially honest:

- `"vertical"` (default) — the lists are **stacked**. Up / Down step within a
  list and **overflow** into the adjacent one at its near end, so the whole
  stack reads as one continuous column. Left / Right do nothing.
- `"horizontal"` — the lists sit in a **row**. Left / Right **jump** to the
  adjacent list at a clamped index and Up / Down stay inside one, matching the
  [`Kanban`](../kanban/README.md) board.

Home / End stay group-local in both. Group order is taken from the measured
rects when a grab begins, so conditionally rendered sections cannot scramble it.
Pointer dragging is unaffected by `groupFlow`: a list is hit-tested by rect
containment with a nearest-rect fallback, so any 2D arrangement works — stacked,
side by side, or a grid.

### Barring a destination

`canDrop(move)` vets each candidate. A rejected target is never adopted, so no
drop preview ever opens where the item cannot land, and the arrow keys step over
it. The item's own slot is always allowed, so a drag can always be abandoned
back home.

```tsx
<SortableGroups
  canDrop={(move) => !(isShared(move.key) && move.toGroupId === "personal")}
  onMove={apply}
>
```

Reach for it only when an item genuinely cannot occupy a destination. A
destination that merely needs **confirming** needs nothing from the library:
because the lists are controlled, withhold the move, show your dialog, and apply
it on confirm — nothing mutated, so the lists snap back on their own.

```tsx
onMove={(move) => {
  if (move.toGroupId === "personal" && move.fromGroupId === "workspace") {
    setPendingMove(move); // opens "This will revoke teammates' access…"
    return;               // withheld: the lists snap back untouched
  }
  applyMove(move);
}}
```

### Rules and limits

- **Item keys must be unique across the whole coordinator** — the drop math, the
  pointer hit test and the focus restore all key off them, so a key repeated in
  two lists would move the wrong row. `Kanban` holds the same rule for card
  keys; duplicates warn in development.
- An **empty group** needs its own height to be a comfortable drop target
  (`style={{ minHeight: 48 }}` or your own empty-state row). The nearest-rect
  fallback still reaches a zero-height one, but only from very close by.
- Lists in one coordinator may differ freely in `handle` mode, `orientation`,
  `size` and styling.
- On native the coordinator renders its children unchanged and nothing is
  draggable, exactly as a lone list behaves today.

## Native

Reordering by dragging is a pointer / physical-keyboard gesture, so on native the
drag hook is an inert no-op today (mirroring the Kanban card drag). The list
still renders — including a static grab handle — and order can be driven from a
consumer's own controls. Native drag / touch reordering is a documented
follow-up (see `plans/sortable-list-component.md`).

## Styling & theming

`style` extends the list container. `gap` sets the spacing between rows
(defaults to the `size` scale) — a visible gap gives the drop preview a slot to
open into. Rows read colours from `SharedUiThemeProvider`: the drop preview and
focus ring use `colors.primary`, the handle hover uses `colors.soft`, and the
default grip glyph uses `colors.muted`.
