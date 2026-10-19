# Web modal stack

Status: Active. Branch `calummoore/palette-forms-overlay-discussion`, no pull request yet. The plan
closes when its PR merges.

`WebModalFrame` is the library's dialog. On web, each open frame portals itself
straight under `document.body`, marks every other body child `inert` and
`aria-hidden`, and installs its own document-level Tab trap. Two open frames
therefore fight. The lower frame's trap cancels Tab inside the upper one, so a
keyboard user in a confirm dialog over Settings cannot move from Cancel to
Confirm. Two frames that mount in one render commit mark each other inert, so
neither works. The toast live region is a body child too, so toasts raised from
a dialog are hidden from assistive technology. The accounting app works around
the first two defects by hiding its Settings dialog with a React `Activity`
while a palette form is open, so the list that launched the form disappears,
against the app mockups.

This plan adds one web modal stack: a shared portal root under `document.body`,
a registry of the open dialogs, page inertness by reference count, inert lower
dialogs, one Tab trap for the top dialog, ordered focus restore, live-overlay
exemption, and a page scroll lock. Consumers keep the `WebModalFrame` API.
Native keeps the React Native `Modal` path.

Not covered: the accounting app change (see the post-merge follow-up), sibling
`Modal`s on iOS, a public stack API for consumer-owned frames, and a full split
of the shared component protocol doc.

## Decisions (2026-10-19)

Cal chose option A of the review item "Palette forms hide the Settings dialog
beneath": fix it upstream in `futex-ai/ui`. The other decisions of the same
message were applied as their recommended options, with no explicit answer:

1. **Stack shape: registry plus one shared root.** Chosen over a registry
   with per-frame body portals. One container gives one rule for what the
   page is, DOM order equals stack order, and it is the follow-up that the
   app's `plans/product-overlay-root.md` (futex-ai/accounting, PR #623)
   recorded.
2. **Page scroll lock: add it.** Chosen over leaving the page scrollable
   under the backdrop. It is small, and the stack already owns the first-push
   and last-pop events. It lands in its own commit so it can be dropped.
3. **Backdrops: keep every backdrop.** Chosen over hiding the backdrops of
   lower dialogs. Compounding matches common dialog libraries and needs no
   code. The app mockups can overrule it later.
4. **Findings 1 to 3 are fixed by the stack**, each behind a browser test
   that fails first: Tab blocked in stacked modals, same-commit mutual inert,
   and the hidden toast live region.
5. **Protocol doc split: partial.** `docs/protocol/shared-ui-components.md`
   has 1008 lines and passes the length target. This plan moves only the
   contracts it touches, Modal and Layering, to a new linked page
   `docs/protocol/web-overlays.md`. A full split is a separate change.
6. **The stack stays internal.** No new public export until a consumer-owned
   frame needs to join. Every app overlay already uses `WebModalFrame`.
7. **Live overlays.** A body child that carries `data-firna-live-overlay`
   is never made inert by the stack. The toast region and the announcer carry
   it. Dropdown and popover layers do not: a popover left open under a dialog
   is background.

Contract owners:

- [Web overlays protocol](../docs/protocol/web-overlays.md), new in M1.
- [Shared UI components protocol](../docs/protocol/shared-ui-components.md).
- The [modal README](../src/modal/README.md) and the
  [toast README](../src/toast/README.md).

Mockups: none. The change adds no new visual design. Stacked dialogs already
paint two backdrops today, and this repo has no modal mockup.

## Design

### Behaviour at the boundary (M1 writes these into the protocol doc)

- Every web dialog renders inside one shared overlay root under
  `document.body`, in opening order.
- While a dialog is open, the page and every dialog beneath the top one are
  inert and hidden from assistive technology. Only the top dialog receives
  focus, Tab, Escape, and pointer input.
- Dialogs that mount in the same render commit stack in tree order. The last
  one is on top.
- Closing the top dialog returns focus to the element that opened it, also
  when that element is inside the dialog beneath. When that element is gone
  or inert, focus moves to the dialog beneath, or to the page when none is
  left.
- Closing a dialog that is not on top does not move focus.
- The toast region and the announcer stay announced and operable while a
  dialog is open.
- The page does not scroll while a dialog is open, and the removed scrollbar
  does not shift the layout.
- Each dialog keeps its own backdrop. Stacked dialogs darken the page
  cumulatively.
- Escape closes the top-most overlay only. Unchanged.

### Mechanics (web only)

