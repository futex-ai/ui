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
- Make rows navigation rows via `itemLink`: links inside their list items, with
  the current page tinted and the app's own navigation.
- Expose `list` / `listitem` semantics so assistive tech reads "list, N items",
  with the divider removed from the accessibility tree.
- Provide `ListItem`, the default leading / title / description / trailing row.
- Size with the shared `ControlSize` scale (`xs` / `sm` / `md` / `lg`), and
  give single-line rows at least 44px inside a `TouchSurface`.
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

### Navigation rows

Pass `itemLink` to make a row a navigation row. It returns the row's link,
`{ href, current?, newTab? }`, or `undefined` for a row without one. The row is
then a link inside its list item, so the list keeps its list semantics, and on
web the link is an anchor with its address. A row with a link wins over
`onItemPress` for that row; the other rows keep the press or stay static.

```tsx
<List<Project>
  accessibilityLabel="Projects"
  itemKey={(project) => project.id}
  itemLink={(project) => ({
    current: project.id === currentId,
    href: `/projects/${project.id}`,
  })}
  items={projects}
  onItemNavigate={(project) => router.push(`/projects/${project.id}`)}
  renderItem={(project) => <ListItem size="xs" title={project.name} />}
  size="xs"
/>
```

- `onItemNavigate` is the app's own navigation. On web, a primary click or Enter
  without a modifier on a same-tab row runs it instead of loading the row's
  `href`; a modified or middle click, and each click of a new-tab row, keep the
  browser's link behaviour. On native every activation runs it. Without it, the
  browser or the platform opens the `href`.
- `current` marks the row of the page that shows now: `aria-current="page"` on
  web and the selected state on native. The row takes the `primarySoft` tint,
  and its `ListItem` title takes `primaryDeep` at weight 600, or at the heavier
  title weight of its size, such as 700 at `md`. Its `ListItem`
  description takes `ink2`, because `muted` text falls below 4.5:1 on the tint
  in the default theme. Give trailing text in the current row the same care,
  for example the `secondary` text colour.
- `newTab` opens the destination in a new tab on web. The row shows an arrow
  after its content, and its name ends with `newTabLabel`, "(opens in a new
  tab)" by default. With `itemLabel`, the note goes at the end of that label.
- `itemLabel` names a navigation row as it names a pressable row. Links have no
  disabled state, so `itemDisabled` does not apply to them.
- A navigation row has the hover wash, the pressed fill, and the inset focus
  ring of a pressable row.

A link holds no other control. A row that needs a control, such as a switch,
keeps it outside the link: it stays a static or pressable row, with the control
in its trailing slot. A `ListItem` inside a navigation row ignores `onPress` and
warns in development, so it never nests a button inside the link.

### Focus behavior

On web, `domBackendCss` renders a List focus ring only while the focused press
target matches the browser's `:focus-visible` pseudo-class. A pointer click gives the
row or title button real focus for activation and other behavior, but does not
paint the keyboard-style ring. Changing to keyboard input while that same
element remains focused makes the ring visible. Moving focus with the pointer
hides the old ring and does not paint one on the new pointer target. Native
keeps its platform focus behavior.

`focusIndicator` is an explicit visual customization, not a workaround for
ordinary pointer interaction. Pointer clicks already suppress the custom ring
on web. `focusIndicator="outline"` restores the browser's default outline so a
keyboard user does not lose the focus indicator; `focusIndicator="none"`
removes every focus style and is only for a list whose container shows focus
itself.

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
`loadingItemCount` sets how many to show (defaults to 6). At `xs`, each
placeholder is a single-line row instead: a title bar and a short trailing bar,
as high as a dense row.

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

`size` takes the shared `ControlSize` (`xs` / `sm` / `md` / `lg`); `md` is the
default. It scales the item padding, the in-row gaps, and the title /
description type scale, so a list reads at the same density as the controls
beside it. Give `ListItem` the same `size` as its `List`.

`xs` is the dense size for desktop sidebars: a single-line row is at least 26px
high, with a 13px title on an 18px line at weight 400 and a 12px description. A
longer row grows with its content. A pressable `ListItem` title spans the full
row height, padding included, so its target is at least the row height.

Inside a `TouchSurface`, the rows take the touch metrics, whatever the `size`:
a single-line row is at least 44px high, the title is 15px on a 20px line, the
description is 13px on an 18px line, and a pressable title spans the row. The
title keeps the weight of the size. A trailing control keeps its own target, so
a row with a 44px switch beside its title is 68px high.
`createTouchListStyles(theme, size)` builds these styles.

## Key Code

- [`List.tsx`](List.tsx): the list, its static and pressable items, and the
  separators.
- [`ListItem.tsx`](ListItem.tsx): the default row and its pressable title.
- [`ListSkeleton.tsx`](ListSkeleton.tsx): the placeholder items of a loading
  list.
- [`LinkListItem.tsx`](LinkListItem.tsx): a navigation row, on the link host of
  the platform seam.
- [`listRowLink.ts`](listRowLink.ts): the row link type and the context that
  gives a `ListItem` the current state of its row.
- [`listStyles.ts`](listStyles.ts): the size table, the touch row metrics, and
  the styles.

## Styling

`style` extends the list container (`ViewStyle`) — layer a card border, radius,
and `overflow: "hidden"` on top to frame the list. The item padding, the
separators, the pressable-item treatments, and the disabled state are applied by
the component.

## Theming

Lists read colours and fonts from `SharedUiThemeProvider`: separators use
`colors.border`, the title uses `colors.ink` and the description `colors.muted`,
the item hover uses `colors.soft`, the pressed state uses `colors.bg2`, and the
focus ring uses `colors.primary`. The current navigation row uses
`colors.primarySoft`, with a `colors.primaryDeep` title and a `colors.ink2`
description.

## Related Docs

- [App shell parts protocol](../../docs/protocol/app-shell-parts.md#navigation-rows):
  the requirements of navigation rows.
