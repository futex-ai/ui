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

## Implementation decisions (2026-10-20)

The implementer applied these as defaults while refining the mechanics, with
no explicit answer from the user:

8. **Tree order for nested dialogs.** React runs a child's effects before
   its parent's, so a dialog nested inside another dialog's content would
   push first and end up below its parent. Each frame links to its parent
   frame through a React context, and the stack inserts a new layer below
   every open layer that descends from it. Chosen over a documented rule
   that nested dialogs must open in separate commits, because a confirm
   inside a dialog's component is the common app pattern.
9. **Escape follows the stack.** A frame's Escape layer closes the stack's
   top dialog, so two frames that pushed their Escape layers in reverse
   order in one commit still close the top one first. Chosen over an
   insert-below call on the shared Escape stack, which would add a second
   ordering rule.
10. **Page inertness by membership.** A page node stays inert while any
    dialog that opened while the node was on the page is open. Chosen over
    one shared reference count, which would leave a popover from the top
    dialog inert after a later dialog closes.
11. **The public portal stays on `document.body`.** The frame portals
    straight into the shared root. Chosen over pointing `WebModalPortal` at
    the root, because consumer content there would be neither page nor
    dialog and would never become inert.
12. **The live-overlay attribute has its own owner module.** Chosen over a
    modal-owned constant, so the toast and the announcer do not import the
    modal module.
13. **The stack layer and the Escape layer register in passive effects.**
    React runs every passive cleanup in a commit before any passive create.
    Overlays, also consumer-owned ones such as a command palette, return
    focus to their trigger in a passive cleanup. So when one action closes
    an overlay and opens a dialog, the dialog records the trigger as its
    opener. Chosen over layout effects, which ran before those cleanups and
    recorded no opener. Moving the library's popover to layout timing would
    not fix consumer overlays.

Contract owners:

- [Web overlays protocol](../docs/protocol/web-overlays.md), new in M1.
- [Shared UI components protocol](../docs/protocol/shared-ui-components.md).
- The [modal README](../src/modal/README.md) and the
  [toast README](../src/toast/README.md).

Mockups: none. The change adds no new visual design. Stacked dialogs already
paint two backdrops today, and this repo has no modal mockup.

## Design

### Behaviour at the boundary (M1 writes these into the protocol doc)

- Every `WebModalFrame` dialog on web renders inside one shared overlay root
  under `document.body`. DOM order inside the root is the stack order.
- While a dialog is open, the page and every dialog beneath the top one are
  inert and hidden from assistive technology. Only the top dialog receives
  focus, Tab, Escape, and pointer input.
- Opening a dialog puts it on top. Dialogs that mount in the same render
  commit stack in tree order: a dialog rendered inside another dialog's
  content is above it, and a later sibling is above an earlier one.
- Closing the top dialog returns focus to the element that opened it, also
  when that element is inside the dialog beneath. When that element is gone
  or inert, focus moves into the dialog beneath, to the control where it
  lands when that dialog opens. When no dialog is left and that element is
  gone, focus stays where the browser puts it.
- Closing a dialog that is not on top does not move focus. A dialog above it
  that opened from inside it later returns focus to the element that opened
  the closed dialog.
- An overlay that was open on the page or in a dialog when a later dialog
  opened, such as a dropdown, is background while that later dialog is
  open, and is live again when it closes.
- Content rendered through the public modal portal is page content, not a
  stacked dialog.
- The toast region and the announcer stay announced and operable while a
  dialog is open.
- The page does not scroll while a dialog is open, and the removed scrollbar
  does not shift the layout.
- Each dialog keeps its own backdrop. Stacked dialogs darken the page
  cumulatively.
- Escape closes the top-most overlay only, also for two dialogs that
  mounted in the same commit.

### Mechanics (web only)

- `src/modal/webModalStackModel.ts`: pure and generic over the layer and
  node types, so `node:test` covers every rule without a DOM:
  - The ordered entry list, where each entry holds a layer and the element
    that opened it, with `top` and `below`.
  - Tree-order insertion: a new layer goes below the first open layer that
    descends from it through the parent links. It takes over that layer's
    opener, and that layer falls back to the dialog beneath.
  - Removal. The layer directly above a removed non-top layer inherits the
    removed layer's opener when its own opener was inside the removed one.
  - The focus-restore target: the opener when it is usable, else the new
    top, else nothing.
  - Page inertness by membership: each page node is background for every
    layer pushed while it was on the page, and is restored when the last of
    those layers is removed.
  - The moves that put the layer roots in stack order.
  - The page-lock transitions on the first push and the last pop.
