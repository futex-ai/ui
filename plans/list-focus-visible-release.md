# List Focus-Visible Regression And 2.0.1 Release

## Goal

Prove that the shared focus-visible fix from PR #154 resolves the List pointer
regression, document the two supported List interaction models, and release the
fix as `@firna/ui@2.0.1` through the existing release-please workflow.

This work validates the shared `useFocusRing` behavior. It does not add
List-specific modality tracking, broaden `ListItem.onPress` to the whole row, or
introduce another press-target API.

## Milestone 1: Document The Interaction Contract

Summary: make the full-row and title-column interaction models unambiguous for
consumers before extending regression coverage.

- [x] Add this plan to `plans/README.md`.
- [x] Document web `:focus-visible`, pointer focus, and native focus behavior in
      `src/list/README.md`.
- [x] Document that `List.onItemPress` owns a full-row target and inset
      keyboard ring.
- [x] Document that `ListItem.onPress` owns only the title/description column
      when a trailing control must stay independent.
- [x] Recommend `List.onItemPress` for decorative trailing content such as a
      chevron.
- [x] State that `disableFocusRing` is not a workaround for ordinary pointer
      interaction.
- [x] Align `docs/protocol/shared-ui-components.md` with the same contract.

## Milestone 2: Add Exact Browser Regression Coverage

Summary: exercise the real DOM and Chromium input-modality heuristic through
the existing List stories.

- [x] Add a focused `tests/browser/list.spec.ts` Playwright suite.
- [x] Cover pointer focus, retained keyboard focus, and return to pointer input
      for a `List.onItemPress` row.
- [x] Assert pointer focus remains real while `:focus-visible` is false and the
      computed `box-shadow` is `none`.
- [x] Assert keyboard input paints an inset, full-row ring without requiring a
      blur first.
- [x] Cover pointer and keyboard focus for a `ListItem.onPress` title column.
- [x] Verify the title-column ring is intentionally narrower than its row and
      the trailing switch remains independently operable.
- [x] Demonstrate the suite fails against `@firna/ui@2.0.0` behavior and passes
      against the current source.
- [x] Keep the existing unit/source assertions as complementary coverage.

## Milestone 3: Audit The Implementation

Summary: confirm List consumes the shared hook correctly and make production
changes only if the browser regression exposes an uncovered gap.

- [x] Confirm `src/list/List.tsx` gates its visual ring on
      `focus.focusVisible` rather than raw `focused` state.
- [x] Confirm `src/list/ListItem.tsx` gates its visual ring on
      `focus.focusVisible` rather than raw `focused` state.
- [x] Keep keyboard/pointer modality handling centralized in `useFocusRing`.
- [x] Preserve actual focused state for behavior.
- [x] Keep the two existing press-target APIs unchanged.
- [x] Update production code only if the browser suite proves it necessary; no
      production change was needed.

## Milestone 4: Verify And Release

Summary: verify the repository, preserve an auditable review order, and publish
the release only after its generated PR is green.

- [x] Run the targeted List Playwright suite.
- [x] Smoke-test both List stories with pointer and keyboard input.
- [x] Run `cargo xtask check` and require a 100% pass rate.
- [x] Review the completed diff against `origin/main`.
- [x] Run `git add -A`, commit all completed work with a Conventional Commit,
      and push the current branch.
- [x] After the push, run `cargo xtask review` against `origin/main`; the command
      was attempted twice but could not authenticate to the OpenAI API, so it
      produced no findings to fix or report.
- [x] Open PR #156 to land the validation documentation and browser suite on
      `main`.
- [x] Confirm release PR #155 is current and all required checks pass.
- [x] Merge release PR #155 to publish `@firna/ui@2.0.1`.
- [x] Verify npm serves version `2.0.1` and the packed List/ListItem output gates
      visual rings on focus-visible state.
