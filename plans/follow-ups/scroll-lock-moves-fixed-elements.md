# Scroll lock still moves fixed page elements

- **Severity:** Medium. **Effort:** Medium. **Confidence:** High. **Harder later:** Yes.
- **Kind:** Needs decision.
- **Added:** 2026-11-01, from `calummoore/palette-forms-overlay-discussion`, review finding 2.
- **Location:** `src/modal/webModalScrollLock.ts:41` and `docs/protocol/web-overlays.md:134`.
- **Reason:** The chosen fix waits for the open decision item `plans/follow-ups/scroll-lock-gutter-strip.md`, because Chromium cannot draw a backdrop over a reserved gutter.

- **Terms:**
  - **Web modal stack:** the internal list of open web dialogs in `src/modal/webModalStack.ts`. Only its top dialog takes input.
  - **Scroll lock:** the code in `src/modal/webModalScrollLock.ts` that stops the page from scrolling while a web dialog is open.
  - **Gutter:** the strip at the right edge of the page where a classic scrollbar sits, 15 px wide in Chromium on Linux and Windows. Overlay scrollbars, the default on macOS and iOS, take no gutter.
  - **Fixed-position element:** an element with `position: fixed`, such as a sticky header or a floating button. The browser places it against the viewport, not the page.
- **Background:**
  - `WebModalFrame` is the dialog of the `@firna/ui` library. On web, each open dialog joins the web modal stack.
  - When the first dialog opens, the scroll lock sets `overflow: hidden` on the root element and the body. Without a scrollbar, the page gets the gutter back, so content would move right by the gutter width.
  - To stop that move, the lock pads the body on the right by the width that the hidden scrollbar gave back. It measures `document.documentElement.clientWidth` before and after the overflow change. When the last dialog closes, it restores every inline value that it changed.
  - `docs/protocol/web-overlays.md`, section "Page Scroll", requires this: "Removing the page scrollbar does not shift the layout."
- **Problem:** Body padding moves only the content in the normal flow. A fixed-position element places itself against the viewport, so the padding does not reach it. In Chromium with a 15 px classic scrollbar, a fixed element pinned to the right edge moved from x = 845 to x = 860 when a dialog opened.
- **Impact if no action:** On browsers with classic scrollbars, fixed headers and floating buttons jump by the gutter width each time a dialog opens and closes. The protocol promises more than the code does.
- **Root question:** How does the page keep every element, also a fixed-position element, in place when the scroll lock hides the scrollbar?
- **Options:**
  - **A.** Limit the requirement to content in the normal flow. Change the protocol line and the modal README. Fixed elements keep moving. Effort: Small.
  - **B.** Reserve the gutter instead of padding the body. Set `scrollbar-gutter: stable` on the root element during the lock, and restore its earlier value on unlock. Each dialog backdrop covers the reserved gutter. Keep the padding for browsers without `scrollbar-gutter`. Effort: Medium.
  - **C.** Keep the padding. Publish the gutter width as a CSS custom property while the lock is on, so that consumers pad their own fixed elements. This adds a public contract and work for each consumer. Effort: Small.
- **Left out:**
  - Keep the scrollbar and block wheel and touch scrolling with listeners: it fails the goal, because a user can still drag the visible scrollbar.
  - Fix the body with `position: fixed` and a negative `top`: it hides the scrollbar in the same way, so fixed elements still move.
- **Wider fix:** None. The `documentation` skill already keeps the protocol and the code aligned.
- **Previous examples:** None found.
- **Related:**
  - `plans/follow-ups/scroll-lock-gutter-strip.md`: the decision item of this work. In Chromium no element can paint into a reserved gutter, so option B cannot keep both of its promises. This work waits for its answer.
  - `plans/follow-ups/scroll-lock-moves-sticky-headers.md`: the same code. With a reserved gutter, every page element stays still only when that item takes its option A.
  - `plans/follow-ups/ios-safari-scroll-lock-check.md`: the same code. A `position: fixed` fallback from that task must work with this fix.
- **Recommendation:** B. The user chose it on 2026-11-01. It keeps all content still with no consumer work, so the protocol stays true as written.
- **Action:** ask the user, because the work depends on the open decision item `plans/follow-ups/scroll-lock-gutter-strip.md`.
- **User answers:**
  - 2026-11-01: option B. Reserve the gutter so that fixed elements stay still, let each backdrop cover the reserved gutter, and keep body padding as the fallback where the browser has no `scrollbar-gutter`.
  - 2026-11-02: keep the open strip decision and the sticky-header problem as follow-up items. So the branch that found this problem merged with the padding lock, and this work moved here.
- **Design calls:**
  - 2026-11-01: reserve the gutter only when the page shows a classic scrollbar when the first dialog opens, that is a gutter width above 0. A stable gutter also reserves space on a page that does not overflow, so a short page would move left.
  - 2026-11-01: measure the gutter as `window.innerWidth - document.documentElement.clientWidth` before any style change. After the change, Chromium reports a `clientWidth` of 900 px although the gutter stays reserved, so a later measure misses the gutter.
  - 2026-11-01: change nothing when the page already sets a `scrollbar-gutter` other than `auto`. The page then reserves the space itself, and writing `stable` over `stable both-edges` would remove the left gutter and move the page.
  - 2026-11-01: detect the browser support with `CSS.supports("scrollbar-gutter", "stable")`.
  - 2026-11-01: the page-scroll requirements cover the vertical page scrollbar only. No browser feature reserves the space of a horizontal scrollbar, so the protocol names the vertical scrollbar and says nothing about a horizontal one.
- **Work:**
  1. Get the answer to `plans/follow-ups/scroll-lock-gutter-strip.md`, and record it here with its date.
  2. Update `docs/protocol/web-overlays.md`, sections "Page Scroll" and "Layering Contract", and the scroll-lock lines of `src/modal/README.md`. Give the decision in force with its rejected options.
  3. Add a browser test with real scrollbars that fails first: a fixed element pinned to the right edge keeps its position when a dialog opens. `tests/browser/modal-scroll-lock.spec.ts` already launches Chromium with `launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] }` and checks that the gutter is above 0. A product-like fixed element in the "Stacked web modals" story, such as a floating help button, is a good fixture. Re-record only that story's two snapshot baselines.
  4. Add `scrollbar-gutter` on the root element to the exact-restore check of that spec.
  5. Add the pure choice of the lock mechanism to `src/modal/webModalStackModel.ts`, with unit tests in `tests/unit/webModalStackModel.test.ts`: reserve the gutter, pad the body, or change nothing, from the gutter width, the browser support, and the page's own `scrollbar-gutter`.
  6. Implement the lock in `src/modal/webModalScrollLock.ts`. Save and restore each inline value that it touches, with its priority.
  7. Keep the scroll-lock, modal stack, Storybook, snapshot, and axe tests green. Run each new or changed browser test 10 times.
  8. Smoke test with real scrollbars, and look at the right edge of the window.
  9. Delete this item and its decision item in the branch that ships the fix.
