# Grouped tag selection for ComboboxMultiSelect

Extend `ComboboxMultiSelect` (`@firna/ui/dropdown`) so Bookfolio can build its
Tags field: labels from user-defined groups (Properties, Projects, Vehicles),
at most one tag per group, some tags fixed after posting, and a "Create tag"
action. Every addition is an optional prop or option field; a caller that
passes none of them keeps today's behaviour, including the Members dialog's
static `footer` note.

The contract is [Combobox Multi-Select Protocol](../docs/protocol/combobox-multi-select.md);
the visual spec is the [tag picker mockup](../docs/mockups/combobox-tag-picker.html).

**Status:** M1–M4 complete. M5 verified, pushed, and reviewed; four review findings await a decision. Release target: `4.1.0` (minor),
cut by release-please from the `feat(dropdown)` commit.

## Background

- `ComboboxMultiSelect` renders a flat `DropdownList` inside `ComboboxPopover`
  and toggles values on row press. `footer` is pushed as a `section` row.
- `DropdownList` already has section rows, a pinned `footer` node region, and
  a `secondary` slot; it has no ARIA groups, no pinned rows that join keyboard
  navigation, and no way to keep a disabled row reachable.
- Source-contract tests pin the structure of `ComboboxMultiSelect.tsx`,
  `DropdownList.tsx`, and `dropdownListStyles.ts`, so new logic lands in new
  modules and those files only grow where the feature needs them.
- `muted` subtext on the selected `primarySoft` fill is 4.27:1 in the default
  theme, below WCAG 1.4.3 AA, so descriptions need a different colour there.
- Found while exploring: with the list open, Enter on a focused chip remove
  button toggles the keyboard-active option instead, because the combobox's
  document-level key listener claims every keydown.

## Milestones

### M1 — Spec

Protocol doc, mockup, and plan for the change.

- [x] Write `docs/protocol/combobox-multi-select.md` and link it from the
      Dropdown Contract in `docs/protocol/shared-ui-components.md`.
- [x] Add the shared `DropdownList` requirements (grouped sections, pinned
      rows, reachable disabled and locked rows, described secondary text) to
      the Dropdown Contract.
- [x] Add `docs/mockups/combobox-tag-picker.html` with mobile and desktop
      variants.
- [x] Add this plan and list it in `plans/README.md`.

### M2 — DropdownList support

`DropdownList` gains the list-level pieces the tag picker needs, opt-in per
entry or prop.

- [x] `group?: boolean` on `section` entries: the heading and the rows after
      it render inside a web `role="group"` labelled by the heading
      (`aria-labelledby`); native marks the heading as a header.
- [x] `footerEntries` prop: rows pinned under the scroll area, inside the
      listbox element, after the scrolling rows in keyboard order; the active
      footer row never scrolls the list.
- [x] `focusableWhenDisabled` and `locked` on item entries: reachable by
      keyboard, never activated by press, Enter, or hover, exposed as
      `aria-disabled`, inset ring while keyboard-active. Disabled rows dim
      their content rather than the row so the ring keeps full contrast; locked
      rows stay at full strength and show a lock beside the check.
- [x] Navigation model: `inert` navigation items, first-open preference for
      rows that can be activated, one `isActivatableDropdownListEntry` guard
      shared by `DropdownList`, `useComboboxNavigation`, and
      `useDropdownSelectorNavigation`.
- [x] Secondary text: `aria-describedby` from the row on web, and
      `primaryDeep` on the soft fills (a new `descriptionStyle` on the row
      highlight). Trailing `rightText` keeps its muted color: an existing
      browser test pins it, so its contrast gap is reported for a decision
      rather than changed here.
- [x] Unit tests for segments, navigation items, activation, and contrast.

### M3 — ComboboxMultiSelect props

- [x] Option fields `group`, `description`, `disabled`, `chipTone`, `icon`.
- [x] `lockedValues`, `singlePerGroup`, `footerAction` props.
- [x] Pure model (`comboboxMultiSelectModel.ts`): grouping, group-aware
      filtering, toggle rules, and footer-action entry.
