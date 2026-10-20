# Dropdown Selectors

Reusable React Native and React Native Web dropdown primitives. They provide a
shared surface for form selects, compact filter pills, action menus, and
input-backed comboboxes in Firna apps.

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
  it stays visible while the rows scroll between them. Pinned `footerEntries`
  rows stay in the keyboard order and in the listbox.
- Expose a row's `secondary` line as its accessible description, and (with
  `groupSections`) name each section's rows as a group on web.
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

### Imperative focus after async hydration

`triggerRef` exposes the selector's underlying pressable when a caller must
move focus itself. The selector still keeps that same node internally for popup
measurement and placement. A common case is a modal form that initially renders
a skeleton: the modal's one-time focus pass runs before the field exists, so the
form must focus its first real field when hydration completes.

```tsx
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { DropdownSelector } from "@firna/ui/dropdown";
import { WebModalFrame } from "@firna/ui/modal";

const firstFieldRef = useRef<View | null>(null);

useEffect(() => {
  if (hydrated) firstFieldRef.current?.focus();
}, [hydrated]);

<WebModalFrame initialFocusRef={firstFieldRef} /* … */>
  {hydrated ? (
    <DropdownSelector
      label="Holiday year starts"
      onValueChange={setMonth}
      options={monthOptions}
      triggerRef={firstFieldRef}
      value={month}
    />
  ) : (
    <FormSkeleton />
  )}
</WebModalFrame>;
```

Keep `initialFocusRef` as well as the hydration effect: it handles a form whose
field already exists when the modal opens (including later reopens), while the
effect handles the initial skeleton-to-form transition.

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

Selector popups use the trigger width as their minimum, grow to fit wider option
content, and stop at a default maximum of `360` pixels or the viewport edge,
whichever comes first. This keeps short selects compact while labels, secondary
text, and trailing codes have room before they wrap. Pass `menuMinWidth` or
`menuMaxWidth` to override those bounds for a specific selector; a wider trigger
still remains the minimum until the viewport itself is narrower:

