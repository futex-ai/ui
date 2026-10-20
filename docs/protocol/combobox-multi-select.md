# Combobox Multi-Select Protocol

## Status

Implemented on web, iOS, and Android. The native sheet presentation has not had
an on-device check.

## Purpose

`ComboboxMultiSelect` in `@firna/ui/dropdown` is a labelled field. It shows the
selected values as removable chips, and its search input filters an option
list. It serves plain multi-selects and grouped tag pickers, where a record
takes at most one tag from each caller-defined group. The rules for the rows of
the option list are in [dropdown-list.md](dropdown-list.md). The rules for the
bottom sheet are in [sheet.md](sheet.md).

## Defaults

- Every grouped tag-picker prop is optional.
- Without them, the list has no section headings, no descriptions, and no
  pinned row, and every chip has a remove button.
- Without `presentation`, the list opens in the popover.
- The keyboard rules of the list are in
  [dropdown-list.md](dropdown-list.md#keyboard).
- `footer` is a static note on the last line of the scrolling list, after the
  empty state. It is not selectable.

## Options

- `group` names the section heading that lists the option.
- Sections keep the order of their first option in `options`.
- Options without a group come first, with no heading.
- `description` is the second line of the option row.
- `disabled` lists the option but blocks choosing it.
- `chipTone` paints the chip in the primary tint, `default`, or in a neutral
  grey, `muted`.
- `icon` draws in the option row's mark and at the start of its chip.
- `chipLeading` draws caller content at the start of the chip, in place of
  `icon`. A render function receives the chip's text colour.
- A text `mark` shows in the option row only.
- Decision: a chip shows a text mark only through `chipLeading`. Rejected: show
  every `mark` in its chip. Reason: callers such as the data-grid editor pass a
  mark for every option, and their chips would change.

## Selection

- The selected values are `values`, plus each value of `lockedValues` that
  `values` lacks.
- A locked value that `values` lacks shows as selected, and the next `onChange`
  includes it. Development builds warn about it.
- Chips follow the order of `options`, not the order of selection.
- A value that matches no option shows no chip.
- A locked value's chip has no remove button.
- A locked value's row shows as selected and cannot change.
- Decision: a locked value's row is disabled. This is an exception to the
  [Dropdown Contract](shared-ui-components.md#dropdown-contract) rule that
  checked rows stay enabled as removal toggles. Rejected: an enabled row that
  ignores presses. Reason: a disabled row tells assistive tech that the row
  cannot change.
- Any other selected value can be removed from its chip and from its row, also
  when its option is `disabled`.
- An unselected option can be chosen unless it is `disabled`, or unless
  `singlePerGroup` is on and a locked value holds its group.
- With `singlePerGroup`, choosing an option replaces the selected value of its
  group.
- Choosing the selected option again removes it.
- `singlePerGroup` does not limit options without a group.
- Without `singlePerGroup`, `onChange` receives the new value added to the
  selected values.
- A press that cannot change the selection does not call `onChange`.
- Choosing a row clears the search and keeps the list open.
- Backspace in an empty search input does not remove a chip.

## Search

- Search ignores case and the spaces around the query.
- An option shows when its label contains the query.
- A group shows all of its options when its name contains the query.
- A group with no shown option is hidden with its heading.
- With no shown option, the list shows "No matching options".
- Screen readers hear the number of shown options as the query changes.

## Footer action

- `footerAction` adds one row below the list, outside its scroll area.
- The row's label is `footerAction.label(query)` for the trimmed query.
- The arrow keys reach the row after the last option. ArrowUp from the first
  option wraps to it.
- When no option can be chosen, the row is the active row.
- Pressing the row, or Enter while it is active, calls `footerAction.onPress`
  with the trimmed query.
- The row then clears the search and closes the list or the sheet.

## Presentation

- `presentation="popover"`, the default, opens the list below the field.
- In the popover, focus stays in the search input while the list is open,
  also when the user presses a row or a heading.
- `presentation="sheet"` shows a button with the placeholder in place of the
  field's search input. The chips stay in the field.
- The button, or a press anywhere on the field, opens a bottom sheet.
- The sheet is named by `label`, else `accessibilityLabel`, else the
  placeholder.
- The sheet holds the chips and a search input at the top, the option list,
  and the footer action row.
- Choices apply as they are made.
- The sheet closes with its visible "Done" button, the backdrop, Escape on web,
  and a pan down or the back button on native.
- Only keys pressed in the sheet's search input move or choose a row. The
  sheet's buttons keep their own keys.
- On web, the sheet's search input takes focus when the sheet opens.
- On web, focus returns to the field's button when the sheet closes.
- On native, the sheet stays above the software keyboard while its search
  input has focus.
- Decision: the caller picks the presentation. Rejected: switch to the sheet by
  screen width inside the component. Reason: the caller knows its layout, and
  a fixed default keeps current callers unchanged.
- Decision: on web, the sheet is a modal dialog. This is an exception to the
  [Dropdown Contract](shared-ui-components.md#dropdown-contract) rule that
  input-backed comboboxes stay on a non-modal web portal. Rejected: a
  non-modal sheet. Reason: the sheet covers the page, so the page behind it
  must not take focus or be read.

## Accessibility

- On web, each search input is a combobox that refers to its list and to the
  active option.
- An explicit `accessibilityLabel` names both search inputs.
- On web and Android, without it, the field's search input takes its name from
  the visible label.
- On iOS, only `accessibilityLabel` names the field's search input.
- Without it, the sheet's search input takes the label text, else the
  placeholder.
- Decision: `accessibilityLabel` names the sheet's search input too. Rejected:
  the label first. Reason: callers set `accessibilityLabel` to override the
  name, and the override must hold in both presentations.
- On web, each search input is described by the error, then the hint.
- On native, the hint of each search input is the error when there is one,
  else the hint.
- On web, each search input reports `invalid` and `required`.
- On web, the sheet button reports that it opens a dialog and whether the
  dialog is open. The error and the hint describe it.
- On native, the sheet button reports whether the sheet is open. Its hint is
  the error when there is one, else the hint.
- A row that cannot change reports as disabled. A locked row also reports as
  selected.
- A chip's remove button is named "Remove {label}".
- `default` and `muted` chips keep WCAG 2.1 AA contrast between their text and
  their fill in every shipped theme.
