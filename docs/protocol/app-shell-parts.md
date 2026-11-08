# App Shell Parts Protocol

## Status

Implemented requirements. They extend the
[shared UI component protocol](shared-ui-components.md).

## Purpose

These parts let a Firna app build a dense desktop workspace and its phone
layout from shared components. The [mockup catalogue](../mockups/README.md)
draws them together under `workspace`. Decision: Conductive decision 119 chose
option B, these parts in this library. It rejected option A, a local copy in
each app, so that the apps keep one look and one accessibility model.

- Each part has the same props and behavior on web and native, unless a rule
  below names one platform.
- Every existing API, size, and default keeps its behavior. Nothing changes
  until a caller selects the `xs` size, the compact text scale, a touch
  surface, or a new part.
- The parts use the semantic theme tokens, and their text meets the 4.5:1
  contrast minimum in every shipped preset.

## Dense Size

- `ControlSize` accepts `xs`, the dense size. Every family that takes a size
  accepts it. A family without a dense design, such as the switch and the chip
  multi-select, draws `xs` with its `sm` metrics.
- At `xs`, buttons, link buttons, link tabs, text and date fields, selectors,
  and segmented controls are 26 px high.
- Button, link-tab, and segment labels at `xs` are 12 px on a 16 px line, at
  weight 500. The other sizes keep their current labels.
- An `xs` field has a 26 px frame around a 24 px input. Fields and selectors at
  `xs` show 13 px text.
- A single-line `xs` list row or menu row is at least 26 px high. Its title is
  13 px on an 18 px line, at weight 400. A longer row grows with its content.
- Each `xs` target, such as a Clear action inside a field, is at least 24 by
  24 px. Outside `xs` and touch surfaces, field actions keep their size.

## Compact Text

- The compact text scale is an optional second scale for the typography roles.
  The current scale stays the default.
- A caller can choose the compact scale for a surface and override it for one
  text, on web and native. Either scale works on any surface, a touch surface
  included.
- Compact body text is 13 px on a 20 px line. The compact scale keeps the nine
  roles, their colors, their letter case, and their heading levels. No compact
  role is larger than the same default role.
- Control labels follow the control metrics. Field labels, hints, and errors
  keep their current metrics.

## Touch Surfaces

- A caller marks a touch surface, such as a phone layout, explicitly. Decision:
  the library does not detect it from the viewport, the pointer, or the
  platform. Static and server-rendered HTML then has the sizes of the first
  client render.
- Inside a touch surface, these parts use the touch metrics, whatever their
  size: buttons, icon buttons, link buttons, link tabs, text and date fields,
  actions inside fields, selectors, segments, list rows, menu rows, chip
  multi-selects, and the close control of a sheet.
- The touch metrics give each target at least 44 by 44 px and each single-line
  row at least 44 px of height. Control labels are 15 px on a 20 px line, at
  weight 500, and icons are 18 px. Row titles are 15 px on a 20 px line, and
  row details are 13 px on an 18 px line.
- A text input is itself at least 44 px high, so its bordered frame can be
  46 px. Its text is 16 px, so that phone browsers do not zoom the page when
  the input takes focus.
- A switch keeps its geometry, and its target grows to 44 by 44 px.
- Each target occupies its own layout space. A control that the caller draws
  smaller keeps its drawing and reserves the rest of its target around it, for
  example an icon button with an explicit box size. Decision: the library
  reserves space instead of an invisible hit area, because a dense phone
  toolbar has no room for targets that overlap. Outside a touch surface, the
  box size and the hit slop of a button keep their current behavior.
- A chip multi-select grows to hold its 44 px input and 44 px removal actions.
  Its single-line mode stays on one line and grows in height, so that no
  action is clipped.

## Links

- These rules apply to link buttons, link tabs, and navigation rows.
- A link always has a destination that the caller gives. On web, it is an
  anchor with that address. The browser keeps its link behavior: a new tab or
  window, the address preview, copying the address, and the context menu.
- A link contains no other interactive control. An icon-only link has an
  accessible name.
- The caller can give a navigation action for routing inside the app. A primary
  click or Enter without Ctrl, Meta, Shift, or Alt runs that action and does
  not load the address.
- A modified click, a middle click, and each activation of a new-tab link keep
  the browser default and do not run the action. Space does not activate a
  link.
- On native, a link has the link role. Activation runs the navigation action.
  Without one, the platform's link handling opens the destination.
- The caller chooses whether a link opens a new tab. Decision: the library does
  not infer a new tab or a route from the address, because only the app knows
  its routes.
- A new-tab link shows a new-tab indicator after its label. Its accessible name
  ends with a hidden note, by default "(opens in a new tab)", which the caller
  can replace. The opened page gets no access to the page that opened it.
- The caller marks the link to the current page. That link exposes the
  current-page state, `aria-current="page"` on web and the selected state on
  native, and shows a current style. Decision: the caller marks it, rather than
  the library comparing addresses, because routing belongs to the app and
  static HTML has no location.
