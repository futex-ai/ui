# Publish the app shell parts in 5.1.0

- **Severity:** Medium. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-08, from PR #183, `conductor/firna-ui-parts-for-conductive`.
- **Location:** `.github/workflows/release-plz.yml` and `package.json`.
- **Reason:** Publication starts only after the owner merges the implementation and the release pull request.

- **Terms:**
  - **release-please:** The GitHub automation that proposes package versions from Conventional Commits on `main`.
  - **Package subpath:** An import such as `@firna/ui/link` that the package's `exports` map exposes.
- **Background:** The Conductive app needs the shared dense controls and app shell parts in a published `@firna/ui` version.
  The baseline version is 5.0.0.
  Additive `feat:` commits target 5.1.0.
  The owner will review and merge the implementation, then merge the release-please pull request.
  This workspace must merge neither pull request and must not publish manually.
- **Task:**
  - Let the owner or the authorized Conductive orchestrator merge the reviewed implementation pull request into `main`.
  - Confirm that release-please opens the 5.1.0 release pull request.
  - Let the owner or the authorized Conductive orchestrator merge that release pull request.
  - Confirm that the release workflow publishes `@firna/ui@5.1.0` successfully.
  - Read the version-specific npm metadata and inspect the published package.
  - Confirm the new `link`, `notice`, `empty-state`, `panel-resize`, and `touch-surface` subpaths.
  - Confirm `InlineMenu` and `InlineMenuSheet` in `popover`, and the compact scale in `typography`.
  - Confirm named root exports, web declarations, and native export files for the new parts.
- **Impact if no action:** Conductive cannot install these parts from npm and must keep its local copies.
- **Needs:** The completed implementation pull request, passing checks and review, and the owner's two merges.
- **Done when:** npm serves version 5.1.0 with the new exports, and the release workflow reports a successful publication with provenance.
