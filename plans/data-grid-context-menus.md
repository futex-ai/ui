# Data Grid Context Menus

Right-clicking a column header or a row in [`DataGrid`](../src/data-grid/README.md)
does nothing today — the browser's own menu appears. The grid already has the
vocabulary for the actions people expect there (`DataGridColumnAction` is
`sortAsc` / `sortDesc` / `clearSort` / `hide` / `delete`, dispatched from the
header caret in [`DataGridColumnMenu.tsx`](../src/data-grid/DataGridColumnMenu.tsx)),
but the only way to reach it is a 20px caret you have to hover a header to find,
and there is no row or cell equivalent at all.

The blocker is not the menu, it is where a menu can be put. Every menu surface in
the library funnels through `DropdownPortal`, which takes `anchorRef` and measures
it with `measureInWindow`. There is no way to position a surface at a _point_.
`DropdownMenu` already ships a `trigger="contextMenu"` mode
([`dropdownMenuModel.ts:131-145`](../src/dropdown/dropdownMenuModel.ts)) that
right-clicks on web and long-presses on native — but it throws the event's
coordinates away and anchors to the trigger's box, which on a full-width table row
puts the menu at the row's left edge instead of under the pointer. The geometry
underneath is already point-capable: `dropdownPlacement()` is a pure
rect-in / placement-out function, and [`SlashMenu.web.tsx`](../src/rich-text/SlashMenu.web.tsx)
already bypasses the portal to feed it a virtual caret rect. This plan promotes
that one-off into a real primitive and then spends it on the grid.

**Visual reference:** the `DataGrid/Examples` Storybook folder — the new
`Context menus` and `Context menu (open)` stories are the living spec.

**Status:** delivered. M1–M7 complete and `npm run verify` green. Right-click
(web) and long-press (native) menus are live on `DataGrid` column headers, the
row gutter, and cells, behind an opt-in `contextMenu` prop. The point anchor
landed on `DropdownPortal` as `anchorRect`, and the `ContextMenu` primitive
built on it lives in `src/popover` alongside `ResponsiveMenu` (whose native
sheet it reuses) rather than in `src/dropdown` as first sketched. The one
deferred item is the manual on-device native pass in M6 — long-press timing,
sheet dismissal, and VoiceOver / TalkBack behaviour still need a real device,
and join the existing deferred native item in
[Data Grid component](data-grid-component.md) M7.

M8 amends the delivered behaviour: a right-click on the gutter or a header no
longer selects the row or column. Only a cell press can move the selection, and
only when it landed outside it.

---

## Goal

Right-click (web) or long-press (native) a DataGrid column header, row gutter, or
cell and get a menu of the actions that make sense there — including **Delete
field** and **Delete row** — positioned at the pointer, reachable from the
keyboard, and extensible by the consumer.

## Background — what already exists

| Piece                                                          | Where                                              | State                                                                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dropdownPlacement(anchor, viewport, options, preferredWidth)` | `src/dropdown/dropdownGeometry.ts:103`             | Pure, unit-tested with literal rects. Handles a zero-size rect correctly. **Reused as-is.**                                                               |
| `DropdownPortal` (web + native)                                | `src/dropdown/DropdownPortal{,.web}.tsx`           | `anchorRef` only. **Extended in M1.**                                                                                                                     |
| `useDropdownAnchor(anchorRef, open)`                           | `src/dropdown/useDropdownAnchor.ts:18`             | `measureInWindow` only. **Extended in M1.**                                                                                                               |
| `useDropdownDismiss`                                           | `src/dropdown/useDropdownDismiss.ts:33`            | Outside-`pointerdown` capture + escape layer. `dropdownShouldClose` tolerates a null anchor node, so it works with no trigger. **Reused as-is.**          |
| `useDropdownSelectorNavigation`                                | `src/dropdown/useDropdownSelectorNavigation.ts:35` | Document-level capture `keydown` while open, driving a controlled `activeId`. Focus-independent, so it works with no focusable trigger. **Reused as-is.** |
| `DropdownList`                                                 | `src/dropdown/DropdownList.tsx`                    | `listRole="menu"`, `tone: "danger"`, dividers, sections. **Reused as-is.**                                                                                |
| `ResponsiveMenu` → `ResponsivePopover` → `Sheet`               | `src/popover/ResponsiveMenu.tsx`                   | Native bottom sheet; `anchorRef` is required but **ignored on native** (`ResponsivePopover.tsx:1-6`). **Reused as-is for the native build.**              |
| `DataGridColumnMenu`                                           | `src/data-grid/DataGridColumnMenu.tsx:38`          | Builds the header caret entries inline. **Refactored in M3** to share one builder with the context menu.                                                  |
| `dataGridSelectionModel`                                       | `src/data-grid/dataGridSelectionModel.ts`          | `rangeRect`, `rectContains`, `singleCell`, `cellKey`. Pure. **Reused in M4.**                                                                             |
| `useDataGridClipboard`                                         | `src/data-grid/useDataGridClipboard.ts`            | Returns `{ onCopy, onCut, onPaste, onClearSelection, onCancelCopy, bind, copied }`. **Reused in M4** — the cell menu needs no new callbacks.              |
| `isInteractiveDragTarget(event)`                               | `src/data-grid/dataGridDragDom.ts:57`              | `target.closest("button, a, input, [role='button']")`. **Reused in M4.**                                                                                  |

There is **no** `Shift+F10` or `ContextMenu` key handler anywhere in the repo
(verified by grep across `src/`, `tests/`, `docs/`, `plans/`), and no
`event.button === 2` handling outside the inverse guard in `useDataGridDrag.ts:253`.

## Non-goals

- **`src/table/Table.tsx` is untouched.** It is presentational: no column
  identity beyond a layout `key`, no selection, no ARIA table roles, and cells
  are non-interactive `View`s. "Delete column" has no meaning there. The
  `ContextMenu` primitive from M2 is generic, so `Table` can adopt it later
  without redesign.
- **Submenus.** `DropdownListEntry` has no nested variant and
  `dropdownNavigation.ts` has no Left/Right keys. Out of scope.
- **Changing `DropdownMenu trigger="contextMenu"` to anchor at the pointer.**
  See [§ Open questions](#open-questions) #1.
- **Column reordering.** Still Phase 2 per `plans/data-grid-component.md:43`.
- **Row selection as a first-class model.** The grid expresses whole-row
  selection as a full-width cell rectangle; this plan reads that, it does not
  replace it.

## Public API

### New — `@firna/ui/popover`

```ts
/** A menu positioned at a point rather than anchored to an element. */
export type ContextMenuProps = {
  /** Accessible name for the menu surface; the native sheet's default title. */
  accessibilityLabel: string;
  entries: DropdownListEntry[];
  /** Body cap. Default 320. */
  maxHeight?: number;
  /** Web surface minimum width. Default 220. A point anchor has zero width, so
   *  without this the resolved surface width would be 0. */
  minWidth?: number;
  onClose: () => void;
  open: boolean;
  /** Viewport coordinates of the gesture. Ignored on native (the sheet has no
   *  anchor). The menu stays closed while this is `null`. */
  point: DropdownPoint | null;
  testID?: string;
  /** Overrides the visible native sheet title when it should differ from
   *  `accessibilityLabel`. */
  title?: string;
  zIndex?: number;
};

