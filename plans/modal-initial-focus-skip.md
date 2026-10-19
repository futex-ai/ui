# Modal initial-focus skip marker

Status: Active. Plan created on 2026-10-19 on branch `calummoore/modal-autofocus-exclusion`;
no PR is open yet. The plan closes when its PR merges.

`WebModalFrame` (the web build in `src/modal/WebModalFrame.web.tsx`) moves
focus into the dialog when it opens. Without an `initialFocusRef` it picks the
first focusable element the caller rendered, in DOM order, skipping only its own
close button. `Input`, `Textarea`, `DateField`, `DropdownSelector`, and
`SegmentedControl` render the `labelInfo` ⓘ button (`LabelInfo`) in the label
row, before the control itself. A modal whose first field has `labelInfo`
therefore opens with focus on the ⓘ button instead of the field. Today the only
workaround is an `initialFocusRef` on every such modal, and a consumer cannot
exclude a control of their own from the landing choice at all.

The change adds a static **initial-focus marker**: the attribute
`data-firna-initial-focus="skip"`. The modal's default landing choice ignores an
element that carries the marker, or that sits inside a marked ancestor within
the dialog surface, so a wrapper `View` excludes a whole group. The marker does
not remove the element from the Tab order or from the focus trap; it only stops
the element being the landing spot. An explicit `initialFocusRef` still wins,
even when it points at a marked element. When every caller control is marked,
the frame falls back as today: the close button, then the surface. The marker
ships in the two spellings the focus-ring markers already use:
`skipInitialFocusProps` (a `dataSet` fragment for the library's `View`,
`Pressable`, and `TextInput` primitives and React Native elements) and
`skipInitialFocusDomProps` (literal `data-*` attributes for a raw DOM element).
`LabelInfo` carries the marker, which fixes all five labelled controls at once.
The module lives at `src/modal/initialFocus.ts` because the modal owns the
initial-focus contract (`initialFocusRef` and `Focusable` live in
`src/modal/types.ts`), and it is exported from `@firna/ui/modal` and `@firna/ui`
without a new package subpath.

Not covered: native, where there is no tab order and `dataSet` is inert, so the
marker is a documented no-op; popovers and dropdowns, which focus their own
surface or manage an active item and never pick a "first focusable"; the
input's clear and suffix buttons, which follow the field in DOM order and so
never win the landing choice. Nothing visual changes, so there is no mockup
milestone.

Design choices made at planning time: a plain prop object instead of a hook,
because the marker has no state and a static attribute also works in
server-rendered HTML; ancestor semantics instead of a wrapper component, because
a wrapper component would add a layout node, while any `View` can already carry
the marker.

Decisions put to the user on 2026-10-19 (all pending; the recommended option is
applied if there is no answer):

1. Mechanism: A, the `data-*` marker with ancestor semantics (recommended), over
   a context-registration hook, a wrapper component, or a prefer-fields
   heuristic.
2. Name: A, `data-firna-initial-focus="skip"` with `skipInitialFocusProps` /
   `skipInitialFocusDomProps`, matching the `initialFocusRef` prop
   (recommended), over an `autoFocus`-based name.
3. A declarative `prefer` value: B, defer it (recommended). `initialFocusRef`
   already covers the explicit landing spot.
4. Protocol doc placement: A, extend the existing Modal and Input contracts in
   `docs/protocol/shared-ui-components.md` (recommended), over splitting the
   Modal Contract into its own page in this change.

Contract owners:

- [Shared UI components protocol](../docs/protocol/shared-ui-components.md),
  the Modal Contract and the Input Contract.
- The [modal README](../src/modal/README.md).
- The [input README](../src/input/README.md).

## Milestone 1: Documentation and protocol

The protocol doc states the complete landing rules, which today it does not
(the close-button skip is only in the README), and names the marker. The
READMEs show the consumer-facing API.

- [ ] Modal Contract in `docs/protocol/shared-ui-components.md`: define the
      default landing choice (first focusable caller control in DOM order; the
      close button is skipped; an element with the marker, or inside a marked
      ancestor within the surface, is skipped; `initialFocusRef` overrides the
      choice; fallback to the close button, then the surface), state that
      marked elements stay in the Tab order and the focus trap, name the
      attribute and value, the two spellings, the `dataSet` merge rule when a
      host already carries `dataSet` (for example the focus-ring markers), and
      the native no-op.
- [ ] Input Contract in the same doc: the `labelInfo` ⓘ button carries the
      marker so the field, not the button, is the landing spot inside a modal.
