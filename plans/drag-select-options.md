# Drag select options

Status: Active. Milestones 1 to 6 are delivered on branch
`calummoore/dragselectableprovider-improvements`, and Milestone 7 has run the
smoke test and the complete gate (`cargo xtask check`, which runs
`npm run verify`). Open before merge: the user's manual check of macOS
overlay scrollbars, and the review findings under the review TODO. No PR is
open yet. The plan closes when its PR merges.

[`DragSelectableProvider`](../src/drag-select/README.md) was built to wrap one
list. The accounting app wants one provider around every page, so that a drag
can start anywhere in the main column. A Chrome test of that layout on 4.0.0
found text highlighting, scrollbar drags that clear the selection, drags that
fail after a button press, an empty "0 items" box on pages without rows, a
page-wide "group" for screen readers, a fixed "Select" label, and no way for
the app to own the selection. This plan gives the app full control of the
gesture through one options type that both the provider and a new page hook
accept. It also fixes every reproduced bug, adds app-owned (controlled)
selection and edge auto-scroll, and makes the box and the wrapper
configurable.

Not covered: touch and native drag selection (native keeps its no-op
gesture); a selection that changes live while the pointer moves (the
selection still commits on release); rows that a virtualized list unmounts
during a drag (an unmounted row cannot be hit); an imperative API for
uncontrolled selection (use controlled selection); more than one selection
per provider; keyboard model changes beyond routing keys through the new
selection path.

Decisions (2026-10-14). The user asked for this plan after a discussion of
nine decisions and did not answer them at first, so the recommended option
applied to each. Decision 6 deletes current behavior, so it waited for the
user, who approved it later the same day.

1. Options are set on the provider and through a page hook (A).
2. A control inside a row starts a drag after 10px (A).
3. Control and Alt never start a drag. Shift adds. Command toggles (A).
4. Text selection is blocked by default (A).
5. Selection can be controlled or uncontrolled (A).
6. The fixed "Select" label is removed (A). The default box shows only the
   count badge. A new `marqueeLabel` option restores a label.
7. The wrapper gets the `group` role only when it has an accessible name (A).
8. Edge auto-scroll is in this plan and on by default (A).
9. The on/off option stays `disabled` (A).

Later decisions (2026-10-14), after two plan reviews: the user approved the
six test rewrites listed under "Approved test rewrites"; chose set semantics
for selection ids, so the order of ids carries no meaning; changed the review
TODO to report findings without fixing them, as `AGENTS.md` requires; and
declined native tests for the native selection behavior in Milestone 4.

Plan check (2026-10-14). The user let the recommended option apply to each
plan-check item: the uncontrolled selection clears when the last target
unregisters; text selection is blocked only after the drag starts, which a
Chrome check confirmed (see the evidence file); the work ships in one PR;
`ignore` combines across layers; the page hook publishes in a layout effect;
a container with a hidden scrollbar is exempt from the overlay-scrollbar
rule; and the `Tags: ui` line is removed, because every milestone in this UI
library is UI work.

The Storybook stories and the accounting app's transactions mockup are the
visual spec. This repo gets no new HTML mockup, as in the
[sortable group coordinator](sortable-group-coordinator.md) plan.

Contract owners:

- [Drag select protocol](../docs/protocol/drag-select.md), new in
  Milestone 1 and split from
  [shared UI components](../docs/protocol/shared-ui-components.md).
- The [drag-select README](../src/drag-select/README.md).
- [Consumer migration](../docs/consumer-migration.md).

Evidence: `.context/drag-select-options/reproduction.md` records the
reproduction of each finding and the check of the text-selection technique.

## Findings

