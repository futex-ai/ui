# Check the dialog scroll lock on iOS Safari

- **Severity:** Medium. **Effort:** Medium. **Confidence:** Medium. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-02, from `calummoore/palette-forms-overlay-discussion`, pull request #179.
- **Location:** `src/modal/webModalScrollLock.ts`.
- **Reason:** On 2026-11-01 the user moved this check after the merge, because the agent had no iPhone and no iOS Simulator.

- **Terms:**
  - **Scroll lock:** the code in `src/modal/webModalScrollLock.ts` that stops the page from scrolling while a web dialog is open.
  - **iOS Simulator:** Apple's iPhone simulator. It runs on a Mac with Xcode.
- **Background:**
  - While a web dialog is open, the scroll lock sets `overflow: hidden` on the root element and the body. iPhones use overlay scrollbars, so the gutter and padding parts of the lock do nothing there.
  - `docs/protocol/web-overlays.md` requires this: "The page does not scroll while a dialog is open."
  - WebKit bug reports say that iOS Safari does not always honor `overflow: hidden` on the page for touch scrolling. See [bug 153852](https://bugs.webkit.org/show_bug.cgi?id=153852) and [bug 240859](https://bugs.webkit.org/show_bug.cgi?id=240859).
  - The browser tests in `tests/browser/` run in Chromium only, so no test covers iOS Safari.
  - The user chose to ship the scroll lock unverified on iOS Safari and to run this check after the merge.
- **Task:**
  1. Start Storybook with `npm run storybook`, and make it reachable from the iPhone or the iOS Simulator.
  2. Open the story "Modal/Examples" → "Stacked web modals" in iOS Safari. Its page scrolls, because it has a long list of recent activity.
  3. Open the "Manage account" dialog. Then drag the page outside the dialog with a finger, and try to scroll it. Also try with the bottom-sheet placement, in the story "Bottom-sheet web modal".
  4. Record the result with screenshots or a screen recording.
  5. When the page scrolls, fix the body in place while the lock is on: `position: fixed`, full width, and the saved scroll offset as a negative `top`. Restore the scroll offset when the last dialog closes. Put the offset arithmetic in `src/modal/webModalStackModel.ts` with a unit test. Keep the gutter reservation for desktop browsers.
- **Impact if no action:** On iPhones, the page may scroll under an open dialog, against the protocol requirement.
- **Needs:** an iPhone, or a Mac with Xcode and the iOS Simulator, and a Storybook server that the device can reach.
- **Done when:** the check ran in iOS Safari, and either the page did not scroll, or the fallback landed with its unit test and the page no longer scrolls.
- **Related:**
  - `plans/follow-ups/scroll-lock-moves-sticky-headers.md`: when that item drops the body overflow, check that lock in iOS Safari.
  - `plans/follow-ups/scroll-lock-gutter-strip.md`: its option E is the same `position: fixed` body that this task would add.
  - `plans/follow-ups/scroll-lock-moves-fixed-elements.md`: the fallback must work with the gutter reservation of that work.