- [ ] `src/modal/README.md`: a Responsibilities bullet, a Quick Start section
      "Keep a control out of the landing spot" with a primitive example, a
      wrapper-`View` example, a raw-DOM example, and the `dataSet` merge note;
      add `initialFocus.ts` and `webModalFocus.ts` to Key Code.
- [ ] `src/input/README.md`: extend the Label info and Accessibility sections.
- [ ] `src/sheet/README.md`: one line that the web sheet inherits the landing
      rules.
- [ ] Root `README.md`: mention the marker in the `@firna/ui/modal` bullet.
- [x] Add this plan to `plans/README.md`.

## Milestone 2: Marker primitive and modal frame

Tags: ui

The pure marker module, the frame change, and the focus-helper split that
keeps the frame file under the 300-line cap.

- [ ] Add `src/modal/initialFocus.ts`: the attribute name constant, the
      `InitialFocusMarker` type (`"skip"`), `InitialFocusHostProps`
      (`dataSet` spelling), `InitialFocusDomProps` (literal spelling),
      `skipInitialFocusProps`, `skipInitialFocusDomProps`, the CSS selector,
      and a pure `isInitialFocusCandidate(element, surface)` over structural
      node types (`closest`, `contains`) so unit tests need no DOM.
- [ ] Move the DOM focus helpers out of `WebModalFrame.web.tsx` (437 lines)
      into `src/modal/webModalFocus.ts`: initial-target choice, the Tab trap,
      the focusable query, the portal-root walk, and the focus call. The
      initial-target choice filters with `isInitialFocusCandidate`; the trap
      keeps the unfiltered list.
  - [ ] Point the source assertions in `tests/unit/webModal.test.ts` at the
        new file.
- [ ] Export the module from `src/modal/index.ts`.
- [ ] Unit tests: new `tests/unit/initialFocus.test.ts` (self marker,
      marked ancestor inside the surface, marked ancestor outside the surface
      is still a candidate, no marker; both spellings name the same
      attribute; the DOM backend hyphenates the `dataSet` key to
      `data-firna-initial-focus`); extend `tests/unit/webModal.test.ts`
      (initial target filters, trap does not, `initialFocusRef` precedence,
      public exports).
- [ ] `npm run typecheck`, `npm run typecheck:web`, `npm test`.

## Milestone 3: Library adoption

Tags: ui

`LabelInfo` carries the marker. The audit of other label rows is recorded.

- [ ] `src/input/LabelInfo.tsx`: merge `skipInitialFocusProps.dataSet` into the
      trigger's `dataSet` next to `focus.focusRingProps.dataSet`. A plain double
      spread would drop the focus-ring markers.
- [ ] `tests/unit/input.test.ts`: `LabelInfo` carries the marker and keeps the
      focus-ring markers.
- [ ] Record the audit under this milestone: `LabelInfo` is the only focusable
      that precedes its control in a label row (`Input`, `Textarea`,
      `DateField`, `DropdownSelector`, `SegmentedControl`);
      `ComboboxMultiSelect` has no label-row control.

## Milestone 4: Storybook and browser coverage

Tags: ui

A story exercises both the library case and the consumer case, and a browser
spec proves the landing spot in a real DOM.

- [ ] Story under `Modal/Examples`, "Initial focus skips helper controls": a
      modal open on mount with a marked icon toolbar (wrapper `View` with
      `skipInitialFocusProps`) above an `Input` with `label` and `labelInfo`,
      and a footer action.
- [ ] New `tests/browser/modal.spec.ts`: the text field is focused on open;
      Shift+Tab reaches the ⓘ button; Tab reaches the toolbar buttons; the ⓘ
      button carries `data-firna-initial-focus="skip"` and its focus-ring
      marker.
- [ ] Record the ARIA and screenshot baselines for the new story with
      `SNAPSHOT_UPDATE=1` on `tests/browser/snapshots.spec.ts` and commit them.
- [ ] The axe sweep (`tests/browser/a11y.spec.ts`) passes for the new story.
- [ ] Smoke test: `npm run storybook`, open the story, confirm the field holds
      focus, and save the screenshot under
      `.context/modal-initial-focus-skip/`.

## Milestone 5: Verification, commit, and review

- [ ] Run `npm run verify` and `cargo xtask check`.
- [ ] Commit with Conventional Commits and push the branch.
- [ ] Review the complete local diff against `origin/main` with the
      `implementation-review` skill after the push. Report the findings,
      then apply the review-fix rule: fix the `Auto-fix: yes` findings,
      re-review once, and report the rest.

## Post-merge follow-up (non-blocking)

- [ ] Consumers (accounting, Juno) can drop `initialFocusRef` workarounds that
      only existed to skip an ⓘ button, once they take the release.
