# Combobox Multi-Select Protocol

## Status

Implemented on React Native Web, iOS, and Android through the public
`ComboboxMultiSelect` in `@firna/ui/dropdown`, including the grouped tag-picker
props (`group`, `description`, `disabled`, `chipTone`, `icon`, `lockedValues`,
`singlePerGroup`, `footerAction`, `presentation`). The native sheet
presentation still needs an on-device check.

## Purpose

`ComboboxMultiSelect` is a labelled field that holds removable chips for the
selected values and a search input that filters an option list. It serves
plain multi-selects (a members dialog, linked books, a data-grid cell editor)
and grouped tag pickers, where a record takes at most one tag from each
caller-defined group. The shared dropdown rules (placement, layering, keyboard,
row highlight) are in the Dropdown Contract of
[shared-ui-components.md](shared-ui-components.md).

## Compatibility

- Every grouped tag-picker prop is optional. A caller that passes none of them
  gets the same rows, chips, keyboard behavior, and accessibility tree as
  before these props existed.
- `footer` stays a static note, rendered as the last line of the scrolling
  list, after the empty state. It is not selectable.
- `label`, `labelInfo`, `hint`, `error`, `required`, `singleLine`, `size`,
  `borderRadius`, `focusIndicator`, `highlightVariant`, and `autoFocus` keep
  their contracts.

## Options

- `value` and `label` are required. `color` and `mark` paint the option row's
  leading mark; `icon` replaces the mark's text with a glyph.
- `group` names the section heading the option is listed under. Sections keep
  the order of their first option in `options`. Options without a group come
  first, with no heading.
- `description` is the row's secondary line and its accessible description.
- `disabled` lists the option but blocks choosing it.
- `chipTone` is `default` (primary tint) or `muted` (neutral grey). `icon` also
  draws inside the chip. A text `mark` never shows in a chip.

## Selection Rules

- The selected set is `values` plus any value in `lockedValues` that `values`
  is missing. A missing locked value logs a development warning and shows as
  selected; the next `onChange` includes it.
- Chips render in `options` order, not selection order. Values that match no
  option render no chip.
- A locked value's chip has no remove button. Its row shows as selected and is
  not interactive.
- Any other selected value toggles off from its row and is removable from its
  chip, even when its option is `disabled`.
- An unselected option can be chosen unless it is `disabled` or, with
  `singlePerGroup`, its group's selected value is locked.
- With `singlePerGroup`, choosing an option removes the other selected values
  of its group and appends it. Options without a group are not limited.
  Without `singlePerGroup`, the new value is appended and the caller replaces.
- A press that cannot change the selection calls nothing. Choosing a row
  clears the search query and keeps the list open.
- Backspace in the empty search input does not remove chips.

## Search

- The query is trimmed and matched case-insensitively.
- An option shows when its label contains the query. A group shows all of its
  options when its name contains the query. A group with no visible option is
  hidden with its heading.
- With no visible option, the list shows a `No matching options` line. The
  match count is announced through the shared polite live region.

## Footer Action

- `footerAction` renders one selectable row pinned under the scroll area, with
  a leading plus glyph. Its label is `footerAction.label(query)` for the
  trimmed query.
- It follows the options in the arrow-key order: ArrowDown from the last
  choosable row reaches it, and ArrowUp from the first wraps to it. When no
  option is choosable, it is the active row when the list opens or filters.
- Pressing it, or Enter while it is active, calls `footerAction.onPress` with
  the trimmed query, then clears the query and closes the list (or the sheet).

## Presentation

- `presentation="popover"` (default) anchors the list below the field through
  `ComboboxPopover`: a non-modal web portal that keeps focus in the input.
- `presentation="sheet"` replaces the field's input with a button that shows
  the `placeholder`; the chips stay in the field. The button, or a press
  anywhere in the field, opens a `Sheet` named by `label` (else
  `accessibilityLabel`, else `placeholder`).
- The sheet holds the chips and a search input at the top, then the option
  list, then the pinned footer action. On web its input takes focus on open.
- In the sheet, only keys pressed in the search input drive the list (arrows,
  Enter, Escape). The sheet's buttons, such as Done and the chip remove
  buttons, keep their own Enter.
- Selections apply as they are made. The sheet's dismiss control is a Done
  action: native shows "Done" text in the header; web shows the modal's close
  button, named "Done". Escape, the backdrop, Android back, and pan-down also
  close it. Web focus returns to the field's button.
- Native caveat: the sheet's search input is a plain `TextInput` inside the
  gorhom sheet, so the software keyboard can cover the bottom of the list.

## Accessibility

- Popover: the input is a `combobox` named by the visible label
  (`aria-labelledby`) unless `accessibilityLabel` is set, with
  `aria-autocomplete="list"`, `aria-expanded`, `aria-controls`, and
  `aria-activedescendant` for the active row.
- Sheet: the field's button has `aria-haspopup="dialog"` and `aria-expanded`,
  and its name is `accessibilityLabel`, else `{label}, {placeholder}`. The sheet
  is a modal dialog; its input is a `combobox` named by the sheet's label.
- The list is a `listbox`. On web each group is a `role="group"` named by its
  heading through `aria-labelledby`.
- Option rows are `option`s with `aria-selected`. A non-interactive row
  (disabled, locked, or blocked) has `aria-disabled`, so a locked row is
  announced as selected and unavailable. Arrow keys skip non-interactive rows.
- A row's `description` is its `aria-describedby` description.
- The footer action is an `option` owned by the listbox through `aria-owns`,
  named by its label.
- Chip remove buttons are named `Remove {label}`; the visible `x` is hidden
  from assistive tech.

## Visual Contract

- A row's secondary line keeps WCAG 2.1 AA (4.5:1) contrast on every row fill
  in the four shipped themes: `onSolid` on the solid active fill and
  `primaryDeep` on the tinted fills (`primarySoft`, `soft`).
- `default` chips use a `primarySoft` fill, `primaryBorder` edge, and
  `primaryDeep` text; `muted` chips use a `soft` fill, `border2` edge, and
  `ink2` text.
- Disabled and locked rows are dimmed like every disabled dropdown row.

## Tests

- `tests/unit/comboboxMultiSelectModel.test.ts`: grouping, group-name search,
  and the selection rules.
- `tests/unit/dropdownListGroups.test.ts`: group segments and container ARIA.
- `tests/unit/staticComboboxMultiSelect.test.ts` and
  `tests/unit/dropdownRowContrast.test.ts` (run by `npm run test:dist`): server
  markup and row contrast from the built package.
- `tests/browser/combobox-tags.spec.ts`: keyboard, pointer, sheet, and axe
  checks against the `Dropdown/Examples` tag-picker stories.
