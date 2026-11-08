# Empty state

A quiet message for a view with nothing to show, for React Native and the web:
an optional decorative icon, a title, an optional body, and optional actions.

## Responsibilities

- Render a title as a heading at the level that the caller gives, with the same
  size at every level.
- Centre a page empty state in its area, and set a smaller panel empty state at
  the top of its panel.
- Show an optional decorative icon in a soft circle, a muted body, and the
  caller's actions.
- Follow the active text scale, so an empty state on a compact surface is
  compact.
- Read all colours and radii from `SharedUiThemeProvider`.

## Usage

```tsx
import { EmptyState } from "@firna/ui/empty-state";
import { LinkButton } from "@firna/ui/link";

<EmptyState
  actions={<LinkButton href="/atlas/settings" size="xs">Connect a repository</LinkButton>}
  headingLevel={2}
  icon={Inbox}
  title="No files yet"
>
  Connect a repository to see its files here.
</EmptyState>

<EmptyState
  headingLevel={3}
  icon={GitBranch}
  size="panel"
  title="Changes appear after the first push"
/>
```

### Heading level

`headingLevel` (1 to 6) is required, because only the page knows its outline.
On web the title is an `h1` to `h6` element; on native it has the header role,
which has no level there. The title always has the `h4` metrics of the active
text scale, so the level never changes its size.

### Sizes

`size="page"` (the default) fills its area and centres its content, with 40 px
of vertical padding. `size="panel"` keeps its content height and sits at the top
of its panel, with 28 px of vertical padding and a smaller mark: 36 px instead
of 44 px.

### Slots

- `icon` is a lucide glyph in a soft circle, hidden from assistive technology.
- `children` is the body. A string or number takes the muted body text, centred
  and at most 320 px wide; any other node renders as-is.
- `actions` holds the caller's controls, centred below the text. Each stays its
  own control.

An empty state is not a live region. A caller that must announce a change, such
as a search that finds nothing, announces it separately, for example with the
shared announcer.

## Accessibility

- **Info and relationships (1.3.1, A).** The title is a heading at the caller's
  level, so it takes its place in the page outline.
- **Non-text content (1.1.1, A).** The icon is decorative.
- **Contrast (1.4.3, AA).** The title is `ink` and the body is `muted`, which
  meet 4.5:1 on the theme surfaces.

## Key Code

- [`EmptyState.tsx`](EmptyState.tsx): the heading, the slots, and the sizes.
- [`emptyStateStyles.ts`](emptyStateStyles.ts): the layout of each size and the
  text metrics of the active scale.

## Related Docs

- [App shell parts protocol](../../docs/protocol/app-shell-parts.md#empty-states):
  the requirements of empty states.