export function ContextMenu(props: ContextMenuProps): ReactNode;

/** Viewport point from a synthetic or native pointer/context event. */
export function contextMenuPoint(rawEvent: unknown): DropdownPoint | null;

/** Gesture props that open a context menu: right-click on web, long-press on
 *  native. Suppresses the browser menu on web. */
export function contextMenuTriggerProps(options: {
  isWeb: boolean;
  onOpen: (point: DropdownPoint | null) => void;
}): Record<string, unknown>;
```

### Changed — `@firna/ui/dropdown`

```ts
export type DropdownPortalProps = DropdownPlacementOptions & {
  /** Element anchor. Supply exactly one of `anchorRef` / `anchorRect`. */
  anchorRef?: RefObject<View | null>;
  /** Virtual anchor in viewport coordinates; wins over `anchorRef` when set.
   *  A zero-size rect anchors the surface at a point. */
  anchorRect?: DropdownAnchorRect | null;
  // ...unchanged
};

export function useDropdownAnchor(
  anchorRef: RefObject<View | null>,
  open: boolean,
  anchorRect?: DropdownAnchorRect | null,
): { anchor: DropdownAnchorRect | null; viewport: DropdownViewport };
```

Relaxing `anchorRef` to optional is source-compatible with every existing caller.

### Changed — `@firna/ui/data-grid`

```ts
/** `insertLeft` / `insertRight` are new. */
export type DataGridColumnAction =
  | "clearSort"
  | "delete"
  | "hide"
  | "insertLeft"
  | "insertRight"
  | "sortAsc"
  | "sortDesc";

export type DataGridRowAction =
  | "delete"
  | "duplicate"
  | "insertAbove"
  | "insertBelow";

/** Which region a context menu was opened from. */
export type DataGridContextMenuTarget =
  | { region: "cell"; ref: DataGridCellRef }
  | { region: "column"; columnId: string }
  | { region: "row"; rowId: string };

/** Context handed to `onContextMenuEntries`. */
export type DataGridContextMenuContext =
  | { region: "cell"; ref: DataGridCellRef; rect: DataGridRangeRect | null }
  | { region: "column"; column: DataGridColumn }
  | { region: "row"; rowIds: string[] };

export type DataGridProps = {
  // ...unchanged

  /** Enable right-click (web) / long-press (native) menus on headers, the row
   *  gutter, and cells. Default `false` — opting in also suppresses the
   *  browser's own menu over the grid. */
  contextMenu?: boolean;

  /** Column actions, from both the header caret and the header context menu.
   *  `insertLeft` / `insertRight` leave the field type to the consumer. */
  onColumnMenuAction?: (columnId: string, action: DataGridColumnAction) => void;

  /** Row actions. `rowIds` is the full selected row span when the pressed row
   *  is inside it, otherwise just that row — so "Delete 5 rows" works. */
  onRowMenuAction?: (rowIds: string[], action: DataGridRowAction) => void;

  /** Add to, reorder, or replace the default entries. Return `[]` to suppress
   *  the menu for that target. */
  onContextMenuEntries?: (
    entries: DropdownListEntry[],
    context: DataGridContextMenuContext,
  ) => DropdownListEntry[];
};
```

### Default menu contents

| Region               | Entries (in order)                                                                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `columnheader`       | Sort ascending · Sort descending · Clear sort _(all three only when `column.sortable !== false`; Clear sort only when `column.sortDirection` is set)_ · — · Insert left · Insert right · Hide field · **Delete field** (`tone: "danger"`) |
| `rowheader` (gutter) | Insert row above · Insert row below · Duplicate · — · Copy · — · **Delete row** / **Delete N rows** (`tone: "danger"`)                                                                                                                    |
| `gridcell`           | Edit _(only when `column.editable !== false`)_ · — · Copy · Cut · Paste · Clear                                                                                                                                                           |

Row entries render only when `onRowMenuAction` is supplied; column entries only
when `onColumnMenuAction` is supplied (matching the existing caret gating).
Copy/Cut/Paste/Clear are web-only — `useDataGridClipboard` reads the OS clipboard
— and are omitted from the native sheet.

## Architecture

### New files

| File                                        | Responsibility                                                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `src/popover/contextMenuModel.ts`           | `ContextMenuProps`, `contextMenuPoint`, `contextMenuTriggerProps`. Pure; no JSX, no RN runtime import, so `node --test` can import it. |
| `src/popover/ContextMenu.web.tsx`           | Point-anchored `DropdownPortal` + `DropdownList`, plus scroll dismissal.                                                               |
| `src/popover/ContextMenu.tsx`               | Native: delegates to `ResponsiveMenu` (bottom sheet).                                                                                  |
| `src/data-grid/dataGridContextMenuModel.ts` | Pure entry _descriptors_ per region + gating rules. No JSX.                                                                            |
| `src/data-grid/dataGridContextSelection.ts` | Pure spreadsheet selection rules (`contextSelectionFor`, `contextRowIds`).                                                             |
| `src/data-grid/dataGridContextMenu.tsx`     | Maps descriptors → `DropdownListEntry[]` with lucide icons and `onPress`.                                                              |
| `src/data-grid/useDataGridContextMenu.ts`   | Owns the single open menu: target, point, entries, open/close.                                                                         |

The pure/JSX split mirrors the family's existing `dataGridSelectionModel.ts`
(pure) vs `dataGridCellContent.tsx` (JSX) boundary. It is not cosmetic: a module
that imports `lucide-react-native` or `react-native` at runtime cannot be
imported by a `node --test` unit test.

### Changed files

`src/dropdown/useDropdownAnchor.ts`, `dropdownPortalModel.ts`,
`DropdownPortal.tsx`, `DropdownPortal.web.tsx`, `index.ts` ·
`src/data-grid/types.ts`, `DataGrid.tsx`, `DataGridBody.tsx`, `DataGridRow.tsx`,
`DataGridCell.tsx`, `DataGridHeader.tsx`, `DataGridColumnMenu.tsx`,
`useDataGridController.ts`, `useDataGridKeyboard.ts`, `DataGridCardStack.tsx`,
`index.ts` · `src/data-grid/README.md`, `src/dropdown/README.md`, root
`README.md` · `src/stories/data-grid.stories.tsx` ·
`scripts/package-smoke-stubs.mjs` · `tests/unit/testIDForwarding.test.ts`.

### Data flow

```
DataGridCell / DataGridRow gutter / DataGridHeader cell
  └─ contextMenuTriggerProps({ isWeb, onOpen })      ← built inline, like webProps
       └─ onContextMenu(target, point)               ← ONE stable callback, threaded
            └─ useDataGridContextMenu.openFor(target, point)
                 ├─ contextSelectionFor(...)  → controller.setSelection(...)   (M4)
                 ├─ buildContextMenuEntries(descriptors, theme, handlers)
                 ├─ onContextMenuEntries?.(entries, context)
                 └─ setState({ open: true, point, label, title, entries })
                      └─ <ContextMenu ... />         ← ONE instance, rendered by DataGrid
