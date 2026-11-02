# Web modal stack

Status: Active. [PR #179](https://github.com/futex-ai/ui/pull/179) is open. Milestones 1 to 5 and 7
are done. Decision 16 moved the work of milestone 6 to follow-up items. The next commit deletes this
plan.

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

## User decisions (2026-11-01)

Cal answered the two open items of 2026-10-20:

14. **Fixed elements stay in place: reserve the scrollbar gutter.** Option B
    of review finding 2. While the lock is on, the root element keeps its
    scrollbar gutter with `scrollbar-gutter: stable` instead of padding the
    body, so fixed-position elements do not move. Each dialog backdrop
    covers the reserved gutter. Body padding stays as the fallback where
    the browser has no `scrollbar-gutter`. Chosen over limiting the
    requirement to content in the normal flow (option A), which accepted
    the movement, and over publishing the gutter width so that consumers
    pad their own fixed elements (option C), which added a public contract
    and work for each consumer.
15. **The iOS Safari check moves after the merge.** Option C. The manual
    iOS Safari check and its conditional `position: fixed` fallback move
    from milestone 4 to the post-merge follow-up, so the scroll lock ships
    unverified on iOS Safari. Chosen over a check on a device before the
    merge (option A), and over the fallback without device evidence
    (option B), which can make the page jump for every consumer.

## User decisions (2026-11-02)

16. **Items 5 and 6 stay as follow-up items.** Cal kept both open items as
    follow-ups instead of answering them in this branch. The work of
    decision 14 waits for them, so milestone 6 moves to
    `plans/follow-ups/scroll-lock-moves-fixed-elements.md`, and this branch
    merges with the padding lock of milestone 4. Item 5 is
    `plans/follow-ups/scroll-lock-gutter-strip.md`, and item 6 is
    `plans/follow-ups/scroll-lock-moves-sticky-headers.md`.

## Open decisions (2026-11-01)

Milestone 6 found that decision 14 cannot ship as written. The ui implementor
probed it in Chromium 148 with real scrollbars. The evidence is in
`.context/web-modal-stack/m6-probe.txt`. The options check of item 5 added
options F and G and corrected B, C, and E. It also found item 6. Its probes are
in `.context/web-modal-stack/test-results/options-check/`. Both items wait for
the user and block milestones 6 and 7.

### 5. Chromium cannot dim the reserved scrollbar gutter

- **Severity:** High. **Effort:** Medium.
- **Source:** Implementation.
- **Category:** Docs or spec.
- **Location:** `src/modal/webModalScrollLock.ts:26`, `src/modal/webModalFrameStyles.ts:68`, and decision 14 in this plan.
- **Terms:**
  - **Gutter:** the strip at the right edge of the window where a classic scrollbar sits, 15 px wide here. Overlay scrollbars on macOS and phones take no gutter.
  - **Reserved gutter:** the gutter that stays empty after the lock hides the scrollbar, because the root element has `scrollbar-gutter: stable`.
  - **Canvas colour:** the colour that the browser paints behind the whole page. It comes from the root element, or from the body when the root has none.
- **Background:**
  - Decision 14 chose option B of item 2: the lock reserves the gutter so that fixed-position elements do not move, and each dialog backdrop covers the reserved gutter.
  - Reserving the gutter works in Chromium. A fixed box at the right edge stays at x = 845, and content in the normal flow stays in place too.
  - No element can paint into a reserved gutter. A wider layer, a box shadow, an outline, a top-layer popover, and a native `<dialog>` backdrop all leave the strip in the page colour. Only the canvas colour shows there. A click in the strip reaches `html`, not the backdrop.
  - React Aria, Adobe's accessibility-focused React library, reserves the gutter in the same way and leaves the same strip.
- **Problem:** The two parts of decision 14 conflict in Chromium. The lock can keep fixed elements still, or the backdrop can cover the whole window, but not both.
- **Impact if no action:** Milestones 6 and 7 wait, and so does the merge of PR #179. Fixed elements at the right edge keep moving by the scrollbar width.
- **Root question:** While a dialog is open on a page with a classic scrollbar, what does the window edge show, and which page elements may move?
- **Options:**
  - **A.** Keep the current padding and reserve no gutter. The backdrop covers the whole window. Fixed elements at the right edge move by the scrollbar width, which decision 14 rejected. Effort: Small.
  - **B.** Reserve the gutter and leave the strip uncovered. Every page element stays still when the lock hides the root overflow alone, which item 6 decides. The strip keeps the page colour, and a click there does nothing. A centered dialog sits 7.5 px left of the window center, and a bottom sheet ends at the strip. Effort: Medium.
  - **F.** Drop the page scroll lock. Revert its commit `57e63c1` and its docs. The page scrolls under the backdrop again, as on `origin/main`, and the live scrollbar stays undimmed at the edge. F reverses decision 2. Effort: Medium.
  - **C.** Reserve the gutter and tint the strip through the canvas colour. The lock computes the dimmed colour at each open and close, and it paints the page colour as a root background image, so only the strip gets the dim colour. It needs one plain page colour, and it rests on a Chromium paint rule that no spec states. Effort: Large.
  - **D.** Keep the padding and move each fixed element at the right edge by the scrollbar width. The lock writes inline styles on consumer elements, and it misses elements that appear later. Effort: Large.
  - **E.** Keep the scrollbar visible but inert. Fix the body in place at its scroll offset, and force a scrollbar on the root element. Fixed and sticky elements stay still, and the edge shows a normal scrollbar track that cannot scroll. When the lock starts, the page scroll offset becomes 0, and consumer scroll listeners see a scroll event. The unlock must restore the offset. E also reverses decision 15, which kept the `position: fixed` body out of this change before the merge. Effort: Large.
  - **G.** Do E, and set the track colour of the root scrollbar to the dimmed page colour for the number of open dialogs. In the probe, the strip matched the backdrop for one dialog and for two. It costs E plus the colour work of C. Effort: Large.
- **Left out:**
  - A layer that covers the strip: Chromium paints no element there, so it fails the goal.
  - Publish the scrollbar width for consumers: decision 14 rejected it for its public contract and consumer work, and that reason still holds.
  - Keep the scrollbar and block wheel, touch, and key scrolling: a user can still drag the scrollbar, so the page scrolls.
  - Snap the page back in a scroll listener: Chromium scrolls on its compositor thread, so the user sees the scrolled frame first.
  - Reserve the gutter only on pages where a fixed element would move: a toast raised from the dialog then moves when the dialog closes.
  - Move the fixed elements that consumers mark with a class, as MUI and Radix do: decision 14 chose against a public contract and work for each consumer.
- **Wider fix:** F. The lock now has three side effects: fixed elements move, the strip shows, and sticky elements move. Only F removes that class, and it reverses decision 2.
- **Previous examples:** React Aria's `usePreventScroll` ships option B. Item 2 raised the movement of fixed elements under option A.
- **Related:**
  - Item 2, the same code: this item revises the option B that the user chose for item 2.
  - Item 6, the same code: under option B, every page element stays still only with option A of item 6.
- **Recommendation:** B. It keeps every page element still, which is the aim of decision 14, at Medium effort, and an established accessibility library ships the same trade-off. F best protects the codebase, but it reverses decision 2.
- **Action:** ask the user, because the options have real trade-offs. No option keeps fixed elements still and also covers the whole window in Chromium, and decision 14 asked for both.

### 6. The lock moves stuck sticky headers out of view

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Small.
- **Source:** Implementation.
- **Category:** Product bug.
- **Location:** `src/modal/webModalScrollLock.ts:40`.
- **Terms:**
  - **Sticky element:** an element with `position: sticky`, such as a header that stays at the top of the window while the page scrolls.
- **Background:**
  - The lock sets `overflow: hidden` on the root element and on the body.
  - The body part came from the iOS Safari TODO that the user approved on 2026-10-19, because iOS Safari was said to ignore the lock on one element alone. Nobody has verified this, and decision 15 moved the iOS check after the merge.
  - With `overflow: hidden` on both elements, the body becomes the scroll container of the page content. A sticky element then sticks to the body, which has not scrolled, instead of to the window.
  - React Aria hides only the root overflow on desktop browsers, and it handles iOS Safari in a separate code path.
- **Problem:** When a dialog opens on a scrolled page, a sticky header that was stuck at the top moves out of view, and it comes back when the dialog closes. In the stacked story with a sticky header, it moved from y = 0 to y = −284.
- **Impact if no action:** In apps with a sticky header, the header disappears under the backdrop each time a dialog opens on a scrolled page.
- **Root question:** How does the lock stop page scrolling without moving sticky page elements?
- **Options:**
  - **A.** Hide only the root overflow, as React Aria does. Sticky elements stay stuck, and in the probe the wheel still did not scroll the page. The iOS Safari reason for the body overflow stays unverified until the iOS follow-up runs. Effort: Small.
  - **B.** Keep both, and allow the movement in the protocol: sticky page elements can move while a dialog is open. Effort: Small.
  - **C.** Hide the body overflow only in iOS Safari, which the code finds from the user agent. User-agent detection is fragile. Effort: Medium.
- **Left out:** Fix the body in place at its scroll offset: that is option E of item 5.
- **Wider fix:** None in this item. Option F of item 5 drops the lock and removes the class of lock side effects.
- **Previous examples:** Item 2 and item 5 are other side effects of the same lock.
- **Related:** Item 5, the same code, and work that waits for the answer. Under options E, F, or G of item 5, this item falls away. Under option B of item 5, every page element stays still only with option A of this item.
- **Recommendation:** A. The sticky defect is shown in Chromium, the iOS benefit of the body overflow is not, and the iOS follow-up already plans a proper fallback.
- **Action:** ask the user, because option A reverses the iOS Safari TODO that the user approved on 2026-10-19, which hides the overflow of both the root element and the body.

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
  does not shift the layout. Fixed-position elements stay in place too, where
  the browser supports a stable scrollbar gutter (decision 14).
- Each dialog backdrop covers the whole window, also a reserved scrollbar
  gutter. Item 5 is open, because Chromium cannot paint into a reserved
  gutter.
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
- `src/modal/webModalScrollLock.ts`: the page scroll lock. It saves the
  inline values that it touches, hides overflow on the root element and the
  body, and restores every saved value on the last pop. Item 6 is open on
  the body overflow. From M6, it
  reserves the gutter with `scrollbar-gutter: stable` on the root element,
  and it pads the body by the width that the hidden scrollbar gives back
  only where the browser has no `scrollbar-gutter`.
- My call (2026-11-01): the lock reserves the gutter only when the page
  shows a classic scrollbar when the first dialog opens. A stable gutter
  also reserves space on a page that does not overflow, so a short page
  would move left by the gutter width.
- My call (2026-11-01): the page-scroll requirements concern the vertical
  page scrollbar, as the M4 design did. No browser feature reserves the space
  of a horizontal scrollbar, so the protocol names the vertical scrollbar and
  says nothing about a horizontal one.
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

## Milestone 6: Reserve the scrollbar gutter

Tags: ui

Depends on: Milestone 4.

Decision 14: fixed-position page elements stay in place when the scroll lock
hides the scrollbar, and each backdrop covers the reserved gutter. It fixes
review finding 2. Items 5 and 6 block this milestone: Chromium cannot paint
into a reserved gutter, and the lock moves stuck sticky headers.

Decision 16 moved this milestone to the follow-up items before it started. Its
TODOs, the user answer of 2026-11-01, and the design calls are in
`plans/follow-ups/scroll-lock-moves-fixed-elements.md`. No code of this
milestone landed.

## Milestone 7: Verification, review, and plan deletion

Depends on: Milestone 6.

The change gets its gate and its review. Then the last commit deletes this
plan, and the pull request description keeps its dated record.

- [x] Run each new or changed browser test 10 times, and record the pass
      counts under `.context/web-modal-stack/`. No browser test changed
      after the 10-run check of 2026-11-01: `repeat-10.txt`.
- [x] Run `cargo xtask check`. CI ran it on `d6cc5b7` and passed. No code
      changed after that commit.
- [x] Commit with Conventional Commits and push the branch.
- [x] Review the complete local diff against `origin/main` with the
      `implementation-review` skill after the push: a review by the
      `first-pass review agent`, then one finding check for each new
      finding. Apply the fix rule: fix the `fix now` findings, record a
      follow-up item for each other finding, re-review once, and report.
      No code changed after review round 2 at `ede2202`, so no new round
      ran.
- [x] Delete this plan, as "Deleting the plan" in the `plans` skill says:
      turn each post-merge task into a follow-up item, check that the
      protocol docs hold each decision in force, replace links to the plan
      with permalinks, and delete it in the last commit. The commit after
      this one deletes it.
- [x] Update the description of PR #179: each user decision and design call
      with its date, a permalink to the plan at the commit before the
      deletion, and each follow-up item that the change adds or deletes.
      Push.

## Post-merge follow-up (non-blocking)

- [ ] Smoke test on iOS Safari by hand, on an iPhone or the iOS Simulator,
      because the browser tests run in Chromium only: open the stacked story
      and try to scroll the page under the sheet with touch. Moved from
      milestone 4 by decision 15. Follow-up item:
      `plans/follow-ups/ios-safari-scroll-lock-check.md`.
- [ ] When iOS Safari still scrolls the page, fix the body in place instead:
      `position: fixed`, full width, and the saved scroll offset as a negative
      `top`, then restore the offset on the last pop. Keep the offset math in
      `webModalStackModel.ts` with a unit test. Moved from milestone 4 by
      decision 15. Follow-up item:
      `plans/follow-ups/ios-safari-scroll-lock-check.md`.
- [ ] Release the package through release-please, expected `4.1.0`.
      Follow-up item: `plans/follow-ups/release-web-modal-stack.md`.
- [ ] In `futex-ai/accounting`: bump `@firna/ui`, remove the `Activity` hiding
      in `DeferredProductSettings.tsx` and the wait-for-acknowledgement
      sequencing, update `docs/protocol/settings-dialog.md` and
      `docs/protocol/command-palette.md`, and add a browser test for a palette
      form over the Settings dialog. Follow-up item:
      `plans/follow-ups/adopt-web-modal-stack-in-accounting.md`.
- [ ] Compare the stacked backdrop look with the app mockups that draw a
      form over the Accounts list, and revisit decision 3 if they differ.
      Merged into `plans/follow-ups/adopt-web-modal-stack-in-accounting.md`.
