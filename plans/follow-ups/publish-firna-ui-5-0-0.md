# Publish `@firna/ui` 5.0.0 to npm

- **Severity:** Medium. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-06, from the branch `calummoore/dragselectableprovider-improvements`.
- **Location:** None.
- **Reason:** Release-please makes a release only from the commits on `main`, so the 5.0.0 release can start only after the drag-select change merges.

- **Terms:**
  - **Release-please:** the GitHub automation that keeps one release pull request open for the Conventional Commits on `main`. When that pull request merges, release-please tags the release, and the release workflow publishes `@firna/ui` to npm.
  - **Breaking change:** a Conventional Commit with a `!` after its type or scope, such as `feat(drag-select)!:`, or with a `BREAKING CHANGE:` footer. Release-please then proposes the next major version.
  - **Drag select:** the rubber-band ("marquee") selection of `@firna/ui/drag-select`. In 5.0.0, one `DragSelectableProvider` can wrap every page of an app shell, each page sets its options with the page hook `useDragSelectableOptions`, and the app can own the selection.
- **Background:**
  - The release workflow is `.github/workflows/release-plz.yml`. GitHub shows it as the workflow "Release", with the job "Release @firna/ui". It runs on each push to `main`. The file keeps the old name `release-plz.yml`, because npm trusted publishing checks that file name. The workflow itself runs release-please.
  - On each push to `main`, release-please opens or updates the release pull request. That pull request changes `CHANGELOG.md`, `package.json`, and `package-lock.json`. The workflow then runs `npm run format` on the branch of that pull request, and pushes a `chore: format release PR` commit when the files need it.
  - When the release pull request merges, release-please creates the tag `vX.Y.Z` and the GitHub release. The same workflow run then checks out the release commit and checks that the tag matches the version in `package.json`. It runs `cargo xtask check`, skips the publish when npm already has the version, and runs `npm publish --access public` with npm trusted publishing.
  - The drag-select change merges with the type `feat(drag-select)!:`, so it is a breaking change. `docs/consumer-migration.md`, under "Drag Select (5.0)", lists each changed default and the option that restores the 4.x behavior.
  - On 2026-11-06, npm had 4.0.0 as its latest version. Release-please had an open release pull request, `chore(main): release 4.1.0`, with the label `autorelease: pending`. It released the web modal stack, from the commit `feat(modal): stack web dialogs so only the top dialog is live`.
  - The drag-select merge makes release-please change that pull request to 5.0.0, so 5.0.0 also ships the web modal stack. If the 4.1.0 pull request merges first, release-please opens a new release pull request for 5.0.0.
  - On 2026-11-06, the release pull request ran the CI check "Checks", which runs `cargo xtask check`.
- **Task:**
  1. After the drag-select change merges, wait until the "Release" run of that push to `main` completes.
  2. Open the release pull request of release-please. Its title is `chore(main): release 5.0.0`, and it has the label `autorelease: pending`.
  3. Check that `package.json` and `package-lock.json` have the version 5.0.0. Check that the 5.0.0 section of `CHANGELOG.md` has a "BREAKING CHANGES" heading with the drag-select change. Check that the CI check "Checks" passed.
  4. Merge the release pull request.
  5. Wait until the "Release" run of that merge completes. Check that the job "Release @firna/ui" passed and that its step "Publish package" ran.
  6. Run `npm view @firna/ui version`.
  7. If the publish failed after the GitHub release `v5.0.0` was created, start the "Release" workflow by hand, with the input `publish_ref` set to `v5.0.0`. That run checks out the tag, repeats the checks, and publishes.
- **Impact if no action:** npm keeps 4.0.0. Apps, such as the accounting app, cannot use the page-wide drag-select options, the app-owned selection, or the drag fixes of 5.0.0.
- **Needs:** the drag-select change merged on `main`, and the permission to merge pull requests and to start workflows in this repository.
- **Done when:** `npm view @firna/ui version` prints `5.0.0`, and the GitHub release `v5.0.0` lists the drag-select breaking change.
- **Related:**
  - `plans/follow-ups/release-web-modal-stack.md`: it waits for the same release pull request, and it expects 4.1.0. When 5.0.0 ships the web modal stack, this release also completes that item.
  - `plans/follow-ups/accounting-shell-drag-select-check.md`: that task needs this release.