- `src/modal/webModalStackModel.ts`: pure. An ordered layer list with `top`
  and `below`, the focus-restore target resolution, and the page-lock
  transitions on the first push and the last pop. Tested with `node:test`.
- `src/modal/webModalRoot.ts`: creates `<div data-firna-modal-root>` under
  `document.body` once, unstyled, so fixed-position layers stay
  viewport-relative. DOM order inside the root is the stack order, and the
  frames keep one `z-index`.
- `src/modal/webModalStack.ts`: the DOM side. `push` snapshots
  `document.activeElement` and applies the stack. `remove` applies the stack
  and then restores focus, so the dialog beneath is live before focus lands
  in it. `apply` marks every non-exempt, non-root body child inert and
  `aria-hidden`, remembers each node's first-seen prior state, and restores
  all of them on the last pop. It marks every lower dialog root inert and
  `aria-hidden`, clears the top one, and keeps one capture-phase keydown
  listener that traps Tab inside the top surface. The scroll lock joins in
  M4.
- `src/modal/webModalFocusTrap.ts`: the focusable selector, the trap, the
  initial-focus target, and the focus helper, moved out of the frame file.
- `src/modal/useWebModalLayer.ts`: one effect on `visible` that pushes a
  layer with root and surface getters and the initial focus target, and
  removes it on close.
- `WebModalPortal.web.tsx` portals into the shared root.
  `WebModalFrame.web.tsx` drops its inert, Tab-trap, and focus-restore
  effects and keeps the Escape layer and the sheet height logic. The file
  falls under the 300-line limit.
- `ToastViewport.web.tsx` and `announcer.ts` set `data-firna-live-overlay`
  on their body-level nodes.
- Native `WebModalFrame.tsx` is unchanged. iOS presents one sibling `Modal`
  at a time, so a second native dialog must render inside the first.

## Milestone 1: Documentation and protocol

The protocol doc states the stacking requirements and the decisions in force
before the code changes. The parent doc passes the length target, so the
touched contracts move to a new linked page.

- [x] Add `.context/` to `.gitignore`.
- [ ] Create `docs/protocol/web-overlays.md`. Move the Modal Contract and the
      Layering Contract there from `shared-ui-components.md`. Add the
      requirements under "Behaviour at the boundary" above, each with its
      decision in force and the rejected alternative. Keep the page under
      250 lines.
- [ ] In `docs/protocol/shared-ui-components.md`, replace the moved sections
      with links to the new page. Add one sentence to the Toast Contract that
      links the live-overlay requirement.
- [ ] Update `src/modal/README.md`: the stack in Responsibilities, the new
      modules under Key Code, the native sibling-modal note, and the new
      protocol page under Related Docs.
- [ ] Update `src/toast/README.md`: the region stays live under dialogs.
- [ ] Update the root `README.md`: the modal feature bullet, the
      `@firna/ui/modal` line, and the protocol doc list.
- [ ] Run `npx prettier --check` on the changed Markdown.

## Milestone 2: Stack model, root, and focus-trap modules

Pure and DOM modules land with unit tests and no behaviour change. The frame
still uses its own effects, so the product keeps working.

- [ ] Add `src/modal/webModalStackModel.ts` and
      `tests/unit/webModalStackModel.test.ts`: push and remove keep order,
      removing a middle layer keeps the top, `top` and `below` partition,
      restore target resolution, and page-lock transitions only on the first
      push and the last pop.
- [ ] Add `src/modal/webModalFocusTrap.ts`. Move the focusable selector,
      `webModalFocusableElements`, `trapWebModalFocus`,
      `webModalInitialFocusTarget`, and `focusWebModalElement` out of
      `WebModalFrame.web.tsx`. Update the source assertions in
      `tests/unit/webModal.test.ts`.
- [ ] Add `src/modal/webModalRoot.ts`: idempotent root creation, safe when
      `document` is undefined.
- [ ] Add `src/modal/webModalStack.ts` with push, remove, and apply, the
      single Tab listener, the inert bookkeeping, and the focus restore
      order. Add `tests/unit/webModalStack.test.ts` with source assertions in
      the style of `tests/unit/escapeLayer.test.ts`.
- [ ] Run `npm test`, `npm run typecheck`, and `npm run typecheck:web`.

## Milestone 3: Frame wiring, live overlays, story, and browser tests

Tags: ui

The frame joins the stack, the toast region and the announcer become exempt,
and a stacked story with browser tests captures findings 1 to 3 before the
wiring lands.

