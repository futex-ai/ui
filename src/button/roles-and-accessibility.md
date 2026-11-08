# Button roles, triggers, and accessibility

These sections extend the [Button README](README.md).

## Roles and states

`role` re-points the button at another single-activation role, so a rail row,
tab, checkbox, radio, switch, or menu item is a themed `Button` rather than a
hand-rolled `Pressable` that has to re-derive the tones, sizes, focus glow, and
disabled/busy handling. Each role carries exactly one state prop:

| `role`     | state prop | announced as    |
| ---------- | ---------- | --------------- |
| `button`   | `pressed`  | `aria-pressed`  |
| `checkbox` | `checked`  | `aria-checked`  |
| `radio`    | `checked`  | `aria-checked`  |
| `switch`   | `checked`  | `aria-checked`  |
| `tab`      | `selected` | `aria-selected` |
| `menuitem` | —          |                 |

`expanded` is separate and composes with `button`, `checkbox`, `menuitem`, and
`tab` for a control that reveals a menu, panel, or section.

```tsx
{
  /* A settings rail. The `tablist` is the caller's — see the note below. */
}
<View accessibilityLabel="Settings sections" accessibilityRole="tablist">
  {sections.map((item) => (
    <Button
      key={item.id}
      onPress={() => setSection(item.id)}
      role="tab"
      selected={section === item.id}
      tone={section === item.id ? "primary" : "plain"}
    >
      {item.label}
    </Button>
  ))}
</View>;

{
  /* A toggle button. */
}
<Button onPress={() => setPinned(!pinned)} pressed={pinned}>
  {pinned ? "Pinned" : "Pin"}
</Button>;

{
  /* A checkbox. */
}
<Button checked={notify} onPress={() => setNotify(!notify)} role="checkbox">
  Email notifications
</Button>;
```

Pairing a state with a role ARIA does not allow — or leaving a `checkbox` /
`radio` / `switch` without `checked`, or a `tab` without `selected` — fires a
`__DEV__` warning naming the mismatch, because the resulting control announces
the wrong thing rather than failing loudly.

`link` is deliberately not a member: a re-roled button has no `href`, so it
cannot be opened in a new tab, middle-clicked, or copied as a URL. Use
[`LinkButton`](../link/README.md) for a real link: it has the look of the button
of the same tone and size, and it is an anchor on web.

**`Button` is a single control, not a group.** It does not own roving focus or
arrow-key navigation, so the `tablist` / `radiogroup` / `menu` container and any
group keyboard model belong to the caller. `SegmentedControl` already implements
the radiogroup pattern end to end if that is what you need.

## Menu triggers

`hasPopup` announces what a trigger opens (`aria-haspopup`) before the user
commits to opening it; pair it with `expanded` when the surface opens in place:

```tsx
<Button expanded={open} hasPopup="menu" icon={MoreHorizontal} onPress={toggle}>
  Actions
</Button>
```

It is web-only — the mobile accessibility APIs model no "has popup" relationship
— and ARIA supports it on the `button`, `menuitem`, and `tab` roles only; a
`checkbox` / `radio` / `switch` is a value control rather than a trigger, and a
`__DEV__` warning says so.

## Accessibility

- **Accessible name (WCAG 1.1.1 / 4.1.2, A).** A button with visible text uses
  that text as its name; pass `accessibilityLabel` only to override it (keep the
  visible text a substring so it still satisfies 2.5.3 Label in Name). An
  **icon-only** button (no children) **requires** `accessibilityLabel` — this is
  type-enforced, and a `__DEV__` warning fires if a name can't be resolved.
- **Decorative icon (1.1.1, A).** The leading icon is hidden from assistive
  technology (`aria-hidden` on web), so the button is announced once by its name
  rather than by the raw glyph. Caller-supplied icon nodes also ignore pointer
  events, preventing a focusable descendant from stealing click focus and
  showing a second browser focus outline inside the button.
- **Busy state (4.1.2, A).** `busy` sets `aria-busy`, blocks the press handler,
  and swaps the icon for a spinner while keeping the button focusable and
  announced. It is distinct from `disabled` (which removes the control from the
  tab order). The spinner stops animating under `prefers-reduced-motion`.
- **Keyboard (2.1.1, A).** On the default `button` role, Enter/Space activation
  is delegated to React Native Web's `role="button"` synthesis (no explicit
  `onKeyDown` is wired); a Playwright test asserts both keys still activate to
  catch RNW regressions. React Native Web presses Enter on _every_ role but
  binds Spacebar to `button` roles alone, so the other `role` values wire Space
  themselves — swallowing it (rather than scrolling the page) even while
  disabled or busy, and leaving Enter to the press responder so a press never
  fires twice.
- **Role and state (4.1.2, A).** The role state travels on two channels because
  the renderers disagree: React Native reads `accessibilityState`, while React
  Native Web honours it only on `TouchableWithoutFeedback` and so needs the
  literal `aria-*` props. `Button` emits both. `pressed` is the exception — React
  Native models no pressed toggle and `aria-pressed` is the only toggle state
  ARIA allows on `role="button"`, so on web it stays `aria-pressed` and on native
  it degrades to the announced `selected` state.
- **Popup triggers (4.1.2, A).** `hasPopup` emits `aria-haspopup` on web so a
  screen reader can say which kind of surface Enter will open; `expanded`
  reports whether it is open. ARIA supports the attribute on `button`,
  `menuitem`, and `tab` only, and a `__DEV__` warning fires on the rest.
- **Target size (2.5.5 AAA / 2.5.8 AA).** `hitSlop` grows the pressable area
  without growing the control, so shrinking a glyph with `boxSize` never
  shrinks its tap target with it.
- **Focus visible (2.4.7, AA).** The library's shared soft focus glow is painted
  by `domBackendCss` for `:focus-visible` focus on web, including static HTML
  before hydration. It covers every tone — including `primary`, where a
  border-colour ring would be invisible — and suppresses the browser outline
  only while the glow is active. Native keeps its platform focus affordance.
  The hook still listens for native web blur as well as React `onBlur`, so
  disabling and later re-enabling a focused button cannot restore stale
  interaction state.
- **Resting border.** The secondary button's resting edge uses the
  `controlBorder` token — a soft, translucent-ink line (intentionally below the
  1.4.11 ≥3:1 non-text-contrast floor, for a calmer edge). The `ghost` tone
  intentionally has no resting border or fill: its `primaryDeep` label is the
  affordance.