```

One menu instance for the whole grid, one stable `onContextMenu` callback
threaded down. This matters: `DataGridRow` is `memo`'d, so a per-row closure
would defeat memoization on every render, and a virtualized grid must not mount
a `DropdownMenu` per cell.

## Key design decisions (resolved forks)

1. **`ContextMenu` lives in `src/popover`, not `src/dropdown` and not a new
   `@firna/ui/context-menu` subpath.** A new subpath would cost a
   `package.json` exports block, a `tests/unit/packageExports.test.ts` entry,
   and three README lists for no conceptual gain. `src/dropdown` was the first
   choice — it is a `DropdownList` in a `DropdownPortal` — but the native build
   must render `ResponsiveMenu`, and `src/popover` already imports
   `src/dropdown` in four files, so hosting it there created a genuinely **new**
   `dropdown ⇄ popover` barrel cycle. (The claim that `src/input` already
   created such a cycle is false: `src/input` imports nothing from
   `src/dropdown`.) `npm run build` and `npm run test:package` do **not** catch
   it — the node consumer resolves `ContextMenu.web`, which never touches
   popover — so the cycle would have shipped undetected to native only.
   `src/popover` is also the better home on the merits: it is the family for
   "anchored on web, bottom sheet on native", which is exactly what this is.

2. **One shared menu instance, not one `DropdownMenu` per target.**
   `DropdownMenu` wraps its trigger in its own anchor `View` and owns its own
   open state. Mounting one per cell in a virtualized grid is untenable, and
   their independent open states would fight the "one menu at a time" model.

3. **Three distinct menus (header / gutter / cell), not one merged menu.** The
   cost is that deleting a row means hitting the ~40px gutter rather than
   right-clicking anywhere in the row. Accepted deliberately; adding a "Delete
   row" descriptor to the cell region later is a one-line change to
   `dataGridContextMenuModel.ts`.

4. **The header context menu and the header caret menu share one builder.** One
   column-action vocabulary, not two that drift.

5. **Opt-in behind `contextMenu` (default `false`).** Suppressing the browser's
   own context menu is a visible behaviour change; existing consumers should not
   get it by upgrading.

6. **Point-anchored menus dismiss on scroll.** `useDropdownDismiss` only watches
   `pointerdown`, so a wheel would leave the menu pointing at a row that has
   moved. The listener is capture-phase on `window` (scroll does not bubble) and
   ignores scrolls originating inside the menu's own `ScrollView`.

7. **`anchorWidthAsMinimum: false` and an explicit `minWidth` are baked into
   `ContextMenu`, not left to callers.** `dropdownPlacement`'s `preferredWidth`
   defaults to `anchor.width`, and `dropdownWidthBounds` treats `anchor.width` as
   a minimum — so a zero-size anchor resolves to a zero-width surface. This is a
   real trap; the component closes it.

8. **The keyboard route reuses `point`, not a second rect API.** `Shift+F10`
   computes `{ x: rect.left, y: rect.bottom }` from the focused cell's registered
   node, so `ContextMenu` keeps a single positioning concept.

---

## Milestones

### M1 — Point anchoring in the dropdown portal ✅

At the end: any `DropdownPortal` caller can position a surface at a virtual rect
instead of a measured element, and every existing caller behaves identically.

- [x] `npm install` and `npx playwright install chromium` (this worktree has no
      `node_modules`; nothing below runs without them).
- [x] `npm run format`. `cargo xtask check` is literally `npm run verify`
      (`xtask/src/check.rs:9`), whose **first** step is
      `prettier --check "**/*.{ts,tsx,js,json,md,yml,yaml}"`, and `.prettierignore`
      does not exclude `plans/` — so unformatted markdown fails the gate before a
      line of code is touched. This file was formatted when it was written; run
      `npm run format` after every edit to it, and keep `npm run format:check` in
      every milestone gate below. Prettier's markdown table formatting is **not
      idempotent** on this file's wide tables — it took three `--write` passes to
      converge, so re-run `format` until `format:check` is clean rather than
      assuming one pass is enough.
- [x] `src/dropdown/useDropdownAnchor.ts`: add a third optional parameter.

      ```ts
      export function useDropdownAnchor(
        anchorRef: RefObject<View | null>,
        open: boolean,
        anchorRect?: DropdownAnchorRect | null,
      ): DropdownAnchorState {
        const viewport = useWindowDimensions();
        const [measured, setMeasured] = useState<DropdownAnchorRect | null>(null);
        // A virtual anchor is supplied by the caller, so there is nothing to
        // measure and nothing to re-measure on scroll: the rect is already in
        // viewport coordinates and the surface is `position: fixed`.
        const isVirtual = anchorRect != null;

        const measure = useCallback(() => {
          anchorRef.current?.measureInWindow((x, y, width, height) => {
            setMeasured({ height, width, x, y });
          });
        }, [anchorRef]);

        useEffect(() => {
          if (!open || isVirtual) {
            setMeasured(null);
            return;
          }
          measure();
          const timer = setTimeout(measure, 0);
          return () => clearTimeout(timer);
        }, [isVirtual, measure, open, viewport.height, viewport.width]);
        // ...existing scroll-follow effect, with `|| isVirtual` added to its
        // early-return guard and `isVirtual` added to its dep array.
        return { anchor: open ? (anchorRect ?? measured) : null, viewport };
      }
      ```

- [x] `src/dropdown/dropdownPortalModel.ts`: relax `anchorRef` to optional and
      add `anchorRect`, with the doc comments from [§ Public API](#public-api).
- [x] `src/dropdown/DropdownPortal.web.tsx`: accept `anchorRect`, and keep
      `useDropdownDismiss` unchanged by substituting a stable fallback ref.

      ```ts
      const fallbackAnchorRef = useRef<View>(null);
      const resolvedAnchorRef = anchorRef ?? fallbackAnchorRef;
      const { anchor, viewport } = useDropdownAnchor(
        resolvedAnchorRef, open, anchorRect,
      );
      useDropdownDismiss({ anchorRef: resolvedAnchorRef, onClose, open, surfaceRef });
      ```

      `dropdownShouldClose` is `nodes.every((node) => !node?.contains(target))`,
      so a permanently-null anchor node never blocks a close — outside-click
      dismissal works with no trigger element.

- [x] `src/dropdown/DropdownPortal.tsx` (native): same `anchorRect` pass-through
      and fallback ref, for API symmetry. The grid does not use this path (native
      uses the sheet), but the prop must not be silently ignored.
- [x] `devWarn` from `src/devWarn.ts` when neither `anchorRef` nor `anchorRect`
      is supplied: `"DropdownPortal needs an anchorRef or an anchorRect."`
- [x] Unit test `tests/unit/dropdownPointAnchor.test.ts` against
      `dropdownPlacement` / `dropdownWidthBounds` directly (both pure, both
      already imported by `tests/unit/dropdown.test.ts` with literal rects): - a zero-size rect at `{x: 100, y: 200}` with `align: "start"`,
      `gutter: 2`, `minWidth: 220`, `anchorWidthAsMinimum: false` places
      `left === 100`, `top === 202`, `width === 220`, `side === "bottom"`; - the same rect near the right edge clamps `left` to
      `viewport.width - width - margin` rather than overflowing; - the same rect near the bottom edge flips to `side === "top"` and sets
      `bottom`; - **the trap:** a zero-size rect with no `minWidth` and
      `anchorWidthAsMinimum` left at its default resolves to `width === 0` —
      pin it so the reason `ContextMenu` sets both is documented in a test.
- [x] `npm run format:check`, `npm run test`, and `npm run typecheck` green.

### M2 — The `ContextMenu` primitive ✅

At the end: `ContextMenu` is exported and usable by anything in the library —
a cursor-anchored menu on web, a bottom sheet on native.

- [x] `src/popover/contextMenuModel.ts` — pure, no JSX, no `react-native`
      runtime import (type-only imports are fine):

      ```ts
      /** Viewport point from a synthetic or native pointer/context event.
       *  RNW sometimes carries the DOM fields at the top level and sometimes only
       *  under `nativeEvent`, so both are read (matching `pointFromEvent` in
       *  `useDataGridDrag.ts:54`). Native long-press reports `pageX/pageY`. */
      export function contextMenuPoint(rawEvent: unknown): DropdownPoint | null {
        const event = rawEvent as {
          clientX?: number; clientY?: number;
          nativeEvent?: {
            clientX?: number; clientY?: number;
            pageX?: number; pageY?: number;
          };
        };
        const x = event.clientX ?? event.nativeEvent?.clientX
          ?? event.nativeEvent?.pageX;
        const y = event.clientY ?? event.nativeEvent?.clientY
          ?? event.nativeEvent?.pageY;
        return typeof x === "number" && typeof y === "number" ? { x, y } : null;
      }

      export function contextMenuTriggerProps({ isWeb, onOpen }: {
        isWeb: boolean;
        onOpen: (point: DropdownPoint | null) => void;
      }): Record<string, unknown> {
        return isWeb
          ? {
              onContextMenu: (event: unknown) => {
                (event as { preventDefault?: () => void }).preventDefault?.();
                onOpen(contextMenuPoint(event));
              },
            }
          : { onLongPress: (event: unknown) => onOpen(contextMenuPoint(event)) };
      }
      ```

      `ContextMenuProps` is declared here so both platform builds share it.

- [x] `src/popover/ContextMenu.web.tsx`:

      ```tsx
      export function ContextMenu({
        accessibilityLabel, entries, maxHeight = 320, minWidth = 220,
        onClose, open, point, testID, zIndex,
      }: ContextMenuProps) {
        const contentRef = useRef<View>(null);
        const anchorRect = point
          ? { height: 0, width: 0, x: point.x, y: point.y }
          : null;
        const isOpen = open && anchorRect !== null;
        const menuEntries = useMemo(
          () => closeDropdownMenuEntries(entries, onClose, true),
          [entries, onClose],
        );
        // There is no trigger to focus, so keyboard navigation cannot come from
        // DropdownList's own ScrollView handler. This hook's document-level
        // capture listener drives a controlled activeId instead — the same
        // reasoning ResponsiveMenu documents at its top.
        const { activeId, setActiveId } = useDropdownSelectorNavigation({
          entries: menuEntries,
          interactive: hasSelectableDropdownMenuEntry(menuEntries),
          onClose, onOpen: noop, open: isOpen, resetOnOpen: true,
        });
        // Dismiss on scroll: useDropdownDismiss only watches pointerdown, so a
        // wheel would leave the menu pinned to a point that has moved. Capture
        // phase because scroll does not bubble; scrolls inside the menu's own
        // list are ignored.
        useEffect(() => {
          if (!isOpen || typeof window === "undefined") return;
          const handleScroll = (event: Event) => {
            const node = contentRef.current as unknown as {
              contains?: (n: Node) => boolean;
            } | null;
            const target = event.target;
            if (target instanceof Node && node?.contains?.(target)) return;
            onClose();
          };
          window.addEventListener("scroll", handleScroll, true);
          return () => window.removeEventListener("scroll", handleScroll, true);
        }, [isOpen, onClose]);

        return (
          <DropdownPortal
            align="start"
            anchorRect={anchorRect}
            anchorWidthAsMinimum={false}
            gutter={2}
            maxHeight={maxHeight}
            minWidth={minWidth}
            onClose={onClose}
            open={isOpen}
            zIndex={zIndex}
          >
            {(placement) => (
              <View ref={contentRef} testID={testID}>
                <DropdownList
                  activeId={activeId}
                  entries={menuEntries}
                  highlightVariant="ring"
                  label={accessibilityLabel}
                  listRole="menu"
                  maxHeight={placement.maxHeight}
                  onActiveIdChange={setActiveId}
                  onClose={onClose}
                />
              </View>
            )}
          </DropdownPortal>
        );
      }
      ```

      `highlightVariant="ring"` is mandatory, not stylistic: the default solid
      fill inverts library-owned row text to white
      (`src/data-grid/README.md:262-265`).

- [x] `src/popover/ContextMenu.tsx` (native) — same props, sheet surface:

      ```tsx
      export function ContextMenu({
        accessibilityLabel, entries, maxHeight = 320, onClose, open, testID,
        title, zIndex,
      }: ContextMenuProps) {
        // `ResponsivePopover` ignores `anchorRef` on native and renders a Sheet,
        // so this ref is never measured. `point` is unused for the same reason.
        const anchorRef = useRef<View>(null);
        return (
          <ResponsiveMenu
            anchorRef={anchorRef}
            entries={entries}
            highlightVariant="ring"
            label={accessibilityLabel}
            maxHeight={maxHeight}
            onClose={onClose}
            open={open}
            testID={testID}
            title={title}
            zIndex={zIndex}
          />
        );
      }
      ```

      This makes `src/dropdown` import from `src/popover`, which today imports
      from `src/dropdown`. Verify no cycle breaks the build (`npm run build` +
      `npm run test:package`); if it does, move both `ContextMenu` builds to
      `src/popover` and re-export from `src/dropdown/index.ts`.

- [x] `src/dropdown/index.ts`: `export * from "./ContextMenu";` and
      `export * from "./contextMenuModel";`.
- [x] `tests/unit/testIDForwarding.test.ts`: add
      `dropdown/ContextMenu.tsx` and `dropdown/ContextMenu.web.tsx` to
      `FORWARDING_FILES`, and register `dropdown/contextMenuModel.ts` as their
      shared type file in the `sharedTypeFiles` map (the `sheet/types.ts`
      precedent) since `testID?: string` is declared there.
- [x] Unit test `tests/unit/contextMenu.test.ts` (imports only
      `contextMenuModel.ts`, so `node --test` can load it): - `contextMenuPoint` reads top-level `clientX/clientY`; - falls back to `nativeEvent.clientX/clientY`; - falls back to `nativeEvent.pageX/pageY` (the native long-press shape); - returns `null` when neither is present; - `contextMenuTriggerProps({ isWeb: true, ... })` returns an
      `onContextMenu` that calls `preventDefault` and reports the point, and
      **no** `onLongPress` and **no** `onPress` (a plain tap is never hijacked
      — the contract `tests/unit/dropdownMenu.test.ts:115-124` already pins for
      `DropdownMenu`); - `contextMenuTriggerProps({ isWeb: false, ... })` returns `onLongPress`
      and no `onContextMenu`.
- [x] `npm run format:check`, `npm run test`, `npm run typecheck`,
      `npm run build`, `npm run test:package` green.

### M3 — One column-action vocabulary and the entry builders ✅

At the end: the header caret menu renders from the shared builder and gains
Insert left / Insert right, with no context menu wired yet — the grid is fully
working and visibly improved on its own.

- [x] `src/data-grid/types.ts`: extend `DataGridColumnAction` with
      `insertLeft` / `insertRight`; add `DataGridRowAction`,
      `DataGridContextMenuTarget`, `DataGridContextMenuContext`.
- [x] `src/data-grid/dataGridContextMenuModel.ts` — pure descriptors:

      ```ts
      export type DataGridMenuDescriptor =
        | { kind: "divider"; id: string }
        | {
            action: string; danger?: boolean; icon: string; id: string;
            kind: "item"; label: string;
          };

      export function columnMenuDescriptors(column: {
        sortDirection?: "asc" | "desc" | null;
        sortable?: boolean;
      }): DataGridMenuDescriptor[];

      export function rowMenuDescriptors(options: {
        rowCount: number;   // how many rows the action will apply to
        web: boolean;       // Copy is web-only
      }): DataGridMenuDescriptor[];

      export function cellMenuDescriptors(options: {
        editable: boolean;
        web: boolean;
      }): DataGridMenuDescriptor[];
      ```

      `rowMenuDescriptors({ rowCount: 5 })` labels the delete row
      `"Delete 5 rows"`; `rowCount: 1` gives `"Delete row"`. `icon` is a string
      key resolved to a component in the `.tsx` layer, so this module stays free
      of `lucide-react-native`.

- [x] `src/data-grid/dataGridContextMenu.tsx`: `MENU_ICONS`, a
      `Record<string, LucideIcon>`, plus
      `buildMenuEntries(descriptors, theme, onAction): DropdownListEntry[]`
      mapping `danger` to `tone: "danger"` and a `theme.colors.roseDeep` glyph
      (matching `DataGridColumnMenu.tsx:88`), everything else to
      `theme.colors.muted`.
      Icons: `ArrowUpAZ`, `ArrowDownAZ`, `X`, `ArrowLeftToLine`,
      `ArrowRightToLine`, `EyeOff`, `Trash2`, `ArrowUpToLine`,
      `ArrowDownToLine`, `CopyPlus`, `Copy`, `Scissors`, `ClipboardPaste`,
      `Eraser`, `Pencil`.
- [x] `scripts/package-smoke-stubs.mjs`: add the seven icons not already stubbed
      — `ArrowDownToLine`, `ArrowUpToLine`, `ClipboardPaste`, `Copy`, `CopyPlus`,
      `Eraser`, `Pencil` — to the alphabetical `export const X = Icon;` list.
      (`ArrowLeftToLine`, `ArrowRightToLine`, `Scissors` are already there;
      `ArrowUpAZ`, `ArrowDownAZ`, `EyeOff`, `Trash2`, `X` are already in use.)
      A missing stub fails `npm run test:package`, and it has caught this exact
      gap three times before — see `plans/charts-component-family.md:265-267`.
- [x] `src/data-grid/DataGridColumnMenu.tsx`: replace the inline `entries` array
      with `buildMenuEntries(columnMenuDescriptors(column), theme, onAction)`.
      The caret menu's rendered output must be unchanged except for the two new
      Insert rows.
- [x] `src/data-grid/README.md`: document `insertLeft` / `insertRight` in the
      "Column menus" section.
- [x] Unit test `tests/unit/dataGridContextMenuModel.test.ts`: - a sortable, unsorted column yields Sort asc, Sort desc, divider, Insert
      left, Insert right, Hide, Delete — and **no** Clear sort; - `sortDirection: "asc"` inserts Clear sort; - `sortable: false` drops all three sort rows _and_ their trailing divider
      (no leading divider on the rendered menu); - exactly one descriptor is `danger` in each region; - `rowMenuDescriptors({ rowCount: 5, web: true })` labels the delete
      `"Delete 5 rows"`; `rowCount: 1` gives `"Delete row"`; - `web: false` omits Copy from the row menu and Copy/Cut/Paste from the
      cell menu; - `cellMenuDescriptors({ editable: false })` omits Edit **and** does not
      leave a leading divider.
- [x] `npm run format:check`, `npm run test`, `npm run typecheck`,
      `npm run test:package` green.
- [x] Storybook: the existing `FullFeatured` story ("Column menu, add column &
      row") shows the two new caret rows.

### M4 — Wire the three regions on web ✅

At the end: right-clicking a header, gutter, or cell opens the right menu at the
cursor, with spreadsheet selection semantics.

- [x] **Fix the latent right-click editor bug first.**
      `src/data-grid/DataGridCell.tsx:171-195` runs its 350ms double-press check
      and its active-select-cell check _before_ any button test — the
      `button !== 0` bail lives downstream in `useDataGridDrag.ts:253`. So a
      right-click on an already-active `singleSelect` cell opens the editor
      today, and two right-clicks within 350ms open it on any cell. Once a
      context menu is attached, both would fire the editor _and_ the menu. Gate
      the handler:

      ```ts
      onPointerDown: (event: unknown) => {
        // Secondary buttons open the context menu; they must not start a drag,
        // count toward the double-press timer, or open an editor.
        const button = (event as { button?: number }).button
          ?? (event as { nativeEvent?: { button?: number } }).nativeEvent?.button;
        if (button !== undefined && button !== 0) return;
        // ...existing body unchanged
      }
      ```

      Write the regression test before the fix: a source assertion in
      `tests/unit/dataGridContextMenu.test.ts` that `DataGridCell.tsx` bails on a
      non-zero button *before* `lastDownRef.current = now`. (This is the family's
      established shape for behaviour a pure test cannot reach —
      `tests/unit/table.test.ts` and `dropdownSource.test.ts` both do it.) The
      real behavioural coverage is the browser test below.

- [x] `src/data-grid/dataGridContextSelection.ts` — pure:

      ```ts
      /** Spreadsheet rule for cells: a press inside the current selection
       *  keeps it, a press outside collapses to the pressed cell. Rows and
       *  columns always return `null` — see M8. */
      export function contextSelectionFor(args: {
        columnIds: readonly string[];
        ref: DataGridCellRef;
        region: "cell" | "column" | "row";
        rowIds: readonly string[];
        selection: DataGridSelection;
      }): DataGridSelection | null;

      /** The row ids a row-region action applies to: the full-width selected row
       *  span when it contains `rowId`, otherwise just `[rowId]`. */
      export function contextRowIds(args: {
        columnIds: readonly string[];
        rowId: string;
        rowIds: readonly string[];
        selection: DataGridSelection;
      }): string[];
      ```

      Built on `rangeRect` / `rectContains` / `singleCell` from
      `dataGridSelectionModel.ts`. A row counts as "covered" only when the rect
      spans it *and* is full-width (`minCol === 0 && maxCol === columnIds.length - 1`);
      a column, only when the rect spans it and is full-height.

- [x] `src/data-grid/useDataGridContextMenu.ts`: owns
      `{ target, point }` state, resolves entries for the current target, applies
      `onContextMenuEntries`, and exposes a **stable**
      `onContextMenu(target, point)`. Returns `{ close, entries, label, open,
point, title }` for `DataGrid` to spread onto one `<ContextMenu>`.
      An `onContextMenuEntries` that returns `[]` leaves the menu closed.
      Cell-region handlers come from the existing
      `useDataGridClipboard()` return value plus `controller.requestEdit`; no new
      callbacks.
- [x] **Gate the grid's own key handler while a menu is open.** Nothing moves DOM
      focus when the menu opens (`DropdownPortal.web.tsx` is non-modal;
      `DropdownList` never focuses itself), so the cell keeps focus and its
      `onKeyDown` — `controller.handleCellKeyDown` — keeps firing.
      `useDropdownSelectorNavigation` only calls `stopPropagation()` when it
      handled the key (`useDropdownSelectorNavigation.ts:122-126`), and
      `dropdownKeyAction` recognises only ArrowDown / ArrowUp / Enter / Escape /
      Space (`dropdownNavigation.ts:22-28`). **Every other key still reaches the
      grid.** With a menu open that means `Delete` / `Backspace` runs
      `onClearSelection()` and wipes the selected cells under the menu
      (`useDataGridKeyboard.ts:143-147`), and `ArrowLeft` / `ArrowRight` /
      `Home` / `End` / `Tab` pass `isGridNavigationKey`
      (`dataGridKeyboardModel.ts:104-114`) and move the selection while the menu
      stays pinned to a stale point.

      Thread `useDataGridContextMenu`'s `open` flag through
      `useDataGridController` into `useDataGridKeyboard` as
      `contextMenuOpen: boolean`, and return from `handleCellKeyDown`
      immediately while it is true — **without** calling `preventDefault()` or
      `stopPropagation()`, so the nav hook and the escape layer keep working:

      ```ts
      const handleCellKeyDown = useCallback((raw: unknown) => {
        // A context menu owns the keyboard while it is open: its navigation
        // runs on a document-level listener that only stops propagation for the
        // keys it handles, so anything else would otherwise still clear cells
        // or move the selection under the open menu.
        if (contextMenuOpen) return;
        const event = raw as GridKeyEvent;
        // ...existing body unchanged
      }, [contextMenuOpen, /* ...existing deps */]);
      ```

      Do **not** solve this by moving focus into the menu surface: that would
      break the roving tab stop and the Escape-returns-to-cell behaviour M5
      relies on.

- [x] Thread one stable `onContextMenu?: (target, point) => void` through
      `DataGrid.tsx` → `DataGridHeader.tsx` (header cells) and
      `DataGrid.tsx` → `DataGridBody.tsx` → `DataGridRow.tsx` → `DataGridCell.tsx`.
      Each host builds its own gesture props inline next to its existing
      `webProps`, exactly as `DataGridHeader.tsx:95-112` already does, guarded by
      `isInteractiveDragTarget(event)` so a right-click on the caret button or
      the expand icon does not also open the region menu.
      **Do not** pass a per-row or per-cell closure: `DataGridRow` is `memo`'d.
- [x] `DataGrid.tsx`: add the `contextMenu`, `onRowMenuAction`, and
      `onContextMenuEntries` props; render one `<ContextMenu>` after
      `<DataGridMarquee>`; pass `onContextMenu` only when `contextMenu` is true.
- [x] Unit test `tests/unit/dataGridContextSelection.test.ts`: - cell inside the current rect → `null` (selection preserved); - cell outside → collapses to `singleCell(ref)`; - row inside a full-width multi-row rect → `null`; - row inside a rect that spans the rows but **not** all columns → selects
      the whole row (the rect does not "cover" it); - row outside → selects the whole row; - column, both transposed cases; - an empty selection (`{anchor: null, focus: null}`) always collapses; - a selection whose endpoints reference a hidden/removed column
      (`rangeRect` returns `null`) always collapses rather than throwing; - `contextRowIds` returns the full span for a covered row and `[rowId]`
      otherwise.
- [x] Browser tests in `tests/browser/data-grid.spec.ts` against a new
      `context-menus` story: - right-click a column header → `role="menu"` visible, containing
      "Delete field"; - the menu's bounding box left/top is within a few px of the click point
      (this is the whole point of M1 — assert it, do not assume it); - right-click a cell outside the current selection → that cell becomes the
      only selected cell; - drag-select a 3×2 range, right-click **inside** it → the range still has
      `aria-selected="true"` on all six cells; - right-click the gutter of a row inside a multi-row selection → the menu
      reads "Delete 5 rows"; - Escape closes; a click outside closes; scrolling the grid body closes; - right-click a `singleSelect` cell that is already active → the menu opens
      and **no editor appears** (the M4 bug fix); - left-click still selects and double-click still edits (no regression); - **with the menu open, `Delete` leaves every cell value unchanged**, and
      `ArrowLeft` / `Home` / `Tab` do not move the grid selection (the
      key-gating fix above — this is destructive if it regresses).
- [x] Add a unit pin for the gate in `tests/unit/dataGridContextMenu.test.ts`:
      a source assertion that `handleCellKeyDown` returns on `contextMenuOpen`
      before reading `event.key` (the same shape as the `DataGridCell` button
      assertion, and the family's established route for hook-resident logic —
      see `tests/unit/dropdownSource.test.ts` and `dragSelect.test.ts:212`).
- [x] `npm run format`, `npm run test`, `npm run typecheck`,
      `npm run test:browser` green.

### M5 — Keyboard route and accessibility ✅

At the end: the menu is reachable without a mouse, so it passes WCAG 2.1.1.

- [x] Widen `registerCellNode`'s parameter type in
      `src/data-grid/useDataGridController.ts:129` from `{ focus?: () => void }`
      to `DataGridCellNode["node"]` — the stored type already declares
      `getBoundingClientRect` (`dataGridDragDom.ts:12-19`), only the registration
      signature narrows it away.
- [x] Add `contextMenuPointForCell(ref): DropdownPoint | null` to the controller,
      reading the registered node's `getBoundingClientRect()` and returning
      `{ x: rect.left, y: rect.bottom }` so the menu opens under the focused cell.
      Returns `null` off-web or when the node is unregistered.
- [x] `src/data-grid/useDataGridKeyboard.ts`: add
      `onContextMenuKey?: (ref: DataGridCellRef) => void` to
      `UseDataGridKeyboardOptions` and handle it in `handleCellKeyDown` —
      `key === "ContextMenu"`, or `shiftKey && key === "F10"` — reading both
      `event.key` and `event.nativeEvent?.key` like every other branch there, and
      calling `preventDefault()`. Place the branch **before** the
      `isGridNavigationKey` movement check, but **after** the `contextMenuOpen`
      early return added in M4 — pressing the context-menu key again while the
      menu is open must not reopen it.
- [x] Wire it to open the **cell** menu for the active cell at that point.
- [x] Focus handling: `DropdownPortal.web.tsx` is non-modal and does not move
      focus, and `useDropdownSelectorNavigation`'s listener is document-level, so
      arrows and Enter work with focus still on the cell. Confirm the cell keeps
      DOM focus while the menu is open, and that Escape returns control to it
      with the roving tab stop intact. The M4 `contextMenuOpen` gate is what
      makes this safe — without it the still-focused cell would also act on
      every key the menu's navigation does not consume.
- [x] Extend `tests/unit/dataGridKeyboard.test.ts`: `Shift+F10` and the
      `ContextMenu` key both invoke `onContextMenuKey` with the active cell and
      call `preventDefault`; a bare `F10` does not; the branch does not swallow
      arrow keys.
- [x] Browser test: focus a cell, press `Shift+F10` → the menu opens; `ArrowDown`
      moves the active row; `Enter` fires the action; `Escape` closes and focus
      is back on the cell.
- [x] `src/data-grid/README.md`: add `Shift+F10` / `ContextMenu` to the keyboard
      table (`README.md:96-110`) — the family's convention is doc-and-code parity.
- [x] `docs/accessibility-manual-checklist.md`: add the grid context menu to the
      composite-widget list if it is not covered by the existing menu entry.
- [x] `npm run format:check`, `npm run test`, `npm run test:browser` green.

### M6 — Native long-press and the card stack ✅

At the end: the same menus are reachable by long-press on native, as a bottom
sheet.

- [x] The gesture props from `contextMenuTriggerProps` already resolve to
      `onLongPress` off-web; verify each host actually forwards it —
      `DataGridCell` renders a `Pressable` (fine), but the header cell and the
      row gutter are plain `View`s, which do **not** accept `onLongPress`. Wrap
      each in a `Pressable` on native only, or attach the gesture to the existing
      `Pressable` where one is present. Do not change the web DOM.
- [x] `src/data-grid/DataGridCardStack.tsx`: long-press a card → the **row**
      menu, titled with the card's primary field. This is the only menu reachable
      in the responsive card layout, so it must include the row actions.
- [x] Set `ContextMenu`'s `title` per region so the sheet header reads
      `"Status field"` / `"Row 4"` / the column label — a sheet has no pointer
      context to imply what it acts on.
- [x] Omit Copy / Cut / Paste on native (`web: false` in the descriptor
      builders): `useDataGridClipboard` reads the OS clipboard and is web-only
      (`src/data-grid/README.md:118-127`).
- [ ] **Not done: the on-device native pass.** Long-press timing, sheet
      dismissal, and VoiceOver/TalkBack behaviour need a real device — the web
      Storybook only ever renders the `.web` code path, so none of the native
      branches above are exercised by the gate. This joins
      the existing deferred native item in
      [Data Grid component](data-grid-component.md) M7 and the manual pass in
      [WCAG 2.1 AA Accessibility](wcag-2-1-accessibility.md) §7.
- [x] `npm run format:check`, `npm run test`, `npm run typecheck`,
      `npm run build` green.

### M7 — Stories, docs, export, and the verify gate ✅

At the end: the feature is documented, swept by axe, and the full gate is green.

- [x] `src/stories/data-grid.stories.tsx`: add `ContextMenus`
      (`name: "Context menus"`, story id `datagrid-examples--context-menus`) — a
      stateful example wiring `contextMenu`, `onColumnMenuAction`,
      `onRowMenuAction`, and an `onContextMenuEntries` that appends one custom
      row, so the extension point is demonstrated, not just documented.
- [x] Add `ContextMenuOpen` (`name: "Context menu (open)"`, story id
      `datagrid-examples--context-menu-open`) rendering the menu **already
      open**. The axe sweep is a static scanner — it only sees the rendered DOM
      (`tests/browser/a11y.spec.ts:7-27`), so without this story `role="menu"`
      and its rows are never scanned. Discovery is automatic from Storybook's
      `/index.json`; no list to update.
- [x] Add a `Dark` variant if the open-menu story needs one to pin the danger
      row's contrast under `darkSharedUiTheme`.
- [x] `src/popover/README.md`: a `ContextMenu` section — the point anchor, the
      `minWidth` requirement, scroll dismissal, the native sheet, and how it
      differs from `DropdownMenu trigger="contextMenu"`.
- [x] `src/data-grid/README.md`: a "Context menus" section covering the three
      regions, the default entries, `onRowMenuAction`, `onContextMenuEntries`,
      the spreadsheet selection rule, the keyboard route, and the native sheet.
      Add the new files to the "Key code" index.
- [x] Root `README.md`: no new subpath, so no exports list change — but confirm
      `tests/unit/packageExports.test.ts` still passes unchanged.
- [x] `npm run verify` green (record the unit and browser test counts) and
      `cargo xtask check` green.
- [x] `plans/README.md`: move this plan to **Completed** with a prose summary of
      what shipped and what was deferred.

### M8 — Stop a right-click from selecting the row or column ✅

Post-delivery change. Shipped behaviour promoted a gutter press to the whole
row and a header press to the whole column when the gesture landed outside the
current selection. In use that read as destructive: reaching for a menu threw
away a carefully built selection, and the promotion bought nothing, because
`contextRowIds` already reads the pressed row directly.

At the end: opening a gutter or header menu never touches the selection, and
the cell rule is unchanged.

- [x] `contextSelectionFor` returns `null` for the `row` and `column` regions.
      `wholeRow` / `wholeColumn` deleted with it.
- [x] Cells keep the spreadsheet rule. The cell menu's Copy / Cut / Clear act on
      the selection, so a menu opened on a cell outside it would otherwise
      operate on something else entirely, off screen — that one has to move.
- [x] `contextRowIds` untouched, so a row menu opened inside a five-row
      selection still says "Delete 5 rows" and one opened outside it still acts
      on the row under the pointer.
- [x] Unit tests rewritten as two rule-shaped cases — "a row press never changes
      the selection" and the column equivalent — each covering inside-full-span,
      inside-partial-range, outside, and empty-selection.
- [x] Browser test `right-clicking a gutter or header leaves the selection
alone`: build a 2×2 range, right-click a distant gutter cell and then a
      header, assert the four cells stay selected both times.
- [x] `src/data-grid/README.md` selection paragraph rewritten.
- [x] `npm run verify` green.

---

## Testing

**Unit** (`node --test` via `tsx`; every module under test must be free of
`react-native` and `lucide-react-native` runtime imports):

| File                                             | Pins                                                                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/unit/dropdownPointAnchor.test.ts`         | Zero-size-rect placement, edge clamping, bottom flip, and the zero-width trap that forces `minWidth`.                                                        |
| `tests/unit/contextMenu.test.ts`                 | Point extraction across all three event shapes; web vs native trigger props; that a plain tap is never hijacked.                                             |
| `tests/unit/dataGridContextMenuModel.test.ts`    | Per-region descriptors, gating by `sortable` / `sortDirection` / `editable` / `web`, pluralised delete labels, no orphaned dividers, exactly one danger row. |
| `tests/unit/dataGridContextSelection.test.ts`    | The full inside/outside matrix per region, plus empty and stale-selection cases.                                                                             |
| `tests/unit/dataGridKeyboard.test.ts` (extended) | `Shift+F10` / `ContextMenu` key; bare `F10` ignored; arrows unaffected.                                                                                      |
| `tests/unit/dataGridContextMenu.test.ts`         | Source assertion: `DataGridCell.tsx` bails on a non-primary button before the double-press timer.                                                            |
| `tests/unit/testIDForwarding.test.ts` (extended) | Both `ContextMenu` builds forward `testID`.                                                                                                                  |

