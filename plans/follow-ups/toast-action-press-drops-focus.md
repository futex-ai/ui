# Toast action press drops keyboard focus

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-20, from the branch `calummoore/milan-sjo9` (review round 1, outside the scope).
- **Location:** `src/toast/ToastActionButton.tsx` (the `onPress` handler), `src/toast/Toast.tsx` (the `onDone` callback), `src/toast/toastFocus.ts`.
- **Reason:** The problem was on `main` before the branch, and the branch only moved the action code, so the fix belongs in its own change.

- **Terms:**
  - **Action:** the optional button of a toast, such as "Undo", that a caller sets with `action: { label, onPress }`.
  - **Focus hand-off:** `moveFocusToNeighbourToast` in `src/toast/toastFocus.ts`. Before a toast leaves the stack, it moves keyboard focus to the close control of a neighbour toast.
- **Background:** A press on the close control of a toast calls the focus hand-off, then dismisses the toast. A press on the action runs the caller's `onPress`, then dismisses the toast with no hand-off. The toast unmounts, so the focused action button goes away.
- **Problem:** After a keyboard user presses the action, focus drops to `<body>`. The user loses their place in the page and in the toast stack (WCAG 2.1 — 2.4.3 Focus Order, A).
- **Impact if no action:** Each keyboard or screen-reader user who presses "Undo" or "Restore" must find their place again from the top of the page.
- **Root question:** Where must keyboard focus go after a press on a toast action?
- **Options:**
  - A. Call the focus hand-off before the action dismisses the toast, as the close control does. Effort: Small.
  - B. Make one dismiss path in `Toast.tsx` that every in-toast control uses, and that always runs the hand-off, so a new control cannot skip it. Effort: Small.
- **Recommended:** B. It removes the case where a control dismisses without the hand-off.
- **Action:** fix after merge, apply B, with a browser test that presses the action from the keyboard and checks the focused element.