- `src/modal/webModalRoot.ts`: creates `<div data-firna-modal-root>` under
  `document.body` once, unstyled, so fixed-position layers stay
  viewport-relative, and the frames keep one `z-index`. It returns the
  cached root while it is connected, else finds or creates it, and returns
  `null` without a document.
- `src/liveOverlay.ts`: the owner of the `data-firna-live-overlay` attribute
  name and its `dataSet` key, shared by the stack, the toast viewport, and
  the announcer.
- `src/modal/webModalStack.ts`: the DOM side. `push` snapshots
  `document.activeElement`, records the entry through the model, applies
  the stack, and focuses the layer's initial target when the layer is the
  new top. `remove` applies the stack and then restores focus, so the
  dialog beneath is live before focus lands in it. `apply` marks the page
  nodes, the body children other than the root and the live overlays,
  inert and `aria-hidden` by membership, and remembers each node's
  first-seen prior state. It marks every lower layer root inert and
  `aria-hidden`, clears the top one, and moves misplaced layer roots with
  `insertBefore`, so the node that holds focus never moves. One
  capture-phase keydown listener, installed on the first push and removed
  on the last pop, traps Tab inside the top surface. The stack exposes its
  top layer, so a frame's Escape layer can close it. It calls the scroll
  lock on the first push and the last pop.
- `src/modal/webModalScrollLock.ts`: the page scroll lock from M4. It saves
  the inline overflow and padding values that it touches, hides overflow on
  the root element and the body, pads the body by the width that the hidden
  scrollbar gives back, and restores every saved value.
- `src/modal/webModalFocusTrap.ts`: the focusable selector, the trap, the
  initial-focus target, and the focus helper, moved out of the frame file.
  The helpers take elements, not refs, so the stack can call them.
- `src/modal/useWebModalLayer.ts`: one passive effect on `visible` that
  pushes a layer with its parent from context, root and surface getters,
  the initial focus target, and a close request, and removes it on close.
  It also gives the frame the context value that links nested frames. The
  effect is passive, so a closing overlay returns focus before the push
  records the opener (decision 13).
- `WebModalFrame.web.tsx` portals straight into the shared root, provides
  the layer context to its content, and routes its Escape layer to the
  stack's top dialog. It drops its inert, Tab-trap, and focus-restore
  effects and keeps the sheet height logic. The file falls under the
  300-line limit.
- `WebModalPortal.web.tsx` stays a `document.body` portal, because it is
  public API.
- `ToastViewport.web.tsx` and `announcer.ts` set the live-overlay attribute
  on their body-level nodes.
- Native `WebModalFrame.tsx` is unchanged. iOS presents one sibling `Modal`
  at a time, so a second native dialog must render inside the first.

## Milestone 1: Documentation and protocol

The protocol doc states the stacking requirements and the decisions in force
before the code changes. The parent doc passes the length target, so the
touched contracts move to a new linked page.

- [x] Add `.context/` to `.gitignore`.
- [x] Create `docs/protocol/web-overlays.md`. Move the Modal Contract and the
      Layering Contract there from `shared-ui-components.md`. Add the
      requirements under "Behaviour at the boundary" above, each with its
      decision in force and the rejected alternative. Keep the page under
      250 lines.
- [x] In `docs/protocol/shared-ui-components.md`, replace the moved sections
      with links to the new page. Add one sentence to the Toast Contract that
      links the live-overlay requirement.
- [x] Update `src/modal/README.md`: the stack in Responsibilities, the new
      modules under Key Code, the native sibling-modal note, and the new
      protocol page under Related Docs.
- [x] Update `src/toast/README.md`: the region stays live under dialogs.
- [x] Update the root `README.md`: the modal feature bullet, the
      `@firna/ui/modal` line, and the protocol doc list.
- [x] Correct the stale native note in `docs/consumer-migration.md`, which
      still called `WebModalFrame` web-only.
- [x] Run `npx prettier --check` on the changed Markdown.

## Milestone 2: Stack model, root, and focus-trap modules

Pure and DOM modules land with unit tests and no behaviour change. The frame
still uses its own effects, so the product keeps working.

- [x] Add `src/modal/webModalStackModel.ts` and
      `tests/unit/webModalStackModel.test.ts`: push and remove keep order,
      removing a middle layer keeps the top, `top` and `below` partition,
      restore target resolution, and page-lock transitions only on the first
      push and the last pop.
  - [x] Tree-order insertion: a parent pushed after its descendant goes
        below it and takes over its opener, and siblings keep push order.
  - [x] Opener inheritance when a non-top layer is removed.
  - [x] Page inertness by membership: a node added after the first push is
        restored when the layer that marked it is removed, and a node marked
        by several layers stays inert until the last one is removed.
  - [x] The moves that put the layer roots in stack order.
