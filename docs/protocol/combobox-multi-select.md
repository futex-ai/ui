# Combobox Multi-Select Protocol

## Status

Implemented contract for `ComboboxMultiSelect` (`@firna/ui/dropdown`): the
removable-chip autocomplete field, including grouped tag selection. The
[Dropdown Contract](shared-ui-components.md#dropdown-contract) covers the
shared portal, placement, and list behaviour this control is built on. The
[tag picker mockup](../mockups/combobox-tag-picker.html) is the visual spec.

## Compatibility

Every capability below except the base field is opt-in through an optional
prop or option field. A caller that passes none of them renders and behaves as
before: one flat option list, every row toggles, every chip is removable, and
`footer` is a static note in the last list row.

## Option Model

`ComboboxMultiSelectOption`:

| Field         | Meaning                                                      |
| ------------- | ------------------------------------------------------------ |
| `value`       | Stable id. Also the row id, so it must be unique.            |
| `label`       | Visible text; the row's accessible name and the filter text. |
| `group`       | Section heading the option is listed under.                  |
| `description` | Secondary line under the label.                              |
| `disabled`    | Listed but cannot be chosen.                                 |
| `chipTone`    | `"default"` (default) or `"muted"` chip styling.             |
| `icon`        | Glyph shown in the row mark and at the start of the chip.    |
| `mark`        | Row mark text; defaults to the label's first character.      |
| `color`       | Row mark fill; defaults to `primary`.                        |

`mark` and `color` stay row-only. Only `icon` reaches the chip, so existing
callers that set `mark` keep their chips unchanged.

## Grouping

- Options that share a `group` render under one section heading.
- Groups appear in the order of their first option in `options`.
- Options with no `group` render first, with no heading, in `options` order.
- Inside a group, options keep their `options` order.
- Group names are compared exactly; `"Vehicles"` and `"vehicles"` are two
  groups. An empty `group` string counts as ungrouped.

## Filtering

- The query is trimmed; an empty query lists every option.
- Matching is case-insensitive, like the label filter it extends.
- An option matches when its `label` contains the query.
- A group whose name contains the query lists all of its options.
- Otherwise a group lists only its matching options.
- A group with no listed options is hidden, heading included.
- `description` is not searched.
- With nothing listed, the list shows the `No matching options` row.
- The polite live region announces `N options available` (or
  `No matching options`) for a non-empty query. `N` counts listed option rows,
  disabled and locked rows included; headings and the footer action are not
  counted.

## Rows

- The row label is `label`. `description` renders in the row's `secondary`
  slot.
- The row mark shows `icon` when set, otherwise `mark`, otherwise the label's
  first character.
- A selected row shows the trailing check.
- A disabled row is dimmed. A press or Enter does nothing.
- A locked row keeps the selected styling at full strength and shows a lock
  glyph before the check. A press or Enter does nothing.
- The description must stay readable in every row state: `onSolid` on the
  solid active fill, `primaryDeep` on the soft fills (the selected row in the
  `solid` and `dot` variants, the active `ringFill` and `dot` rows), and
  `muted` on the plain surface. Each pair clears WCAG 2.1 1.4.3 (AA) in all
  four shipped themes; `muted` on `primarySoft` or `soft` does not in the
  default theme.

## Chips

- Chips render in `options` order, not selection order.
- A chip shows `icon` (when set) before its label.
- `chipTone: "muted"` is an outlined chip: the `surface` fill, the `border2`
  edge, and `muted` text, glyph, and remove control (`muted` on `surface`
  clears AA in all four themes; `muted` on `soft` does not). The default tone
  keeps the `primarySoft` chip.
- A locked chip has no remove button. A decorative lock glyph sits where the
  remove control would be.
- A disabled option that is already selected keeps a removable chip; only
  `lockedValues` prevents removal.
- `singleLine` keeps the first chip plus a `+N` summary and drops every
  trailing control, including the lock glyph.
- Backspace in the empty input does not remove chips.

## Selection Rules

`onChange` receives the next `values` array.

- Choosing an unselected option appends its value.
- Choosing a selected option removes its value.
- Disabled and locked options never change.
- `lockedValues` lists selected values that cannot be removed. A locked value
  that is not in `values` is ignored.
- Values in `values` that match no option are preserved.
- With `singlePerGroup`, choosing an unselected grouped option removes the
  other selected values of that group, then appends the new value. Choosing
  the selected option still removes it. Ungrouped options are unaffected.
- With `singlePerGroup`, a group that holds a locked value cannot change, so
  its other options render and behave as disabled.

## Footer Note And Footer Action

- `footer` (string) stays a static note: the last row inside the scrolling
  list, after the options or the empty-state row.
- `footerAction` is
  `{ label: (query: string) => string; onPress: (query: string) => void }`.
  It renders as a pressable row with a leading plus glyph, pinned under the
  list and outside the scroll area, so it stays visible while options scroll.
- `label` and `onPress` receive the trimmed query.
- Activation by press or Enter calls `onPress(query)`, then closes the list and
  clears the query.
- The note and the action can show at the same time.

## Keyboard

- Focusing the input opens the list, and so do ArrowDown, ArrowUp, and Enter
  while it is closed. ArrowDown / ArrowUp move the active row through the
  listed rows and then the footer action, wrapping at both ends.
- Section headings and the empty-state row are skipped.
- Disabled and locked rows are reachable, so assistive tech announces them.
  Their active state is an inset `primary` ring, never the activation fill.
- On open the active row is the first selected row when it can be toggled,
  otherwise the first row that can be toggled, otherwise the first reachable
  row.
- Enter activates the active row when it can be toggled or is the footer
  action, and does nothing on a disabled or locked row.
- Escape closes the list. Space types into the input.
- The document-level key listener handles only keydowns whose target is the
  input or a row inside the list. Enter on a chip's remove button, or on any
  other control, reaches that control.
- Pointer hover moves the active row onto rows that can be toggled and onto
  the footer action, never onto disabled or locked rows.

## Web Accessibility

- The input is `role="combobox"` with `aria-autocomplete="list"`,
  `aria-expanded`, `aria-controls`, and `aria-activedescendant`.
- The list is `role="listbox"`, named by `label` (else `placeholder`). The
  pinned footer action sits inside the listbox element, so
  `aria-activedescendant` can point at it.
- Each group renders as `role="group"` labelled by its heading through
  `aria-labelledby`. Ungrouped rows sit directly in the listbox.
- Rows are `role="option"` with `aria-selected`. Disabled and locked rows add
  `aria-disabled="true"`; a locked row is also `aria-selected="true"`.
- A row with secondary text references it through `aria-describedby`, so the
  description (for a disabled row, the reason) is announced.
- The footer action is an option named by its current label, for example
  `Create tag “van”`.
- Chip remove buttons are `Remove {label}` buttons. Locked chips and the lock
  glyphs are not interactive and add no tab stop.

Native keeps the tappable `button` row role and `accessibilityState`; grouped
headings are exposed as headers.

## Presentation

The list always opens in the anchored popover (`ComboboxPopover`): a non-modal
web portal, and the native fallback below the field. A bottom-sheet
presentation is out of scope until the sheet primitive gains a keyboard-aware
native text input and pinned top and bottom regions; see the
[plan's open questions](../../plans/combobox-grouped-tag-selection.md#open-questions).
