# Disable the focus ring

Add a first-class way to **turn off the shared focus glow** — both globally (a
theme flag) and per instance (a public `disableFocusRing` prop on every control
that renders one). Everything routes through the single choke point in
[`src/focusRing.ts`](../src/focusRing.ts) so the core change is tiny; the bulk of
the work is threading one prop through the ~21 consuming components.

**Status:** M1–M5 delivered. Public prop chosen: `disableFocusRing?: boolean`
(binary). Global `theme.focusRing` switch + per-instance `disableFocusRing` on
every ring-bearer (Button, Switch, RadioCard, Input/Textarea/InputFrame,
LabelInfo, SegmentedControl, DropdownSelector, List, ListItem, Table, Kanban,
Heatmap, CalendarMonth, DateWheel, WebModalFrame, DataGrid, DragSelectable
target option, RichTextEditor, SortableList, WorkflowNode, WorkflowEdge,
WorkflowBuilder). Family B sites gate on `ringEnabled`; disabled rings restore
the UA outline (M4). Unit tests + a `Focus ring/Examples` story added.
`npm run verify` green (format, 526 unit tests, typecheck, build, package smoke,
Storybook build, 171 browser tests incl. the axe WCAG 2.1 A/AA sweep).
**Deferred:** threading `disableFocusRing`
through the `DateField` / `DateRangeField` composites down to their trigger +
calendar (the ring-bearing `CalendarMonth` / `DateWheel` / `InputFrame` already
carry the prop, and the theme flag covers the global case) — see Open questions.

---

## Background — how the ring works today

The system has one hook, `useFocusRing(options)`
([`src/focusRing.ts`](../src/focusRing.ts) L99–114), returning
`{ focusRingStyle, focused, onBlur, onFocus }`. `focusRingStyle` is a web-only
`box-shadow` glow (native returns `{}`). Options are `{ color, width, offset,
alpha }` — **none turns the glow off**. There is no theme toggle either
(`SharedUiTheme`, [`src/theme.tsx`](../src/theme.tsx) L73–77, has no focus key).

Every consumer applies the ring with the same idiom:

```ts
style={[ base, focus.focused ? focus.focusRingStyle : null ]}
```

But there are **two families**, and they must be handled differently:

- **Family A — read the hook's `focusRingStyle` inline.** If the hook returns
  `{}` when disabled, the existing gate already renders nothing. **These need no
  gate edit** — only the call site changes from `useFocusRing()` to
  `useFocusRing({ disabled })`.
- **Family B — gate on `focus.focused` but paint a _local stylesheet_ glow**
  (e.g. `styles.rowFocused`), never reading `focusRingStyle`. Emptying the hook
  style does **not** reach these; each needs a one-token gate edit
  (`&& focus.ringEnabled`).

---

## Design

### Core primitive (one hook + one theme flag)

In [`src/focusRing.ts`](../src/focusRing.ts):

1. Add `disabled?: boolean` to `FocusRingOptions` (L22–41).
2. In `useFocusRing` (L99–114):
   ```ts
   const theme = useSharedUiTheme();
   const enabled = !options.disabled && theme.focusRing !== false;
   const focusRingStyle = useMemo(
     () =>
       enabled ? focusRingStyleFor({ color, width, offset, alpha }) : EMPTY,
     [enabled, color, width, offset, alpha],
   );
   return { focusRingStyle, ringEnabled: enabled, focused, onBlur, onFocus };
   ```
   `EMPTY` is a module-level frozen `{}` so the returned identity is stable.

In [`src/theme.tsx`](../src/theme.tsx):

3. Add `focusRing: boolean` to `SharedUiTheme` (L73–77) and
   `focusRing?: boolean` to `SharedUiThemeOverrides` (L79–83).
4. Add `focusRing: true` to the `defaultSharedUiTheme` literal (L85–122).
5. Add `focusRing: overrides.focusRing ?? defaultSharedUiTheme.focusRing` to
   `createSharedUiTheme` (L129–133). **`junoSharedUiTheme` (L155) is built via
   `createSharedUiTheme`, so it inherits automatically** — no separate edit.

This single change gives the **global kill switch** for all of Family A and
backs the per-instance prop. Family B is finished in M2.

### Public per-instance prop