- [x] Add `src/liveOverlay.ts` with the attribute name and the `dataSet` key.
- [x] Add `src/modal/webModalFocusTrap.ts`. Move the focusable selector,
      `webModalFocusableElements`, `trapWebModalFocus`,
      `webModalInitialFocusTarget`, and `focusWebModalElement` out of
      `WebModalFrame.web.tsx`. Update the source assertions in
      `tests/unit/webModal.test.ts`.
- [x] Add `src/modal/webModalRoot.ts`: idempotent root creation, safe when
      `document` is undefined.
- [x] Add `src/modal/webModalStack.ts` with push, remove, and apply, the
      single Tab listener, the inert bookkeeping, and the focus restore
      order. Add `tests/unit/webModalStack.test.ts` with source assertions in
      the style of `tests/unit/escapeLayer.test.ts`.
- [x] Run `npm test`, `npm run typecheck`, and `npm run typecheck:web`.

## Milestone 3: Frame wiring, live overlays, story, and browser tests

Tags: ui

The frame joins the stack, the toast region and the announcer become exempt,
and a stacked story with browser tests captures findings 1 to 3 before the
wiring lands.

- [x] Add `src/stories/modalStackExample.tsx` and two stories under
      `Modal/Examples`: "Stacked web modals" with a page trigger, a first
      dialog with a text field, an "Open confirm" button, and a "Show toast"
      button, and a confirm dialog with Cancel and Delete; and "Stacked at
      mount", which opens both dialogs in one state update. Wrap the stories
      in a `ToastProvider`. The confirm renders inside the first dialog's
      content in both stories.
- [x] Add `tests/browser/modal-stack.spec.ts` before the wiring, so the
      tests fail first:
  - [x] Tab from Cancel reaches Delete in the confirm dialog (finding 1).
  - [x] The confirm root has no `inert`. The first dialog root and the page
        carry `inert` and `aria-hidden`.
  - [x] Escape closes only the confirm, focus returns to "Open confirm", and
        Tab then moves inside the first dialog.
  - [x] Closing the first dialog restores the page and focuses the page
        trigger.
  - [x] "Stacked at mount" leaves the confirm live (finding 2).
  - [x] A toast raised from the first dialog is not `aria-hidden`, and its
        close button works (finding 3).
  - [x] Two backdrops are present while both dialogs are open.
  - [x] Both dialogs sit in one shared overlay root, in stack order.
  - [x] In "Stacked at mount", the confirm paints above the first dialog and
        holds focus, and Escape closes only the confirm.
  - [x] A toast that was visible before the confirm opened keeps a working
        close button.
  - [x] Delete closes both dialogs and focuses the page trigger.
  - [x] "Stacked at mount" closes in stack order, and its page action
        reopens both dialogs in one update.
- [x] Save the failing run under `.context/web-modal-stack/` and name the
      file here: `m3-failing-run.txt`.
- [x] Add a page action that announces through the shared announcer, and a
      browser test that the announcer region stays live under a dialog.
      Save its failing run before the wiring: `m3-failing-run-announcer.txt`.
- [x] Portal the frame straight into the shared root, and keep
      `WebModalPortal.web.tsx` a `document.body` portal. Add
      `src/modal/useWebModalLayer.ts` with the parent-layer context, and wire
      `WebModalFrame.web.tsx` to it. Route the frame's Escape layer to the
      stack's top dialog. Remove the inert, Tab-trap, and focus-restore
      effects from the frame.
- [x] Update the source assertions in `tests/unit/webModal.test.ts` and
      `tests/unit/escapeLayer.test.ts` for the wired frame.
- [x] Set `data-firna-live-overlay` in `ToastViewport.web.tsx` and
      `announcer.ts`.
- [x] Keep the existing modal browser tests in `tests/browser/storybook.spec.ts`
      green: focus restore with nested dropdowns, footer-action initial focus,
      nested dropdown Escape, and the web sheet.
- [x] Record the snapshot sweep baselines for the new stories with
      `--update-snapshots=missing`, and check that no other baseline changed.
- [x] Run the axe sweep. If it reports `aria-hidden-focus` on a stacked
      story, record the triage here and ask before any baseline entry.