| #   | Finding                                          | Cause                                                                                                                                                                                                                        | Milestone |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Every drag highlights text                       | Nothing blocks `selectstart`. `preventDefault()` on `pointermove` (`DragSelectableProvider.web.tsx:320`) does not stop text selection.                                                                                       | 3         |
| 2   | A scrollbar drag clears the selection            | A scrollbar press targets the scroll element, so a drag starts. The empty hit list then replaces the selection.                                                                                                              | 2         |
| 3   | A Control-drag starts                            | `beginDrag` checks only the button and the pointer type (`:355`).                                                                                                                                                            | 3         |
| 4   | A drag from a row button does not start          | `dragSelectableShouldStartFromTarget` (`dragSelectableDom.ts:128`) refuses every control inside a row.                                                                                                                       | 3         |
| 5   | The next drag fails after a button or row press  | (a) The capture-phase `window` `blur` listener (`:341`) also receives element blurs, so a focus move cancels the new drag. (b) A press on highlighted text starts a native text drag, and the browser sends `pointercancel`. | 2         |
| 6   | A page without rows shows an empty "0 items" box | A press starts a drag without checking for targets.                                                                                                                                                                          | 2         |
| 7   | Screen readers announce a page-wide "group"      | `role` defaults to `"group"` (`:67`).                                                                                                                                                                                        | 6         |
| 8   | The box always shows "Select"                    | Fixed text in `DragSelectableOverlay.web.tsx:70`.                                                                                                                                                                            | 6         |
| 9   | The app cannot own the selection                 | The selection is internal state. No prop sets it, and no public hook clears it.                                                                                                                                              | 4         |
| 10  | A scroll during a drag selects the wrong rows    | The box uses viewport coordinates and does not follow the content.                                                                                                                                                           | 2         |
| 11  | A drag sends a click                             | The browser dispatches `click` after the release, on the row where the drag ended or on a common ancestor.                                                                                                                   | 2         |
| 12  | No auto-scroll once text selection is blocked    | The only edge scroll today is the browser's text-selection scroll.                                                                                                                                                           | 5         |
| 13  | Every press measures every row                   | `beginDrag` measures all targets on each press, plain clicks included (`:384`).                                                                                                                                              | 2         |

## Contract

Milestone 1 copies this section into the protocol doc. Later milestones
implement it.

### Public API

```ts
type DragSelectableDragMode = "replace" | "add" | "toggle";

type DragSelectableModifierKeys = {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
};

type DragSelectableStartReason = "modifier" | "ignored" | "field" | "control";

type DragSelectableStart = {
  allowed: boolean; // the answer of the default rules
  reason: DragSelectableStartReason | null; // null when allowed
  element: Element; // the pressed element
  targetId: string | null; // the registered target that contains the press
  keys: DragSelectableModifierKeys;
  mode: DragSelectableDragMode | null; // from dragMode
  event: PointerEvent;
};

type DragSelectableSelectionChange = {
  source: "drag" | "keyboard";
  mode: DragSelectableDragMode;
  hitIds: string[]; // in document order
  previousIds: string[];
};

type DragSelectableMarquee = {
  box: DragSelectableBox; // viewport coordinates, clipped
  matchingCount: number;
  matchingIds: string[];
  matchingTargets: DragSelectableTargetSnapshot[];
  mode: DragSelectableDragMode;
};

// Existing type. The return type widens: null hides the badge.
type DragSelectableSelectionLabel = (
  count: number,
  context: DragSelectableSelectionLabelContext,
) => string | null;

type DragSelectableOptions = {
  autoScroll?: boolean;
  disabled?: boolean;
  dragMode?: (
    keys: DragSelectableModifierKeys,
  ) => DragSelectableDragMode | null;
  ignore?: string | readonly string[];
  marqueeLabel?: string | null;
  minimumControlDragDistance?: number;
  minimumDragDistance?: number;
  onSelectedIdsChange?: (
    ids: string[],
    change: DragSelectableSelectionChange,
  ) => void;
  onSelectionChange?: (selection: DragSelectableSelection) => void;
  overlayZIndex?: number;
  preventTextSelection?: boolean;
  renderMarquee?: (marquee: DragSelectableMarquee) => ReactNode;
  selectedIds?: readonly string[];
  selectionAnnouncement?: DragSelectableSelectionAnnouncement;
  selectionLabel?: DragSelectableSelectionLabel;
  shouldStartDrag?: (start: DragSelectableStart) => boolean;
  startFromControls?: boolean;
};

type DragSelectableProviderProps = DragSelectableOptions & {
  accessibilityLabel?: string;
  children: ReactNode;
  defaultSelectedIds?: readonly string[];
  role?: "group" | "list" | "none";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function useDragSelectableOptions(options: DragSelectableOptions): void;
function dragSelectableDefaultDragMode(
  keys: DragSelectableModifierKeys,
): DragSelectableDragMode | null;
function dragSelectableNextSelection(
  currentIds: readonly string[],
  hitIds: readonly string[],
  mode: DragSelectableDragMode,
): string[];
const dragSelectableIgnoreProps: { dataSet: { dragSelectIgnore: "true" } };
const dragSelectableIgnoreDomProps: { "data-drag-select-ignore": "true" };
```