- [x] Chips: icon, muted tone, locked chip with a lock glyph instead of the
      remove button.
- [x] Scope the combobox document key listener to the input and its list
      (`ownerIds`), with a failing browser test first (confirmed failing
      without the fix).
- [x] Muted chip moved from the `soft` fill to an outlined `surface` chip:
      the axe sweep showed `muted` on `soft` is 4.498:1 in the default theme.
- [x] Unit tests for every new prop: grouping and group-name search, disabled
      options, locked chips (static markup), footer action from the keyboard
      with the query, and `singlePerGroup` replacement.

### M4 — Stories, browser coverage, and docs

- [x] `House` and `Car` glyphs in both icon modules for the story.
- [x] Add the glyphs to the package smoke's stubbed `lucide-react`, plus a unit
      test that keeps that stub list in sync with the icon modules (the import
      smoke caught the gap only at the end of `npm run verify`).
- [x] Storybook: grouped tag picker story (open on mount) plus a dark variant.
- [x] Browser tests: groups and headings, group-name search, disabled and
      locked rows, footer action by keyboard and pointer, `singlePerGroup`,
      chip-remove Enter, and computed contrast of descriptions.
- [x] Record snapshot baselines for the new stories; the axe sweep stays clean.
- [x] Update `src/dropdown/README.md`, the root `README.md`, and the manual
      accessibility checklist.

### M5 — Verification and delivery

- [x] `npm run format:check`, `npm test`, typecheck (native and web), build,
      `test:dist`, `test:package`, `storybook:build`, `test:browser`.
- [x] `cargo xtask check` green: 1,277 unit tests (13 dist-only skips, run by
      `test:dist`), 15 dist tests, package smoke, Storybook build, and 398
      browser tests including the axe and snapshot sweeps.
- [x] `git add -A`, commit with Conventional Commits (`feat(dropdown)` and
      `fix(dropdown)`), and push the branch.
- [x] `cargo xtask review` after the push; record findings here without fixing
      them. (The sandbox's codex proxy hangs on the `gpt-5.5` model the xtask
      pins, so the identical review prompt ran through `codex exec` with the
      proxy's default model and the same read-only flags. Codex's bwrap
      sandbox also needs every capability dropped here, through `setpriv` as
      in the focus-indicator plan.)
- [ ] Review finding 1 (P2): internal row ids (`combobox-group-N`,
      `combobox-footer-action`, and the older `empty` / `footer`) can collide
      with an option `value`, breaking navigation for that option. Awaiting a
      decision on namespacing.
- [ ] Review finding 2 (P2): without a `listId`, `DropdownList` emits
      `role="group"` with no `aria-labelledby` and drops `aria-describedby`
      (`ContextMenu.web.tsx` omits it). Awaiting a decision on a `useId`
      fallback.
- [ ] Review finding 3 (P2): option `icon`s in rows and chips are not passed
      `aria-hidden`; Lucide hides itself, but a custom `IconComponent` may not.
      Awaiting a decision.
- [ ] Review finding 4 (P3): the README tag-picker example uses `House`
      without importing it. Awaiting a decision.

## Open questions

- **Bottom-sheet presentation (nice to have #8) is not shipped.** It does not
  fit the library yet:
  - The native `Sheet` hosts `@gorhom/bottom-sheet`, whose keyboard handling
    only engages for its own `BottomSheetTextInput`. The library's `TextInput`
    primitive is a plain React Native input, so the software keyboard would
    cover the list and the pinned action.
  - The web `Sheet` scrolls title, body, and footer as one column, so the
    input at the top and the action at the bottom cannot stay pinned.
  - `Sheet` has no initial-focus hook, so focus would land on the first chip's
    remove button rather than the input.
  - A follow-up would add a sheet text input that registers with gorhom's
    keyboard state, pinned header and footer regions on both sheets, and an
    `initialFocusRef`, then a `presentation="sheet"` prop that reuses the field
    and list from this change. It needs an on-device pass.
