# Release the web modal stack to npm

- **Severity:** Medium. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-02, from `calummoore/palette-forms-overlay-discussion`, pull request #179.
- **Location:** None.
- **Reason:** Release-please makes a release only from the commits on `main`, so the release comes after the merge.

- **Terms:**
  - **Web modal stack:** the internal list of open web dialogs in `src/modal/webModalStack.ts`. Only its top dialog takes input, and the page and the lower dialogs are inert.
  - **Release-please:** the GitHub automation that opens a release pull request from the Conventional Commits on `main`, and publishes `@firna/ui` to npm when that pull request merges.
- **Background:**
  - The web modal stack makes stacked web dialogs work. It also keeps toasts live under dialogs and locks page scroll while a dialog is open.
  - Its squash commit on `main` is a `feat`, so release-please makes a minor version. The last release was 4.0.0, so the expected version is 4.1.0.
  - The drag select change, a breaking change, merges after it. Release-please then changes its release pull request from 4.1.0 to 5.0.0, so 5.0.0 ships the web modal stack, unless the 4.1.0 release pull request merges first.
  - Consumers, such as the accounting app, can use the stack only after npm has the release.
- **Task:**
  1. Find the release pull request that release-please opens after the merge.
  2. Check that its changelog lists the web modal stack, and merge it.
  3. Confirm that npm lists the new version.
- **Impact if no action:** Consumers cannot use the web modal stack, and the accounting app keeps its workaround.
- **Needs:** the merged web modal stack on `main`.
- **Done when:** `npm view @firna/ui version` shows the new version, and its changelog lists the web modal stack.
- **Related:**
  - `plans/follow-ups/adopt-web-modal-stack-in-accounting.md`: that task needs this release.
  - `plans/follow-ups/publish-firna-ui-5-0-0.md`: it waits for the same release pull request. One release can complete both items.
