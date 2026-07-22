# Data Grid

An Airtable / Notion–style **editable data grid** for React Native and React
Native Web. It is a distinct primitive from the read-only [`Table`](../table/README.md):
the grid adds cell-range selection (keyboard + pointer drag), arrow-key
navigation, typed in-cell editing, column header menus, an infinitely-scrolling
virtualized body, and a responsive card-stack for mobile.

The grid is **controlled and data-agnostic** — the consumer owns `columns`,
`rows`, and (optionally) `selection`, and the grid emits change callbacks. It
composes the existing library primitives (`Input`, `DateField`,
`DropdownMenu`, `ComboboxMultiSelect`, `Badge`/pills) and lets them own their
portals; the grid contributes the selection model, keyboard model, and chrome.

## Responsibilities

- Render typed cells from `columns` + `rows`: text, number, date, single-select,
  and multi-select (colored option pills).
- Select a rectangular range of cells by keyboard (`Shift`+arrows, `Ctrl/Cmd-A`)
  or pointer drag, with a moving active cell and roving Tab focus.
- Edit cells in place — text/number via `Input`, date via `DateField`
  (`variant="wheel"`), single-select via `DropdownMenu`, multi-select via
  `ComboboxMultiSelect` — committing through `onCellChange`.
- Virtualize the body (`FlatList`, fixed row height) and load more rows on
  scroll-end via `onEndReached`.
- Offer column header menus (sort / hide / delete), an add-column field-type
  picker, an add-record row, and a per-row expand affordance.
- Collapse to a read-only card stack below `cardBreakpoint` (mobile).
- Read colors, fonts, and radii from `SharedUiThemeProvider`; size on the shared
  `ControlSize` scale.

## Usage

```tsx
import {
  DataGrid,
  type DataGridColumn,
  type DataGridRow,
} from "@firna/ui/data-grid";

const columns: DataGridColumn[] = [
  { id: "title", label: "Title", fieldType: "text", flex: 2 },
  {
    id: "status",
    label: "Status",
    fieldType: "singleSelect",
    width: 130,
    options: [
      { id: "todo", label: "To do", color: "amber" },
      { id: "done", label: "Done", color: "green" },
    ],
  },
  { id: "score", label: "Score", fieldType: "number", width: 90 },
  { id: "due", label: "Due", fieldType: "date", width: 120 },
];

const [rows, setRows] = useState<DataGridRow[]>([
  {
    id: "r1",
    cells: {
      title: "Ship the grid",
      status: "todo",
      score: 0.8,
      due: "2026-07-01",
    },
  },
]);

<DataGrid
  accessibilityLabel="Tasks"
  columns={columns}
  rows={rows}
  onCellChange={(ref, value) =>
    setRows((current) =>
      current.map((row) =>
        row.id === ref.rowId
          ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
          : row,
      ),
    )
  }
/>;
```

### Field types

`fieldType` selects the renderer and editor: `text`, `number`, `date` (ISO
`YYYY-MM-DD`), `singleSelect` (cell value is an option id), and `multiSelect`
(cell value is an array of option ids). Select columns carry `options`
(`{ id, label, color? }`); `color` maps to an AA-contrast pill palette
(`gray` / `blue` / `green` / `amber` / `purple` / `rose` / `teal`).

### Selection & keyboard

The grid is one Tab stop (roving tabindex). With a cell focused:

| Keys                   | Action                                                  |
| ---------------------- | ------------------------------------------------------- |
| Arrows                 | Move the active cell (clamps at edges)                  |
| `Shift`+Arrows         | Extend the rectangular selection from the anchor        |
| `Home` / `End`         | First / last column of the row (`Ctrl`+ = grid corners) |
| `Tab` / `Shift+Tab`    | Walk cells in reading order                             |
| `Ctrl/Cmd-A`           | Select all cells                                        |
| `Ctrl/Cmd-C`           | Copy the selection (TSV — pastes into spreadsheets)     |
| `Ctrl/Cmd-X`           | Cut the selection (source clears on the next paste)     |
| `Ctrl/Cmd-V`           | Paste into the selection (coerced to each field type)   |
| `Delete` / `Backspace` | Clear the selected cells                                |
| `Enter`                | Edit the active cell                                    |
| `Escape`               | Cancel the edit, or dismiss the copy/cut marquee        |