- [x] Smoke test in `npm run storybook`: open the stacked story, Tab, Escape,
      and raise a toast. Save a screenshot under `.context/web-modal-stack/`:
      `m3-smoke.png`. The passing spec run is `m3-passing-run.txt`.
- [x] Add a browser test that fails first: an action that closes a popover
      and opens a dialog in one update returns focus to the popover trigger
      when the dialog closes. The failing run is
      `m3-failing-run-popover.txt`.
- [x] Register the stack layer and the Escape layer in passive effects
      (decision 13), and update their source assertions.
- [x] Export the live-overlay view props from `src/liveOverlay.ts`, and use
      them in both toast files instead of local copies.

## Milestone 4: Page scroll lock

Tags: ui

The stack locks page scroll on the first push and releases it on the last pop.
Own commit, so it can be dropped on its own.

- [x] Add the scrollbar-gutter padding math to `webModalStackModel.ts` with a
      unit test.
- [x] In `webModalStack.ts`, store the `overflow` and `padding-right` of the
      root element and the body on the first push, set `overflow: hidden` on
      both and pad by the scrollbar width, and restore all of them on the
      last pop. iOS Safari ignores the lock on one element alone.
- [x] Move the lock into `src/modal/webModalScrollLock.ts`, so the stack
      module stays near its size target and the milestone reverts as one
      module.
- [ ] Smoke test on iOS Safari by hand, on an iPhone or the iOS Simulator,
      because the browser tests run in Chromium only: open the stacked story
      and try to scroll the page under the sheet with touch. Save the
      evidence under `.context/web-modal-stack/` and name the file here.
      Blocked: the delivery sandbox has no iPhone and no iOS Simulator.
- [ ] When iOS Safari still scrolls the page, fix the body in place instead:
      `position: fixed`, full width, and the saved scroll offset as a negative
      `top`, then restore the offset on the last pop. Keep the offset math in
      `webModalStackModel.ts` with a unit test.
- [x] Give the "Stacked web modals" story tall page content. Add a browser
      test: `overflow` is hidden while a dialog is open and restored after,
      and a fixed-width page element does not shift. The test is
      `tests/browser/modal-scroll-lock.spec.ts`, and its failing run is
      `m4-failing-run.txt`.
- [x] Re-record the "Stacked web modals" snapshot baseline after the tall
      content, and check that no other baseline changed.
- [x] Commit as `feat(modal): lock page scroll while a dialog is open`.
      Committed as `feat(modal): lock page scroll under web dialogs`,
      because the planned title passes the 50-character limit.

## Milestone 5: Verification, commit, and review

- [x] Run `npm run verify` and `cargo xtask check`. One `cargo xtask check`
      run covers both, because it runs `npm run verify`. The log is
      `gate-1.log`.
- [x] Commit with Conventional Commits and push the branch.
- [x] Run `cargo xtask review`, and review the complete local diff against
      `origin/main` with the `implementation-review` skill after the push.
      Report the findings, then apply the review-fix rule: fix the
      `Auto-fix: yes` findings, re-review once, and report the rest.
      `cargo xtask review` failed twice with `model_not_found` for
      `gpt-5.5`, so the skill reviews are the reviews of record:
      `review/review-1.md` and `review/review-2.md`. Finding 1 was fixed in
      `ede2202`, and the re-review found nothing new.
  - 2. Scroll-lock contract overstates layout stability. Severity Medium,
       effort Medium. Recommended: B, reserve the scrollbar gutter during the
       lock and extend each dialog layer over it.
  - Outside the scope: `.storybook/main.ts`: Vite reloads every story page
    when Playwright writes a trace under `.context/`. Separate branch.
  - Outside the scope: `src/button`: `Button` does not forward
    `aria-controls`, so a popover trigger built with it loses the link to
    its popup. Separate branch.
  - Outside the scope: `xtask/src/review.rs`: the review command hardcodes
    `gpt-5.5`, which the configured Codex provider does not serve.
    Separate branch.

## Post-merge follow-up (non-blocking)

- [ ] Release the package through release-please, expected `4.1.0`.
- [ ] In `futex-ai/accounting`: bump `@firna/ui`, remove the `Activity` hiding
      in `DeferredProductSettings.tsx` and the wait-for-acknowledgement
      sequencing, update `docs/protocol/settings-dialog.md` and
      `docs/protocol/command-palette.md`, and add a browser test for a palette
      form over the Settings dialog.
- [ ] Compare the stacked backdrop look with the app mockups that draw a
      form over the Accounts list, and revisit decision 3 if they differ.
