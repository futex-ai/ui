# Data grid menus

These sections extend the [Data Grid README](README.md).

## Column menus, add column / row

Pass `onColumnMenuAction(columnId, action)` to show each header's caret menu
(`sortAsc` / `sortDesc` / `clearSort` / `insertLeft` / `insertRight` / `hide` /
`delete`); reflect the result by updating your `columns` (`sortDirection`,
`hidden`) and `rows`. `onAddColumn(type)` adds the (+) header picker; `onAddRow`
adds the trailing "+ New record" row; `onRowExpand(rowId)` wires the gutter
expand icon.

`insertLeft` / `insertRight` report only the position, not a field type — pick
one the way you already do for `onAddColumn`, and splice the new column beside
`columnId`. The sort rows are hidden for a column with `sortable: false`, and
`clearSort` only appears once `sortDirection` is set.

The caret menu renders from the same descriptors as the header context menu
(see [Context menus](#context-menus)), so there is one column action vocabulary
rather than two.

## Context menus

Pass `contextMenu` to open a menu on a secondary gesture — right-click on web,
long-press on native. Opting in also suppresses the browser's own menu over the
grid, so it is off by default.

There are three menus, one per region:

| Region            | Rows                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------- |
| Column header     | Sort ascending / descending / Clear sort · Insert left · Insert right · Hide field · **Delete field** |
| Row-number gutter | Insert row above / below · Duplicate · Copy · **Delete row**                                          |
| Cell              | Edit · Copy · Cut · Paste · Clear                                                                     |

The header menu shows exactly what the caret menu shows — both render from the
same descriptors, so `onColumnMenuAction` services both. Row rows need
`onRowMenuAction(rowIds, action)`; without it the gutter opens nothing. The cell
menu needs no callback at all: the grid already owns the clipboard and the
editor. Rows are gated the way you would expect — no sort rows on a
`sortable: false` column, no Edit or Clear on `editable: false`, and no
clipboard rows on native, where the OS clipboard is out of reach.

**Opening a menu on the gutter or a header never changes the selection.**
Reaching for a menu is not the same gesture as selecting, so a right-click there
leaves whatever you had selected exactly as it was. The menu still knows its
target: a row menu acts on the row under the pointer, and a header menu on the
column it was opened from.

Cells are the one exception, because the cell menu's Copy / Cut / Clear act on
the selection — a menu opened on a cell outside it would otherwise operate on
something else entirely, possibly off screen. So a cell press **inside** the
current selection keeps it, and a press **outside** collapses to that cell.

Where a row action spans more than one row, the selection still decides: a
gutter menu opened inside a five-row selection reads "Delete 5 rows" and reports
all five ids in one call. A row counts as inside only when the selection spans
it at full width, so a small cell range that merely overlaps a row yields just
that row.

`onContextMenuEntries(entries, context)` is the extension point: add, reorder, or
replace the default rows, or return `[]` to suppress the menu for that target.
`context` is discriminated by `region`, carrying the `column`, the `rowIds`, or
the cell `ref` plus the current selection `rect`.

```tsx
<DataGrid
  columns={columns}
  contextMenu
  onColumnMenuAction={(columnId, action) => {
    /* sort / hide / delete / insert beside columnId */
  }}
  onContextMenuEntries={(entries, context) =>
    context.region === "cell"
      ? [
          ...entries,
          { id: "ask", label: "Ask an agent", onPress: ask, type: "item" },
        ]
      : entries
  }
  onRowMenuAction={(rowIds, action) => {
    /* one call for the whole selected span */
  }}
  rows={rows}
/>
```

`Shift+F10` (or the dedicated `ContextMenu` key) opens the cell menu from the
keyboard, positioned under the focused cell — the menu is never mouse-only
(WCAG 2.1.1). While it is open the menu owns the keyboard: the grid's own
shortcuts stand down, so `Delete` cannot clear cells underneath it and the
arrows cannot walk the selection away from it. On web the menu opens at the
pointer and closes on Escape, an outside press, or a scroll; on native it is the
house bottom sheet, titled with the field or row it acts on.
