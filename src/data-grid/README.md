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

| Keys                | Action                                                  |
| ------------------- | ------------------------------------------------------- |
| Arrows              | Move the active cell (clamps at edges)                  |
| `Shift`+Arrows      | Extend the rectangular selection from the anchor        |
| `Home` / `End`      | First / last column of the row (`Ctrl`+ = grid corners) |
| `Tab` / `Shift+Tab` | Walk cells in reading order                             |
| `Ctrl/Cmd-A`        | Select all cells                                        |
| `Ctrl/Cmd-C`        | Copy the selection (TSV — pastes into spreadsheets)     |
| `Ctrl/Cmd-V`        | Paste from the active cell (coerced to each field type) |
| `Enter`             | Edit the active cell                                    |
| `Escape`            | Cancel the current edit                                 |

On web, a pointer drag paints a rectangle (the selected cells are the marquee).
Pass `selection` + `onSelectionChange` to control it, or let the grid manage it
internally. Selection and navigation are announced to a polite live region.
Copy (`Ctrl/Cmd-C`) serializes the selection to TSV; paste (`Ctrl/Cmd-V`) fills
cells from the active cell, coercing each value to its column's field type
(numbers parsed, select options matched by label or id).

### Layout

Columns size with a fixed `width` or a `flex` share (clamped to `minWidth`); the
grid resolves them to pixel widths from its measured container so the header and
every body row stay aligned. When the columns are wider than the container it
scrolls horizontally, and the row-number gutter stays pinned to the left (frozen
column, web only).

### Editing

Open an editor with **Enter**, a **double-press**, or (native) a tap on the
already-active cell. **Enter** commits and moves down; **Escape** reverts; blur
commits. `onCellChange(ref, value)` may return a promise — a rejection keeps the
editor open so you can surface an error. Number cells reject non-numeric input
with an inline error.

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

## Key code

- `DataGrid.tsx` — the controlled component + state wiring.
- `useDataGridController.ts` / `useDataGridKeyboard.ts` / `useDataGridDrag.ts` —
  selection, keyboard, and pointer-drag interaction.
- `dataGridSelectionModel.ts` / `dataGridKeyboardModel.ts` — pure, React-free
  models (unit-tested), exported as `dataGridSelectionModel` /
  `dataGridKeyboardModel` namespaces.
- `dataGridCellContent.tsx` / `dataGridCellEditors.tsx` — per-field renderers and
  editors.
- `DataGridBody.tsx` (`FlatList`), `DataGridHeader.tsx`, `DataGridColumnMenu.tsx`,
  `DataGridCardStack.tsx` — view + chrome.
