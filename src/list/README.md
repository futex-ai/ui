# List

A vertical list for React Native and React Native Web that draws a hairline
separator **between** items and — deliberately — **never after the last one**.
The separator is its own interleaved node rather than a per-row bottom border, so
the rule is expressed directly by a `!last` guard and item content stays free of
border styling. It ships proper `list` / `listitem` semantics, optionally
pressable items, the shared `ControlSize` densities, and a `ListItem` row
convenience — all driven by shared theme tokens.

## Responsibilities

- Render `items` through a `renderItem` callback (text, avatars, tags, or any
  node), keyed by `itemKey`.
- Draw a `separators` hairline between consecutive items and never after the
  last; support full-bleed or a left `separatorInset` to align past an avatar.
- Make items pressable via `onItemPress`, with the shared hover wash, sage focus
  ring, pressed and disabled states, `button` semantics, and keyboard
  activation — or render plain static rows when no handler is given.
- Expose `list` / `listitem` semantics so assistive tech reads "list, N items",
  with the divider removed from the accessibility tree.
- Provide `ListItem`, the default leading / title / description / trailing row.
- Size with the shared `ControlSize` scale (`sm` / `md` / `lg`).
- Use shared theme colours, fonts, and radii instead of consumer-local theme.

## Usage

```tsx
import { Avatar } from "@firna/ui/avatar";
import { List, ListItem } from "@firna/ui/list";

type Person = { id: string; initials: string; name: string; detail: string };

<List<Person>
  accessibilityLabel="People on payroll"
  itemKey={(person) => person.id}
  items={people}
  renderItem={(person) => (
    <ListItem
      description={person.detail}
      leading={<Avatar decorative label={person.initials} size={42} />}
      title={person.name}
    />
  )}
/>;
```

### Separators

A hairline is drawn between each pair of items and never after the last — the
fix for the common bug where a trailing divider doubles up with a card's bottom
edge. Pass `separators={false}` for a flush, separator-less stack, or
`separatorInset={70}` to inset the hairline from the left so it aligns with the
text past a leading avatar.

### Clickable items

Pass `onItemPress` to make every item a pressable button. Items then gain a
hover wash, the sage focus ring, a pressed state, and keyboard activation (Enter
/ Space), and announce themselves as buttons inside the list. Use `itemLabel` to
give each item an accessible name, and `itemDisabled` to make individual items
non-pressable. Without `onItemPress`, items render as plain static rows.

```tsx
<List<Person>
  itemKey={(person) => person.id}
  itemLabel={(person) => `Open ${person.name}`}
  items={people}
  onItemPress={(person) => router.push(`/people/${person.id}`)}
  renderItem={(person) => <ListItem title={person.name} />}
/>
```

### ListItem

`ListItem` is the default row: an optional `leading` node (e.g. an `Avatar`), a
bold `title` with an optional muted `description` beneath it, and an optional
`trailing` accessory (a tag, amount, or chevron). `title` and `description` take
the themed typography when passed a string/number, or render any node as-is.
`renderItem` can return any node, so a list is never limited to `ListItem`.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default.
It scales the item padding, the in-row gaps, and the title / description type
scale, so a list reads at the same density as the controls beside it.

## Styling

`style` extends the list container (`ViewStyle`) — layer a card border, radius,
and `overflow: "hidden"` on top to frame the list. The item padding, the
separators, the pressable-item treatments, and the disabled state are applied by
the component.

## Theming

Lists read colours and fonts from `SharedUiThemeProvider`: separators use
`colors.border`, the title uses `colors.ink` and the description `colors.muted`,
the item hover uses `colors.soft`, the pressed state uses `colors.bg2`, and the
focus ring uses `colors.primary`.
