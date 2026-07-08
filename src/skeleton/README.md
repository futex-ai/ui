# Skeleton

Content-shaped loading placeholders for React Native and React Native Web: a
shimmering bar and circle, a row/column group, and the pulse provider that lets a
whole skeleton sweep off one animation.

Use a skeleton — rather than a [`Spinner`](../spinner/README.md) — when you can
mirror the _shape_ of the content that is loading (a row of text lines, an
avatar, a card). Mirroring the layout means it does not jump when the real
content arrives. Reach for `Spinner` instead for an action in progress (a saving
button) or when the incoming layout is unknown.

## Responsibilities

- Render rectangular (`SkeletonBar`) and circular (`SkeletonCircle`) placeholders
  sized in px (or a percentage / flex share for bars), with a corner radius from
  the shared radii scale.
- Sweep a translucent white sheen across a faint base fill, drawn with
  `react-native-svg` and driven by React Native's `Animated` API, so the same
  component animates identically on iOS, Android, and web, and stop the loop on
  unmount.
- Share one sweep across a whole skeleton via `SkeletonGroup` /
  `SkeletonPulseProvider`, so a grouped skeleton runs a single animation and its
  placeholders shimmer in unison.
- Honour `prefers-reduced-motion`: render a clear, static placeholder with no
  sweeping sheen (WCAG 2.1 — 2.3.3 AAA).
- Stay decorative on every platform (`aria-hidden` + `accessibilityElementsHidden`
  - `importantForAccessibility="no-hide-descendants"`) so assistive technology
    never reads a placeholder as content — the surrounding container announces the
    loading state via `aria-busy`.
- Use shared theme colours (the decorative `soft` neutral base) instead of
  consumer-local theme imports.

## Usage

```tsx
import { SkeletonBar, SkeletonCircle, SkeletonGroup } from "@firna/ui/skeleton";

// A single line of "text"
<SkeletonBar width="60%" />;

// A list-row shape: avatar + title/subtitle + trailing chip, breathing as one
<SkeletonGroup gap={12}>
  <SkeletonCircle diameter={40} />
  <SkeletonGroup direction="column" gap={6} style={{ flex: 1 }}>
    <SkeletonBar height={14} width="50%" />
    <SkeletonBar height={11} width="80%" />
  </SkeletonGroup>
  <SkeletonBar height={12} radius="pill" width={56} />
</SkeletonGroup>;
```

### Built-in loading states

The [`Table`](../table/README.md) and [`List`](../list/README.md) collection
components have a `loading` prop that renders a content-shaped skeleton for you —
prefer it over hand-composing placeholders for those:

```tsx
<Table columns={columns} cell={cell} rowKey={rowKey} rows={rows} loading />
<List items={items} renderItem={renderItem} itemKey={itemKey} loading />
```

### Sizing

`SkeletonBar` takes an explicit `width` (px or a percentage such as `"60%"`,
defaulting to `"100%"`) or a `flex` grow factor for use inside a row
`SkeletonGroup`; `height` defaults to 12 (about one line of body text) and
`radius` to `sm`. `SkeletonCircle` takes a `diameter`.

### Sharing one sweep

Placeholders sweep on their own when used standalone. Wrap them in a
`SkeletonGroup` (which also lays them out) or a bare `SkeletonPulseProvider` to
drive every descendant from a single loop, so they shimmer in unison and the
skeleton runs one animation rather than one per element.

## Theming

Placeholders read their base fill from `SharedUiThemeProvider`: the `soft`
decorative neutral, over which a translucent white sheen sweeps. The corner
radius resolves against `theme.radii` when given a token (`sm` / `md` / `lg` /
`pill` / `xl` / `xxl`).

## Accessibility

Placeholders are decorative and removed from the accessibility tree on every
platform, so they are never read as content. Announce the loading state on the
container instead — `Table` and `List` set `aria-busy` while `loading`; for a
custom skeleton, put `aria-busy` (and an accessible label) on the region that is
loading.
