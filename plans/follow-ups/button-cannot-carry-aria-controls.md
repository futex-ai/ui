# Button cannot carry a popover trigger's aria-controls

- **Severity:** Low. **Likelihood:** Common. **Effort:** Small. **Confidence:** High. **Harder later:** No.
- **Kind:** Outside the scope.
- **Added:** 2026-11-01, from `calummoore/palette-forms-overlay-discussion`.
- **Location:** `src/button/Button.tsx:142` and `src/popover/popoverModel.ts:65`.
- **Reason:** The Button API is outside the web modal stack change, and each fix adds a requirement to the public Button contract.

- **Terms:**
  - **`triggerProps`:** the props that `Popover` passes to its `trigger` render function. `popoverTriggerProps` in `src/popover/popoverModel.ts` builds them.
  - **`aria-controls`:** an ARIA attribute that names the id of the element that a control shows, so assistive technology can relate the two.
- **Background:**
  - `Popover` gives its trigger render function four `triggerProps`: `aria-controls` with the surface id while the popover is open, `aria-expanded`, `aria-haspopup`, and `onPress`. `src/popover/README.md` says to spread them onto a `Pressable`.
  - `Button`, the shared button of the library, has the props `expanded` and `hasPopup` for the second and third values. Its prop types have no way to pass `aria-controls`.
  - The Button contract in `docs/protocol/shared-ui-components.md` lists the states that the button emits. It does not list `aria-controls`.
  - The story `src/stories/modalFromPopoverExample.tsx` uses `Button` as a popover trigger, so its trigger has no `aria-controls`.
- **Problem:** A consumer who builds a popover trigger with `Button` cannot pass `aria-controls`. Assistive technology then cannot follow the link from the trigger to the popover surface. The only way out is a raw `Pressable`, which loses the shared button styles and focus treatment.
- **Impact if no action:** Popover triggers built with the shared button lose the relation to their surface that the popover gives them (WCAG 1.3.1). Screen readers that use `aria-controls`, such as JAWS, cannot move to the surface.
- **Root question:** How does a popover trigger that uses the shared button keep its link to the popover surface?
- **Options:**
  - **A.** Add a `controls?: string` prop to `Button` that renders `aria-controls` on web, beside `expanded` and `hasPopup`. Use it in the story. Effort: Small.
  - **B.** Let `Button` take the whole `triggerProps` object as one prop, for example `popupTrigger={triggerProps}`, and map all four values. Effort: Small.
  - **C.** Change nothing. Document in `src/popover/README.md` that a trigger that needs `aria-controls` uses a `Pressable`. Effort: Small.
- **Left out:** Accept any `aria-*` prop on `Button`: it drops the typed props of the button contract and lets callers write invalid ARIA.
- **Wider fix:** B. One prop that takes the whole trigger contract keeps `Button` in step when the popover adds a trigger attribute.
- **Previous examples:** None found.
- **Recommendation:** A. It follows the existing `expanded` and `hasPopup` props and keeps `Button` free of popover types. B protects the class better.
- **Action:** ask the user, because options A and B add a prop to the public Button contract, and the user reviews each new requirement.
