# Toast uses two names for solid

- **Severity:** Low. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-20, from the branch `calummoore/milan-sjo9` (review round 1, outside the scope).
- **Location:** `src/toast/Toast.tsx:61`, `src/toast/ToastActionButton.tsx:18`.
- **Reason:** The alias was on `main` before the branch, and a rename touches many lines outside the layout fix.

- **Terms:**
  - **Solid toast:** a toast with `variant: "solid"`. It has a tone-coloured fill instead of the card surface.
- **Background:** `Toast.tsx` sets `const solid = toast.variant === "solid"` and then `const filled = solid`. The code uses `solid` for some styles and `filled` for others. The action component `ToastActionButton` takes a `filled` prop.
- **Problem:** Two names for one value make a reader ask whether they can differ. They cannot.
- **Impact if no action:** Small extra effort for each reader of the toast code.
- **Root question:** Which one name does the toast code use for the solid variant?
- **Options:**
  - **A.** Remove `filled`, use `solid` everywhere, and rename the `filled` prop of `ToastActionButton` to `solid`. Effort: Small.
- **Left out:** Keep `filled` and remove `solid`: the public option is `variant: "solid"`, so `solid` matches the API. Only one approach is real, because the choice is only which name stays.
- **Wider fix:** None. The problem is one local alias, not a class.
- **Previous examples:** None found.
- **Recommendation:** A. It matches the public `variant: "solid"` name.
- **Action:** fix after merge, apply A, because the alias was on `main` before this branch.