```tsx
<DropdownSelector
  menuMaxWidth={440}
  menuMinWidth={280}
  onValueChange={setRunId}
  options={runOptions}
  value={runId}
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

`DropdownList` has two opt-in props for custom pickers:

- `footerEntries` — selectable rows pinned under the scroll area, for an action
  such as "Create tag" that must stay visible while the options scroll. They
  follow the scrolling rows in the arrow-key order and share the highlight. On
  web the list container owns them with `aria-owns`, so they stay `option` (or
  `menuitem`) rows of the list and `aria-activedescendant` can point at them.
- `groupSections` — on web, each `section` entry and the rows after it (up to
  the next section or divider) render inside a `role="group"` named by the
  heading. A heading with no rows after it (an empty state or a note) stays a
  plain line. Native keeps the flat rows.

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
- Each list is one Tab stop, and no row is ever a Tab stop (WCAG 2.1.1). When a
  combobox input controls the list, as in `ComboboxMultiSelect` and a
  `searchable` selector, the input is the stop and keeps focus, also when the
  user clicks or taps a row, a heading, or another line of the list. Otherwise
  the list itself is the stop and points `aria-activedescendant` at the active
  row, so a list that scrolls stays reachable from the keyboard. Pass
  `focusable={false}` to a custom `DropdownList` that a combobox input
  controls. A `DropdownList` without a `listId` makes its own, so its rows
  always have ids to point at.
- A row's name is its label, and its visible `secondary` line is its accessible
  description, so a screen reader hears both: `aria-describedby` on web, and
  the accessibility hint on native.
- Disabled rows carry `aria-disabled`. `ComboboxMultiSelect` also renders a
  locked value's row as disabled, so it is announced as selected and
  unavailable.
- With `groupSections`, each group is a `role="group"` named by its visible
  heading (`aria-labelledby`), and pinned `footerEntries` are owned by the list
  (`aria-owns`), so a footer action is named by its label like any option.

These ARIA roles/attributes are emitted on web only; native keeps the tappable
`button` row role, `accessibilityState`, and the secondary line as the hint.

Use `DropdownPortal` plus `DropdownList` directly for custom pickers that need
to own the anchor ref, surface body, or list wiring. The portal treats the
anchor width as its minimum by default, matching menus and selectors. A compact
fixed-width surface that may be narrower than a wide anchor can pass
`anchorWidthAsMinimum={false}` with explicit `minWidth` / `maxWidth` bounds; the
web date calendar uses this policy to remain `280px` wide below a full-width
field. `DropdownMenu`, `Popover`, and `ComboboxPopover` forward the option with
their other shared placement props.

Vertically, the web portal places a surface by its own size: it lays the
surface out once at its natural height (up to `maxHeight`), measures it, and
places it before the browser paints — below the anchor when the whole surface
fits there, otherwise on whichever side is roomier, clamped to that side's
room. Nothing needs to declare its height, so a fixed-layout surface such as
the date calendar flips instead of being clipped, and a short menu stays below
a trigger near the viewport edge. The height is measured once per open, so a
list that filters or grows while open keeps its side and scrolls within the
clamp. `minHeight` raises the room a surface needs below on top of its measured
height, for content expected to grow after opening. The combobox and rich-text
slash-menu portals share this through `useDropdownSurfacePlacement`. Native
does not measure: the Modal-backed portal opens below while `minHeight`
(default `140px`) fits there.

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
returns focus to its search input. Use `focusIndicator="outline"` to keep the
active border while falling back to the browser's default focus outline, or
`focusIndicator="none"` to drop the glow, the outline, and the active border
when the surrounding surface shows focus itself.

Override the ⓘ glyph with `labelInfoIcon` and its accessible name with
`labelInfoLabel` (defaults to `More information about {label}`); `labelInfo` needs
a `label` to anchor the button (a dev-warned no-op otherwise). For the bare,
label-less variant pass `accessibilityLabel` to name the search input (it also
overrides the `label`-derived name where `aria-labelledby` is not honoured, e.g.
iOS) — mirroring `Input`.

### Grouped tag picker

`ComboboxMultiSelect` also covers a tag picker whose options come in
caller-defined groups, with at most one tag per group. Every prop below is
optional; a caller that passes none of them gets the plain chip multi-select
above, unchanged.

```tsx
import { ComboboxMultiSelect } from "@firna/ui/dropdown";
// Any `IconComponent`: lucide-react-native on native, lucide-react on web.
import { Car, House } from "lucide-react-native";

<ComboboxMultiSelect
  footerAction={{
    label: (query) => (query ? `Create tag “${query}”` : "Create tag"),
    onPress: (query) => openCreateTag(query),
  }}
  label="Tags"
  labelInfo="Tags group transactions by property, vehicle, project or anything else you track."
  lockedValues={["flat2"]}
  onChange={setTagIds}
  options={[
    {
      description: "UK rental property",
      group: "Properties",
      icon: House,
      label: "Flat 2, 14 Brook Street",
      value: "flat2",
    },
    {
      description: "UK rental property",
      group: "Vehicles",
      icon: Car,
      label: "Renault Kangoo BX19 KLM",
      value: "van",
    },
    {
      description: "Consultancy trade",
      disabled: true,
      group: "Vehicles",
      icon: Car,
      label: "Skoda Octavia WK21 LMN",
      value: "skoda",
    },
    {
      // A text mark in the chip, in the chip's text colour.
      chipLeading: ({ color }) => <Text style={{ color }}>L</Text>,
      chipTone: "muted",
      description: "Archived",
      group: "Projects",
      label: "Loft conversion",
      value: "loft",
    },
  ]}
  placeholder="Add tag"
  singlePerGroup
  values={tagIds}