**Browser** (`tests/browser/data-grid.spec.ts`) carries what a source grep and a
pure test cannot: that the menu actually lands at the cursor (a measured bounding
box, not an assumption), that selection is preserved or collapsed correctly under
a real drag, that Escape / outside-click / scroll dismiss, that `Shift+F10` opens
and Enter fires, and that the editor no longer opens on a right-click.

**Axe** sweeps the new open-menu story automatically. `axe-baseline.json` is
currently `{}` — any new WCAG A/AA violation fails the gate, and no baseline
entry should be added for this work.

## Open questions

1. **Should `DropdownMenu trigger="contextMenu"` switch to pointer anchoring
   once M1 lands?** It currently anchors to the trigger box, so the library would
   ship two context-menu behaviours. `AGENTS.md` states breaking changes are
   acceptable while the project is pre-production, and the existing behaviour is
   arguably a bug. Deferring it is safe; the inconsistency is the cost.
   _(Recommended: yes, as a follow-up plan rather than scope creep here — it
   touches `sharedExamples.tsx:470-487`, `dropdown.stories.tsx:227-231`, and
   `tests/browser/storybook.spec.ts:315-329`.)_
2. **Should the cell menu carry a "Delete row" row after all?** The three-menu
   split means row deletion requires hitting the ~40px gutter. One descriptor
   would fix it at the cost of the clean separation.
   _(Recommended: ship as designed, revisit after using it.)_