`DragSelectableState` gains `dragMode: DragSelectableDragMode | null`, the mode
of the active press. The target hook, the selection and change hooks, the
geometry helpers, and the layer token keep their current API.

### Option defaults

| Option                       | Default                         | Meaning                                                                                    |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| `disabled`                   | `false`                         | No press arms, an active drag cancels, and keyboard changes are ignored.                   |
| `ignore`                     | none                            | CSS selectors, combined across layers. A press on or inside a match does not start a drag. |
| `startFromControls`          | `true`                          | A press on a control inside an enabled target can start a drag.                            |
| `minimumDragDistance`        | `4`                             | Pixels of movement before a drag starts.                                                   |
| `minimumControlDragDistance` | `10`                            | Pixels for a press on a control. The larger of the two distances applies.                  |
| `dragMode`                   | `dragSelectableDefaultDragMode` | Maps the modifier keys to a mode, or to `null` for no drag.                                |
| `shouldStartDrag`            | none                            | Gives the final answer for each press that passes the fixed rules.                         |
| `preventTextSelection`       | `true`                          | Blocks text selection from the start of the drag to the release.                           |
| `autoScroll`                 | `true`                          | Scrolls the press's scroll container while the pointer is near its edges.                  |
| `selectedIds`                | none                            | Makes the selection controlled when it is defined.                                         |
| `onSelectedIdsChange`        | none                            | Receives each proposed selection.                                                          |
| `marqueeLabel`               | `null`                          | Text in the top-left corner of the box. `null` shows no label.                             |
| `selectionLabel`             | `"N item"` / `"N items"`        | Badge text. `null` hides the badge.                                                        |
| `renderMarquee`              | none                            | Replaces the box, the label, and the badge.                                                |

`onSelectionChange`, `selectionAnnouncement`, and `overlayZIndex` keep their
current defaults. The two distances use the current normalization: a negative
value clamps to `0`, and a non-finite value falls back to the default.

### Option precedence

- Library defaults apply first. Provider props override them. Hook layers
  override provider props, and the newest mounted layer wins.
- A key whose value is `undefined` does not override.
- `ignore` is the exception: the provider combines the selectors of every
  layer.
- `useDragSelectableOptions` adds a layer on mount, updates it on each
  render, and removes it on unmount. It publishes in a layout effect, in the
  server-safe form that `useDropdownSurfacePlacement` uses, so a changed
  `selectedIds` never paints a stale frame. It configures the nearest
  provider and does nothing outside a provider.
- A change to a non-function option re-renders the provider. The provider
  reads a function option when it calls it, so a new function identity does
  not re-render targets.
- `defaultSelectedIds` is read once, when the provider mounts.

### Start rules

The provider evaluates each `pointerdown` inside its element in this order.

Fixed rules. No option overrides them.

1. An inner provider already claimed the press. Ignore it.
2. The provider is disabled, or no enabled target is registered. Ignore the
   press and do not claim it, so an outer provider can take it.
3. Claim the press on the native event.
4. Ignore `pointerType` `touch` and every `button` other than `0`.
5. Ignore a scrollbar press. The scroll container is the pressed element or
   its nearest scrolling ancestor, else the document scrolling element.
   - Classic scrollbar: the point is inside the container's border box but
     outside its borders and outside its client area.
   - Overlay scrollbar: the container scrolls on an axis but reserves no
     scrollbar space on that axis, and the point is within 16px of the far
     edge on that axis. The far edge is the right edge for vertical
     scrolling, the left edge when `direction` is `rtl`, and the bottom edge
     for horizontal scrolling. The overlay rule does not apply when the
     container hides its scrollbar: its computed `scrollbar-width` is
     `none`, or it carries the library's `data-hide-scrollbar` attribute.