Each control that renders a ring gains `disableFocusRing?: boolean` (default
`undefined`/`false`), forwarded straight into its existing `useFocusRing({
disabled })` call (Family A) or AND-ed into the Family-B gate. Prop-name
rationale: reads as the literal ask ("disable the focus ring") and matches the
existing negative-boolean convention (`disabled`, `showCloseButton`). A
tri-state `focusRing?: boolean` (undefined = inherit theme) is the alternative —
decide in M1 before the rollout; the hook primitive supports either.

---

## Component inventory

**Every component that renders a ring is listed.** `L###` = the exact
apply/gate site verified in the tree at plan time.

### Family A — inline `focusRingStyle` (prop → `useFocusRing({ disabled })`, no gate edit)

| #   | Component                   | File                                        | Site                | Threading                                                                                                                                 |
| --- | --------------------------- | ------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Button                      | `src/button/Button.tsx`                     | L293                | easy — same component                                                                                                                     |
| 2   | Switch                      | `src/switch/Switch.tsx`                     | L114                | easy                                                                                                                                      |
| 3   | RadioCard                   | `src/radio/RadioCard.tsx`                   | L159                | easy                                                                                                                                      |
| 4   | InputFrame (Input/Textarea) | `src/input/InputFrame.tsx`                  | L228                | easy                                                                                                                                      |
| 5   | LabelInfo                   | `src/input/LabelInfo.tsx`                   | L80                 | easy                                                                                                                                      |
| 6   | SegmentedControl            | `src/segmented/SegmentedControl.tsx`        | L528                | awkward — ring is in private `SegmentedControlButton`; drill 1 level                                                                      |
| 7   | DropdownSelector            | `src/dropdown/DropdownSelector.tsx`         | L281                | awkward — private `DropdownSelectorView`                                                                                                  |
| 8   | ListItem                    | `src/list/ListItem.tsx`                     | L155                | awkward — private `PressableTitle`                                                                                                        |
| 9   | CalendarMonth               | `src/date/CalendarMonth.tsx`                | L227, 256, 544, 612 | awkward — **4 sub-button sites**, drill through day/year grids                                                                            |
| 10  | DateWheel                   | `src/date/DateWheel.tsx`                    | L382                | awkward — `WheelColumn`→`WheelRow`, 2 levels                                                                                              |
| 11  | WebModalFrame (close btn)   | `src/modal/WebModalFrame.web.tsx`           | L253                | easy — but scope: this is the modal close button                                                                                          |
| 12  | DataGridResizeHandle        | `src/data-grid/DataGridResizeHandle.tsx`    | L92                 | easy — but plumb from `DataGrid` public API                                                                                               |
| 13  | KanbanColumn add-button     | `src/kanban/KanbanColumn.tsx`               | L318                | awkward — `ColumnAddButton`, thread from `Kanban`                                                                                         |
| 14  | DragSelectableContext       | `src/drag-select/DragSelectableContext.tsx` | L227                | special — hook result is _returned to a consumer_; emptied style is honored automatically, but the provider prop must feed `{ disabled }` |
| 15  | **RichTextEditor** (NEW)    | `src/rich-text/RichTextEditor.web.tsx`      | L828                | easy — same component                                                                                                                     |
| 16  | **SortableRow** (NEW)       | `src/sortable-list/SortableRow.tsx`         | L172, L241          | awkward — **2 sites** (row + handle); thread from `SortableList`                                                                          |

### Family B — local stylesheet glow (needs `focus.focused && focus.ringEnabled ? styles.X : null`)

| #   | Component         | File                            | Site | Style                                                |
| --- | ----------------- | ------------------------------- | ---- | ---------------------------------------------------- |
| 17  | List              | `src/list/List.tsx`             | L236 | `styles.itemFocused`                                 |
| 18  | Table             | `src/table/Table.tsx`           | L305 | `styles.rowFocused` (tableStyles.ts L86)             |
| 19  | KanbanColumn card | `src/kanban/KanbanColumn.tsx`   | L258 | `styles.cardFocused`                                 |
| 20  | Heatmap           | `src/heatmap/Heatmap.tsx`       | L661 | `styles.cellPressableFocused` (heatmapStyles.ts L31) |
| 21  | WorkflowNode      | `src/workflow/WorkflowNode.tsx` | L217 | `styles.nodeFocused`                                 |
| 22  | WorkflowEdge      | `src/workflow/WorkflowEdge.tsx` | L106 | `styles.insertButtonFocused`                         |

