# Family entry imports retain a module cycle

- **Severity:** Medium. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-08, from PR #183 review finding 3, wider option C.
- **Location:** `src/input/LabelInfo.tsx`, the dropdown and popover families, and `tests/unit/input.test.ts` and `tests/unit/combobox.test.ts`.
- **Reason:** The wider owner-import cleanup reaches four older files outside the app shell diff and can serve every branch in one change.

- **Terms:**
  - **Family entry:** An `index.ts` that exposes a component family as a package subpath.
  - **Owner module:** The file that defines a runtime value.
  - **Module cycle:** A chain of imports that returns to a module before its initialization completes.
- **Background:** Input, dropdown, and popover values import each other through family entries.
  A new menu style read `DROPDOWN_LAYERS.portal` during module initialization.
  The direct owner import fixes that read, but the wider family cycle remains.
  A future eager value read can expose it again.
- **Problem:** Family entries load components that their callers do not need.
  The resulting cycle makes initialization depend on which public entry loads first.
- **Impact if no action:** A later feature can break a focused package import even when root-first imports pass.
  Maintainers must reason about a larger initialization graph.
- **Root question:** How do public entries stay independent despite the remaining family cycle?
- **Options:**
  - **A.** Keep the direct layer fix and correct later failing reads one at a time.
    Future failures still require tracing the cycle.
    Effort: Small.
  - **C.** Replace cross-family runtime imports with imports from each value's owner module.
    Keep public entries for consumers and keep type-only imports where appropriate.
    Preserve every existing test and API.
    Effort: Medium.
  - **D.** Make the package smoke load every public entry in its own fresh process.
    This detects the class and requires user approval for a stricter gate.
    It does not remove the cycle. The measured overhead was about nine seconds for forty entries.
    Effort: Small.
  - **E.** Add an import-cycle lint.
    This requires user approval and separate lint tooling.
    It does not remove the cycle.
    Effort: Large.
- **Left out:** Root preloading hides independent-entry failures.
  Export reordering remains order-dependent.
  A complete family redesign adds work that owner imports avoid.
  The earlier render-time workaround, option B, keeps the cycle and is worse than the direct owner fix.
- **Wider fix:** C removes the unnecessary runtime dependency edges.
- **Previous examples:** A fresh dropdown import, rich-text import, and video-editor import failed with `Cannot access 'DROPDOWN_LAYERS' before initialization`.
  Root-first imports passed.
  An in-memory direct-owner correction allowed all 40 public entries to load alone.
  Rollup and esbuild bundles exposed the same bad read before that correction.
- **Recommendation:** C. Owner imports remove the existing cycle without a new gate or a public API change.
- **Action:** fix after merge, apply C, because the broader cleanup reaches the older family graph beyond the direct regression fix.

Inspect these runtime import sites. Some may already use an owner after related target-policy changes.

- `src/input/LabelInfo.tsx`
- `src/dropdown/ComboboxMultiSelect.tsx`
- `src/dropdown/comboboxMultiSelectStyles.ts`
- `src/dropdown/dropdownSelectorParts.tsx`
- `src/dropdown/dropdownSelectorStyles.ts`
- `src/popover/InlineMenu.web.tsx`
- `src/popover/InlineMenuSheet.tsx`
- `src/popover/MenuSheet.tsx`
- `src/popover/inlineMenuModel.ts`
- `src/popover/ResponsiveMenu.tsx`
- `src/popover/Popover.tsx`
- `src/popover/ContextMenu.web.tsx`
- `src/popover/ResponsivePopover.web.tsx`

Before the direct fix, an approximate source probe found one cycle with 21 web modules and 20 native modules.
Owner-import replacements removed both cycles in that probe.
The four older files outside the app shell diff were `LabelInfo.tsx`, `Popover.tsx`, `ContextMenu.web.tsx`, and `ResponsivePopover.web.tsx`.

Two source tests pin family-entry paths: the LabelInfo case in `tests/unit/input.test.ts` and the input-token case in `tests/unit/combobox.test.ts`.
Update their expected owner paths without removing or loosening assertions.
Keep the existing focused cold-dropdown package regression.
Use isolated imports of all public entries and bundle execution as one-time evidence.
Do not add a class-wide test or lint without user approval.