Default rules. The first match sets `reason`, and `allowed` becomes `false`.
Rules 7 to 9 search the pressed element and its ancestors up to the provider
element.

6. `dragMode(keys)` returns `null`: `modifier`. The default mode is `null`
   when Control or Alt is held, else `add` for Shift, else `toggle` for Meta
   (Command), else `replace`.
7. The press is inside an element that matches `[data-drag-select-ignore]`
   or an `ignore` selector: `ignored`. An invalid selector does not match and
   gives a `devWarn` warning.
8. The press is inside a field: `field`. Fields are `input` elements other
   than the press types below, `textarea`, `select`, editable content
   (`[contenteditable]` other than `false`), the roles `textbox`,
   `searchbox`, `combobox`, `slider`, `spinbutton`, and `scrollbar`, and
   `[draggable='true']`.
9. The press is inside a control: `control`. A press on a control inside an
   enabled target is allowed instead when `startFromControls` is `true`.
   Controls are `a[href]`, `button`, `summary`, `label`, `input` of type
   `button`, `checkbox`, `image`, `radio`, `reset`, or `submit`, and the
   roles `button`, `link`, `checkbox`, `radio`, `switch`, `tab`, `menuitem`,
   `menuitemcheckbox`, `menuitemradio`, and `option`. A target's root element
   counts as the target, not as a control, even with the `checkbox` role from
   `a11yProps`. A control that contains the target root is not searched.
10. `shouldStartDrag(start)`, when set, gives the final answer. When it
    allows a press that `dragMode` refused, the mode is `replace`.

### Gesture

- Armed: the provider accepted the press. `state.dragging` is `true`, as
  today. Nothing is measured, and no box is drawn.
- From the accepted press to the release, the provider blocks native
  `dragstart`.
- Started: the pointer moved the threshold distance. The provider measures
  the targets and draws the box. With `preventTextSelection`, it removes the
  text highlight that formed since the press, blocks `selectstart`, and sets
  `user-select: none` on the document element until the release, then
  restores the old value. A press without a start blocks no text selection,
  so a double-click or a triple-click still selects a word or a paragraph.
  It ends the library `Pressable` press that the same pointer started, so
  the control loses its pressed look and does not fire `onPress`. It starts
  auto-scroll.
- Anchor: the start point stays attached to the content of the press's
  scroll container. A scroll during the drag (wheel, keyboard, or
  auto-scroll) moves the start point with the content, and the provider
  measures the targets again. The hit test uses the full box.
- Release after a start: the provider finds the hits in document order,
  proposes `dragSelectableNextSelection(current, hits, mode)`, and swallows
  the next `click` wherever it lands.
- Release before a start: no selection change and no swallowed click.
- Cancel without a commit: `pointercancel`; `Escape` after a start (the
  provider stops the key event); a blur whose target is the window itself;
  `visibilitychange` to hidden; `disabled` becomes `true`; the provider
  unmounts.

### Auto-scroll

After a start, with `autoScroll`, an animation-frame loop scrolls the press's
scroll container by 16px per frame on each axis where the pointer is within
36px of the container's visible edge or beyond it. These are the data grid's
`autoScrollDelta` values. The loop stops on release or cancel.

### Selection

- Selection ids are a set. The order of ids carries no meaning. The
  provider compares a proposal with the current selection as sets, and a
  controlled app may keep its ids in any order. `dragSelectableIdsEqual`
  stays exported, but the provider no longer uses it for this comparison.
- `dragSelectableNextSelection` defines only the order of its result:
  `replace` returns the hits. `add` returns the current ids, then the hits
  that are not current. `toggle` returns the current ids without the hits,
  then the hits that were not current.
- Keyboard: Space or Enter proposes `toggle` with the focused target. Shift
  with an arrow key proposes `replace` with the range, as today. The source is
  `keyboard`.
- The provider skips a proposal whose set equals the current set.
- Controlled, when the merged options define `selectedIds`: the provider
  stores no selection. It calls `onSelectedIdsChange(proposal, change)` and
  renders `selectedIds`. A proposal that the app does not apply changes
  nothing.
- Uncontrolled: the provider starts from `defaultSelectedIds`, applies each
  proposal, and also calls `onSelectedIdsChange`.
