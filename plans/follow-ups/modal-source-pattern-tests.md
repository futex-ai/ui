# Modal unit tests match source text instead of behaviour

- **Severity:** Low. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-26, from `calummoore/webmodalframe-open-without-auto-focus-on-cov8`, review round 1, outside the scope.
- **Location:** `tests/unit/webModal.test.ts` (for example "web modal opens focus on caller content rather than the close button"), `tests/unit/webModalStack.test.ts` (the Tab handler and listener tests).

- **Background:** Several modal unit tests read source files and match regular expressions against the text. A refactor that keeps the behaviour breaks them, and a behaviour change that keeps the text shape passes them. For example, the "opens focus on caller content" test still passes when the open path always returns the surface. The browser specs in `tests/browser/modal-focus.spec.ts` and `tests/browser/modal-stack.spec.ts` cover the real behaviour.
- **Problem:** These tests cost an edit on each refactor and protect little.
- **Root question:** Which modal requirements need a unit-level test, and which are covered by the browser specs?
- **Options:**
  - **A.** Remove each source-pattern test whose requirement a named browser test covers, with the proof for each, as the `testing` skill says. Effort: Medium.
  - **B.** Keep them. Effort: none.
- **Recommendation:** A.
- **Done when:** each remaining modal unit test calls code, not source text, or names why it must read source.
