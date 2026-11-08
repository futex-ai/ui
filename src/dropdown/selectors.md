# Selectors

These sections extend the [Dropdown Selectors README](README.md).

## Imperative focus after async hydration

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

## Pinned header and footer

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

## Searchable selectors

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

## Sizes and touch surfaces

Pass `size` (`xs` / `sm` / `md` / `lg`, default `md`) to size the default
`field` selector from the shared `ControlSize` scale. It reuses the input's
per-size box geometry — height, padding, value text, and chevron — so a select
and a text input stay the same height in a form. `size` applies to the `field`
variant only; the `map` / `pill` / `mobilePeriod` variants keep their bespoke
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

At `xs`, the `field` selector is 26px high with 13px value text, like the `xs`
text field. Inside a `TouchSurface`, every selector takes the touch metrics,
whatever its `size`: the `field` trigger is the 46px touch field with 16px value
text and an 18px chevron, the `map` / `pill` / `mobilePeriod` triggers keep
their drawing and grow to at least 44px high, and the search input of a
`searchable` selector is itself 44px high with 16px text. The option rows of the
popup are touch rows, at least 44px high, as in every `DropdownList` on a touch
surface (see [Row sizes](menus.md#row-sizes-choices-and-notes)). Outside a touch surface they keep their size.

## Popup width

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

## Label info

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

## Read-only selector

Use `ReadOnlySelector` when the UI is selector-shaped but has no scoped data
behavior yet:

```tsx
import { ReadOnlySelector } from "@firna/ui/dropdown";

<ReadOnlySelector label="Date format" value="DD/MM/YYYY" />;
```