> **KanbanColumn spans both families** (add-button = A @L318, card = B @L258) —
> one component, two sites, both fed by the same public prop.

### Not ring-bearers (outline-suppression only — see M4)

`hideWebOutline`/`hideWebOutlineView`-only consumers draw **no** glow but _do_
suppress the browser's default outline: `calendar/*`, `data-grid` cells/rows/
add-row/card-stack/column-menu, `dropdown/ComboboxMultiSelect`, `toast`. They
have no ring to disable, but they matter for the a11y milestone.

---

## Milestones

### M1 — Core primitive + global kill switch

- `src/focusRing.ts`: `disabled` option, `ringEnabled` return, empty-style path.
- `src/theme.tsx`: `focusRing` on `SharedUiTheme` + overrides + defaults +
  `createSharedUiTheme`.
- Decide the public prop shape (`disableFocusRing` vs `focusRing?: boolean`).
- Unit test: `useFocusRing({ disabled: true })` → empty `focusRingStyle`,
  `ringEnabled: false`; `theme.focusRing: false` → same globally.
- **Outcome:** setting `focusRing: false` on the theme kills all 16 Family-A
  rings with zero component edits. `npm run verify` green.

### M2 — Family B gate edits (complete the global switch)

- Add `&& focus.ringEnabled` to the 6 Family-B sites (#17–22 above).
- Test that `theme.focusRing: false` also suppresses List/Table/Kanban-card/
  Heatmap/Workflow rings.
- **Outcome:** the theme flag is now a _complete_ kill switch across all 22 sites.

### M3 — Per-component `disableFocusRing` prop rollout

- Family A (#1–16): add the public prop, forward into `useFocusRing({ disabled })`.
  Do the "easy" ones first (Button, Switch, RadioCard, Input, LabelInfo,
  RichText, WebModalFrame, DataGridResizeHandle), then the "awkward" drill-through
  ones (Segmented, Dropdown, ListItem, CalendarMonth×4, DateWheel, Kanban,
  SortableRow, DragSelectable).
- Family B (#17–22): AND the same prop into the gate alongside `ringEnabled`.
- Update each component's `Props` type + README; extend `testIDForwarding`-style
  coverage where a new public prop is added.
- **Outcome:** any single control can drop its ring in isolation.

### M4 — Accessibility: don't strip focus from keyboard targets

- When a ring is disabled on a **keyboard-navigable** element that also applies
  `hideWebOutlineView` unconditionally (Heatmap gridcells, DataGridResizeHandle,
  Table rows, and any Family-A control), the element must fall back to a visible
  affordance — restore the UA `outline` (drop `hideWebOutlineView`) when
  `ringEnabled` is false, rather than leaving _no_ visible focus.
- Extend the axe / WCAG 2.1 §2.4.7 gate ([`plans/wcag-2-1-accessibility.md`])
  to assert focus visibility with rings disabled.
- **Outcome:** disabling the glow never produces an unfocusable-looking control.

### M5 — Stories, docs, verify

- A Storybook story toggling `theme.focusRing` and a per-component
  `disableFocusRing` demo.
- Note the flag + prop in the top-level README and each affected component README.
- `npm run verify` green (typecheck, tests, package-smoke, axe).

---

## Open questions (resolved)

- **Prop name:** shipped `disableFocusRing?: boolean` (binary, matches the ask).
  The hook's `disabled` option backs a tri-state later if wanted.
- **Scope of the prop:** shipped on all ring-bearers (form controls + the
  container-ish Table/List/Kanban/Heatmap/Workflow), each defaulting `false`.
- **DragSelectable / DataGrid:** DataGrid grew a top-level `disableFocusRing`
  prop (threaded to the resize handle via `DataGridHeader`); DragSelectable
  exposes it as a per-target option on `useDragSelectableTarget` (the hook owns
  the ring), rather than a provider prop — the theme flag covers the group-wide
  case.

## Follow-up

- **DateField / DateRangeField forwarding.** These composites don't yet forward
  a single `disableFocusRing` down to their `InputFrame` trigger + the
  `CalendarMonth` / `DateWheel` picker (both of which already carry the prop).
  The global `theme.focusRing` flag already disables their rings; add the
  forwarding for per-instance control when needed (threads through
  `DateTrigger` and `DatePickerOverlay`, both platform-split).