/>;
```

- **`group`** — options that share a `group` render under one section heading.
  Groups keep the order of their first option in `options`; options without a
  group come first, with no heading. The search hides a group with no match,
  and a query that matches a group name shows the whole group. Matching
  ignores case.
- **`description`** — the row's secondary line, and its accessible description.
  It stays at AA contrast on the solid active fill and on the tinted selected
  fill.
- **`disabled`** — the option is listed but cannot be chosen: the row is
  dimmed, the arrow keys skip it, and web exposes `aria-disabled`. A disabled
  value that is already selected can still be removed.
- **`lockedValues`** — selected values the user cannot remove: the chip has no
  remove button, and the row shows as selected but cannot be toggled. With
  `singlePerGroup`, the other options of a locked value's group cannot be
  chosen either. A locked value missing from `values` is still shown as
  selected (with a development warning).
- **`singlePerGroup`** — choosing an option replaces the selected option of the
  same group; choosing the selected option again removes it. Options without a
  group are not limited. Without this prop, `onChange` receives both values and
  the caller does the replace.
- **`footerAction`** — a row pinned under the list, outside the scroll area.
  The arrow keys reach it after the last option (ArrowUp from the first option
  wraps to it), and it is the active row when nothing matches, so Enter runs
  it. Pressing it or pressing Enter calls `onPress` with the trimmed query,
  then clears the query and closes the list. The `footer` string still shows
  as a static note at the end of the list, so both can show at once.
- **`chipTone`** / **`icon`** / **`chipLeading`** — `chipTone: "muted"` paints
  the chip neutral grey, for example for an archived tag. An `icon` is drawn in
  the option's mark and at the start of its chip. `chipLeading` draws your own
  content at the start of the chip instead of the icon; as a render function it
  gets the chip's text colour, so a text mark matches the label on each tone. A
  text `mark` shows in the row only.

Chips always follow `options` order, not selection order. Backspace in the
empty search input does not remove chips; use a chip's remove button.

On phones and native, pass `presentation="sheet"`. The field then shows the
chips and a button (the `placeholder`) instead of the search input; pressing it
opens a bottom `Sheet` (`@firna/ui/sheet`) named by the `label`. The sheet holds
the chips and the search input at the top, the list below, and the pinned
footer action. Selections apply as they are made, so the sheet's dismiss
control is a visible "Done" text button on both platforms. The backdrop, and
Escape on web, also close it. On web, the search input takes focus when the
sheet opens, and focus returns to the field's button when it closes. Only keys
pressed in the sheet's search input drive the list, so Enter on Done or on a
chip's remove button works as usual. An `accessibilityLabel` names the sheet's
search input as well as the field's. On web, the field's `error` and `hint`
describe both search inputs and the sheet button. On native, the hint of each
is the `error` when there is one, else the `hint`. The sheet's search input is
a `SheetTextInput` on native, so
the sheet stays above the keyboard while you type, and one tap chooses a row
even while the keyboard is open. The caller picks the presentation, for example
by viewport width; the default is the anchored `popover`.

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

- `DropdownList.tsx` — the option list: scroll area, pinned regions, groups.
- `DropdownRow.tsx` and `dropdownRowA11y.ts` — one row, and its name, role,
  description, and Tab order per platform.
- `dropdownListKeepFocus.ts` — keeps focus in a combobox input while the
  pointer presses its list.
- `dropdownListStyles.ts` — row styles and the highlight per state and variant.
- `ComboboxMultiSelect.tsx` — the chip field; `ComboboxFieldParts.tsx` holds its
  label row and messages.
- `useComboboxPicker.ts` and `comboboxMultiSelectModel.ts` — open state,
  search, grouping, and the selection rules.
- `comboboxMultiSelectEntries.tsx` — the option rows and the footer action row.
- `comboboxSearchInputA11y.ts` — the name and description of both search
  inputs.
- `ComboboxSheet.tsx` — the sheet presentation and its trigger button.

## Related Docs

- [Dropdown list requirements](../../docs/protocol/dropdown-list.md)
- [Combobox multi-select requirements](../../docs/protocol/combobox-multi-select.md)
- [Sheet requirements](../../docs/protocol/sheet.md)
- The Dropdown Contract in [shared-ui-components.md](../../docs/protocol/shared-ui-components.md)