- Uncontrolled, page change: when the last registered target unregisters,
  the provider clears its selection and calls `onSelectionChange` with an
  empty selection. The clear is not a proposal, so it is not announced. A
  page in a shell starts with an empty selection. A filter or a reload that
  leaves zero rows also clears the selection.
- `onSelectionChange(selection)` fires when the rendered selection changes,
  from any source.
- Announcement: the provider announces a proposal through
  `selectionAnnouncement` when the rendered selection first equals it. It
  does not announce a change that the app makes on its own, or a proposal
  that the app changes or rejects.
- `selectedTargets` holds snapshots of the current registrations. An id with
  no registered target has `data: undefined`.

### Box and wrapper

- The default box keeps the primary border, the 10% tint, the theme radius,
  and the `selectionLabel` badge at the bottom-right. It shows no top-left
  label unless `marqueeLabel` is set.
- `renderMarquee` replaces the box, the label, and the badge. The provider
  still renders the fixed, non-interactive layer at the box and puts the
  returned node inside it.
- The drawn box is the hit box clipped to the visible rectangle of the
  press's scroll container.
- The provider renders one element that takes `style` and `testID`, so a
  shell can use it as its main column. An explicit `role` wins, and `"none"`
  renders no role. Without `role`, the element has the `group` role when
  `accessibilityLabel` is set, and no role when it is not.

### Native

The native provider accepts every option and the page hook. It applies
`selectedIds` and `defaultSelectedIds` to `target.selected` and to the
selection state, and it ignores the gesture options.

### Library gesture surfaces

Library components that own a pointer gesture mark their gesture root with
`[data-drag-select-ignore]`, so a page-wide provider never starts over them.
The candidates are the calendar time grid and month grid, the data grid body,
header, and resize handles, kanban cards, sortable list items, the timeline
tracks and ruler, the video-editor `Scrubber` and `NumberScrubber`, and the
chart scrub layer. A surface that the field rule already covers needs no
marker.

### Breaking changes

The release is `@firna/ui` 5.0.0 through a `feat(drag-select)!:` commit.

- A drag that starts inside the provider no longer selects text. A
  double-click or a triple-click still selects text.
  `preventTextSelection: false` restores the old behavior.
- A drag can start from a control inside a row. `startFromControls: false`
  restores the old behavior.
- Control and Alt never start a drag. Shift adds, and Command toggles. A
  `dragMode` that always returns `replace` restores the old behavior.
- The click after a drag is swallowed.
- The box no longer shows the "Select" label. `marqueeLabel="Select"`
  restores it.
- A link or an image inside a row cannot start a native drag, because the
  press arms the provider.
- A press within 16px of the far edge of a scroll container with overlay
  scrollbars does not start a drag.
- A provider without an accessible name has no role. `role="group"` restores
  the old behavior.
- A press starts nothing when no enabled target is registered.

## Approved test rewrites

These existing unit tests in `tests/unit/dragSelect.test.ts` assert the old
behavior or the old source text of the provider. Milestones 2 to 4 break
them. They are on `origin/main`, so they needed the user's approval. The user
approved the rewrites on 2026-10-14. Each rewrite keeps the original intent
as a behavior test.

- "drag-select ignores nested interactive controls inside targets":
  decision 2 changes the result for buttons, checkboxes, radios, and
  switches. Editable content stays refused.

The other five match the source text of `DragSelectableProvider.web.tsx`,
`DragSelectableContext.tsx`, or `DragSelectableOverlay.web.tsx`. The file
split in Milestone 2 and the new selection path in Milestone 4 break them.

- "drag-select selection callback is stable across callback identities".
- "drag-select selection callback ignores registry-only updates".
- "drag-select provider uses the configured movement threshold".
- "drag-select provider cancels stale pointer streams".
- "drag-select provider exposes provider, target, and listener hooks".

## Milestone 1: Documentation and protocol

Write the complete contract into the protocol doc and the READMEs before any
code changes.

- [x] Create `docs/protocol/drag-select.md` from the "Drag Select Contract"
      section of `docs/protocol/shared-ui-components.md` and the Contract
      section of this plan. If it passes about 250 lines, move the option
      reference to a linked page.
