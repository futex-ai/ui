# Responder position test can miss one pixel

- **Severity:** Medium. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-08, from PR #183 CI.
- **Location:** `tests/browser/primitivesInteraction.spec.ts:163`, `src/stories/primitivesInteraction.stories.tsx:253`, and `src/primitives/dom/responder/createResponderEvent.ts:108`.
- **Reason:** The test, story, and responder code are unchanged by the app shell work. One separate correction must reach every branch.

- **Terms:**
  - **Responder:** The DOM adapter that supplies React Native style gesture events to a view.
  - **Local position:** The pointer's position relative to the receiving view's upper-left corner.
- **Background:** The browser test reads the bounds of `responder-box` in the `primitives-interaction--gestures` story.
  It presses at `box.x + 30` and `box.y + 12`.
  The story rounds the reported local position and displays it in `responder-spot`.
  The event adapter subtracts the receiving view's current bounds from the DOM event's client coordinates.
- **Problem:** CI reported `30,11` where the test expected `30,12`.
  The same commit passed the one failed-job rerun without a source change.
  Fractional target bounds, browser pointer-coordinate rounding, or layout readiness can explain the one-pixel difference. The cause needs a captured input and rectangle.
- **Impact if no action:** A correct change can fail the complete gate and require another full CI run.
- **Root question:** How can this test check the local pointer position without a one-pixel race?
- **Options:**
  - **A.** Capture the actual pointer input and target bounds in a scratch reproduction.
    If fractional input causes the mismatch, choose a stable integer pointer point that preserves the literal rounded expectation `30,12`.
    Keep the real responder path and all assertions.
    Effort: Small.
  - **B.** Wait for explicit font readiness before reading the target bounds.
    This preserves the assertion but helps only if a layout change caused the mismatch.
    Confirm that cause before changing the test.
    Effort: Small.
  - **C.** Correct the event adapter if captured inputs prove that its relative-position calculation is wrong.
    This reaches the shared gesture behavior and needs wider regression checks.
    Effort: Medium.
- **Left out:** Retries, sleeps, a larger timeout, a skipped assertion, and accepting either pixel hide the disagreement.
  Changing the expected value without identifying the cause does not prove the contract.
- **Wider fix:** A can give responder tests one pointer-input helper after the reproduction proves the rounding rule.
  Do not add a test for the class or a new gate.
- **Previous examples:** The complete CI at `b73642c` passed all 474 browser tests.
  At `acf2d43`, CI attempt 1 passed 485 tests and failed this test.
  The one failed-job rerun passed.
  The local run also passed this test in 1.8 seconds without a source change.
- **Recommendation:** A. Captured inputs distinguish pointer rounding from layout movement before a correction changes either side.
- **Action:** fix after merge, apply A, because this unchanged flaky test needs its own branch.
  Reproduce the cause before editing source or fixtures. If the cause remains unknown, ask the user before a fix.

The failed run was `42448249945`, attempt 1, job `128631695342`.
The test failed at line 175 after 10000 ms:

```text
Locator: getByTestId('responder-spot')
Expected: "30,12"
Received: "30,11"
```

Attempt 2, job `128637330258`, passed after the only failed-job rerun.
The branch had no missing `origin/main` commits when the failure was checked.
Do not change production coordinate behavior unless the captured event proves a product defect.
