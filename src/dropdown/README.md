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

Pass `labelInfo` to add an ⓘ button after the selector's label that reveals
supplementary help text in a small tooltip on press. It reuses the shared
`LabelInfo` affordance (built on `Popover`, so the bubble is portaled and escapes
overflow clipping and dismisses on outside-press/Escape). Screen-reader users get
the text from the button's own description, so it is a sighted-user reveal that
stays out of the always-read `hint`. Override the glyph with `labelInfoIcon` and
the button's accessible name with `labelInfoLabel` (defaults to
`More information about {label}`); `labelInfo` needs a `label` to anchor the
button (a dev-warned no-op otherwise):

```tsx
<DropdownSelector
  hint="This determines how VAT is calculated on invoices."
  label="VAT scheme"
  labelInfo="The standard scheme reclaims VAT on purchases; the flat-rate scheme pays a fixed percentage of turnover instead."
  onValueChange={setScheme}
  options={schemeOptions}
  value={scheme}
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

Each `item` / `footer` entry accepts an optional `testID`, forwarded to that
row's pressable (`data-testid` on web) so an end-to-end test can target a
specific row; `DropdownSelectorOption` exposes the same `testID` for the
select-only picker.

### Row slots and the active-row color

The default `solid` highlight fills the active row with `primary` and inverts
everything the library renders itself — `label`, `secondary`, `rightText`, and
the selection check — to white. It cannot recolor a node it was merely handed,
so a `leading`/`right` node with a hard-coded color (`<Icon color={ink} />`)
stays near-black on that fill while the label beside it turns white.

Both slots therefore accept either a plain node or a render function receiving
the row's resolved content color, so a caller can tint its own glyph from any
icon set:

```tsx
const entries: DropdownListEntry[] = [
  {
    id: "settings",
    label: "Settings",
    leading: ({ color }) => (
      <Ionicons color={color} name="settings-outline" size={18} />
    ),
    onPress: openSettings,
    type: "item",
  },
];
```

The color tracks the label for the same row state: `surface` (white) on the
solid active fill, `primaryDeep` on the other active/selected variants, `ink` at
rest, and the tone accent (`rose` / `amber`) on a `danger` / `amber` row off the
inverted fill. A plain node still passes through untouched, which is the right
choice for content that owns its color regardless of row state (an avatar, a
category swatch). For trailing _text_, prefer the library-styled `rightText`
string over a hand-colored `right` node.

Pass `open` and `onOpenChange` for controlled state, `defaultOpen` for
uncontrolled initial state, and `closeOnSelect={false}` when a row should keep
the menu open. `entries` may also be a function that receives
`{ close, open, toggle }` for uncommon rows that need direct control. When the
trigger needs open-state styling, pass a function child that receives
`{ open, triggerProps }` and spread `triggerProps` onto the pressable so the
standard press and keyboard handlers stay attached.

By default the menu opens on press. Pass `trigger` to change how the child opens
it:

- `"press"` (default) — tap or click opens the menu, on every platform.
- `"hover"` — pointer hover opens it on web. The menu auto-wires
  `useDropdownHover` and bridges the trigger-to-surface gap, so no manual hook is
  needed. Press stays wired as the touch/keyboard fallback. On native, where
  hover does not exist, only press opens it.
- `"longPress"` — a press-and-hold opens it on web and native. A plain tap is
  left to the trigger's own `onPress`, so a tappable row stays tappable.
- `"contextMenu"` — right-click opens it on web (the browser's native menu is
  suppressed) and a long-press opens it on native. A plain tap is again left to
  the trigger.

```tsx
<DropdownMenu entries={entries} trigger="hover">
  <Pressable accessibilityLabel="Account" accessibilityRole="button">
    <Text>Account</Text>
  </Pressable>
</DropdownMenu>
```

In every mode the trigger advertises its menu to assistive tech with
`aria-haspopup="menu"` and reflects the open state with `aria-expanded`.
`longPress` and `contextMenu` are secondary-gesture triggers, so they never
hijack a tap; Enter/Space and ArrowDown open the menu from the keyboard in every
mode, so keyboard-only users can always reach it (right-click is also
keyboard-reachable on web via the context-menu key). For per-platform behavior,
drive the prop yourself, for example
`trigger={Platform.OS === "web" ? "hover" : "longPress"}`.

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

Use `DropdownPortal` plus `DropdownList` directly for custom pickers that need
to own the anchor ref, surface body, or list wiring.

`trigger="hover"` covers the common hover menu. For custom hover timing, keep
`trigger="press"` and wire `useDropdownHover` on the trigger yourself, passing
`surfaceHoverProps` into `DropdownMenu` or `DropdownPortal`. The hook keeps the
menu open across the small pointer gap between the trigger and the portal
surface, and a consumer-supplied `surfaceHoverProps` still composes with the
built-in bridge when `trigger="hover"`.

Use `ComboboxPopover` plus `DropdownList` when the user keeps typing in an
existing input while results are open. This path uses a non-modal web portal so
focus stays in the input.

Use `ComboboxMultiSelect` for removable-chip autocomplete controls. It is a full
labelled field: pass `label` / `hint` / `error` / `required` (and the shared
`labelInfo` ⓘ affordance) the same way as `DropdownSelector`, or omit `label` for
a bare control. The visible `label` names the combobox input via `aria-labelledby`,
`error` turns the control's border rose and is announced through an assertive live
region, and `required` wires `aria-required` plus the `*`:

```tsx
import { ComboboxMultiSelect } from "@firna/ui/dropdown";

<ComboboxMultiSelect
  error={bookIds.length === 0 ? "Select at least one book." : undefined}
  hint="Start typing to link the books this report should cover."
  label="Linked books"
  labelInfo="Linked books scope the report to specific ledgers. Leave it empty to include every active book."
  onChange={setBookIds}
  options={[{ label: "Greenhouse Studio", value: "book_123" }]}
  required
  values={bookIds}
/>;
```

Pass `size="sm" | "md" | "lg"` to align the control with the shared input
size scale. In a fixed-height table or data-grid cell, combine `size="sm"` with
`singleLine`: the first selected chip stays visible, further selections collapse
into a `+N` summary, and the control keeps the same 32px height as a compact text
input instead of growing across adjacent rows. Selected option rows are enabled
toggles, so pressing a checked row removes that value even when its chip is
summarized. Pass `autoFocus` when the control mounts as an active embedded
editor; its border and shared focus glow then match the text-input family.

Set `autoFocus` when the multi-select mounts as an in-place editor. Focus opens
the option list immediately and gives the control the same primary active border
and shared focus glow as `InputFrame`; pressing anywhere inside the control also
returns focus to its search input. Use `disableFocusRing` to keep the active
border while falling back to the browser's default focus outline.

Override the ⓘ glyph with `labelInfoIcon` and its accessible name with
`labelInfoLabel` (defaults to `More information about {label}`); `labelInfo` needs
a `label` to anchor the button (a dev-warned no-op otherwise). For the bare,
label-less variant pass `accessibilityLabel` to name the search input (it also
overrides the `label`-derived name where `aria-labelledby` is not honoured, e.g.
iOS) — mirroring `Input`.

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
