# Toast focus hand-off finds buttons by label

- **Severity:** Low. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-20, from the branch `calummoore/milan-sjo9` (review round 1, outside the scope).
- **Location:** `src/toast/toastFocus.ts:21`, `src/toast/Toast.tsx:211`.
- **Reason:** The branch moved this helper without a change, and the selector was on `main` before it.

- **Terms:**
  - **Focus hand-off:** `moveFocusToNeighbourToast` in `src/toast/toastFocus.ts`. Before a toast leaves the stack, it moves keyboard focus to the close control of a neighbour toast.
  - **Close control:** the "×" button of a toast. Its accessible name is `Dismiss {title}`.
- **Background:** The hand-off finds the close controls of the other toasts with the CSS selector `[aria-label^="Dismiss "]`. It depends on the English label text that `Toast.tsx` builds for the close control.
- **Problem:** The selector couples the helper to the label text. A change of the label, for example a translation, or another button in a toast whose label starts with "Dismiss ", breaks the hand-off with no type error.
- **Impact if no action:** The hand-off can silently stop working after a label change, and focus then drops to `<body>`.
- **Root question:** How does the hand-off find the close controls of the other toasts?
- **Options:**
  - **A.** Put a data marker, such as `data-toast-close`, on the close control, and select it in the helper. Effort: Small.
  - **B.** Keep refs to the close controls in the provider, and move focus through the refs, with no DOM query. Effort: Medium.
- **Left out:** A test that pins the label text: it detects the break but keeps the coupling, and option A removes it. Only these approaches are real, because the helper either queries the DOM by a marker or holds refs.
- **Wider fix:** A. A marker that the close control owns removes the coupling to the label.
- **Previous examples:** None found.
- **Recommendation:** A. It removes the coupling with a small change. B also removes the DOM query, at a larger cost.
- **Action:** fix after merge, apply A, because the selector was on `main` before this branch.
