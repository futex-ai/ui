# Table

A lightweight data table for React Native and React Native Web, adapted from the
accounting app's data table. React Native has no `<table>`, so it renders flex
rows that share their column definitions to keep the header and body cells
aligned. It is the single table primitive for the library: optional headers,
flexible per-cell rendering, optionally pressable rows, and the shared
`ControlSize` densities, all driven by shared theme tokens.

## Responsibilities

- Render rows from a `columns` definition and a `cell` render callback, so a cell
  can hold plain text, tags, buttons, or any node.
- Size columns with a fixed `width` or a `flex` share, and align them left,
  center, or right.
- Make the header row optional via `headless`.
- Make rows pressable via `onRowPress`, with the shared hover wash, sage focus
  ring, pressed and disabled states, `button` semantics, and keyboard
  activation — or render plain static rows when no handler is given.
- Size the table with the shared `ControlSize` scale (`sm` / `md` / `lg`),
  scaling the row padding and the header / cell type scale.
- Use shared theme colours, fonts, and radii instead of consumer-local theme.

## Usage

```tsx
import { Table, TableCell } from "@firna/ui/table";

type Invoice = { id: string; number: string; amount: string; status: string };

<Table<Invoice>
  columns={[
    { flex: 2, key: "number", label: "Invoice" },
    { key: "status", label: "Status", width: 120 },
    { align: "right", key: "amount", label: "Amount", width: 120 },
  ]}
  cell={(row, key) => {
    if (key === "number") return <TableCell>{row.number}</TableCell>;
    if (key === "status") return <TableCell muted>{row.status}</TableCell>;
    return <TableCell numeric>{row.amount}</TableCell>;
  }}
  rowKey={(row) => row.id}
  rows={invoices}
/>;
```

### Columns

Each column needs a stable `key` (passed to `cell` and used as the cell's React
key). Give a column a fixed `width` (px) or let it share the remaining space with
`flex` (defaults to `1`). `align` (`left` / `center` / `right`) positions both
the header label and the cell box; pair `align: "right"` with `<TableCell numeric>`
for amount columns so the figures line up.

### Headers

The header row shows each column's `label`. Columns without a label render an
empty header cell. Pass `headless` to hide the header row entirely — for a
continuation table stacked under another, or any table that needs no headers.

```tsx
<Table headless columns={columns} cell={cell} rowKey={rowKey} rows={rows} />
```

### Clickable rows

Pass `onRowPress` to make every row a pressable button. Rows then gain a hover
wash, the sage focus ring, a pressed state, and keyboard activation (Enter /
Space), and announce themselves as buttons. Use `rowLabel` to give each row an
accessible name, and `rowDisabled` to make individual rows non-pressable. Without
`onRowPress`, rows render as plain static rows.

```tsx
<Table
  columns={columns}
  cell={cell}
  onRowPress={(row) => router.push(`/invoices/${row.id}`)}
  rowDisabled={(row) => row.status === "void"}
  rowKey={(row) => row.id}
  rowLabel={(row) => `Open invoice ${row.number}`}
  rows={invoices}
/>
```

### Loading

Pass `loading` to render content-shaped placeholder rows (built from the
[`Skeleton`](../skeleton/README.md) primitives) instead of `rows` while data is
fetching, so the layout does not jump when it arrives. The table announces
`aria-busy` while loading, and the placeholder rows are non-interactive and
hidden from assistive technology. `loadingRowCount` sets how many placeholder
rows to show (defaults to 6); the placeholder bars mirror each column's width.

```tsx
<Table
  columns={columns}
  cell={cell}
  loading={isLoading}
  loadingRowCount={6}
  rowKey={(row) => row.id}
  rows={rows}
/>
```

### Cells

`cell` can return any node, so columns can mix text, tags, avatars, and buttons.
For the common text cell, `TableCell` applies the table's default typography:
`muted` greys secondary text and `numeric` gives tabular figures for amounts.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
and matches the accounting data table. It scales the row padding and the header /
cell type scale, so a table reads at the same density as the controls beside it.
`sm` suits dense rows; `lg` suits roomier, touch-first layouts.

## Styling

`style` extends the table container (`ViewStyle`) — layer a card border, radius,
and `overflow: "hidden"` on top to frame the table. Column layout, alignment,
the header, the pressable-row treatments, and the disabled state are applied by
the component.

## Theming

Tables read colours and fonts from `SharedUiThemeProvider`: the header fill uses
`colors.bg`, row separators use `colors.border`, cell text uses `colors.ink`
(and `colors.muted` for headers and muted cells), the row hover uses
`colors.soft`, the pressed state uses `colors.bg2`, and the focus ring uses
`colors.primary`.
