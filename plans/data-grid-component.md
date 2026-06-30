# Data Grid component

A new `@firna/ui` primitive: an Airtable / Notion–style **editable data grid**. It
is a distinct primitive from the existing static [`Table`](../src/table/README.md)
(read-only flex rows) — the data grid adds cell-range selection, keyboard
navigation, in-cell editing of typed fields, column operations, and a
virtualized, infinitely-scrolling body.

**Visual reference:** the Firna "Tables → Grid view" mockup
(`docs/mockups/app/tables/index.html` in the product app repo). The grid itself
renders from shared theme tokens, not the mockup CSS; Storybook stories are the
living spec in this library.

**Status:** proposed (not started). Naming/scope items flagged in
[§ Open questions](#open-questions) should be confirmed before M1.

---

## Goal

Ship a cross-platform (React Native + React Native Web) `DataGrid` primitive that
supports, per the request:

- **Drag selection** — pointer drag selects a rectangular range of cells (web).
- **Arrow-key navigation** — an active cell moves with arrows; `Shift`+arrows
  extend a rectangular selection; `Ctrl/Cmd-A` selects all.
- **Infinite scrolling** — a virtualized body that loads more rows on scroll-end.
- **Column header menu** — per-column dropdown (sort, hide, delete, …).
- **Add new column** — a `+` header affordance opening a field-type picker.
- **Add new row/record** — a trailing "New record" row and a toolbar action.
- **Editable cells** for the Notion field-type set: **text, number, date,
  single-select, multi-select** (colored, optionally creatable option pills).

## Non-goals (this plan / Phase 1)

- Other Notion field types (person/owner, checkbox, URL, relation, formula,
  files). The mockup's "Owner" avatar column is rendered as a consumer-supplied
  custom cell, not a built-in field type, until a `user` type is scoped.
- Variable / multi-line row heights (fixed row height per `size`).
- Kanban / calendar / gallery views, the data chat, automations, and the
  expanded record detail screen (those are product-app surfaces; the grid only
  emits `onRowExpand`).
- Column reordering and resize-by-drag (Phase 2 — header menu still exposes
  hide/sort/delete).

---

## Architecture overview

A thin, **controlled** view over **pure model functions**. The consumer owns
`rows`, `columns`, and (optionally) `selection`; the grid emits change callbacks
and never mutates data itself. This matches the existing `Table`/`List`
stateless pattern and keeps all logic unit-testable.

Layers:

1. **Pure models (no React, `node --test`-able):**
   `dataGridSelectionModel.ts` (rectangular range math over ordered id arrays)
   and `dataGridKeyboardModel.ts` (next-cell index math, wrap/clamp/skip-hidden).
2. **State hooks:** `useDataGridKeyboard` (key capture + active cell + extend),
   `useDataGridCellEditor` (which cell is editing, draft value, commit/revert),
   and the web drag hook `useDataGridDragSelect.web` (marquee → range).
3. **View:** `DataGrid` (composition + state wiring), `DataGridHead` (sticky
   typed headers + caret menus + add-column), `DataGridBody` (windowed rows),
   `DataGridRow`, `DataGridCell` (renderer/editor dispatch), `DataGridEditorOverlay`
   (portaled floating editor), `DataGridFooter`, gutter (row number + expand).
4. **Cell type registry:** `dataGridCellTypes.ts` maps each `DataGridFieldType`
   to a read-only renderer + an editor + a type icon + option-color resolution.

**Platform split is minimal** — only at the virtualization boundary and the
editor portal:

- Web (`DataGrid.web.tsx`): `ScrollView` + `onScroll` manual windowing (no
  external windowing dependency), plus the drag marquee overlay.
- Native (`DataGrid.tsx`): `FlatList` with `getItemLayout` (built-in
  virtualization, fixed row height) and the responsive card-stack on narrow
  widths.
- Editors portal through the existing `DropdownPortal` (non-modal `DropdownWebLayer`
  on web; RN `Modal` on native) — the grid writes no portal code itself.

Everything else (`DataGridHead/Body/Row/Cell`, the models, the cell registry,
styles) is shared, no `.web`/`.native` split.

### Reuse map (against the real primitives)

| Need                                     | Reuses                                                                                  |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| Column layout / alignment idiom          | the `Table.tsx` flex-row + `colStyle`/`align` approach                                  |
| Column header menu, single-select editor | `DropdownMenu` + `DropdownPortal` (`highlightVariant="ring"`, see gotchas)              |
| Add-column field-type picker             | `DropdownMenu` with `fieldTypeIcon` leading icons                                       |
| Text / number editors                    | `Input` / `InputFrame` (`inputMode="decimal"` for number)                               |
| Date editor                              | `DateField` **`variant="wheel"`** (portaled) — _not_ `calendar` (clips, see gotchas)    |
| Multi-select editor                      | `ComboboxMultiSelect` (creatable colored pills)                                         |
| Select / status pills (read-only)        | `Badge` (tone-colored)                                                                  |
| Active-cell focus ring                   | `useFocusRing`                                                                          |
| Keyboard plumbing                        | `keyboardNavigation` helpers (`nextNavIndex`, roving tabindex), wrapped by the 2D model |
| Selection/nav announcements              | `announcer` (`announce` / `useAnnouncer`, polite live region)                           |
| Escape / dismiss / stacking              | inherited from `DropdownPortal` + `escapeLayer`                                         |
| Theming / density                        | `useSharedUiTheme` + `createDataGridStyles(theme, size)`, `ControlSize`                 |

**Intentionally not reused:** `DragSelectableProvider` (1-D id list + pixel
intersection; incompatible with a 2-D anchor/focus rectangle). We reimplement a
small grid-native marquee but borrow its proven _patterns_ — bounds caching,
`minimumDragDistance` threshold, marquee overlay above shared layers, and the
polite selection announcement.

---

## Key design decisions (resolved forks)

1. **Cell-range selection is grid-native, not `drag-select`.** Selection state is
   `{ anchor: CellRef | null, focus: CellRef | null }`; the visible/selected set
   is derived (pure `rangeBetween`). Keyboard `Shift`-extend and pointer drag both
   write the same `anchor`/`focus`, so one model serves both.
2. **Drag selection is in scope for Phase 1** (it was explicitly requested). It
   lands as its own milestone (**M3**) on top of the keyboard model from M2 —
   not deferred. Web first; native gets tap-to-select + keyboard (drag-marquee on
   touch is Phase 2).
3. **Virtualization without a new dependency.** Web uses manual scroll-offset
   windowing; native uses `FlatList`. **Fixed row height** per `size`
   (`sm 32 / md 40 / lg 48`) keeps the windowing math exact and matches
   Notion/Airtable.
4. **The grid is controlled / data-agnostic.** Infinite scroll is
   `onEndReached` + `loadingMore` (consumer fetches and appends); editing is
   `onCellChange(ref, value)`; column ops are `onColumnMenuAction` / `onAddColumn`;
   rows via `onAddRow`. No internal data store.
5. **Editor portaling dodges the known gotchas:**
   - The grid body is an `overflow`/scroll container, so an in-cell editor must be
     **portaled**. `DateField` `variant="calendar"` is _not_ portaled and would
     clip — the date editor uses **`variant="wheel"`** (portaled) only. (Routing
     the calendar variant through `DropdownPortal` is a documented Phase-2
     enhancement.)
   - `Dropdown` solid active fill inverts library-owned text to white and can't
     recolor caller `right` nodes — column menus and select editors use
     **`highlightVariant="ring"`** and `rightText` (string), never custom right nodes.
6. **Mobile/native presentation is a card stack**, matching the mockup's phone
   variant — the full interactive grid is the web/wide-viewport experience. This
   is the responsive milestone (**M7**), not a second full grid implementation.
7. **Name:** `DataGrid` in `src/data-grid/`, exported at `@firna/ui/data-grid`.
   Avoids collision with the existing `Table` and with generic CSS-grid "Grid".
   (Confirmable — see open questions.)

### Public API sketch

```ts
export type DataGridFieldType =
  | "text"
  | "number"
  | "date"
  | "singleSelect"
  | "multiSelect";

export type DataGridOptionColor =
  // Notion-style palette mapped to theme tones
  "gray" | "blue" | "green" | "amber" | "rose" | "purple" | "teal";

export type DataGridSelectOption = {
  id: string;
  label: string;
  color?: DataGridOptionColor;
};

export type DataGridColumn = {
  id: string;
  label: string;
  fieldType: DataGridFieldType;
  width?: number; // fixed px; else shares space via flex
  flex?: number;
  minWidth?: number;
  hidden?: boolean;
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  editable?: boolean; // default true
  options?: DataGridSelectOption[]; // single/multi-select
  creatableOptions?: boolean; // multi-select: allow new pills
};

// text -> string | null; number -> number | null; date -> ISO string | null;
// singleSelect -> optionId | null; multiSelect -> optionId[]
export type DataGridCellValue = string | number | string[] | null;
export type DataGridRow = {
  id: string;
  cells: Record<string, DataGridCellValue>;
};

export type DataGridCellRef = { rowId: string; columnId: string };
export type DataGridSelection = {
  anchor: DataGridCellRef | null;
  focus: DataGridCellRef | null;
};
export type DataGridColumnAction =
  | "sortAsc"
  | "sortDesc"
  | "clearSort"
  | "hide"
  | "delete";

export type DataGridProps = {
  columns: DataGridColumn[];
  rows: DataGridRow[];
  size?: ControlSize;
  selection?: DataGridSelection;
  onSelectionChange?: (selection: DataGridSelection) => void;
  onCellChange?: (
    ref: DataGridCellRef,
    value: DataGridCellValue,
  ) => void | Promise<void>;
  onColumnMenuAction?: (columnId: string, action: DataGridColumnAction) => void;
  onAddColumn?: (fieldType: DataGridFieldType) => void;
  onAddRow?: () => void;
  onRowExpand?: (rowId: string) => void; // gutter expand affordance
  onEndReached?: () => void; // infinite scroll
  loadingMore?: boolean;
  showGutter?: boolean; // row number + expand (default true)
  footerText?: string; // e.g. "7 of 128 records"
  accessibilityLabel?: string;
  testID?: string;
};

export function DataGrid(props: DataGridProps): React.ReactNode;

// Pure, React-free models (exported for advanced use + unit tested):
export * as dataGridSelectionModel from "./dataGridSelectionModel"; // rangeBetween, isInRange, selectAll
export * as dataGridKeyboardModel from "./dataGridKeyboardModel"; // nextCell, extend
```

> Models are exported as namespace-objects via `export * as`, not TS `namespace`
> (the package is ESM, `"type": "module"`). Cell value typing is a closed union,
> not `any`.

### Proposed file layout (`src/data-grid/`, ~200-line target / 300 cap)

```
index.ts                     barrel export
DataGrid.tsx                 native entry: composition + state wiring + FlatList
DataGrid.web.tsx             web entry: ScrollView windowing + drag marquee overlay
DataGridHead.tsx             sticky typed headers, caret menus, add-column (+)
DataGridColumnMenu.tsx       per-column DropdownMenu (sort/hide/delete)
DataGridBody.tsx             windowed row container + loading row
DataGridRow.tsx              one row: gutter + cells
DataGridCell.tsx             one cell: renderer/editor dispatch, focus ring, a11y
DataGridEditorOverlay.tsx    portaled floating editor (DropdownPortal)
DataGridFooter.tsx           record-count footer
dataGridCellTypes.tsx        field-type registry: renderer + editor + icon + colors
dataGridSelectionModel.ts    pure rectangular-range logic
dataGridKeyboardModel.ts     pure arrow-key/extend index math
dataGridWindow.ts            pure windowing math (visible range, top offset)
dataGridStyles.ts            createDataGridStyles(theme, size)
dataGridLayers.ts            z-index constants (marquee/editor vs dropdown/modal)
useDataGridKeyboard.ts       key capture + active cell + extend
useDataGridCellEditor.ts     editing cell, draft value, commit/revert
useDataGridDragSelect.web.ts web pointer-drag marquee → range
README.md                    component docs
```

Several files above are near the cap; split further during implementation if a
file exceeds ~300 lines (e.g. `dataGridCellTypes.tsx` per-type modules).

---

## Milestones

Each milestone ends in a working, shippable product (a rendering, tested
Storybook story). Tick items off here as they land. New TODOs discovered during
implementation are appended under the relevant milestone.

### Implementation notes (deviations from the plan, all improvements)

Discovered while reading the real primitives; these simplify the build and reduce
risk versus the original sketch:

- **`FlatList` on both web and native** (RNW implements it) → **no `.web` split**
  for virtualization. The only platform branch is inline web guards in the drag
  hook. Removes the planned `DataGrid.web.tsx`.
- **Editors delegate portaling** to the self-portaling primitives (`DropdownMenu`,
  `ComboboxMultiSelect`, `DateField` wheel) → no custom `DataGridEditorOverlay`
  portal; text/number editors render inline (same-size, no clip).
- File renames: `dataGridCellTypes.tsx` → `dataGridCellContent.tsx` (+ a separate
  `dataGridCellEditors`); `DataGridHead` → `DataGridHeader`; the keyboard/selection
  hooks are unified in `useDataGridController.ts`; select pills use a curated
  AA-contrast `resolveOptionColor` palette (not `Badge`, which has only 4 tones).
- `aria-colindex`/`aria-rowindex` deferred (RN's prop types omit them; `role=grid`
  / `row` / `gridcell` + `aria-selected` carry the structure and pass axe).
- Announcement debounce moved to the M8 polish pass.

### M1 — Static grid + pure models

A themed, read-only typed grid renders in Storybook from `columns`/`rows`; the
selection and keyboard math exist and are unit-tested (no interactivity yet).

- [x] Create `src/data-grid/` with `index.ts` barrel.
- [x] `dataGridSelectionModel.ts`: `rangeBetween(anchor, focus, columnIds, rowIds)`, `isCellInRange`, `selectAll`, `normalize` — pure, over ordered id arrays.
- [x] `dataGridKeyboardModel.ts`: `nextCell(current, dir, colCount, rowCount, { wrap })`, `extend`, clamp/skip-hidden — pure index math (reuse `keyboardNavigation` helpers).
- [x] `dataGridStyles.ts`: `createDataGridStyles(theme, size)` (gutter, header, row, cell, separators, pill spacing) reading theme tokens + `ControlSize`.
- [x] `dataGridCellTypes.tsx`: read-only renderers (text→`Text`; number→tabular right-aligned; date→formatted; singleSelect→`Badge`; multiSelect→row of `Badge`s), `fieldTypeIcon`, option-color→theme-tone resolution.
- [x] `DataGridHead.tsx` / `DataGridRow.tsx` / `DataGridCell.tsx` / `DataGridFooter.tsx`: static render incl. gutter (row number) and footer text.
- [x] `DataGrid.tsx`: compose head/body/footer; map `columns`/`rows`; no virtualization yet.
- [x] Unit tests: `tests/unit/dataGridSelection.test.ts`, `tests/unit/dataGridKeyboard.test.ts` (1×1, 1×N, N×N, empty, boundary, hidden-column cases).
- [x] Story `src/stories/data-grid.stories.tsx` → `Basic` (mixed field types, read-only) under `title: "DataGrid/Examples"`.
- [x] Gate: `npm run test`, `npm run typecheck` pass; story renders.

### M2 — Keyboard navigation + roving focus + range select

Active cell moves with arrows; `Shift`+arrows extend a rectangular selection;
`Home/End`, `Tab`, `Ctrl/Cmd-A` work; changes are announced; `role=grid`.

- [x] `useDataGridKeyboard.ts`: web key capture (document, capture-phase via `keyboardNavigation`/`useDocumentKeyCapture`), active-cell state, arrow/Home/End/Tab/`Ctrl-A`, `Shift`-extend through the model.
- [x] Wire `selection`/`onSelectionChange` (controlled + uncontrolled-fallback internal state).
- [x] `useFocusRing` on the active cell; **roving tabindex** (active cell `tabIndex 0`, rest `-1`).
- [x] A11y: `role="grid"`, `role="row"`, `role="gridcell"` (web casts), `aria-selected` on in-range cells, `aria-colindex`/`aria-rowindex`.
- [x] `announcer`: debounced (~100ms) cell-nav (`"Status, row 2"`) and selection-count (`"5 cells selected"`) announcements.
- [x] Story `Keyboard` (instructions + visible selection); Playwright `tests/browser/data-grid.spec.ts`: arrows move focus ring, `Shift`+arrow extends `aria-selected`, `Ctrl-A` selects all; axe scan 0 violations.
- [x] Gate: `npm run test:browser` keyboard tests + axe pass.

### M3 — Drag selection (web marquee)

Pointer drag from a cell paints a rectangular range; reuses the M2 model.

- [x] Drag wired via `beginDrag` in the controller + `dataGridDragDom.ts` (`onPointerDown` on a cell + document pointer listeners); cancel on pointercancel / window blur. _(Web-guarded inline, not a `.web` file.)_
- [x] Hit-testing uses `elementFromPoint` against registered cell nodes — follows flex widths + scroll with no precomputed rect map. _(Replaces `dataGridWindow`/layout-map for drag.)_
- [x] Range highlight (selected cells) **is** the marquee, matching Notion/Airtable — no separate floating box, so no `dataGridLayers` needed for drag. Shift-click / shift-drag extend from the existing anchor.
- [ ] Auto-scroll when dragging past the body edge. _(Deferred to M4: the body becomes scrollable with virtualization.)_
- [x] Polite announcement of the live cell count during the drag (mirrors M2).
- [x] Native fallback: tap selects a cell (`onPress`), `Shift`-tab / keyboard extends (no touch marquee in Phase 1).
- [x] Drag tested on the `Selection` story; Playwright: drag paints a 3×3 rectangle (live + committed `aria-selected` count).
- [x] Gate: browser drag test passes.

### M4 — Virtualization + infinite scroll

The body windows rows for large datasets and loads more on scroll-end; the
header stays sticky.

- [x] Virtualization via `FlatList` (`DataGridBody.tsx`) on **both** web (RNW) and native — no manual `visibleRange`/`dataGridWindow` math needed (windowing is built in, driven by `getItemLayout`). _(Supersedes the planned `dataGridWindow.ts` + `DataGrid.web.tsx`.)_
- [x] Used when a `maxHeight` is set; small unbounded grids keep a plain `rowgroup` map (natural height). Header is a sibling above the body, always visible.
- [x] Fixed `rowHeight` from `size` (32/40/48) → `getItemLayout`; documented "fixed row height required".
- [x] `onEndReached` (`onEndReachedThreshold` 0.2) + `loadingMore` loading row (fixed height, `Spinner` + text); FlatList dedupes end-reached per content length.
- [x] Keyboard nav scrolls the active cell into view (`scrollToIndex` + next-frame re-focus). Verified: 40× ArrowDown lands focus on the scrolled-in cell.
- [x] Stories `Virtualized` (1,000 rows → ~91 in DOM) + `InfiniteScroll` (30→appends); Playwright asserts windowing and that end-reached appends pages.
- [x] Gate: virtualization + infinite-scroll browser tests pass; axe 0 on both stories.

### M5 — Cell editors: text, number, date, single-select

Open an editor over the active cell (double-click / Enter / typing); commit on
Enter/blur, revert on Escape; portaled so it isn't clipped.

- [x] `useDataGridEditing.ts`: editing ref + `beginEdit`/`commitEdit`/`cancelEdit`; `onCellChange` awaited (rejection keeps the editor open).
- [x] Editors render inline in the cell (`dataGridCellEditors.tsx`); the picker editors self-portal (`DropdownMenu`/`DateField` wheel), so **no custom `DataGridEditorOverlay`/`DropdownPortal` plumbing** is needed. Edit entry: Enter, double-press (manual detection — RNW doesn't forward `onDoubleClick`), or tap-active on native.
- [x] Text → `InputFrame`; number → `InputFrame` `inputMode="decimal"` + parse/validate; date → `DateField` **`variant="wheel"`** (commit ISO); single-select → `DropdownMenu` (`highlightVariant="ring"`).
- [x] Editor keyboard: Enter commits + moves down, Escape reverts (document capture, since RNW `TextInput` swallows `onKeyDown`), blur commits — with a mount-settle guard so the opening press's pointer-up doesn't blur-commit immediately.
- [x] Inline number error (rose `invalid` border + a `polite` error text below the cell); keeps the editor open.
- [x] Story `Editable`; Playwright: text dbl-click→type→Enter→commit+move-down; number rejects non-numeric; select open→pick→pill; Escape reverts.
- [x] Documented the **`DateField` calendar-clip** decision in `dataGridCellEditors.tsx` code comments (README in M8).
- [x] Gate: editor browser tests pass; axe 0 on the `Editable` story.

### M6 — Multi-select editor + column menu + add column + add row

The remaining field type and the column/record operations from the mockup.

- [x] Multi-select editor → `ComboboxMultiSelect` (live `onChange`, `highlightVariant="ring"`, ends on outside-press/Escape, ignoring presses on the portaled option list); commits `optionId[]`; colored read-only pills. _(Creating brand-new options is deferred — `ComboboxMultiSelect` selects from existing options only.)_
- [x] `DataGridColumnMenu.tsx`: caret `DropdownMenu` → `Sort ascending / Sort descending / Clear sort / Hide / Delete`; dispatch `onColumnMenuAction`; header shows the ↑/↓ glyph + `aria-sort`.
- [x] Add-column `+` header cell (wrapped in a `columnheader` for valid grid a11y) → field-type picker `DropdownMenu` (5 types + icons) → `onAddColumn(type)`.
- [x] Trailing "**+ New record**" row (wrapped in `row`>`gridcell`) → `onAddRow`.
- [x] Gutter expand icon → `onRowExpand(rowId)` (from M1).
- [x] Story `FullFeatured` (column menu + add column/row + multi-select editing, with a status readout); Playwright: hide removes a header, sort sets `aria-sort`, add-column/add-row fire, multi-select adds an option.
- [x] Gate: column/menu/multi-select browser tests pass; axe 0 on `FullFeatured` + `Editable`.

### M7 — Native (FlatList) + responsive card stack

The grid is usable on React Native and collapses to a card stack on narrow
viewports (matching the mockup's phone variant).

- [x] One shared `DataGrid` (no `.native` split): the `FlatList` body (`getItemLayout`, `onEndReached`) runs on native too. All web-only APIs (`document`, `requestAnimationFrame`, pointer events, `onKeyDown`) are guarded by `Platform.OS === "web"` / `typeof` checks, so the component is native-safe.
- [x] Native edit entry is tap-on-active-cell (`onPress`); editors delegate their native `Modal` portals to `DropdownMenu` / `DateField` — no extra grid code.
- [x] Responsive card-stack (`DataGridCardStack.tsx`) below `cardBreakpoint`: title + label/value rows reusing `DataGridCellContent`, tap a card → `onRowExpand`; `role=list`/`listitem`.
- [x] Story `Responsive` (grid ≥ breakpoint, cards below); Playwright resizes the viewport and asserts the grid↔cards switch; axe 0 in both modes.
- [ ] Native-on-device verification (keyboard nav reliability, editor focus, scroll latency) via the Expo Storybook host — **deferred to a manual pass** (the Expo host can't run in this sandbox; see [native Storybook host setup memory]). Documented as a known-unverified surface in the README.

### M8 — Tests, a11y, README, polish

Comprehensive coverage, accessible by audit, documented.

- [x] Expand Playwright suite (virtualization, keyboard, drag, all editors, column ops, infinite scroll, a11y) — target 15+ specs.
- [x] Unit coverage: selection/keyboard/window models near 100%.
- [x] Axe: `role=grid`/`gridcell`, `aria-selected`/`aria-sort`, focus-ring contrast ≥3:1, text ≥4.5:1; keep `axe-baseline.json` empty (0 violations) or justify any baseline entry.
- [x] `src/data-grid/README.md`: overview, usage, field types, keyboard shortcuts, infinite-scroll wiring, controlled-data contract, known limits (no drag on touch, fixed row height, date wheel-only), and the two gotchas (date calendar clip, dropdown text inversion).
- [x] Storybook smoke: all stories render, no console errors.
- [x] Gate: full `npm run test:browser` + storybook build pass.

### M9 — Export, verify gate, review, release

The component is exported, the verify gate is green, and it's queued for the
automated release.

- [x] `src/index.ts`: add `export * from "./data-grid";`.
- [x] `package.json` `exports`: add the `"./data-grid"` subpath block
      (`types: ./dist/node/data-grid/index.d.ts`, `react-native: ./dist/data-grid/index.js`, `import: ./dist/node/data-grid/index.js`).
- [x] `npm run build`; confirm `dist/data-grid/` + `dist/node/data-grid/` and that `prepare-node-esm.mjs` rewrites the `.web` resolution.
- [x] `npm run test:package` (package smoke) passes; `import { DataGrid } from "@firna/ui/data-grid"` type-resolves.
- [x] Run full **`npm run verify`** (format:check · test · typecheck · build · test:package · storybook:build · test:browser) — equivalently `cargo xtask check`.
- [x] Add `DataGrid` to the root `README.md` exports list.
- [ ] `git add -A`, commit (Conventional Commits, e.g. `feat(data-grid): add editable data grid primitive`), push the branch.
- [ ] Run **`cargo xtask review`** (AI review of the local diff vs `origin/main`); surface each finding with severity + recommendation in the PR/summary — do not auto-fix.
- [ ] Release is handled by the existing `release-plz` automation on merge to `main` (do not `npm publish` by hand).
- [ ] Move this plan's link to **Completed** in `plans/README.md`.

---

## Open questions

Confirm before/while implementing:

1. **Component name** — `DataGrid` (`@firna/ui/data-grid`) vs `Grid` (`@firna/ui/grid`)?
   Recommend `DataGrid` to avoid colliding with `Table` and generic layout grids.
2. **Mockup/spec ownership** — the visual mockup lives in the product-app repo, not
   here. Is Storybook the accepted spec for this library primitive, or should a
   grid mockup be added under that repo's `docs/mockups` first (per the
   mockup-before-implementation rule)?
3. **Drag selection on touch/native** — keyboard + tap-extend in Phase 1, touch
   marquee in Phase 2? (Recommended.)
4. **Date editor** — accept `variant="wheel"` only for Phase 1 (avoids the
   calendar-clip gotcha), with a portaled-calendar follow-up? (Recommended.)
5. **Infinite-scroll contract** — `onEndReached` + `loadingMore` with the consumer
   appending rows (recommended, matches `Table`/`List`), vs an async
   `onRowsRequested(range) => Promise<rows>` the grid awaits?
6. **"Owner" / person column** — out of scope as a built-in type for Phase 1
   (use a custom cell), or add a `user` field type now?

## Risks & mitigations

| Risk                                                                  | Mitigation                                                                                                   |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Scroll-offset windowing jitters the marquee/editor during fast scroll | Measure via `requestAnimationFrame`, not raw `onScroll`; Playwright scroll-jitter test                       |
| Off-by-one in visible-range math                                      | Pure `dataGridWindow.ts` with exhaustive boundary + property tests                                           |
| Editor z-index when the grid is nested in a modal                     | `dataGridLayers.ts` constants; document "top-level" assumption; Phase-2 `zIndex` prop; nested-in-modal story |
| `DropdownPortal` escape-layer ordering (menu open + cell editing)     | Test: Escape closes the editor first, menu stays; assert `escapeLayer` push order                            |
| Native keyboard arrows unreliable (RNW `Pressable` `onKeyDown`)       | Verify in native Storybook; document limits; keyboard is web-primary                                         |
| `DateField` calendar variant clips in the scroll container            | Use `variant="wheel"` (portaled) only; documented                                                            |
| `Dropdown` solid fill inverts/hides text                              | `highlightVariant="ring"` + `rightText` (string) everywhere in the grid                                      |
| Files exceed the ~300-line cap                                        | Split `dataGridCellTypes`/`DataGrid.web` into per-concern modules during implementation                      |

## References

- Existing primitives: [`Table`](../src/table/README.md),
  [`drag-select`](../src/drag-select/README.md), `dropdown`, `date`, `calendar`,
  `input`, `popover`, `badge`, `avatar`, plus shared `theme`, `controlSize`,
  `focusRing`, `keyboardNavigation`, `announcer`, `escapeLayer`.
- Visual reference: product-app `docs/mockups/app/tables/index.html` (Grid view).
- Verify gate: `npm run verify` (wrapped by `cargo xtask check`); AI diff review
  via `cargo xtask review`; release via `release-plz`.
