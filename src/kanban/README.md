# Kanban

A horizontally-scrolling status board for React Native and React Native Web. It
shows the same records a [`Table`](../table/README.md) shows as rows, grouped by
a single-select field (a Status) into columns: each column is a status option,
each card shows the record's primary field plus a few chips and a footer. Like
the Table and List, it is generic over the card data, driven by accessor and
render callbacks, and sized on the shared `ControlSize` scale.

## Responsibilities

- Group a flat `cards` array into `columns` via a `cardColumnId` accessor — so
  cards can be filtered, sorted, or moved between statuses without restructuring
  the columns (the Table `rows` / List `items` pattern).
- Render each card through a `renderCard` callback, so a card can be a
  [`KanbanCard`](#cards) or any node.
- Render each column header with a status [chip](#chips), a card count, an
  optional [consumer-rendered accessory](#column-header-accessory), and an
  optional add button.
- Make cards pressable buttons via `onCardPress`, with the shared hover, sage
  focus ring, pressed and disabled states, `button` semantics, and keyboard
  activation — or render plain static cards.
- Make cards [draggable](#drag-and-drop) between and within columns via
  `onCardMove`, by pointer and keyboard, reporting each move for the consumer to
  apply (the board stays controlled).
- Show a busy skeleton state while `loading`, and an optional placeholder for an
  empty column.
- Scroll the columns horizontally, sharing the same board on web and phone.
- Size on the shared `ControlSize` scale (`sm` / `md` / `lg`), scaling the card,
  chip, and footer density.
- Use shared theme colours, fonts, and radii instead of consumer-local theme.

## Usage

```tsx
import { Kanban, KanbanCard, KanbanChip, Avatar } from "@firna/ui";
import type { KanbanColumnDef } from "@firna/ui";

type Card = { id: string; status: string; title: string; channel: string };

const columns: KanbanColumnDef[] = [
  { id: "drafted", title: "Drafted", tone: "warning" },
  { id: "approved", title: "Approved", tone: "primary" },
  {
    id: "published",
    title: "Published",
    color: { backgroundColor: "#e3eee6", color: "#2f5945" },
  },
];

<Kanban<Card>
  accessibilityLabel="Content board"
  columns={columns}
  cards={cards}
  cardColumnId={(card) => card.status}
  cardKey={(card) => card.id}
  renderCard={(card) => (
    <KanbanCard
      title={card.title}
      chips={[
        <KanbanChip key="channel" tone="primary">
          {card.channel}
        </KanbanChip>,
        <KanbanChip key="score">score 0.81</KanbanChip>,
      ]}
      avatar={<Avatar decorative label="CM" size={22} />}
      meta="Cal"
      date="Jun 29"
    />
  )}
  onCardPress={(card) => router.push(`/records/${card.id}`)}
  cardLabel={(card) => `Open ${card.title}`}
/>;
```

### Columns

Each `KanbanColumnDef` needs a stable `id` (matched against `cardColumnId(card)`
to group cards) and a `title` shown in the header chip. Colour the chip with a
semantic `tone` (`neutral` default / `primary` / `warning` / `danger`) or a
literal `color` (`{ backgroundColor, color }`) for a palette-specific status. The
header shows a card `count` (defaulting to the number of cards routed into the
column); set `count` to override it. A card whose `cardColumnId` matches no
column is omitted from the board.

### Cards

`renderCard` can return any node. For the common case, `KanbanCard` lays out a
wrapping `title`, a row of `chips`, and a footer built from the `avatar`, `meta`,
and `date` slots (avatar and meta on the left, date pushed to the right) — or a
custom `footer` node. The chips row and the footer are optional: the footer
renders only when at least one of `avatar`, `meta`, `date`, or `footer` is
provided. Pass the same `size` the board got so the type scale matches.

### Chips

`KanbanChip` is the small, gently rounded tag (the `radii.sm` corner — 6px in the
default theme) used for the column status and the card chips (it is deliberately
not the fully-rounded [`Badge`](../badge/README.md) pill). Colour it with a `tone`, a literal `color`, or leave it neutral; pass
`plain` to drop the fill for inline icon + count metadata (e.g. a file badge),
and `leading` for a decorative icon (hidden from assistive tech, so keep the
label self-describing). Every tone keeps its text ≥4.5:1 on its fill (WCAG 1.4.3
AA); a custom `color` is the caller's responsibility to keep legible.

### Clickable cards

Pass `onCardPress` to make every card a pressable button. Cards then gain a
stronger-border hover, the inset sage focus ring (visible inside the clipped,
scrolling board), a pressed state, and keyboard activation (Enter / Space), and
announce themselves as buttons. Provide `cardLabel` for a concise accessible
name — it replaces the card's text content as the button's name, so fold any
metadata a screen-reader user needs into it (e.g. `Open "Ship the board" —
twitter/x, Cal, Jun 29`); omit it to have the card's title, chips, and footer
read instead. Use `cardDisabled` to make individual cards non-pressable. Without
`onCardPress`, cards render as plain static cards.

### Add button and empty columns

Pass `onColumnAdd` to show a `+` button in every column header (name it per
column with `columnAddLabel`). Pass `renderColumnEmpty` to render a placeholder
in a column with no cards.

### Column header accessory

Pass `renderColumnAccessory` to put your own control in a column header —
typically a per-status toggle the board itself should know nothing about. It
renders between the count and the add button, at the trailing edge:

```tsx
<Kanban<Card>
  {...boardProps}
  renderColumnAccessory={(column) => {
    const status = statusById(column.id);
    return status && isAgentEnableable(status) ? (
      <AgentStepToggle onToggle={toggleAgent} status={status} />
    ) : null;
  }}
/>
```

Return `null` for a column that carries no accessory: its header then renders
exactly as it does on a board that never passes the prop — no wrapper node, no
layout change. Board-level rules:

- **Layout only.** The slot takes no part in the board's press or drag handling:
  a press inside it never reaches a card, never starts a drag, and is never
  swallowed by the post-drag press suppression. It is outside the drop geometry
  too — the drag hit-tests card and column rects, not headers.
- **Its own accessibility.** The slot adds no role and no label, and the
  column's group name (`"<title>, <n> cards"`) is unchanged. An interactive
  accessory must be a self-contained control that brings its own semantics —
  e.g. a `switch` role with a checked state — and its own keyboard handling.
  (React Native Web's press responder maps Space onto `button` roles only, so a
  `switch` needs its own `onKeyDown`, as the library's own
  [`Switch`](../switch/README.md) does.)
- **Its own focus treatment.** No focus ring is applied to the slot and
  `disableFocusRing` does not reach into it. Prefer an _inset_ indicator
  (`useFocusRing({ offset: -2 })`): like the cards, the slot clips, so an outset
  ring — including the browser's default outline — is cropped.
- **Fixed header height.** The slot is clipped to the status chip's box — 20px
  at `sm`, `md`, and `lg` alike, since the chip's type scale does not track
  `size`. That is the floor of the header row in every configuration, which is
  why an accessory can never change a header's height: a taller one is
  centre-clipped rather than accommodated, so columns with and without one stay
  aligned. Size accessories to 20px or less.
- **The chip truncates first.** The accessory never shrinks, so at a narrow
  `columnWidth` the title chip gives up width before the accessory does.
- Rendered in every state the add button is, including while `loading`.

### Loading

Pass `loading` to render placeholder skeleton cards (built from the
[`Skeleton`](../skeleton/README.md) primitives, sharing one pulse) instead of the
cards. The board announces `aria-busy`, and the placeholders are non-interactive
and hidden from assistive technology. `loadingCardCount` sets how many
placeholders to show per column (defaults to 3).

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the mockup. It scales the card, chip, and footer density. Set
`columnWidth` to change the fixed column width (defaults to `286`); on a narrow
phone, size it to the viewport (e.g. `Dimensions.get("window").width - 32`).

## Styling

`style` extends the board container (`ViewStyle`). Column, header, card, chip,
and footer layout, the pressable-card treatments, and the disabled state are
applied by the component. The card frame (border, padding, shadow, and the
interactive states) is owned by the board, so `renderCard` only supplies the
in-card content.

## Accessibility and keyboard

The board and each column are labelled `group`s; cards are `button`s when
pressable (named by `cardLabel`) or draggable, or plain static content otherwise.
Tab moves through the cards, header accessories, and add buttons in visual order
— a focusable accessory sits in the natural DOM order, after the count and
before the add button; Enter / Space activates a focused card. When `onCardMove` is set, the card is also keyboard-
draggable — Space to grab, arrow keys to move, Space/Enter to drop, Escape to
cancel — with each step announced through the shared live region (see
[Drag-and-drop](#drag-and-drop)).

## Drag-and-drop

Pass `onCardMove` to make every card draggable — by pointer **and** keyboard —
between and within columns. The board is **controlled**: a drag never mutates the
cards itself; it reports the move and you apply it to your own state, and the
board re-renders from the new props.

```tsx
const [cards, setCards] = useState(initialCards);

<Kanban<Card>
  columns={columns}
  cards={cards}
  cardColumnId={(card) => card.status}
  cardKey={(card) => card.id}
  renderCard={renderCard}
  onCardMove={(move) => setCards((prev) => applyMove(prev, move))}
/>;
```

The `move` is `{ cardKey, fromColumnId, fromIndex, toColumnId, toIndex }`, where
`toIndex` is the insertion index in the destination column **with the moved card
removed** — the natural shape for splicing the card out of one list and into
another (see the "Drag and drop" story for an `applyMove` reference).

- **Pointer (web):** press and drag a card — Trello-style, a translucent clone of
  the card lifts off and follows the cursor while a faded, dashed **preview of the
  card** opens at the slot where it would land. A plain click still fires
  `onCardPress`; a small move threshold separates a click from a drag. The fixed
  clone renders through a `document.body` portal, so it stays aligned to viewport
  pointer coordinates when the board is nested in a transformed or scrolling
  ancestor such as a React Native Web `ScrollView`.
- **Keyboard:** focus a card and press **Space** to grab it (the card dims in
  place), the **arrow keys** to move the preview between slots and columns,
  **Space**/**Enter** to drop, and **Escape** to cancel. Each step is announced to
  assistive tech, and focus returns to the card after the move. (When a card is
  both pressable and draggable, the keyboard reorders the card — opening it stays
  a pointer click.)
- **Native:** dragging is a web pointer/keyboard gesture, so on React Native the
  drag hook is an inert no-op — `onCardMove` never fires, cards are not draggable,
  and no press is suppressed. The hook signature matches across platforms for
  platform-safe code; drive status changes from `onCardPress` and the opened
  record (e.g. a detail screen or status dropdown) instead.

## Theming

The board reads colours and fonts from `SharedUiThemeProvider`: columns use
`colors.soft` with a `colors.border` edge and the `radii.lg` corner; cards use
`colors.surface` with a `colors.border` edge (`colors.border2` on hover), the
`radii.md` corner, and `colors.bg2` when pressed; the focus ring uses
`colors.primary`; the count and footer use `fonts.mono`; and chip tones resolve
through the same `resolveBadgeColors` the [`Badge`](../badge/README.md) uses.