- [ ] Add `src/stories/modalStackExample.tsx` and two stories under
      `Modal/Examples`: "Stacked web modals" with a page trigger, a first
      dialog with a text field, an "Open confirm" button, and a "Show toast"
      button, and a confirm dialog with Cancel and Delete; and "Stacked at
      mount", which opens both dialogs in one state update. Wrap the stories
      in a `ToastProvider`.
- [ ] Add `tests/browser/modal-stack.spec.ts` before the wiring, so the
      tests fail first:
  - [ ] Tab from Cancel reaches Delete in the confirm dialog (finding 1).
  - [ ] The confirm root has no `inert`. The first dialog root and the page
        carry `inert` and `aria-hidden`.
  - [ ] Escape closes only the confirm, focus returns to "Open confirm", and
        Tab then moves inside the first dialog.
  - [ ] Closing the first dialog restores the page and focuses the page
        trigger.
  - [ ] "Stacked at mount" leaves the confirm live (finding 2).
  - [ ] A toast raised from the first dialog is not `aria-hidden`, and its
        close button works (finding 3).
  - [ ] Two backdrops are present while both dialogs are open.
- [ ] Save the failing run under `.context/web-modal-stack/` and name the
      file here.
- [ ] Point `WebModalPortal.web.tsx` at the shared root. Add
      `src/modal/useWebModalLayer.ts` and wire `WebModalFrame.web.tsx` to it.
      Remove the inert, Tab-trap, and focus-restore effects from the frame.
- [ ] Set `data-firna-live-overlay` in `ToastViewport.web.tsx` and
      `announcer.ts`.
- [ ] Keep the existing modal browser tests in `tests/browser/storybook.spec.ts`
      green: focus restore with nested dropdowns, footer-action initial focus,
      nested dropdown Escape, and the web sheet.
- [ ] Run the axe sweep. If it reports `aria-hidden-focus` on a stacked
      story, record the triage here and ask before any baseline entry.
- [ ] Smoke test in `npm run storybook`: open the stacked story, Tab, Escape,
      and raise a toast. Save a screenshot under `.context/web-modal-stack/`.

## Milestone 4: Page scroll lock

Tags: ui

The stack locks page scroll on the first push and releases it on the last pop.
Own commit, so it can be dropped on its own.

- [ ] Add the scrollbar-gutter padding math to `webModalStackModel.ts` with a
      unit test.
- [ ] In `webModalStack.ts`, store the `overflow` and `padding-right` of the
      root element and the body on the first push, set `overflow: hidden` on
      both and pad by the scrollbar width, and restore all of them on the
      last pop. iOS Safari ignores the lock on one element alone.
- [ ] Smoke test on iOS Safari by hand, on an iPhone or the iOS Simulator,
      because the browser tests run in Chromium only: open the stacked story
      and try to scroll the page under the sheet with touch. Save the
      evidence under `.context/web-modal-stack/` and name the file here.
- [ ] When iOS Safari still scrolls the page, fix the body in place instead:
      `position: fixed`, full width, and the saved scroll offset as a negative
      `top`, then restore the offset on the last pop. Keep the offset math in
      `webModalStackModel.ts` with a unit test.
- [ ] Give the "Stacked web modals" story tall page content. Add a browser
      test: `overflow` is hidden while a dialog is open and restored after,
      and a fixed-width page element does not shift.
- [ ] Commit as `feat(modal): lock page scroll while a dialog is open`.

## Milestone 5: Verification, commit, and review

- [ ] Run `npm run verify` and `cargo xtask check`.
- [ ] Commit with Conventional Commits and push the branch.
- [ ] Run `cargo xtask review`, and review the complete local diff against
      `origin/main` with the `implementation-review` skill after the push.
      Report the findings, then apply the review-fix rule: fix the
      `Auto-fix: yes` findings, re-review once, and report the rest.

## Post-merge follow-up (non-blocking)

- [ ] Release the package through release-please, expected `4.1.0`.
- [ ] In `futex-ai/accounting`: bump `@firna/ui`, remove the `Activity` hiding
      in `DeferredProductSettings.tsx` and the wait-for-acknowledgement
      sequencing, update `docs/protocol/settings-dialog.md` and
      `docs/protocol/command-palette.md`, and add a browser test for a palette
      form over the Settings dialog.
- [ ] Compare the stacked backdrop look with the app mockups that draw a
      form over the Accounts list, and revisit decision 3 if they differ.
