# Data grid selection and editing

These sections extend the [Data Grid README](README.md).

## Exact decimal numbers

A `number` column holds a JavaScript number by default, which silently rounds
anything past a float's precision — `Number("0.1000000000000000055")` is `0.1`.
For money, ledger amounts, or any value a backend stores as an exact decimal,
set `numberValueMode: "decimalString"`:

```tsx
{ id: "amount", label: "Amount", fieldType: "number", numberValueMode: "decimalString" }
```

The cell value is then the decimal **string**. The field type is unchanged, so
the column keeps its `#` header icon, its right alignment, and the same typed
editor — but neither the editor nor the paste path ever calls `Number`, so a
30-digit value round-trips digit-for-digit.

Accepted syntax is canonical dot-decimal only: an optional sign, digits, an
optional `.` fraction (`007`, `-12.50`, `+5`, `.5`, `1.`). Grouping separators,
currency symbols, internal whitespace and exponents are rejected — `1,234` and
`0,001` would need a locale to read, and `1e999999999` would expand into a
gigabyte-scale allocation. Invalid text shows the inline editor error, or aborts
a paste (below).

Valid input is normalized but never rounded: a leading `+` is dropped, redundant
leading zeros go, a missing integer digit is supplied, a trailing bare `.` is
dropped, and a zero value loses its sign — so `007.500` becomes `7.500` and
`-0.00` becomes `0.00`. **Trailing zeros are preserved**, because the library
returns the representation you entered rather than imposing a canonical form.
Deciding that `7.500` should be stored as `7.5` is the consumer's policy; do
that in the adapter that persists the value. `parseDecimalString` is exported so
a consumer can validate with exactly the rules the grid uses.

## Selection & keyboard

The grid is one Tab stop (roving tabindex). With a cell focused:

| Keys                        | Action                                                                   |
| --------------------------- | ------------------------------------------------------------------------ |
| Arrows                      | Move the active cell (clamps at edges)                                   |
| `Shift`+Arrows              | Extend the rectangular selection from the anchor                         |
| `Home` / `End`              | First / last column of the row (`Ctrl`+ = grid corners)                  |
| `Tab` / `Shift+Tab`         | Walk cells in reading order                                              |
| `Ctrl/Cmd-A`                | Select all cells                                                         |
| `Ctrl/Cmd-C`                | Copy the selection (TSV — pastes into spreadsheets)                      |
| `Ctrl/Cmd-X`                | Cut the selection (source clears on the next paste)                      |
| `Ctrl/Cmd-V`                | Paste into the selection (coerced to each field type)                    |
| `Delete` / `Backspace`      | Clear the selected cells                                                 |
| `Enter`                     | Edit the active cell                                                     |
| `Shift+F10` / `ContextMenu` | Open the cell context menu (needs `contextMenu`)                         |
| `Escape`                    | Cancel the edit, dismiss the copy/cut marquee, or close the context menu |

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

Paste is validated as a unit. A value that cannot be read for its column —
unparseable text in a number column, a date that is not a real ISO `YYYY-MM-DD`
calendar day, a select label matching no option, a multi-select with any unknown
token — aborts the **whole** paste: nothing is written, a pending cut keeps its
source and its marquee, and the grid announces "Paste cancelled, _n_ invalid
values" to the polite live region (_n_ counts the unreadable **clipboard**
values, not the cells they tiled onto). This keeps unreadable input distinct from
an intentional clear, so a stray column of text can never blank the cells it
lands on. A blank source cell is still a deliberate clear, and text landing past
the grid's edge or on a non-editable column is dropped as before without blocking
the paste.

What counts as parseable in a number column depends on the mode. A default
`number` column uses JavaScript number semantics, so it still accepts forms like
`1e5` and `0x1f`; a `decimalString` column accepts only the canonical
dot-decimal syntax above. A multi-select cell of pure punctuation (`,`) is
refused rather than treated as empty — only genuinely blank text clears a cell.

## Editing

Open an editor with **Enter**, a **double-press**, or a single click/tap on the
already-active cell (select cells open their menu on that click, matching a
normal dropdown). Dragging from the active cell still paints a range, so only a
click that never dragged edits. **Enter** commits and moves down; **Escape** reverts;
blur commits. `onCellChange(ref, value)` may return a promise — a rejection
keeps the editor open so you can surface an error. Number cells reject
non-numeric input with an inline error — under `numberValueMode: "decimalString"`
they reject anything outside canonical dot-decimal syntax and commit the string
itself.

Date editing adapts by platform. Web renders the editable date trigger and an
anchored calendar through `DropdownPortal`, so it stays beside the cell while
escaping the grid's scroll clipping; entering edit mode focuses the input and
opens that calendar immediately. Native opens the day/month/year wheel in the
shared bottom sheet on edit entry; Cancel discards its draft and Done commits it.

## Loading columns

Set `loading: true` on a column to show a spinner in place of its field-type
icon in the header — for a just-added column still being provisioned, a
computed / AI column being (re)generated, or any async header state. It is
purely presentational (the column stays sortable, resizable, and editable) and
swaps in place with no layout shift; flip it back to `false` when the column is
ready. The spinner is decorative (hidden from assistive tech, like the field
icon it replaces); the loading state is conveyed by marking the header busy
(`accessibilityState={{ busy }}` / `aria-busy`), so the header's spoken name
stays just the column label.

## Loading cells

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
