# Link

Link buttons and link tabs for React Native and the web: real links with the
look of the library's controls. On web each one is an anchor with its address,
so the browser keeps its link behaviour. On native each one has the link role
and opens its destination.

## Responsibilities

- Render `LinkButton`, a link with the look of the button of the same tone and
  size: the `primary`, `secondary` (default), `ghost`, and `plain` tones, every
  `ControlSize` with the dense `xs` size, and the touch metrics inside a
  `TouchSurface`.
- Render `LinkTabs`, a named navigation landmark of link tabs with the current
  page, optional counts, a row that scrolls sideways, and a filled phone bar.
- On web, render anchors with their `href` in static and server-rendered HTML,
  and keep the browser's link behaviour: a new tab or window, the address
  preview, copying the address, and the context menu.
- Let the app run its own navigation for routing inside the app, and fall back
  to the browser or the platform's link handling without it.
- Mark the link to the current page, open a new tab when the caller asks, and
  end the name of a new-tab link with a note.

## Usage

```tsx
import { LinkButton, LinkTabs } from "@firna/ui/link";
import { LifeBuoy } from "lucide-react-native"; // or "lucide-react" on web

<LinkButton
  href="/projects/atlas/activity"
  onNavigate={() => router.push("/projects/atlas/activity")}
  size="xs"
>
  All activity
</LinkButton>

<LinkButton href="https://help.example.com" icon={LifeBuoy} newTab tone="plain">
  Help center
</LinkButton>

<LinkTabs
  accessibilityLabel="Project"
  onNavigate={(tab) => router.push(tab.href)}
  size="xs"
  tabs={[
    { current: page === "overview", href: "/atlas", label: "Overview" },
    { count: 43, current: page === "files", href: "/atlas/files", label: "Files" },
  ]}
/>
```

### Destinations and app navigation

`href` is the destination: a path of the app or an outside address. The library
reads and changes no location, and it infers no route and no new tab from the
address.

`onNavigate` is the app's own navigation. On web, a primary click or Enter
without Ctrl, Meta, Shift, or Alt on a same-tab link runs it and prevents the
page load. Every other click keeps the browser default: a modified click, a
middle click, and each click of a new-tab link. The click is never stopped, so
handlers above the link still see it. Space does not activate a link. On native,
every activation runs `onNavigate`, a new-tab link included. Without
`onNavigate`, the browser loads `href` on web, and `Linking.openURL` opens it on
native. A link that the platform cannot open reports it through a development
warning. `LinkTabs` passes the activated tab to its `onNavigate`.

### Current page

The caller marks the link to the page that shows now with `current` (a tab's
`current`). The link then carries `aria-current="page"` on web and the selected
state on native. A current link button holds the hover fill of its tone at rest.
A current tab gets the control edge, the soft fill, and ink text, with the same
label weight, so the tabs do not shift.

### New tabs

`newTab` (a tab's `newTab`) opens the destination in a new tab on web, with
`target="_blank"` and `rel="noopener noreferrer"`, so the opened page gets no
access to the page that opened it. The link shows an arrow after its label. The
arrow's text alternative is the note, "(opens in a new tab)" by default, which
`newTabLabel` replaces. A link that its text names, such as "Help center",
therefore has the name "Help center (opens in a new tab)". When the caller gives
`accessibilityLabel`, the note goes at the end of that label instead. An
icon-only link button has no label for the arrow to follow, so only its name
carries the note.

### Link buttons

`LinkButton` takes the button's `tone`, `size`, `shape`, `block`, `icon`,
`iconNode`, `labelStyle`, `numberOfLines`, and `focusIndicator`. Its `style` can
be a function of `{ focused, hovered, pressed }`, and `linkRef` is the handle on
the link for callers that move focus themselves. An icon-only link button needs
`accessibilityLabel`; the type requires it. `accessibilityHint` is read on
native only.

A link button has no `danger` tone and no disabled state: a link moves to a page
and destroys nothing. A control that cannot navigate yet is a disabled `Button`.

For a start-aligned link in a list of links, such as a sidebar footer, combine
`block`, `style={{ justifyContent: "flex-start" }}`, and
`labelStyle={{ flex: 1 }}`, so the label fills the row and the arrow sits at its
end.

### Link tabs

`tabs` holds `{ href, label, count?, current?, newTab?, key?, style?, testID? }`
for each tab, and `accessibilityLabel` names the landmark. Each tab is one stop
in the tab order, and arrow keys do not move between tabs, because each tab
loads its own page; an ARIA tab list would switch panels in one page.

- A tab has the height and the label metrics of a button of the same size.
  `labelStyle` restyles the label and the count of every tab, for example a
  monospace font in capitals, and the tab keeps its height.
- `count` follows the label in muted tabular figures and is part of the name, as
  in "Files 43". On a current, hovered, or pressed tab the label turns to `ink`
  and the count to `ink2`, because muted text falls below 4.5:1 on the soft
  fill in the default theme.
- A row wider than its container scrolls sideways. It keeps 4 px of room inside
  its edges for the focus glow and gives the room back outside, so the tabs line
  up with the content around them. When a tab takes focus, the row scrolls so
  the tab and its glow are fully inside it.
- `fill` shares the free width of the bar between the tabs, as on a phone. Each
  tab grows from its content by an equal share of the free width, so the tabs
  fill the bar and every label shows. A tab never shrinks below its content or
  its target floor, 44 px on a touch surface. When the tabs do not fit, the bar
  scrolls sideways like a row without `fill`, with the same focus room.
- On a touch surface the tabs are 44 px high, with the touch label metrics.

## Accessibility

- **Name, role, state (4.1.2, A).** Each link is a link: an anchor on web, the
  link role on native. Its visible text names it, with the count of a tab and
  the new-tab note. The current page is `aria-current="page"` on web and the
  selected state on native. The leading icon is hidden from assistive
  technology.
- **Keyboard (2.1.1, A).** Tab reaches each link, and Enter follows it. Space
  does not, as on any link.
- **Focus visible (2.4.7, AA).** Each link shows the shared focus glow and
  follows the theme's `focusIndicator` modes. A pointer click shows no glow.
- **Contrast (1.4.3, AA).** The link button colours are the button's. Tab text
  meets 4.5:1 on every tab fill in every shipped theme.

## Key Code

- [`LinkButton.tsx`](LinkButton.tsx): the link button, painted by the button's
  own functions in [`../button/buttonPaint.ts`](../button/buttonPaint.ts).
- [`LinkTabs.tsx`](LinkTabs.tsx) and [`LinkTabLink.tsx`](LinkTabLink.tsx): the
  landmark, the scrolling or filled row, and one tab.
- [`useRevealFocusedTab.ts`](useRevealFocusedTab.ts): scrolls a focused tab and
  its glow into the row.
- [`NewTabIndicator.tsx`](NewTabIndicator.tsx): the arrow, the note, and the name
  of a new-tab link. Navigation rows of the list use it too.
- The link host at the platform seam: `src/primitives/link.tsx` and
  `link.web.tsx`. The [primitives README](../primitives/README.md) describes it.

## Related Docs

- [App shell parts protocol](../../docs/protocol/app-shell-parts.md#links): the
  requirements of links, link buttons, and link tabs.

## Theming

Link buttons read the button's tokens. Tabs read `colors.muted` for their labels
and counts at rest, `colors.ink` and `colors.ink2` on a fill, `colors.soft` for
the current and hovered fill, `colors.controlBorder` for the current edge,
`colors.bg2` for a press, and `colors.primary` for the focus glow.
