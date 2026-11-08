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

Longer topics have their own guides:
[selection and editing](selection-and-editing.md), [layout](layout.md), and
[menus](menus.md).

## Responsibilities

- Render typed cells from `columns` + `rows`: text, number, date, single-select,
  and multi-select (colored option pills).
- Select a rectangular range of cells by keyboard (`Shift`+arrows, `Ctrl/Cmd-A`)
  or pointer drag, with a moving active cell and roving Tab focus.
- Edit cells in place — text/number via `Input`, date via a responsive
  `DateInput` (anchored calendar on web, wheel bottom sheet on native),
  single-select via `DropdownMenu`, and multi-select via
  `ComboboxMultiSelect` — committing through `onCellChange`.
- Virtualize the body (`FlatList`, fixed row height) and load more rows on
  scroll-end via `onEndReached`.
- Offer column header menus (sort / hide / delete), an add-column field-type
  picker, an add-record row, and a per-row expand affordance.
- Reveal a clipped heading or value in full on hover (web), gated by
  `overflowTooltip`.
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

The grid element (`role="grid"`, with the header, the resize handles, and
the body) carries the drag-select ignore marker (`data-drag-select-ignore`),
so by default a page-wide `DragSelectableProvider` does not start a selection
box over the grid's own cell-range drag. The provider's `shouldStartDrag`
option can still allow such a press.

### Field types

`fieldType` selects the renderer and editor: `text`, `number`, `date` (ISO
`YYYY-MM-DD`), `singleSelect` (cell value is an option id), and `multiSelect`
(cell value is an array of option ids). Select columns carry `options`
(`{ id, label, color? }`); `color` maps to an AA-contrast pill palette
(`gray` / `blue` / `green` / `amber` / `purple` / `rose` / `teal`).

### Exact decimal numbers

See the [selection and editing guide](selection-and-editing.md#exact-decimal-numbers).

### Selection & keyboard

See the [selection and editing guide](selection-and-editing.md#selection--keyboard).

### Layout

See the [layout guide](layout.md#layout).

### Resizing

See the [layout guide](layout.md#resizing).

### Clipped text

See the [layout guide](layout.md#clipped-text).

### Editing

See the [selection and editing guide](selection-and-editing.md#editing).

### Fixed height

See the [layout guide](layout.md#fixed-height).

### Infinite scroll

See the [layout guide](layout.md#infinite-scroll).

### Column menus, add column / row

See the [menus guide](menus.md#column-menus-add-column--row).

### Context menus

See the [menus guide](menus.md#context-menus).

### Loading columns

See the [selection and editing guide](selection-and-editing.md#loading-columns).

### Loading cells

See the [selection and editing guide](selection-and-editing.md#loading-cells).

### Responsive

See the [layout guide](layout.md#responsive).

## Known limitations

- **Fixed row height** per `size` (`xs 32 / sm 32 / md 40 / lg 48`) — required
  for the windowing math; no variable / multi-line rows yet.
- **Dropdown text-inversion gotcha.** Column menus and select editors use
  `highlightVariant="ring"`; the solid fill would invert library-owned row text
  to white. Use `rightText` (string) for trailing text, not custom `right` nodes.
- **Multi-select selects from existing options** (no create-new-option yet —
  `ComboboxMultiSelect` limitation).
- **Touch drag-marquee and on-device native interactions** (keyboard reliability,
  editor focus, context-menu long-press) are not yet verified on a real device;
  web is the primary interactive surface, native renders via `FlatList` +
  tap/keyboard.
- **Row deletion is a gutter action.** The three context menus are kept
  distinct, so deleting a row means opening the menu on the row-number gutter,
  not on a cell in that row. Add a row entry to the cell menu through
  `onContextMenuEntries` if you want it in both places.
- **No submenus.** `DropdownListEntry` has no nested variant, so `insertLeft` /
  `insertRight` report position only and leave the new column's field type to
  the consumer, the way `onAddColumn` already does.

## Styling & theming

`size` takes the shared `ControlSize` (`xs` / `sm` / `md` / `lg`). The grid has
no dense design, so `xs` draws the `sm` grid. The grid reads `colors`, `fonts`,
and `radii` from `SharedUiThemeProvider`: the gutter/header use `bg`, separators
use `border`, the selection wash uses `primarySoft`, the active cell uses an
inset `primary` ring, and pills resolve to AA-contrast token pairs.

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
neighboring rows. Entering multi-select edit mode focuses the search input,
opens its option list, and applies the primary active border and focus glow, so
typing works immediately. Checked option rows remain enabled so they can be
toggled off.

## Key code

- `DataGrid.tsx` — the controlled component + state wiring.
- `useDataGridController.ts` / `useDataGridKeyboard.ts` / `useDataGridDrag.ts` —
  selection, keyboard, and pointer-drag interaction. The drag's pure rules (the
  marquee box, the tap threshold, and the focus of a row or column drag) are in
  `dataGridDragModel.ts`, and its edge auto-scroll in `useDataGridAutoScroll.ts`.
- `useDataGridColumnResize.ts` / `DataGridResizeHandle.tsx` — column resizing
  (pointer + keyboard) and the header-edge handle; widths resolved in
  `dataGridColumnWidths.ts`. Both drags use the shared document listeners of
  `../dragGesture.ts`.
- `dataGridSelectionModel.ts` / `dataGridKeyboardModel.ts` — pure, React-free
  models (unit-tested), exported as `dataGridSelectionModel` /
  `dataGridKeyboardModel` namespaces.
- `useDataGridContextMenu.ts` — owns the grid's single context menu (target,
  point, entries), bound late so it and the controller can see each other.
- `dataGridContextMenuModel.ts` / `dataGridContextSelection.ts` — pure menu
  descriptors with their gating rules, and the spreadsheet selection rule;
  `dataGridContextMenu.tsx` attaches the icons.
- `dataGridCellContent.tsx` / `dataGridCellEditors.tsx` — per-field renderers and
  editors.
- `DataGridClippedText.tsx` / `useOverflowTooltip.ts` / `dataGridOverflowModel.ts`
  — the hover reveal for clipped text: the shared text + popover, the hover state
  machine, and the pure rules (unit-tested); `dataGridOverflowContext.tsx` carries
  `overflowTooltip` down to both surfaces.
- `DataGridBody.tsx` (`FlatList`), `DataGridHeader.tsx`, `DataGridColumnMenu.tsx`,
  `DataGridCardStack.tsx` — view + chrome.
