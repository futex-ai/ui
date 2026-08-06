# Status dot

Reusable React Native and React Native Web status dot: a small themed circle that
signals state beside a label, optionally pulsing to show that state is live.

## Responsibilities

- Render a circle sized on the shared `ControlSize` scale (`sm` / `md` / `lg` —
  7 / 9 / 11px), filled from a semantic `tone`.
- Carry the same four-tone vocabulary as the `Badge` (`neutral`, `primary`,
  `warning`, `danger`), so a dot and the pill beside it describe a status in one
  language.
- Optionally `pulse` its opacity for a live or in-progress state, honouring the
  user's "reduce motion" preference.
- Stay decorative unless given a `label`, on the assumption that adjacent text
  states the status.
- Accept a custom `color` for a caller-owned palette the semantic tones do not
  cover.
- Read all colors and radii from `SharedUiThemeProvider` instead of
  consumer-local theme imports.

## Usage

```tsx
import { StatusDot } from "@firna/ui/status-dot";

<StatusDot tone="primary" />
<StatusDot tone="warning" />
<StatusDot tone="danger" />
<StatusDot />
```

The default is a `neutral`, `md`, non-pulsing dot.

### Pulsing

Pass `pulse` for a live or in-progress state. The dot eases its opacity between
full and 35% on an 800ms leg — a heartbeat, not a blink:

```tsx
<StatusDot pulse tone="primary" />
```

Under `prefers-reduced-motion` the dot rests at full opacity instead.

### Inside a badge

`Badge` has its own `dot`, and a matching `pulse` prop, so the common live-status
pill needs no composition:

```tsx
<Badge dot pulse tone="primary">
  Running
</Badge>
```

Reach for a standalone `StatusDot` when the dot is not inside a pill — a list
row, a table cell, a header beside a title.

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default
at 9px, so a dot reads at the same density as the control beside it:

```tsx
<StatusDot size="sm" tone="primary" />
```

### Tones

| tone      | fill      | use                         |
| --------- | --------- | --------------------------- |
| `neutral` | `ink2`    | default, inactive, archived |
| `primary` | `primary` | active, positive, brand     |
| `warning` | `amber`   | pending, attention          |
| `danger`  | `rose`    | error, overdue, failed      |

A dot carries no text of its own, so unlike the badge it takes the mid accent
rather than a soft-fill/deep-text pair — the same accents the badge `outline`
variant borders with. There is deliberately no `success` or `info` tone, for the
same reason the badge has none: the shared theme exposes no green or blue accent
distinct from the brand `primary`.

For a status outside that vocabulary, pass `color`:

```tsx
<StatusDot color="#2563EB" />
```

## Accessibility

- The dot is **decorative by default** (hidden from assistive tech), because it
  normally sits beside text that already states the status. Announcing both is
  noise.
- Pass `label` when the dot stands alone; it then reports as an `image` with that
  name, so the status is never carried by color alone (WCAG 1.4.1 Use of Color).
- The `pulse` honours `prefers-reduced-motion` (web) / `isReduceMotionEnabled`
  (native), satisfying the AAA criterion 2.3.3 Animation from Interactions. The
  loop also stops on unmount.
- The dot is non-interactive and never receives focus.

## Theming

Status dots read colors and radii from `SharedUiThemeProvider`. A theme swap
recolors every tone; `primary` follows the brand accent, so a positive state
reads green in the default (accounting) theme.
