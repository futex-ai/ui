# Dropdown List Protocol

## Status

Implemented on web, iOS, and Android for every dropdown list: selectors,
menus, comboboxes, responsive menus, and context menus.

## Purpose

This page holds the rules for the rows of a dropdown list that the
[Dropdown Contract](shared-ui-components.md#dropdown-contract) does not cover:
keyboard order, row names and descriptions, groups, pinned rows, and text
contrast.

## Keyboard

- A dropdown list is one Tab stop.
- The list's trigger or search input keeps focus, and the arrow keys move the
  active row.
- Tab never moves focus onto a row.
- Decision: rows are not Tab stops. Rejected: rows as Tab stops. Reason: a
  list is a composite widget, which is one Tab stop under WCAG 2.1, and a row
  with focus let Space choose the active row instead of the focused one.

## Names and descriptions

- A row's accessible name is its `accessibilityLabel`, else its label.
- A row's secondary line is its accessible description on web.
- A row's secondary line is its accessibility hint on native.
- Decision: native rows read the secondary line as a hint. Rejected: add the
  secondary line to the row's name. Reason: the name stays the visible label,
  which tests and callers use to find the row.
- An option row reports whether it is selected.
- A disabled row reports that it is disabled.

## Groups and pinned rows

- With `groupSections` on web, each section heading and the rows after it, up
  to the next section or divider, form a group named by the heading.
- A heading with no rows after it stays a plain line.
- `footerEntries` rows sit below the scrolling rows and stay visible while the
  rows scroll.
- Pinned rows follow the scrolling rows in the arrow-key order.
- Pinned rows stay part of the list for assistive tech.

## Contrast

- A row's label and secondary line keep WCAG 2.1 AA contrast, 4.5:1, against
  the row's fill.
- This holds in every highlight state and variant, in every shipped theme.