- A link shows the shared focus indicator and follows the focus-indicator modes
  of the [theming contract](shared-ui-theming.md#theming-contract).

## Link Buttons

- A `LinkButton` is a link with the look of a button of the same tone and size.
  Its tones are primary, secondary, ghost, and plain. It can fill the width of
  its container, and its icon is hidden from assistive technology.
- Decision: a link button has no danger tone and no disabled state, because a
  link moves to a page and destroys nothing. A control that cannot navigate yet
  is a disabled button.

## Link Tabs

- `LinkTabs` is a named navigation landmark, and each tab is a link with its
  own destination. Decision: the tabs are links, not an ARIA tab list, because
  each tab loads its own page. An ARIA tab list switches panels in one page.
- Each tab is one stop in the keyboard tab order. Arrow keys do not move
  between tabs.
- The current tab changes its fill, outline, and text color, but not its label
  weight, so the tabs do not shift.
- A tab can show a count after its label, as part of its accessible name.
- A tab has the height of a button of the same size. The caller can restyle
  the labels, such as a monospace font in capitals, without a change to that
  height.
- A tab row wider than its container scrolls sideways, and each focus
  indicator stays fully visible inside it. A filled tab bar shares its free
  width between tabs after their content, while keeping each target at its
  minimum size.

## Navigation Rows

- A list row can be a link. The list keeps its list semantics, and each link
  is the content of its list item.
- The row of the current page has a tinted fill and a deep accent title at
  least weight 600. It keeps a heavier title weight when its size uses one.
- A row that needs another control keeps that control outside the link. Rows
  with a press action stay buttons, as the
  [list contract](shared-ui-data-views.md#list-contract) says.

## Notices

- A `Notice` shows a title, an optional body, an optional decorative icon, and
  optional actions. Its title is not a heading, so the page outline stays.
- An urgent notice is an alert. Assistive technology announces its message
  when the notice appears and when the message changes.
- A neutral notice is ordinary content, not a live region. Decision: only the
  urgent tone announces, because an announcement for each neutral notice
  interrupts the user with messages that can wait.
- Neither tone moves focus. The icon slot is hidden from assistive technology
  and can hold any glyph, such as a spinner.
- The actions follow the text in a wide notice and go below it in a narrow
  one. The tone shows as a fill and an outline on every edge. The urgent
  colors derive from the theme's danger color.

## Empty States

- An `EmptyState` shows a quiet message for a view with nothing to show: an
  optional decorative icon, a title, an optional body, and optional actions.
- The title is a heading at the level that the caller gives, and the level
  does not change its size. Decision: the caller gives the level, because only
  the page knows its outline.
- A page empty state centers in its area. A panel empty state is smaller and
  sits at the top of its panel.
- An empty state is not a live region. A caller that must announce a change,
  such as a search with no results, announces it separately.

## Menus

- These rules apply to a menu drawn open in place and to a menu that opens as a
  sheet. The [dropdown contract](shared-ui-overlays.md#dropdown-contract)
  keeps the rules of the portal menus, with their measured placement.
- A menu has the menu role and an accessible name. It holds action rows,
  choice rows, group labels, dividers, and notes.
- An action row is a menu item. A choice row is a menu radio item with its
  checked state, and the checked row shows a check mark.
- A row can show a decorative icon and a muted detail, such as a count. A
  danger row uses the danger color. A disabled row shows its state and cannot
  be activated.
- Outside a sheet, the rows take the size that the caller selects, such as
  `xs`, and the first enabled row is active when the menu opens. A sheet uses
  touch rows.
- Up and Down arrows move the active row. They skip disabled rows, labels,
  dividers, and notes.
- Enter activates the active row, and Escape closes the menu. Activating a row
  closes the menu unless the caller keeps it open.
- Closing the menu returns focus to its trigger.

### Open In Place

- A menu can render open in place beside its trigger, without a portal and
  without a measurement, so static and server-rendered HTML shows it open. It
  keeps the rows and semantics of an interactive menu.
- The caller chooses the side, above or below the trigger, and the alignment,
  start or end. Decision: the caller places the menu, rather than the menu
  measuring and flipping itself, because static HTML cannot measure.

### Phone Menu Sheets

- On a touch surface, an interactive menu opens as a bottom sheet, on web and
  native. Elsewhere, web anchors the menu to its trigger, and native keeps its
  sheet.
- The sheet is a modal dialog named by the menu label, with a visible title, a
  close control, and the menu rows. It opens without an active row, and the
  arrow keys still move the active row.
- The sheet follows the focus and close rules of the
  [modal contract](web-overlays.md#modal-contract). Escape, a backdrop press,
  and the close control close it, and focus returns to the trigger.
- A sheet can also render open in place, with the same rows, for static and
  server-rendered HTML.

## Panel Resize Handle

- A resize handle sits on the inner edge of a side panel and changes the width
  of the panel. Moving it away from the panel makes the panel wider.
- The caller owns the width, the layout, and the storage. The handle proposes
  each new width, which the caller applies. It reports the end of each drag,
  key change, or accessibility action, so the caller can store the width once.
- The caller gives the minimum and maximum width, and each proposed width
  stays within them. Decision: the caller gives bounds that leave room for the
  main content, because only the caller knows the layout around the panel.
- A pointer drag follows the pointer until release, also outside the handle.
  On native, a touch drag works the same way.
- On web, the handle is a vertical separator in the keyboard tab order. It has
  an accessible name, the width as its value, and the bounds as its minimum
  and maximum.
- Left and Right arrows move the handle one step in their direction, 16 px by
  default. Home sets the minimum width, and End sets the maximum width.
- On native, the handle is adjustable. Its increment and decrement actions
  change the width by one step, and it exposes its name and width.
- At rest, the handle is the hairline between the columns. Under the pointer,
  during a drag, and with keyboard focus, the hairline darkens and a short
  grip shows in the primary color. Decision: the grip is short, because a
  full-height primary line reads as an accent strip along the panel.
- Keyboard focus adds the shared focus indicator around the grip and follows
  the focus-indicator modes of the theming contract.

## Non-Goals

- Routing. The library does not read or change the app's location.
- Detecting a phone. The caller marks each touch surface.
- Laying out panels or storing their widths.
- A Graphite theme preset. The parts use the semantic tokens of any theme.
- Moving Conductive to these parts, which its own repository does.