3. **`insertLeft` / `insertRight` emit no field type**, unlike `onAddColumn(fieldType)`.
   The consumer picks. An alternative is a submenu of field types, which the
   dropdown stack cannot express today. _(Recommended: emit the action.)_

## Risks & mitigations

| Risk                                                                                                                                          | Mitigation                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zero-size anchor resolves to a zero-width surface (`preferredWidth` defaults to `anchor.width`).                                              | `ContextMenu` hard-codes `anchorWidthAsMinimum={false}` + a `minWidth` default; M1 pins the failing case in a test so the reason survives.                                                     |
| `src/dropdown` importing `src/popover` creates a module cycle.                                                                                | Caught by `npm run build` + `npm run test:package` in M2; documented fallback is to host both `ContextMenu` builds in `src/popover` and re-export.                                             |
| Scroll dismissal also fires when scrolling the menu's own list.                                                                               | The handler ignores events whose target is inside the menu content ref; the browser test scrolls the grid body, not the menu.                                                                  |
| Per-row/per-cell closures defeat `DataGridRow`'s `memo`.                                                                                      | One stable `onContextMenu(target, point)` threaded down; hosts build gesture props inline beside their existing `webProps`.                                                                    |
| A right-click on the caret button or expand icon opens two menus.                                                                             | `isInteractiveDragTarget(event)` guards the region gesture, the same guard the drag paths already use.                                                                                         |
| Missing lucide stubs fail `npm run test:package`.                                                                                             | M3 lists the exact seven additions; this gate has caught the same gap three times before.                                                                                                      |
| Keys the menu's navigation does not consume still reach the focused cell (Delete clears cells, arrows move the selection under an open menu). | The M4 `contextMenuOpen` early return in `handleCellKeyDown`, pinned by a source assertion and a browser test that presses Delete with the menu open.                                          |
| The plan's own markdown fails `prettier --check`, the first step of `cargo xtask check`.                                                      | `npm run format` is the second step of M1, and `npm run format:check` is in every milestone gate.                                                                                              |
| Escape ordering with a cell editor open.                                                                                                      | `escapeLayer` runs only the top-most layer; the browser test asserts Escape closes the menu first and leaves the editor alone (the risk already logged at `plans/data-grid-component.md:435`). |
| Native `View`s do not accept `onLongPress`.                                                                                                   | M6 wraps the header cell and gutter in a native-only `Pressable`; web DOM unchanged.                                                                                                           |

