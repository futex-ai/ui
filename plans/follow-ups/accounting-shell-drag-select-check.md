# Check accounting shell drag select on 5.0.0

- **Severity:** Medium. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-06, from the branch `calummoore/dragselectableprovider-improvements`.
- **Location:** None. The work is in the repository `futex-ai/accounting`.
- **Reason:** The accounting app can test the drag-select fixes only with the published `@firna/ui` 5.0.0, and npm gets 5.0.0 only after the merge.

- **Terms:**
  - **Drag select:** the rubber-band ("marquee") selection of `@firna/ui/drag-select`. A press and a drag draw a box, and the release selects the rows that the box touches.
  - **Provider:** `DragSelectableProvider`, the element that owns the drag gesture and the selection of the rows inside it.
  - **Page hook:** `useDragSelectableOptions`. A page calls it to set the options of the nearest provider, for example to turn the provider on, or to own the selection with `selectedIds` and `onSelectedIdsChange`.
  - **Main column:** the scrolling column of the app shell, beside the sidebar, that shows the current page.
  - **Classic scrollbar:** a scrollbar that takes layout space beside the content, as in Chrome on Windows and Linux, and on macOS when System Settings → Appearance → Show scroll bars is "Always".
  - **Overlay scrollbar:** a scrollbar that takes no layout space and shows over the content while the user scrolls. macOS uses it when Show scroll bars is "When scrolling", and by default when no mouse is connected.
- **Background:**
  - The 4.0.0 provider was built to wrap one list. The accounting app wants one provider around every page of its shell, so that a drag can start anywhere in the main column.
  - The user tested that layout in Chrome on 4.0.0. A sidebar was outside the provider, and the provider was the scrolling main column. The centered page content had a title, a paragraph, and rows that each held a library `Button`.
  - That test found text highlighting during a drag, scrollbar drags that cleared the selection, drags that failed after a button press, an empty "0 items" box on pages without rows, a page-wide "group" for screen readers, a fixed "Select" label, and no way for the app to own the selection.
  - When `@firna/ui` reproduced that layout, it recorded 13 problems in all, listed under **Task**. Problems 1, 2, 5, 6, 7, 8, and 9 are the ones that the Chrome test found. 5.0.0 fixes all 13. Before the merge, a smoke test repeated each problem on the "Page shell" story of "Drag Select/Examples" in the `@firna/ui` Storybook, and all 13 were fixed.
  - The "Page Shell" section of `src/drag-select/README.md` in `@firna/ui` shows the shell pattern. The shell makes its main column the provider, keeps it off with `disabled`, and names the current page with `selectionScope`, so that each page starts with an empty selection. Each page turns the provider on and sets its options with the page hook.
  - The provider renders one element that takes `style` and `testID`. Its `role` prop takes only `group`, `list`, or `none`. Without an `accessibilityLabel` or a `role`, the element has no role.
  - 5.0.0 changes some drag-select defaults. `docs/consumer-migration.md` in `@firna/ui`, under "Drag Select (5.0)", lists each change and the option that restores the 4.x behavior.
  - Server-rendered HTML uses only the provider props. The options of a page hook apply in the browser, so a selection that a page sets with the page hook shows after hydration. `docs/protocol/drag-select.md` in `@firna/ui` states this rule.
  - The accounting app on 2026-11-06:
    - `ts/app/package.json` depends on `@firna/ui` `^4.0.0`. That range does not accept 5.0.0.
    - On web, `ts/app/src/components/shell/ProductShell.tsx` renders the main column as a `ScrollView` with `role="main"`. The provider has no `main` role, so it cannot take the place of that element.
    - `ts/app/src/screens/product/TransactionsScreen.tsx` has its own drag selection, from `ts/app/src/screens/product/transactionsDragSelection.ts`, with the test `ts/app/src/__tests__/transactionsDragSelection.test.ts`. The app plan `plans/firna-ui-adoption-gaps.md` says that it may map onto `@firna/ui/drag-select`.
    - `ts/app/app.json` sets the web `output` to `static`, so a build renders the web pages to HTML ahead of time. The server-rendering rule above applies to that HTML.
