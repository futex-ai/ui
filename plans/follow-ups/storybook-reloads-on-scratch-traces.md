# Storybook reloads pages on scratch trace files

- **Severity:** Low. **Effort:** Small. **Confidence:** Medium. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-01, from `calummoore/palette-forms-overlay-discussion`.
- **Location:** `.storybook/main.ts:24`.
- **Reason:** The Storybook configuration is outside the web modal stack change, and one fix in a separate branch helps every branch.

- **Terms:**
  - **Playwright trace:** the zip file and HTML report that Playwright writes into its `--output` folder for a failed browser test.
  - **`.context/`:** the git-ignored scratch folder where agents keep logs and evidence, as the shared agent rules require.
- **Background:**
  - The browser tests in `tests/browser/` run against a Storybook dev server. Playwright starts it through `webServer` in `playwright.config.ts`. Storybook serves the stories through Vite 7.3.5.
  - Vite watches the project folder. When an `.html` file changes, Vite tells every open page to reload. Vite ignores paths that contain `test-results`, so the default Playwright output folder causes no reload.
  - Agents keep scratch output under `.context/`, so they often pass `--output=.context/<plan>/<run>` to Playwright.
- **Problem:** When Playwright writes its output under `.context/`, each trace adds HTML files that Vite watches. Vite then reloads every open story page, and a test whose page reloads during the test can fail. In one session, the Storybook log showed 19 "Vite page reload" lines. All four shards of the snapshot sweep timed out, and one kanban test failed while the page still showed the Storybook loading spinner. The failures stopped when the output moved to a folder named `test-results`.
- **Impact if no action:** Browser runs that write their output under `.context/` fail at random. Each false failure costs a rerun and an investigation.
- **Root question:** How do browser test runs avoid page reloads from files that the run itself writes?
- **Options:**
  - **A.** Document the workaround in the root `README.md`, next to the browser test commands: write Playwright output only under a folder named `test-results`, for example `.context/<plan>/test-results/<run>`. Agents can still forget it. Effort: Small.
  - **B.** Make the Vite watcher of Storybook ignore `.context/`. Add `server.watch.ignored` with `**/.context/**` in `viteFinal` in `.storybook/main.ts`. It protects every run, whatever the output path. Effort: Small.
  - **C.** Serve the static Storybook build to the browser tests, so that no file watcher runs. This changes the test harness of every browser spec and needs a build before each run. Effort: Medium.
- **Left out:** Keep Playwright output out of `.context/`: it breaks the shared rule that scratch output lives in `.context/`.
- **Wider fix:** B. It removes the reload for every path under `.context/`, so no run depends on its output path.
- **Previous examples:** None found.
- **Recommendation:** B. One watcher rule protects every run, without a rule that each agent must remember.
- **Action:** fix after merge, apply B, because the Storybook configuration is outside the files of the change that found the problem.
