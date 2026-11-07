# Notice

A persistent message in a box for React Native and the web: a title, an optional
body, an optional decorative icon, and optional actions. An urgent notice is an
alert that assistive technology announces. A neutral notice is ordinary
content.

## Responsibilities

- Render a title, a body, a decorative icon, and caller actions in one box.
- Show the tone as a fill and an outline on every edge, never as an accent
  strip.
- Announce an urgent message when the notice appears and when the message
  changes, on web and native, without moving focus.
- Follow the active text scale, so a notice on a compact surface is compact.
- Read all colours and radii from `SharedUiThemeProvider`.

## Usage

```tsx
import { Notice } from "@firna/ui/notice";
import { Spinner } from "@firna/ui/spinner";

<Notice
  actions={<LinkButton href="/atlas/activity" size="xs" tone="plain">View log</LinkButton>}
  iconNode={<Spinner color={theme.colors.muted} size={14} />}
  title="Deploying to production"
>
  The live site updates when the deploy finishes.
</Notice>

<Notice
  actions={<Button onPress={retry} size="xs">Try again</Button>}
  icon={CircleAlert}
  title="The deploy failed"
  tone="urgent"
>
  The build stopped at the test step. The live site still runs the last good deploy.
</Notice>
```

### Tones

`tone` is `neutral` (the default) or `urgent`. A neutral notice has the `bg`
fill and a `border2` outline. An urgent notice has the `roseSoft` fill and an
outline of the theme's danger colour, `rose`, at 35% alpha. The title is the body
text of the active scale at weight 600, and a string or number body is the body
text in `ink2`. Both meet 4.5:1 on both fills in every shipped theme.

### Icon, body, and actions

- `icon` is a lucide glyph, tinted to the tone: `muted` or `rose`. `iconNode`
  is any node, such as a spinner, and wins over `icon`. The icon slot is hidden
  from assistive technology on web and native, which also hides a spinner's own
  progress role.
- `children` is the body. A string or number takes the body text; any other node
  renders as-is in the text column.
- `actions` holds the caller's controls. Each stays its own control. The text
  column has a 240 px basis, so the actions follow the text in a wide notice and
  go below it, at its start, in a narrow one.

### Announcements

An urgent notice keeps the alert role, so assistive technology can identify it,
with its own live behaviour off (`aria-live="off"`). The shared announcer speaks
its message assertively instead: once when the notice appears or turns urgent,
and again only when the message changes. A re-render with the same message, and
React's development StrictMode, which runs each effect twice, do not repeat it.
On native the announcer calls `AccessibilityInfo.announceForAccessibility`,
because the alert role alone announces nothing there. Focus never moves.

The message is the title, then a string or number body, as in "The deploy
failed. The build stopped at the test step." A node body is not text the library
can read, so give `announcementText` with the whole message when the body is a
node. The notice then announces that text, and announces it again when it
changes:

```tsx
<Notice
  announcementText={`Checks failed. ${check} did not pass.`}
  icon={CircleAlert}
  title="Checks failed"
  tone="urgent"
>
  <Body color="secondary">
    <Body color="secondary" style={{ fontWeight: "600" }}>
      {check}
    </Body>{" "}
    did not pass.
  </Body>
</Notice>
```

A neutral notice is not a live region and announces nothing, `announcementText`
included. The announcer writes one message at a time, so two urgent notices that
appear together can leave only the second one spoken.

## Accessibility

- **Status messages (4.1.3, AA).** An urgent message reaches assistive
  technology without focus, once for each new message.
- **Non-text content (1.1.1, A).** The icon slot is decorative. The title and
  body carry the message.
- **Info and relationships (1.3.1, A).** The title is not a heading, so the page
  outline stays as the page draws it.
- **Contrast (1.4.3, AA).** The text meets 4.5:1 on both fills in every shipped
  theme; `tests/unit/notice.test.ts` checks it.

## Key Code

- [`Notice.tsx`](Notice.tsx): the box, its slots, and its alert role.
- [`noticeColors.ts`](noticeColors.ts): the colours of each tone.
- [`noticeStyles.ts`](noticeStyles.ts): the layout and the text metrics of the
  active scale.
- [`useUrgentAnnouncement.ts`](useUrgentAnnouncement.ts): the announced message
  and when it is announced.

## Related Docs

- [App shell parts protocol](../../docs/protocol/app-shell-parts.md#notices): the
  requirements of notices.