On web, a pointer drag selects: from a **cell** it paints a rectangle with a
marquee box; from the **row-number gutter** it selects whole rows; from a
**column header** it selects whole columns. Dragging into a top/bottom/side edge
auto-scrolls the body and keeps extending. Pass `selection` + `onSelectionChange`
to control the selection, or let the grid manage it internally. Selection and
navigation are announced to a polite live region.
Copy (`Ctrl/Cmd-C`) and cut (`Ctrl/Cmd-X`) serialize the selection to TSV and
outline it with a dashed "marching-ants" marquee. Paste (`Ctrl/Cmd-V`) coerces
each value to its column's field type (numbers parsed, select options matched by
label or id) and follows spreadsheet fill semantics: it grows the target to at
least the copied block and tiles the source across it, so a single copied cell
fills the whole selection, a copied row or column repeats across it, and a block
pasted onto one cell drops in at full size. A cut clears its source cells once
pasted; `Delete` / `Backspace` clear the selection in place. All of this needs an
`onCellChange` handler and is web-only (it reads the OS clipboard). Copy/cut/paste
respect `editable: false` columns and clamp writes to the grid's edges.

### Layout

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

### Resizing

On web, each column header carries a resize handle on its right edge (a focusable
`separator`): drag it to set the column's width — clamped to `minWidth` /
`maxWidth` — or focus it and use the Left/Right arrow keys. The grid owns the
widths internally; `columns[].width` / `flex` seed the initial size. Starting a
resize freezes the other flexible columns at their current pixel widths, so only
the dragged column's edge moves (the rest stay put and the grid scrolls if the
total outgrows the container). Pass `onColumnResize(columnId, width)` to persist a
width (e.g. to storage); opt a column out with `resizable: false`. Native renders
no handle.

### Editing

Open an editor with **Enter**, a **double-press**, or a single click/tap on the
already-active cell (select cells open their menu on that click, matching a
normal dropdown). Dragging from the active cell still paints a range, so only a
click that never dragged edits. **Enter** commits and moves down; **Escape** reverts;
blur commits. `onCellChange(ref, value)` may return a promise — a rejection
keeps the editor open so you can surface an error. Number cells reject
non-numeric input with an inline error.

### Fixed height

`maxHeight` gives the body a fixed height rather than a cap: the rows scroll once
they overflow it, and when there are fewer rows than fit, they stack at the top
and the area below the last row reads as a muted grey empty zone (Airtable /
Notion style) instead of collapsing to the rows or leaving a blank white gap.
Omit `maxHeight` for an unbounded body that's exactly as tall as its rows.

### Infinite scroll

Set a `maxHeight` to virtualize the body, then handle `onEndReached` (fired near
the bottom) by fetching and appending rows; show the loading row with
`loadingMore`. The grid is stateless about data — you own `rows`.

### Column menus, add column / row

Pass `onColumnMenuAction(columnId, action)` to show each header's caret menu
(`sortAsc` / `sortDesc` / `clearSort` / `hide` / `delete`); reflect the result by
updating your `columns` (`sortDirection`, `hidden`) and `rows`. `onAddColumn(type)`
adds the (+) header picker; `onAddRow` adds the trailing "+ New record" row;
`onRowExpand(rowId)` wires the gutter expand icon.

### Loading columns

Set `loading: true` on a column to show a spinner in place of its field-type
icon in the header — for a just-added column still being provisioned, a
computed / AI column being (re)generated, or any async header state. It is
purely presentational (the column stays sortable, resizable, and editable) and
swaps in place with no layout shift; flip it back to `false` when the column is
ready. The spinner is decorative (hidden from assistive tech, like the field
icon it replaces); the loading state is conveyed by marking the header busy
(`accessibilityState={{ busy }}` / `aria-busy`), so the header's spoken name
stays just the column label.

### Loading cells

Pass `cellLoading(ref)` to mark individual body cells busy — for example while
an edited value is being saved. A busy cell keeps its current, optimistic value
visible with a compact spinner inline beside it, exposes
`accessibilityState={{ busy: true }}` / `aria-busy`, and stays available for
selection and keyboard navigation without opening another editor. The
responsive card presentation reflects the same state. The callback is
controlled by the consumer, so it can resolve one cell or many cells at once:

