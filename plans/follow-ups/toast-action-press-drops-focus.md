# Toast action press drops keyboard focus

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-20, from the branch `calummoore/milan-sjo9` (review round 1, outside the scope).
- **Location:** `src/toast/ToastActionButton.tsx:39`, `src/toast/Toast.tsx:139` and `src/toast/Toast.tsx:160`, `src/toast/toastFocus.ts:11`.
- **Reason:** The problem was on `main` before the branch, and the branch only moved the action code, so the fix belongs in its own change.

- **Terms:**
  - **Action:** the optional button of a toast, such as "Undo", that a caller sets with `action: { label, onPress }`.
  - **Focus hand-off:** `moveFocusToNeighbourToast` in `src/toast/toastFocus.ts`. Before a toast leaves the stack, it moves keyboard focus to the close control of a neighbour toast.
- **Background:**
  - A press on the close control of a toast runs `dismissFromClose` in `src/toast/Toast.tsx`. It calls the focus hand-off, then dismisses the toast.
  - A press on the action runs the caller's `onPress`, then `onDone`, which dismisses the toast with no hand-off.
  - The toast unmounts, so the focused action button goes away.
  - A browser check on 2026-11-20 confirmed it: after a keyboard press of "Undo" in the "With action" story of "Toast/Examples", the focused element is the page body.
- **Problem:** After a keyboard user presses the action, focus drops to `<body>`. The user loses their place in the page and in the toast stack (WCAG 2.1 — 2.4.3 Focus Order, A).
- **Impact if no action:** Each keyboard or screen-reader user who presses "Undo" or "Restore" must find their place again from the top of the page.
- **Root question:** Where must keyboard focus go after a control inside a toast dismisses it?
- **Options:**
  - **A.** Call the focus hand-off in the action's `onDone`, as the close control does. Effort: Small.
  - **B.** Make one dismiss function in `Toast.tsx` that runs the hand-off and then dismisses, and pass it to every control inside the toast, so a new control cannot skip the hand-off. Effort: Small.
- **Left out:** Return focus to the element that had focus before the toast showed: a toast does not take focus when it shows, so that element is not known, and the neighbour toast is the place that the close control already uses. Only these approaches are real, because the choice is only where the hand-off runs.
- **Wider fix:** B. One dismiss function for all in-toast controls removes the path that skips the hand-off.
- **Previous examples:** The close control got the hand-off in commit `2bd294b` ("feat(a11y): WCAG 2.1 AA support across components + axe gate"), and the action did not.
- **Recommendation:** B. It fixes the action and protects later controls at the same cost as A.
- **Action:** fix after merge, apply B, with a browser test that presses the action from the keyboard and checks the focused element, because the problem was on `main` before this branch.
