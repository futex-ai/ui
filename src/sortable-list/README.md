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
- Offer an optional grab `handle` (`"start"` / `"end"`) that becomes the sole
  drag / keyboard / focus target, so the rest of the row (its own buttons) stays
  independently interactive; with no handle the whole row is the drag surface.
- Flow `vertical` (default) or `horizontal` via `orientation`.
- Support a full keyboard reorder on the web (Space to grab, arrow keys to move,
  Home / End to jump to the ends, Space / Enter to drop, Escape to cancel) with
  live-region announcements, plus a lifted floating clone and a dashed drop
  preview under the pointer.
- Expose `list` / `listitem` semantics and the shared `ControlSize` densities,
  driven by shared theme tokens.

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
glyph, or your own via `renderHandle`). The handle is then the **only** drag /
keyboard / focus target, so a row's own controls (chevrons, an archive button)
keep working. Omit `handle` to make the whole row the drag surface — best for
simple rows with no interactive content of their own (a whole-row drag target
plus interactive children would nest press targets). `handleLabel` names the
handle button (defaults to `Reorder <itemLabel>`); `itemLabel` names the
whole-row target and is woven into the drag announcements.

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

```

```
