# Remaining dense action targets need verification

- **Severity:** Medium. **Likelihood:** Common. **Effort:** Medium. **Confidence:** Medium. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-08, from PR #183 finding checks.
- **Location:** `src/sortable-list/sortableListStyles.ts:18`, `src/sortable-list/SortableRow.tsx:236`, `src/workflow/workflowStyles.ts:29`, and `src/workflow/WorkflowEdge.tsx:105`.
- **Reason:** These noncritical target observations came from the final finding checks and need their own rendered verification and correction branch.

- **Terms:**
  - **`xs`:** The optional dense control size introduced by the app shell parts.
  - **Target:** The actual pointer area of an interactive element.
- **Background:** `docs/protocol/app-shell-parts.md:37-38` requires every `xs` target to measure at least 24 by 24 px.
  Families without a dense drawing use their `sm` visual metrics, at `docs/protocol/app-shell-parts.md:26-28`.
  Visual fallbacks must not reduce the target minimum.
  Older `sm`, `md`, and `lg` geometry must remain unchanged.
- **Problem:** The sortable-list grab style uses a 14 px icon and 4 px padding at `xs`, which calculates to 22 px.
  `SortableRow` applies it to an interactive `Pressable` when a drag binding exists.
  The workflow insert button applies a 20 px square style to a `Pressable` at `xs`.
  Neither owner supplies an extra hit area. Actual rendered bounds and edge hits have not been measured yet.
- **Impact if no action:** These optional dense actions can remain below the declared minimum and be harder to activate.
  Each app that draws a sortable list or a workflow at `xs` meets them.
- **Root question:** How do the remaining mapped dense actions meet the target floor while keeping their established drawing?
- **Options:**
  - **A.** Measure each actual target and enlarge only the `xs` target style where required.
    A direct minimum can also enlarge a painted hover or focus box.
    Effort: Small.
  - **B.** Verify the target and space, then use the shared original-size target policy with family-specific space treatment.
    The policy is `fieldActionSize` and `fieldActionBoxStyle` in `src/input/fieldActionBox.ts:16-28`, which keep the 24 px target for a family that draws `xs` with its `sm` metrics.
    The chip removal shows a space treatment: negative margins at `src/dropdown/comboboxMultiSelectStyles.ts:33-38`.
    Preserve the old painted handle or circle and all other sizes.
    Add a regression at the actual interaction boundary for each confirmed defect.
    Effort: Medium.
  - **C.** Declare these families exempt from the dense target minimum.
    This changes a requirement and needs the user to choose it.
    Effort: Small.
- **Left out:** Making every older size larger breaks the unchanged-default requirement.
  A visual icon measurement alone does not prove the pointer target.
  A new class-wide test or gate requires user approval and is not part of this correction.
- **Wider fix:** B keeps target selection separate from visual size fallbacks.
- **Previous examples:** Dense date clearing, icon-only segments, and chip removal needed explicit target floors, at `src/date/dateFieldStyles.ts:72-76`, `src/segmented/segmentedControlStyles.ts:55`, and `src/dropdown/comboboxMultiSelectStyles.ts:33-38`.
  The chip action keeps its drawing with space around the real box.
- **Related:**
  - `plans/follow-ups/source-files-pass-line-cap.md`: the same file. That item holds the files over 300 lines, and `src/sortable-list/SortableRow.tsx` has 335. Under the reading of `plans/follow-ups/legacy-control-size-comments.md`, a change to it splits the file first.
  - `plans/follow-ups/icon-seam-one-binding-per-glyph.md`: the same file. Its option B changes the icon import of `src/sortable-list/SortableRow.tsx`. The first change splits the file, and the second follows the split.
- **Recommendation:** B. The same target policy can preserve the drawing after a real measurement confirms each gap.
- **Action:** fix after merge, apply B, because the final review workflow leaves these noncritical observations for a separate branch.
  Verify the rendered target before changing code.

For the sortable list, measure the bound interactive handle rather than its non-interactive drag preview or clone.
For the workflow, measure `WorkflowInsertButton` rather than the separate Add step `Button`.
Check actual edge activation, keyboard paths, native compatibility, and old-size geometry.
Keep every existing assertion. Record negative proof and ten runs of each changed asynchronous or browser case.
