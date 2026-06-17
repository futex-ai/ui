# Dropdown Selectors

Reusable React Native and React Native Web dropdown primitives. They provide a
shared surface for form selects, compact filter pills, action menus, and
input-backed comboboxes in Firna apps.

## Responsibilities

- Anchor dropdowns to a measured trigger and render through the correct portal
  for the interaction model.
- Keep dropdowns above tables, forms, sidebars, modals, and other React Native
  Web stacking contexts.
- Keep placement viewport-aware by flipping above the trigger when there is not
  enough room below and clamping menu height.
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
- Size the default `field` selector with the shared `ControlSize` scale (`sm` /
  `md` / `lg`) so a select matches the height of the text inputs beside it.
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

Pass `header` and/or `footer` to pin custom content above and below the option
list. Both accept any node (a title, a hint, an action button), and they stay
fixed while the options scroll between them. The same props are available on the
underlying `DropdownList` for custom pickers and action menus:

```tsx
<DropdownSelector
  label="Scheme"
  header={<Text>Choose a scheme</Text>}
  footer={
    <Pressable onPress={addScheme}>
      <Text>Add scheme</Text>
    </Pressable>
  }
  onValueChange={setScheme}
  options={options}
  value={scheme}
/>
```

Pass `searchable` to add a search input pinned at the top of the menu that
filters the options (and section groups) as the user types. Filtering is
case-insensitive, empty section groups drop out, and a "No matching options"
row shows when nothing matches. The input is focused on open, the query resets
on close, and arrow keys / Enter / Escape keep working while typing:

```tsx
<DropdownSelector
  label="Currency"
  onValueChange={setCurrency}
  options={currencyOptions}
  searchable
  searchPlaceholder="Search currencies"
  value={currency}
/>
```

Pass `size` (`sm` / `md` / `lg`, default `md`) to size the default `field`
selector from the shared `ControlSize` scale. It reuses the input's per-size box
geometry — height, padding, value text, and chevron — so a select and a text
input stay the same height in a form. `size` applies to the `field` variant
only; the `map` / `pill` / `mobilePeriod` variants keep their bespoke
dimensions. `ReadOnlySelector` takes the same `size`:

```tsx
<DropdownSelector
  label="Currency"
  onValueChange={setCurrency}
  options={currencyOptions}
  size="sm"
  value={currency}
/>
```

Use `ReadOnlySelector` when the UI is selector-shaped but has no scoped data
behavior yet:

```tsx
import { ReadOnlySelector } from "@firna/ui/dropdown";

<ReadOnlySelector label="Date format" value="DD/MM/YYYY" />;
```

Use `DropdownMenu` for the common action-menu case. It owns the anchor ref,
open state, portal/list composition, and closes after selectable row presses by
default. When the menu opens, the first selectable row is active immediately;
ArrowUp / ArrowDown move that active row, mouse hover keeps the active row in
sync with the pointer, and Enter / Space activates the active row:

```tsx
import { DropdownMenu } from "@firna/ui/dropdown";

<DropdownMenu align="end" entries={entries} minWidth={220}>
  <Pressable
    accessibilityLabel={`Actions for ${name}`}
    accessibilityRole="button"
    style={styles.memberMenuButton}
  >
    <MoreHorizontal color={colors.ink2} size={17} />
  </Pressable>
</DropdownMenu>;
```

Pass `open` and `onOpenChange` for controlled state, `defaultOpen` for
uncontrolled initial state, and `closeOnSelect={false}` when a row should keep
the menu open. `entries` may also be a function that receives
`{ close, open, toggle }` for uncommon rows that need direct control. When the
trigger needs open-state styling, pass a function child that receives
`{ open, triggerProps }` and spread `triggerProps` onto the pressable so the
standard press and keyboard handlers stay attached.

Use `DropdownPortal` plus `DropdownList` directly for custom pickers that need
to own the anchor ref, surface body, or list wiring.

For web hover menus, use `useDropdownHover` on the trigger and pass
`surfaceHoverProps` into `DropdownMenu` or `DropdownPortal`. The hook keeps the
menu open across the small pointer gap between the trigger and the portal
surface.

Use `ComboboxPopover` plus `DropdownList` when the user keeps typing in an
existing input while results are open. This path uses a non-modal web portal so
focus stays in the input.

Use `ComboboxMultiSelect` for removable-chip autocomplete controls:

```tsx
import { ComboboxMultiSelect } from "@firna/ui/dropdown";

<ComboboxMultiSelect
  onChange={setBookIds}
  options={[{ label: "Greenhouse Studio", value: "book_123" }]}
  values={bookIds}
/>;
```

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
