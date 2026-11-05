# Show palette forms over the Settings dialog

- **Severity:** Medium. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Post-merge task.
- **Added:** 2026-11-02, from `calummoore/palette-forms-overlay-discussion`, pull request #179.
- **Location:** None. The work is in the repository `futex-ai/accounting`.
- **Reason:** The accounting app can use the web modal stack only after `@firna/ui` releases it.

- **Terms:**
  - **Web modal stack:** the internal list of open web dialogs of `@firna/ui`. Only its top dialog takes input, and the page and the lower dialogs are inert and dimmed.
  - **Palette form:** a form, such as Set, Edit, or Add account, that the command palette of the accounting app opens from Settings → Accounts.
- **Background:**
  - The accounting app shows its Settings dialog and its palette forms with `WebModalFrame` from `@firna/ui`.
  - Before the web modal stack, two open web dialogs made each other inert, and Tab did not work in the top one. So the app hides the Settings dialog with a React `Activity` while a palette form is open, in `DeferredProductSettings.tsx`. It also waits for an acknowledgement before it shows the form.
  - The app mockups draw each palette form over the Accounts list that opened it. The hidden Settings dialog differs from the mockups, and the screen can be empty for a moment.
  - With the web modal stack, the lower dialog stays visible, inert, and dimmed under the top dialog. Each dialog keeps its own backdrop, so stacked dialogs dim the page more. `@firna/ui` chose this on 2026-10-19, because most dialog libraries do it, and the app mockups can change it.
- **Task:**
  1. Bump `@firna/ui` to the release with the web modal stack.
  2. Remove the `Activity` hiding in `DeferredProductSettings.tsx` and the wait for the acknowledgement.
  3. Update `docs/protocol/settings-dialog.md` and `docs/protocol/command-palette.md` in the app.
  4. Add a browser test: a palette form opens over the visible, inert Settings dialog, and Escape closes only the form.
  5. Compare the stacked look with the app mockups that draw a form over the Accounts list. When the backdrops differ, add a follow-up item in `@firna/ui` that asks whether to hide the backdrops of the lower dialogs.
- **Impact if no action:** The app keeps hiding the Settings dialog under a palette form, against its mockups.
- **Needs:** the `@firna/ui` release with the web modal stack.
- **Done when:** the app shows each palette form over the visible Settings dialog, its new browser test passes, and the backdrops match the mockups or a follow-up item records the difference.
- **Related:** `plans/follow-ups/release-web-modal-stack.md`: this task needs that release.