- [x] Replace that section in `docs/protocol/shared-ui-components.md` with a
      short summary and a link. Every current requirement stays, either
      unchanged in the new doc or as a change that this plan lists.
- [x] Update `src/drag-select/README.md`: a page-wide shell example with
      `useDragSelectableOptions`, a controlled example, the options table, the
      start rules, the ignore marker, the page-change rule for uncontrolled
      selection, and the release behavior.
- [x] Add a "Drag select (5.0)" section to `docs/consumer-migration.md` with
      each breaking change and the option that restores the old behavior.
- [x] Update the `@firna/ui/drag-select` entry in the root `README.md`.

The protocol doc refines the Contract section above in six places, and it
wins where the two differ: hook layers are ordered by the first render of
their component; arrays in options compare element by element; Escape and
`disabled` are soft cancels that keep the text-selection block until the
release and swallow the click after a started drag; the release measures the
targets again; the page-change rule clears the stored selection in both
modes; and `selectedTargets` is taken again when the registered targets
change. The option reference is in `docs/protocol/drag-select-api.md`.

## Milestone 2: Gesture fixes

Fix the reproduced gesture bugs with the current options. Each fix starts
with a failing test. The provider keeps its current props.

- [x] Get the user's approval for the rewrites under "Approved test
      rewrites" (approved 2026-10-14).
- [x] Split `DragSelectableProvider.web.tsx` (470 lines) and
      `DragSelectableContext.tsx` (291 lines) into focused modules (gesture
      session, start rules, scroll anchoring, selection model, and target
      registry), so that every file stays under 300 lines. Keep `testID` in
      `dragSelectableTypes.ts`, where `tests/unit/testIDForwarding.test.ts`
      looks for it.
- [x] Add new unit tests in new files under `tests/unit/` (the current
      `dragSelect.test.ts` has 400 lines). Add the browser tests in a new
      `tests/browser/drag-select.spec.ts`. The current browser tests stay in
      `storybook.spec.ts` and must keep passing.
- [x] Add a full-screen "Page shell" story: a sidebar outside the provider,
      the provider as the scrolling main column, a centered content area with
      a title and a paragraph, and 30 rows with a library `Button` each. The
      sidebar switches between two pages, Transactions and Invoices, with
      different row ids. Add an "Empty page" story with no rows.
- [x] Cancel only on a blur of the window itself. Tests: a click on a row
      button, then a drag from the gutter, selects rows. A click on a row,
      then a drag from another row, selects rows.
- [x] Block native `dragstart` from the accepted press to the release. Test:
      highlight a row's text, then drag from that text; the rows are
      selected.
- [x] Ignore scrollbar presses, classic and overlay. Unit-test the geometry.
      Browser test: run Chrome without `--hide-scrollbars`, drag the main
      column's scrollbar, and check that the selection stays.
- [x] Arm nothing when no enabled target is registered. Test: no box on the
      "Empty page" story.
- [x] Measure the targets at the start, not at the press.
- [x] Anchor the start point to the scroll container's content, and measure
      again on each scroll during a drag. Unit-test the anchor math. Browser
      test: start on row 1, wheel-scroll 400px, release, and check that rows
      1 to N are selected.
- [x] Swallow the click after a completed drag. Move `suppressNextClick` from
      `src/sortable-list/sortableDragFocus.ts` to a new shared
      `src/dragGesture.ts` and update the sortable list import. Tests: a row
      `onPress` does not fire after a drag that ends on the row, and a plain
      click still fires it.
- [x] Cancel on `Escape` after a start.
- [x] Claim presses so that the innermost active provider owns a press.
      Test with nested providers.
- [x] Rewrite the approved tests as behavior tests.
- [x] Discovered: add a "Nested providers" story for the claim test.
- [x] Discovered: let `a11yProps` sit on a child of the registered row, with
      keyboard focus on that child, so a row that holds a `Button` passes the
      axe `nested-interactive` rule. Document it in the protocol and README.
- [x] Discovered: a `pointercancel` of any pointer cancels, so the existing
      browser test that dispatches a synthetic `pointercancel` keeps passing.

Evidence: `.context/drag-select-options/m2-evidence.md`.

