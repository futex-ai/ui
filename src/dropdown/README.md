# Dropdown Selectors

Reusable React Native and React Native Web dropdown primitives. They provide a
shared surface for form selects, compact filter pills, action menus, and
input-backed comboboxes in Firna apps.

Longer topics have their own guides: [selectors](selectors.md),
[menus and lists](menus.md), and [comboboxes](comboboxes.md).

## Responsibilities

- Anchor dropdowns to a measured trigger and render through the correct portal
  for the interaction model.
- Keep dropdowns above tables, forms, sidebars, modals, and other React Native
  Web stacking contexts.
- Keep placement viewport-aware: on web, measure each surface and flip it above
  the trigger when it does not fit below, and clamp menu height.
- Share keyboard navigation, hover/active row styling, right-side row content,
  section headers, disabled rows, and footer/action rows.
- Pin optional `header` and `footer` content above and below the option list so
  it stays visible while the rows scroll between them.
- Keep the keyboard-active row scrolled into the visible list viewport for long
  dropdowns and combobox result lists.
- Include visual field labels in selector accessible names when labels are
  present.
- Provide a concise `DropdownMenu` wrapper for the common trigger + action list
  case, while leaving `DropdownPortal` and `DropdownList` available for custom
  pickers.
- Size the default `field` selector with the shared `ControlSize` scale (`xs` /
  `sm` / `md` / `lg`) so a select matches the height of the text inputs beside
  it.
- Give the triggers, the search input, and the chip multi-select targets of at
  least 44 by 44px inside a `TouchSurface`.
- Keep button-backed selectors/action menus separate from input-backed
  comboboxes so autocomplete inputs keep focus while results are open.

## Usage

Use `DropdownSelector` for value selects:

```tsx
import { DropdownSelector } from "@firna/ui/dropdown";

<DropdownSelector
  label="Scheme"
  onValueChange={setScheme}
  options={[{ label: "Standard", value: "standard" }]}
  value={scheme}
/>;
```

### Imperative focus after async hydration

See the [selectors guide](selectors.md#imperative-focus-after-async-hydration).

### Row slots and the active-row color

See the [menus guide](menus.md#row-slots-and-the-active-row-color).

### Row sizes, choices, and notes

See the [menus guide](menus.md#row-sizes-choices-and-notes).

## Accessibility

On web the option surface is a real ARIA composite (WCAG 4.1.2 Name/Role/Value):

- `DropdownMenu` exposes its surface as `role="menu"` with `role="menuitem"`
  rows; the selector and combobox surfaces are `role="listbox"` with
  `role="option"` rows (so the selected option carries `aria-selected`). Pass
  `accessibilityLabel` to name a menu surface.
- The trigger/input links to its surface with `aria-controls` and tracks the
  keyboard-active row with `aria-activedescendant`, so Arrow navigation is
  announced without moving DOM focus off the trigger.
- Searchable selectors and `ComboboxMultiSelect` mark their text field as
  `role="combobox"` with `aria-autocomplete="list"`/`aria-expanded`, and
  announce the filtered result count through a polite live region (WCAG 4.1.3).
  `ComboboxMultiSelect`'s labelled surface names the combobox input from the
  visible `label` via `aria-labelledby`, references its `error`/`hint` by id via
  `aria-describedby`, and reflects `aria-invalid`/`aria-required` — matching
  `DropdownSelector`. Its optional `labelInfo` ⓘ carries the detail as its own
  accessible description (announced on focus); the portaled bubble is a
  sighted-user reveal only, so the text is never announced twice and never leaks
  into the input's name.
- `DropdownSelector` associates a visible `error`/`hint` with the trigger via
  `aria-describedby` (and `accessibilityHint` on native) and reflects
  `aria-invalid`/`aria-required`, since RNW does not map `accessibilityHint` to
  `aria-describedby` (WCAG 3.3.1 / 1.3.1). Its optional `labelInfo` ⓘ is a real
  button that carries the detail as its accessible description (announced on
  focus); the portaled bubble is a sighted-user reveal only, so the text is never
  announced twice and never leaks into the trigger's name.

These ARIA roles/attributes are emitted on web only; native keeps the tappable
`button` row role and `accessibilityState` so OS screen readers are unaffected.

## Theming

Dropdowns read colors, fonts, and radii from `SharedUiThemeProvider`. The
default theme matches the accounting source components. Juno can use
`junoSharedUiTheme` or pass primary-token overrides through
`createSharedUiTheme`.

## Scope

On web, `DropdownPortal` and `ComboboxPopover` render through
`DropdownWebLayer`, a non-modal `pointer-events: box-none` DOM portal. Only the
menu surface is hit-testable, so the trigger keeps real hover state while the
menu is open and the rest of the page stays interactive. Outside presses close
the menu through a `useDropdownDismiss` document listener instead of a scrim,
and Escape closes it through the shared escape-layer stack (`src/escapeLayer.ts`)
so a menu opened inside a modal dismisses without also closing the modal.

Do not render web dropdown surfaces through React Native Web `Modal`: its
internal wrappers are full-viewport hit-testable elements that steal hover from
the trigger and make hover-opened menus flicker shut. On native,
`DropdownPortal` stays modal-backed so the scrim catches outside taps and the
back button closes the menu.

When a dropdown or combobox opens from inside a web modal, it must remain above
the modal surface. Keep `DROPDOWN_LAYERS.portal` above
`WEB_MODAL_LAYERS.surface`. The default portal layer is intentionally high
(`1_000_000`) so anchored menus and popovers clear consumer content stacks.
`DropdownPortal` accepts `zIndex` for the rare screen that owns an even higher
custom layer.

## Key Code

- [`DropdownSelector.tsx`](DropdownSelector.tsx): the single-value selector,
  with its trigger, messages, and option popup. Its state is in
  [`useDropdownSelectorState.ts`](useDropdownSelectorState.ts), and its option
  and section types are in [`dropdownSelectorTypes.ts`](dropdownSelectorTypes.ts).
- [`ReadOnlySelector.tsx`](ReadOnlySelector.tsx): a selector's trigger as static
  text, for values that cannot change.
- [`DropdownMenu.tsx`](DropdownMenu.tsx): the trigger-backed action menu.
  [`useDropdownHover.ts`](useDropdownHover.ts) holds its hover-open state.
- [`DropdownList.tsx`](DropdownList.tsx) and [`DropdownRow.tsx`](DropdownRow.tsx):
  the shared option list and its rows. [`dropdownListTypes.ts`](dropdownListTypes.ts)
  holds the entry types.
- [`DropdownPortal.tsx`](DropdownPortal.tsx) and
  [`DropdownPortal.web.tsx`](DropdownPortal.web.tsx): the modal native surface
  and the non-modal web surface. [`DropdownWebLayer.tsx`](DropdownWebLayer.tsx)
  is the web portal layer, and
  [`useDropdownSurfacePlacement.ts`](useDropdownSurfacePlacement.ts) places a
  web surface from its measured height.
- [`ComboboxPopover.web.tsx`](ComboboxPopover.web.tsx) and
  [`ComboboxPopover.tsx`](ComboboxPopover.tsx): the non-modal web result popover
  of an input-backed combobox, and its native fallback.
- [`ComboboxMultiSelect.tsx`](ComboboxMultiSelect.tsx): the chip multi-select.
  Its state is in
  [`useComboboxMultiSelectState.ts`](useComboboxMultiSelectState.ts).
- [`dropdownLayers.ts`](dropdownLayers.ts): the shared web stacking layers.