## References

- [Data Grid component](data-grid-component.md) — the family's original plan; the closed `DataGridColumnAction` union at `:191-196`, the menu constraints at `:88-89` / `:438`, the escape-ordering risk at `:435`.
- [`src/data-grid/README.md`](../src/data-grid/README.md) — keyboard table, pointer drag, clipboard semantics, the `highlightVariant="ring"` text-inversion limitation.
- [`src/dropdown/README.md`](../src/dropdown/README.md) — trigger modes (`:253-284`), `DropdownWebLayer` (`:390`).
- [`src/popover/ResponsiveMenu.tsx`](../src/popover/ResponsiveMenu.tsx) — the definitive explanation of why a trigger-less menu needs `useDropdownSelectorNavigation`.
- [`src/rich-text/SlashMenu.web.tsx`](../src/rich-text/SlashMenu.web.tsx) and [`useCaretAnchor.web.ts`](../src/rich-text/useCaretAnchor.web.ts) — the existing virtual-rect precedent M1 generalises.
- [WCAG 2.1 AA Accessibility](wcag-2-1-accessibility.md) — §7 manual release pass; the `2.1.1` gesture-trigger item at `:254`.
- [`docs/protocol/shared-ui-components.md`](../docs/protocol/shared-ui-components.md) — Dropdown Contract (`:598-645`).

## Verification and review

Per `AGENTS.md`, after each milestone's checks pass: `git add -A`, commit with
Conventional Commits (`feat(data-grid): …`, `feat(dropdown): …`), push the
branch, then run `cargo xtask review` so an AI reviewer checks the local diff
against `origin/main`. Findings are reported back numbered, with severity,
impact, and lettered options — not auto-fixed.

The release is a minor through release-please (`feat` commits); nothing here is a
breaking change to a shipped API — `anchorRef` is only relaxed, never removed.
Do not `npm publish` by hand.