## Milestone 3: Options and start rules

Add the options type, the page hook, and the configurable start rules.

- [x] Add `DragSelectableOptions` and the provider-only props. Put the new
      types in their own module if `dragSelectableTypes.ts` would pass 300
      lines.
- [x] Add the option merge and `useDragSelectableOptions`, shared by the web
      and native providers. Unit tests: precedence, `undefined` keys, the
      newest layer wins, unmount restores the earlier value, and a function
      option is read at call time.
- [x] Export `dragSelectableIgnoreProps` and `dragSelectableIgnoreDomProps`.
      Add `ignore` with the invalid-selector warning.
- [x] Add the field and control rules, `startFromControls`, and
      `minimumControlDragDistance`. Unit-test each rule and its reason.
- [x] Add an internal function to `src/primitives/dom/usePress.ts` that ends
      the active pointer presses. Call it at a start. Tests: after a drag
      from a row `Button`, the button has no pressed look and fires no
      `onPress`. A click without movement still fires `onPress`.
- [x] Add `dragMode`, `dragSelectableDefaultDragMode`,
      `dragSelectableNextSelection`, and `state.dragMode`. Unit-test the
      reducer. Browser tests: Control-drag and Alt-drag do not start,
      Shift-drag adds, and Meta-drag toggles.
- [x] Add `shouldStartDrag` with `DragSelectableStart`. Unit tests: each
      reason, and an override in both directions.
- [x] Add `preventTextSelection`. Browser tests: no highlight during or
      after a drag, including a drag that starts on row text and ends outside
      the provider; a highlight that formed before the start is gone after
      the start; a double-click selects a word and a triple-click selects a
      paragraph; with `false`, the old behavior returns.
- [x] Mark the library gesture surfaces with the ignore marker. Browser
      test: a drag inside a `DataGrid` and a `SortableList` in the page shell
      draws no box. Add source tests for the other surfaces.
- [x] Discovered: the "Page shell" story becomes the shell pattern: the
      provider is `disabled`, each page turns it on with
      `useDragSelectableOptions`, a sidebar switch sets
      `preventTextSelection`, and the Invoices page holds a `DataGrid` and a
      `SortableList` for the gesture-surface test.
- [x] Discovered: the chart scrub hook is native-only and has no web
      gesture, and the video-editor `Scrubber` and the timeline ruler are web
      `slider`s that the field rule refuses, so none of them gets a marker.
      The protocol doc lists the marked roots.

Evidence: `.context/drag-select-options/m3-evidence.md`.

## Milestone 4: Controlled selection

Let the app own the selection, from the provider or from the page hook.

- [x] Add `selectedIds`, `defaultSelectedIds`, `onSelectedIdsChange`, and
      `DragSelectableSelectionChange`.
- [x] Send keyboard toggles and ranges through the same proposal path.
- [x] Clear the uncontrolled selection when the last target unregisters.
      Browser test on the page shell: select rows on Transactions, open
      Invoices, check that `selectedCount` is 0 and that `onSelectionChange`
      fired once with an empty selection, then return to Transactions and
      check that no row is selected.
- [x] Apply the announcement rule. Test: a proposal that the app applies is
      announced once; a rejected proposal and an app-made change are not.
- [x] Make the native provider show `selectedIds` and `defaultSelectedIds`
      and accept the page hook.
- [x] Add a "Controlled selection" story. The app owns the selection with
      click, Command-click, Shift-click, a toolbar "Clear" button, and drag.
      Browser tests: a drag proposal that the app applies; a proposal that
      the app rejects; the toolbar clears both the app state and the rows.
- [x] Discovered: the page-change check runs at the end of the task and
      keeps the stored selection when one of its ids registers again, so
      React's development double mount keeps `defaultSelectedIds`. Unit-test
      the rule and update the protocol doc and the README.
- [x] Discovered: move the options, the registry, and the selection into a
      shared `useDragSelectableCore`, so the web and the native provider build
      the same state.

Evidence: `.context/drag-select-options/m4-evidence.md`.

## Milestone 5: Auto-scroll

Scroll the press's scroll container while the pointer is near its edges.

