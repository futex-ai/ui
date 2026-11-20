# Toast stories show no toast at mount

- **Severity:** Low. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-20, from the branch `calummoore/milan-sjo9` (review round 2, finding 7, option C).
- **Location:** `src/stories/toast.stories.tsx:17`, `tests/browser/snapshots.spec.ts`.
- **Reason:** The fix adds a story and new screenshot baselines, which need a Linux re-record of the snapshot sweep outside the layout fix.

- **Terms:**
  - **Snapshot sweep:** `tests/browser/snapshots.spec.ts`. It records a screenshot and an ARIA snapshot of each Storybook story, and fails when a story drifts.
- **Background:**
  - Every story under "Toast/Examples" renders only trigger buttons. A toast shows only after a click.
  - So the snapshot sweep records no toast surface. A change to the toast layout, the icon, the action, or the close control passes the sweep.
  - The branch `calummoore/milan-sjo9` moved the card toast action to the left edge of the card. Browser tests in `tests/browser/toast.spec.ts` now check the action position and order. No screenshot pins the look of the toast.
- **Problem:** No baseline shows a toast, so a visual change to a toast is not caught.
- **Impact if no action:** A change to the toast colours, spacing, or icon can merge with no failed check.
- **Root question:** How does the gate catch a visual change to a toast?
- **Options:**
  - **A.** Add one story that opens a card toast with an action and a solid toast with an action when it mounts, with `duration: null`. Record its baselines on Linux. Effort: Medium.
  - **B.** Do A for each tone and each variant of toast. Effort: Medium.
- **Left out:** A screenshot assertion only in `tests/browser/toast.spec.ts`: the snapshot sweep gives the same check with less code. Only these approaches are real, because the choice is only how many toasts the story shows.
- **Wider fix:** A. A story at mount brings the toast into the sweep, which already covers every story.
- **Previous examples:** None found.
- **Recommendation:** A. One story covers both variants and the action at a small baseline cost.
- **Action:** fix after merge, apply A, because the baselines need a Linux re-record of the snapshot sweep.