- **Task:**
  1. In the accounting app, change the `@firna/ui` range in `ts/app/package.json` to `^5.0.0`, and install it.
  2. Make the main column of the shell the provider, as the "Page Shell" section of the drag-select README shows. Set `selectionScope` to the current route.
  3. On each page with rows to select, turn the provider on with the page hook, and make each row a target with `useDragSelectableTarget`. The Transactions screen has its own drag selection. Use the provider in its place, so that only one drag gesture runs on that page. That removes behavior from the app, so get the approval of the user first.
  4. In Chrome, repeat the original test on the pages of the shell. Use a page with many rows, such as Transactions, and a page without rows. Check each problem below:
     1. **Text highlight.** On 4.0.0, every drag highlighted text. Expected: a drag highlights no text from its start to the release. A double-click or a triple-click still selects text.
     2. **Scrollbar drag.** On 4.0.0, a drag of the scrollbar of the main column cleared the selection. Expected: the column scrolls, no box shows, and the selection stays. Check with classic scrollbars, and on a Mac with overlay scrollbars. With overlay scrollbars, a press within 16px of the right edge of the column starts no drag.
     3. **Control-drag.** On 4.0.0, a drag with Control held started. Expected: Control and Alt start no drag. Shift adds the rows to the selection, and Command toggles them.
     4. **Drag from a row button.** On 4.0.0, a drag from a button inside a row did not start. Expected: the drag starts after 10px of movement, and the button does not fire. A click without movement still activates the button.
     5. **Drag after a press.** On 4.0.0, the next drag failed after a press on a button or a row. A drag that started on highlighted text also failed. Expected: both drags start and select rows.
     6. **Page without rows.** On 4.0.0, a drag on a page without rows showed an empty "0 items" box. Expected: no box shows.
     7. **Page-wide group.** On 4.0.0, screen readers announced the whole main column as a "group". Expected: the main column has no role, unless the provider gets an `accessibilityLabel` or a `role`. Check the accessibility tree in Chrome DevTools.
     8. **"Select" label.** On 4.0.0, the box always showed "Select". Expected: the box shows only the count badge, unless the app sets `marqueeLabel`.
     9. **App-owned selection.** On 4.0.0, the app could not own the selection. Expected: a page that passes `selectedIds` through the page hook shows that selection. Each drag and each selection key calls `onSelectedIdsChange` with the proposed ids, and the rows change only when the page applies them.
     10. **Scroll during a drag.** On 4.0.0, a scroll during a drag selected the wrong rows. Expected: a wheel scroll during a drag keeps the start point on its row, and the release selects the rows from the start row to the pointer.
     11. **Click after a drag.** On 4.0.0, a drag sent a click, so a drag that ended on a row opened that row. Expected: the click after a drag is swallowed. A plain click still opens the row.
     12. **Auto-scroll.** On 4.0.0, a drag had no edge auto-scroll once text selection was blocked. Expected: during a drag, with the pointer within 36px of the top or the bottom edge of the main column, or beyond it, the column scrolls and the drag extends.
     13. **Measurement on each press.** On 4.0.0, every press measured every row, also a plain click. Expected: a press without movement measures no row. A manual test cannot see this. The unit test "drag-select measures the targets at the start, not at the press" in `tests/unit/dragSelectSession.test.ts` of `@firna/ui` covers it.
  5. For each problem that still shows, record the page, the steps, and the Chrome version, and add a follow-up item in `@firna/ui`.
- **Impact if no action:** Nobody confirms the 5.0.0 fixes in the app that asked for them. The accounting app keeps its own drag selection on the Transactions screen, and a drag cannot start anywhere in its main column.
- **Needs:** `@firna/ui` 5.0.0 on npm, the accounting app repository `futex-ai/accounting`, and Chrome on a desktop computer. The overlay-scrollbar part of problem 2 needs a Mac.
- **Done when:** the main column of the accounting shell is the provider, with `@firna/ui` 5.0.0. The Chrome test ran on its pages, and each of the 13 problems is fixed there or has a follow-up item in `@firna/ui`.
- **Related:**
  - `plans/follow-ups/publish-firna-ui-5-0-0.md`: this task needs that release.
  - `plans/follow-ups/drag-select-macos-overlay-scrollbar-check.md`: the same overlay-scrollbar check, on the "Page shell" story of the `@firna/ui` Storybook.
  - `plans/follow-ups/adopt-web-modal-stack-in-accounting.md`: that task also bumps `@firna/ui` in the accounting app. When 5.0.0 ships the web modal stack, one bump serves both tasks.
