# Check drag select with macOS overlay scrollbars

- **Severity:** Medium. **Effort:** Small. **Confidence:** Medium. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-06, from the branch `calummoore/dragselectableprovider-improvements`.
- **Location:** src/drag-select/dragSelectableScrollbar.ts:23, src/drag-select/dragSelectableScrollbar.ts:53, docs/protocol/drag-select.md:94
- **Reason:** On 2026-11-06 the user moved this manual check from before the merge to after it, so the check runs on the Storybook of `main`.

- **Terms:**
  - **Drag select:** the rubber-band ("marquee") selection of `@firna/ui/drag-select`. A press and a drag draw a box, and the release selects the rows that the box touches. `DragSelectableProvider` owns the gesture and the selection.
  - **Classic scrollbar:** a scrollbar that takes layout space beside the content, as in Chrome on Windows and Linux, and on macOS when System Settings → Appearance → Show scroll bars is "Always".
  - **Overlay scrollbar:** a scrollbar that takes no layout space and shows over the content while the user scrolls. macOS uses it when Show scroll bars is "When scrolling", and by default when no mouse is connected.
  - **Page shell story:** the story "Page shell" of "Drag Select/Examples" in the `@firna/ui` Storybook, from `src/stories/dragSelectPageShellExample.tsx`. A sidebar sits outside the provider, and the provider is the scrolling main column, with `data-testid="page-shell-main"`. Its Transactions page lists 30 rows, and its status line shows "Selected N rows".
- **Background:**
  - On 4.0.0, a drag of the scrollbar of a scrolling provider started a drag select, and the release replaced the selection with no rows. A Chrome test of an app shell, with the provider as its main column, found this problem.
  - The start rules in `docs/protocol/drag-select.md` ignore a press on a scrollbar. The overlay-scrollbar rule is: a press within 16px of the far edge of a scroll container whose scrollbar takes no space starts no drag. The far edge is the right edge for vertical scrolling, the left edge for right-to-left content, and the bottom edge for horizontal scrolling. The rule applies only when the content overflows on that axis. It does not apply when the container hides its scrollbar.
  - The unit tests in `tests/unit/dragSelectGeometry.test.ts` check the scrollbar rule on sizes that each test supplies: a press on a classic scrollbar, the 16px zone at the right edge (16px from the edge is in the zone, 17px is not), the left edge for right-to-left content, the bottom edge for horizontal scrolling, no zone for a hidden scrollbar or for content that does not overflow, and the zone at the edge of the document.
  - The browser tests run Playwright with Chromium on Linux. CI runs them on `ubuntu-latest`, through `cargo xtask check`. Headless Chromium hides scrollbars by default, with the launch flag `--hide-scrollbars`. So each scroll container takes no scrollbar space, as with overlay scrollbars, but it shows no scrollbar to drag.
  - `tests/browser/drag-select-scrollbar.spec.ts` removes that flag to get classic scrollbars. It drags the classic scrollbar thumb of the page shell story and checks that a 3-row selection stays.
  - No browser test drags an overlay scrollbar or presses in the 16px zone, and CI runs no test on macOS. So no test shows what Chrome on macOS does with a press on its overlay scrollbar: whether the page receives the press, and whether the thumb is within 16px of the edge. When the drag-select branch reproduced the 4.0.0 problems in headless Chrome 155 on Linux, the flag `--enable-features=OverlayScrollbar` did not change the layout. So the branch could not reproduce macOS overlay scrollbars.
  - The branch required this check before the merge. On 2026-11-06 the user moved it to after the merge.
  - The workflow "Storybook", in `.github/workflows/storybook.yml`, deploys the Storybook of `main`. Its job "Deploy Main Storybook" runs on each push to `main`. It builds Storybook with `npm run storybook:build`, and deploys the folder `storybook-static` to the Cloudflare Pages project `futex-ui-storybook`, with the branch `main`. The workflow file does not state the address of that deployment. The section "Storybook Deployments" of the root `README.md` gives it as `https://futex-ui-storybook.pages.dev`.
- **Task:**
  1. On a Mac, set System Settings → Appearance → Show scroll bars to "When scrolling". Quit Chrome and open it again.
  2. In Chrome, open the page `iframe.html?id=drag-select-examples--page-shell` at the Storybook address of `main`. That page shows the page shell story without the Storybook frame. Make the window short enough that the main column scrolls.
  3. Check that the scrollbar takes no space. In the DevTools console, run `const m = document.querySelector('[data-testid="page-shell-main"]'); m.offsetWidth - m.clientWidth`. The result must be `0`. A result above `0` means classic scrollbars, so correct step 1 first.
  4. Press on the text of row 1, drag down to row 3, and release. The status line shows "Selected 3 rows".
  5. Scroll the main column a little with the trackpad, so that the overlay scrollbar shows. Press its thumb at the right edge of the main column, and drag it down.
  6. The check passes when the column scrolls, no selection box shows, and the status line still shows "Selected 3 rows".
  7. Record the macOS version, the Chrome version, and the result, with a screen recording, in the pull request that deletes this item.
  8. When the check fails, add a follow-up item with the recording and the width of the overlay thumb. A change of the 16px zone, or of another part of the overlay rule, changes a requirement in `docs/protocol/drag-select.md`, so that item has the kind Needs decision.
- **Impact if no action:** On Macs with overlay scrollbars, a drag of the scrollbar can still clear the selection, which is the 4.0.0 problem, and nobody knows it until a user finds it.
- **Needs:** a Mac with Chrome, and the drag-select change merged on `main`, with the job "Deploy Main Storybook" complete for that push. Without the deployed Storybook, run `npm ci` and `npm run storybook` on a checkout of `main`, and use the address `http://localhost:6006`.
- **Done when:** in Chrome on macOS with overlay scrollbars, a drag of the scrollbar thumb of the page shell story scrolls the column and keeps the selection, and the result is recorded. Or the check failed, and a follow-up item records the failure.
- **Related:** `plans/follow-ups/accounting-shell-drag-select-check.md`: that task repeats this check in the accounting app.
