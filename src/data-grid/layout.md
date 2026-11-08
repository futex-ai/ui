# Data grid layout

These sections extend the [Data Grid README](README.md).

## Layout

Columns size with a fixed `width` or a `flex` share (clamped to `minWidth`); the
grid resolves them to pixel widths from its measured container so the header and
every body row stay aligned. A flex column's automatic width is capped at a
default max (≈480px) so a lone flexible column in a sparse grid (e.g. two
columns) can't stretch across the whole viewport — raise or lower it with
`maxWidth`, or drag the column wider by hand (manual resizes aren't bound by the
default cap). When the resolved columns are narrower than the container the
leftover reads as a clean empty grid area; when they are wider it scrolls
horizontally, and the row-number gutter stays pinned to the left (frozen column,
web only).

## Resizing

On web, each column header carries a resize handle on its right edge (a focusable
`separator`): drag it to set the column's width — clamped to `minWidth` /
`maxWidth` — or focus it and use the Left/Right arrow keys. The grid owns the
widths internally; `columns[].width` / `flex` seed the initial size. Starting a
resize freezes the other flexible columns at their current pixel widths, so only
the dragged column's edge moves (the rest stay put and the grid scrolls if the
total outgrows the container). Pass `onColumnResize(columnId, width)` to persist a
width (e.g. to storage); opt a column out with `resizable: false`. Native renders
no handle.

## Clipped text

A column narrower than its heading or values clips them with an ellipsis.
Resting the pointer on clipped text reveals the whole string in a small popover
anchored to it:

```tsx
<DataGrid columns={columns} overflowTooltip="headers" rows={rows} />
```

`overflowTooltip` takes `"all"` (headings **and** text cells — the default),
`"headers"`, or `"none"`. The popover only opens for text that is genuinely cut
off, measured at hover time, so it never repeats a label already fully on screen
and stays correct after a column resize. Select-option pills are not covered.

It is web only: hover has no touch equivalent, so the hook is inert on native.
The card stack below `cardBreakpoint` is still a web presentation with a real
pointer, so a clipped card field value reveals the same way. Nothing is hidden
from assistive tech either way — the
clipping is purely visual (CSS `text-overflow`), so the full string remains the
element's accessible name, and the popover itself is `aria-hidden` to avoid
announcing it twice.

The reveal waits for the pointer to rest (~400ms) and never opens while a
pointer button is held, so sweeping across a row and dragging a range, column,
or resize handle are all unaffected. It dismisses on pointer-out, on any press,
and on **Escape**. Moving the pointer off the text onto the popover itself keeps
it up — a short grace period covers the gap — so a magnified reader can travel
to a long name instead of watching it vanish (WCAG 2.1 — 1.4.13 Content on Hover
or Focus, AA: dismissible, hoverable, persistent). A press dismisses it until
the pointer leaves and re-enters the text.

## Fixed height

`maxHeight` gives the body a fixed height rather than a cap: the rows scroll once
they overflow it, and when there are fewer rows than fit, they stack at the top
and the area below the last row reads as a muted grey empty zone (Airtable /
Notion style) instead of collapsing to the rows or leaving a blank white gap.
Omit `maxHeight` for an unbounded body that's exactly as tall as its rows.

## Infinite scroll

Set a `maxHeight` to virtualize the body, then handle `onEndReached` (fired near
the bottom) by fetching and appending rows; show the loading row with
`loadingMore`. The grid is stateless about data — you own `rows`.

## Responsive

Set `cardBreakpoint` (px) to render a read-only card stack below that viewport
width — one card per record (title + label/value rows), tapping a card calls
`onRowExpand`. This is the mobile presentation; the full interactive grid is the
wide-viewport experience.