- [x] Move `autoScrollDelta` from `src/data-grid/dataGridDragDom.ts` to
      `src/dragGesture.ts`. Update the data grid import and its tests.
- [x] Add the animation-frame loop and `autoScroll`. It stops on release and
      on cancel.
- [x] Browser test: hold the pointer at the bottom edge of the page-shell
      column. Wait until the column scrolls and the selection reaches rows
      below the first screen. Use polling expectations, not elapsed-time
      assertions.

Evidence: `.context/drag-select-options/m5-evidence.md`.

## Milestone 6: Box and wrapper

Make the box and the wrapper element configurable.

- [x] Remove the fixed "Select" label, add `marqueeLabel` (default `null`),
      and let `selectionLabel` return `null`.
- [x] Add `renderMarquee`.
- [x] Clip the drawn box to the visible rectangle of the scroll container.
- [x] Apply the wrapper role rule and add `role="none"`.
- [x] Add a "Custom marquee" story that uses `renderMarquee`. The existing
      stories show the default box, which now has no label and matches the
      transactions mockup.
- [x] Browser tests: the default box has no label; `marqueeLabel` shows one;
      `selectionLabel` returning `null` hides the badge; the custom box
      renders; the page-shell provider has no role; a provider with a name
      keeps `group`.
- [x] Record the snapshot baselines for the new stories with
      `SNAPSHOT_UPDATE=1` on Linux, and check that the axe sweep passes.
- [x] Discovered: the box layer carries `data-drag-select-marquee`, so apps
      and tests can find it. Documented in the protocol.

Evidence: `.context/drag-select-options/m6-evidence.md`.

## Milestone 7: Verification, commit, and review

Prove the change, release it as a breaking change, and review it.

- [x] Smoke test: start Storybook and repeat each finding on the "Page
      shell" story. All 13 findings are fixed
      (`.context/drag-select-options/logs/smoke-2.log`).
- [ ] Manual check before merge: in the PR's Storybook preview, the user
      drags the page-shell scrollbar in Chrome on macOS with overlay
      scrollbars, and the selection stays.
- [x] Run `npm run verify`. `cargo xtask check` runs it, so one run covers
      both TODOs.
- [x] Run `cargo xtask check`: passed
      (`.context/drag-select-options/logs/gate-1.log`).
- [x] Update the plan status and `plans/README.md`.
- [x] Run `git add -A`, commit with Conventional Commits (a
      `feat(drag-select)!:` entry with a `BREAKING CHANGE:` footer), and push
      the branch.
- [x] Run `cargo xtask review` after the push. It reviews the complete local
      diff against `origin/main`. Do not fix its findings automatically, as
      `AGENTS.md` requires. Report each finding in the final message with a
      severity, the context, the impact of no change, lettered options, and
      a recommendation, so that the user decides. Add each open finding as
      one line below. Ran on 2026-10-15 against `3a7a535` with the
      configured `gpt-5.6-sol` model, because the provider rejects the
      hard-coded `gpt-5.5`, and with Linux capabilities dropped for the
      sandbox. Report: `.context/drag-select-options/review-impl-2.md`.
  - Open R1 (high): a function-only change in a hook layer does not reach
    the selection callbacks (`onSelectedIdsChange`, `onSelectionChange`,
    `selectionAnnouncement`), which read the options of the last provider
    render.
  - Open R2 (medium): auto-scroll also scrolls an axis whose `overflow` is
    `hidden`, because `scrollBy` moves hidden overflow.
  - Open R3 (medium): `selectedTargets` can carry stale `data`, because a
    data-only target update does not publish the registry snapshot.
  - Open R4 (medium): duplicate ids in `selectedIds` or
    `defaultSelectedIds` count twice.
  - Open R5 (medium): `role="none"` with `accessibilityLabel` renders a
    label on an element with no role (`aria-prohibited-attr`).
  - Open R6 (medium, test): no test checks the five new runtime exports in
    the built package.
  - Open R7 (low, docs): `plans/README.md` says 5.0.0 is released; it is
    published only after the merge.

## Post-merge follow-up (non-blocking)

- [ ] Publish 5.0.0 through the release-please PR.
- [ ] In the accounting app, make the shell's main column the provider and
      repeat the original Chrome test against the published package.
