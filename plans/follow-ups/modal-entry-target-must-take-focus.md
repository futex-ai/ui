# A modal can open with focus outside it when its initialFocusRef cannot take focus

- **Severity:** Low. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-26, from `calummoore/webmodalframe-open-without-auto-focus-on-cov8`, review round 1, finding 2 (wider fix B) and its check.
- **Location:** `src/modal/useWebModalLayer.ts` (`initialFocusTarget`), `src/modal/webModalFocusTrap.ts` (`trapWebModalFocus`).

- **Terms:**
  - **Entry target:** the control that a web modal focuses on open, or on the first Tab from its surface: `initialFocusRef`, else the first caller control.
  - **Surface:** the `role="dialog"` element of `WebModalFrame`, which can take focus by script.
- **Background:**
  - With `initialFocus="control"` (the default), the open path focuses `initialFocusRef` when it is set. It does not check that focus moved.
  - A disabled `Button` renders `<button disabled tabindex="-1">`, and a node with `display: none` cannot take focus either.
  - The Tab path from a focused surface already tries the caller target, then the default target.
- **Problem:** When `initialFocusRef` points at a control that cannot take focus, the dialog opens with focus left outside it. Screen readers then do not announce the dialog. The next Tab brings focus back into the dialog. `origin/main` had the same behaviour before this branch.
- **Impact if no action:** A caller that disables its safe action while busy can open a dialog that screen readers do not announce.
- **Root question:** How do we make every focus path of a modal land inside it?
- **Options:**
  - **A.** In the open path, check `document.activeElement` after the focus call, and try the default target, then the surface. Effort: Small.
  - **B.** One resolver that returns only an element that can take focus inside the surface, used by the open path, the Tab path, and the restore path. Effort: Medium.
  - **C.** A `devWarn` when the caller target does not take focus, in addition to A or B. Effort: Small.
- **Recommendation:** B. It removes the wrong case for every path.
- **Done when:** a browser test opens a control-mode dialog whose `initialFocusRef` is disabled and sees focus on the default target.
