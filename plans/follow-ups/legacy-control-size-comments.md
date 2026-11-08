# Legacy size comments omit dense values

- **Severity:** Low. **Effort:** Medium. **Confidence:** High. **Harder later:** No.
- **Kind:** Fix after merge.
- **Added:** 2026-11-08, from `conductor/firna-ui-parts-for-conductive`, visual preparation item 1.
- **Location:** `src/kanban/Kanban.tsx:116`, `src/sortable-list/SortableList.tsx:122`, `src/table/Table.tsx:93`, and `src/data-grid/DataGrid.tsx:71`.
- **Reason:** These four source files need larger structural splits before their comments can change under the existing 300-line rule.

- **Terms:**
  - **ControlSize:** The shared size union in `src/controlSize.ts`, with `xs`, `sm`, `md`, and `lg`.
- **Background:** The library accepts `xs` as an optional dense size.
  Each affected component uses `ControlSize` for its `size` prop.
  The four source files have 314, 422, 373, and 493 lines, respectively.
  They remain outside the app shell change's source splits.
  The repository requires a responsibility split when a changed source file exceeds 300 lines.
- **Problem:** Each public size comment lists only `sm`, `md`, and `lg`.
  The declarations shown in consumer editors therefore omit `xs` from that explanation.
- **Impact if no action:** A consumer can miss a supported size when reading the comment.
  The actual type and runtime still accept `xs`.
- **Root question:** How do these size comments stay accurate as the shared type grows?
- **Options:**
  - **A.** Split the four files without behavior changes, then add `xs` to each comment's value list.
    Later sizes need the same comment edits.
    Effort: Medium.
  - **B.** Split the four files without behavior changes, then describe control density and the real default without repeating the value list.
    The `ControlSize` declaration remains the source of accepted values.
    Effort: Medium.
- **Left out:** Editing the comments while leaving the files over the cap breaks the existing source rule.
  Generating repeated comment lists adds maintenance that B avoids.
  Keeping the comments unchanged leaves the omission.
- **Wider fix:** B removes the repeated enum lists that caused this drift.
- **Previous examples:** The app shell change updates the same comments in ten shorter component files.
  Its button documentation also corrected the smallest track from 30 px to 26 px.
- **Related:** `plans/follow-ups/source-files-pass-line-cap.md` covers the wider long-file backlog and a separate lint decision.
  This work needs the current manual split rule, not an answer about adding that lint.
- **Recommendation:** B. It preserves the existing default and makes the shared type the single list of values.
- **Action:** fix after merge, apply B, because the larger legacy component splits sit outside the current app shell implementation.
