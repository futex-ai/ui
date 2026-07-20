# Badge

Reusable React Native and React Native Web status badge: a small, non-interactive
rounded pill that labels a status (e.g. `Active`, `Pending`, `Overdue`) with a
themed tone.

## Responsibilities

- Render a content-hugging rounded pill around one short label, sized on the
  shared `ControlSize` scale (`sm` / `md` / `lg`).
- Carry a semantic status color through a `tone` — `neutral` (default),
  `primary`, `warning`, or `danger` — in a quiet `soft` fill, a filled `solid`
  fill, or a bordered `outline` chip.
- Show an optional leading status `dot`, tinted to the tone (or a custom color).
- Accept custom `color` / `textColor` / `borderColor` for a caller-owned
  per-option palette the semantic tones do not cover.
- Keep every built-in tone/variant pair at the WCAG 1.4.3 AA text-contrast
  minimum on its own fill in both shipped themes.
- Read all colors, fonts, and radii from `SharedUiThemeProvider` instead of
  consumer-local theme imports.

## Usage

```tsx
import { Badge } from "@firna/ui/badge";

<Badge tone="primary">Active</Badge>
<Badge tone="warning">Pending</Badge>
<Badge tone="danger">Overdue</Badge>
<Badge>Draft</Badge>
```

The default is a `neutral`, `soft`, `md` badge. `tone="primary"` is the brand /
positive accent — the green "Active" status in the default theme.

### Variants

`variant` defaults to `"soft"` — a tinted fill with deep accent text, the quiet
status-pill look. Pass `variant="solid"` for a filled accent chip with white
text when a status needs more emphasis, or `variant="outline"` for a white chip
with a 1px accent border and deep accent text:

```tsx
<Badge tone="danger" variant="solid">
  Failed
</Badge>

<Badge tone="primary" variant="outline">
  In review
</Badge>
```

### Status dot

Pass `dot` to add a small leading status dot, tinted to the resolved text color
by default (override with `dotColor`). It reinforces the label — the text still
states the status — and is decorative (hidden from assistive tech):

```tsx
<Badge dot tone="primary">In progress</Badge>
<Badge dot variant="outline" tone="warning">Blocked</Badge>
```

### Custom colors

When a status comes from a caller-owned palette the semantic tones do not cover
(e.g. a dynamic per-option color set), pass `color` (fill), `textColor` (label,
and the default dot color), and/or `borderColor` (draws a 1px border on any
variant). These override the resolved tone/variant colors; the library only
guarantees the 4.5:1 AA contract for its built-in tones, so make sure a custom
`color` / `textColor` pair clears it.

```tsx
<Badge color="#EEF6FF" dot dotColor="#2563EB" textColor="#1D4ED8">
  Design
</Badge>
```

### Sizes

`size` takes the shared `ControlSize` (`sm` / `md` / `lg`); `md` is the default.
It scales the label type scale and the pill padding so a badge reads at the same
density as the control beside it:

```tsx
<Badge tone="primary" size="sm">
  Active
</Badge>
```

### Tones

| tone      | soft fill / text              | solid fill / text     | use                         |
| --------- | ----------------------------- | --------------------- | --------------------------- |
| `neutral` | `bg2` / `ink2`                | `ink2` / white        | default, inactive, archived |
| `primary` | `primarySoft` / `primaryDeep` | `primaryDeep` / white | active, positive, brand     |
| `warning` | `amberSoft` / `amberDeep`     | `amberDeep` / white   | pending, attention          |
| `danger`  | `roseSoft` / `roseDeep`       | `roseDeep` / white    | error, overdue, failed      |

The `outline` variant keeps each tone's deep accent text on the white `surface`
and uses the mid accent as the 1px border (`primary` / `amber` / `rose`, and the
light `border2` divider for `neutral`).

There is deliberately no `success` or `info` tone: the shared theme exposes no
green or blue accent distinct from the brand `primary`, so a status badge maps
onto the existing accent families rather than inventing palette tokens. In the
default (accounting) theme `primary` is green, so a positive "Active" status
reads green; the same `tone="primary"` follows the brand color in other themes.

## Accessibility

- The visible label text states the status, so the tone color reinforces the
  meaning rather than being the only channel (WCAG 1.4.1 Use of Color).
- **Contrast contract:** every tone/variant pair meets the 4.5:1 AA text-contrast
  minimum (1.4.3) on its own fill in both shipped themes. The warning and danger
  tones use the deep `amberDeep` / `roseDeep` accents because the lighter
  `amber` / `rose` accents fall below AA on their soft tints.
- The badge is non-interactive and adds no role; it is announced as its text.
  Pass `accessibilityLabel` to override the announced name when the visible
  label is an abbreviation or bare number (e.g. show `3`, announce "3 unread").
- The label is a single line; the full string stays the accessible name.
- The optional leading `dot` is decorative (hidden from assistive tech) — the
  label text carries the status, so the dot color is never the only channel.
- The 4.5:1 AA contract holds for the built-in tones; a **custom** `color` /
  `textColor` pair is the caller's responsibility to keep AA.

## Theming

Badges read colors, fonts, and radii from `SharedUiThemeProvider`. A theme swap
recolors every tone, including the deep `amberDeep` / `roseDeep` accents that
keep the warning and danger tones AA-safe.