```tsx
import type { DataGridCellRef } from "@firna/ui/data-grid";

const [saving, setSaving] = useState<Set<string>>(new Set());
const keyFor = (ref: DataGridCellRef) => `${ref.rowId}:${ref.columnId}`;

<DataGrid
  cellLoading={(ref) => saving.has(keyFor(ref))}
  columns={columns}
  rows={rows}
  onCellChange={async (ref, value) => {
    const key = keyFor(ref);
    setRows((current) =>
      current.map((row) =>
        row.id === ref.rowId
          ? { ...row, cells: { ...row.cells, [ref.columnId]: value } }
          : row,
      ),
    );
    setSaving((current) => new Set(current).add(key));
    try {
      await saveCell(ref, value);
    } finally {
      setSaving((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }}
/>;
```

If `onCellChange` returns the save promise, the grid keeps the active editor
mounted behind the inline value and spinner until the promise settles. A
rejected save therefore restores the draft editor, preserving the existing
rejected-save behavior.

### Responsive

Set `cardBreakpoint` (px) to render a read-only card stack below that viewport
width — one card per record (title + label/value rows), tapping a card calls
`onRowExpand`. This is the mobile presentation; the full interactive grid is the
wide-viewport experience.

## Known limitations

- **Fixed row height** per `size` (`sm 32 / md 40 / lg 48`) — required for the
  windowing math; no variable / multi-line rows yet.
- **Date editor uses `variant="wheel"` only.** `DateField`'s `calendar` variant
  is not portaled and would be clipped by the grid's scroll container, so the
  grid forces the (portaled) wheel. A calendar-in-grid would need the calendar
  routed through `DropdownPortal` (future).
- **Dropdown text-inversion gotcha.** Column menus and select editors use
  `highlightVariant="ring"`; the solid fill would invert library-owned row text
  to white. Use `rightText` (string) for trailing text, not custom `right` nodes.
- **Multi-select selects from existing options** (no create-new-option yet —
  `ComboboxMultiSelect` limitation).
- **Touch drag-marquee and on-device native interactions** (keyboard reliability,
  editor focus) are not yet verified on a real device; web is the primary
  interactive surface, native renders via `FlatList` + tap/keyboard.

## Styling & theming

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`). The grid reads
`colors`, `fonts`, and `radii` from `SharedUiThemeProvider`: the gutter/header use
`bg`, separators use `border`, the selection wash uses `primarySoft`, the active
cell uses an inset `primary` ring, and pills resolve to AA-contrast token pairs.

The grid frame and the mobile card stack default to **square corners**
(`borderRadius: 0`) with a `1px` outer border. Pass `borderRadius` (e.g.
`theme.radii.lg`) to round the corners, and `borderWidth={0}` to drop the outer
border entirely — useful when the grid sits flush inside an already-bordered
panel. Both only touch the outer frame; the internal cell hairlines are
unaffected.

The **in-cell editors share the focused text editor's chrome**: a square
(`borderRadius: 0`) box, active primary border, and focus glow. Text / number
(`InputFrame`), date (`DateInput`), single-select, and multi-select
(`ComboboxMultiSelect`) editors therefore read as the same control family inside
the rectangular grid, while the single-select's value remains a rounded option
pill inside its square frame. The multi-select also uses the compact `sm` size
and single-line mode, keeping its search field at the same 32px height as a text
editor and summarizing extra selections as `+N` instead of wrapping chips over
neighboring rows. Checked option rows remain enabled so they can be toggled off.

## Key code

- `DataGrid.tsx` — the controlled component + state wiring.
- `useDataGridController.ts` / `useDataGridKeyboard.ts` / `useDataGridDrag.ts` —
  selection, keyboard, and pointer-drag interaction.
- `useDataGridColumnResize.ts` / `DataGridResizeHandle.tsx` — column resizing
  (pointer + keyboard) and the header-edge handle; widths resolved in
  `dataGridColumnWidths.ts`.
- `dataGridSelectionModel.ts` / `dataGridKeyboardModel.ts` — pure, React-free
  models (unit-tested), exported as `dataGridSelectionModel` /
  `dataGridKeyboardModel` namespaces.
- `dataGridCellContent.tsx` / `dataGridCellEditors.tsx` — per-field renderers and
  editors.
- `DataGridBody.tsx` (`FlatList`), `DataGridHeader.tsx`, `DataGridColumnMenu.tsx`,
  `DataGridCardStack.tsx` — view + chrome.
