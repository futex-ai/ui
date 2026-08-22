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
hover wash, a pressed state, keyboard activation (Enter / Space), and an inset
focus ring around the complete row. They announce themselves as buttons inside
the list. This is the normal model for a row whose trailing content is
decorative, such as a chevron: the whole row communicates and performs one
action.

Use `itemLabel` to give each item an accessible name, `itemDisabled` to make
individual items non-pressable, and `itemTestID` to identify each item's actual
press target in tests. Without `onItemPress`, items render as plain static rows
and `itemTestID` identifies the row view instead.

```tsx
<List<Person>
  itemKey={(person) => person.id}
  itemLabel={(person) => `Open ${person.name}`}
  itemTestID={(person) => `person-${person.id}`}
  items={people}
  onItemPress={(person) => router.push(`/people/${person.id}`)}
  renderItem={(person) => <ListItem title={person.name} />}
/>
```

### Focus behavior

On web, a List focus ring renders only while the focused press target matches
the browser's `:focus-visible` pseudo-class. A pointer click still gives the
row or title button real focus for activation and other behavior, but does not
paint the keyboard-style ring. Changing to keyboard input while that same
element remains focused makes the ring visible. Moving focus with the pointer
hides the old ring and does not paint one on the new pointer target. Native
keeps its platform focus behavior.

`disableFocusRing` is an explicit visual customization, not a workaround for
ordinary pointer interaction. Pointer clicks already suppress the custom ring
on web. Disabling the custom ring restores the browser's default outline so a
keyboard user does not lose the focus indicator.

The Storybook **Repository picker regression** fixture preserves the consumer
composition that originally exposed this bug: a modal containing a static
`List`, rich `ListItem.onPress` title content, and a decorative trailing
chevron. It exists to make that exact focus path inspectable. It is not the
recommended composition for new one-action rows; those should still use
`List.onItemPress` for the complete-row target.

### Loading

Pass `loading` to render content-shaped placeholder items (built from the
[`Skeleton`](../skeleton/README.md) primitives) instead of `items` while data is
fetching, so the layout does not jump when it arrives. Each placeholder mirrors
the `ListItem` anatomy — a leading avatar circle, title and description bars, and
a trailing chip — and the items breathe in unison off one pulse. The list
announces `aria-busy`, the placeholders are non-interactive and hidden from
assistive technology, and the separator rule still holds between them.
`loadingItemCount` sets how many to show (defaults to 6).

```tsx
<List<Person>
  itemKey={(person) => person.id}
  items={people}
  loading={isLoading}
  renderItem={(person) => <ListItem title={person.name} />}
/>
```

### ListItem

`ListItem` is the default row: an optional `leading` node (e.g. an `Avatar`), a
bold `title` with an optional muted `description` beneath it, and an optional
`trailing` accessory (a tag, amount, or chevron). `title` and `description` take
the themed typography when passed a string/number, or render any node as-is.
`renderItem` can return any node, so a list is never limited to `ListItem`.

When `ListItem` has an `onPress`, only its title/description column is a
pressable button and receives the intentionally narrower focus ring. Use this
model for a row with a separate interactive trailing control, such as a switch.
The leading and trailing slots remain outside the title button, so the targets
do not nest and the trailing control stays independently operable. For one row
action with decorative trailing content, prefer `List.onItemPress` and its
full-row target instead.

For a pressable `ListItem`, `testID` is forwarded to the title `Pressable`, so
`fireEvent.press(getByTestId(...))` reaches the handler. For a static
`ListItem`, the same prop identifies the outer row view.

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
