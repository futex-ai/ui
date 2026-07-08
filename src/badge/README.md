# Badge

Reusable React Native and React Native Web status badge: a small, non-interactive
rounded pill that labels a status (e.g. `Active`, `Pending`, `Overdue`) with a
themed tone.

## Responsibilities

- Render a content-hugging rounded pill around one short label, sized on the
  shared `ControlSize` scale (`sm` / `md` / `lg`).
- Carry a semantic status color through a `tone` — `neutral` (default),
  `primary`, `warning`, or `danger` — in a quiet `soft` fill or a filled
  `solid` fill.
- Keep every tone/variant pair at the WCAG 1.4.3 AA text-contrast minimum on its
  own fill in both shipped themes.
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
text when a status needs more emphasis:

```tsx
<Badge tone="danger" variant="solid">
  Failed
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

## Theming

Badges read colors, fonts, and radii from `SharedUiThemeProvider`. A theme swap
recolors every tone, including the deep `amberDeep` / `roseDeep` accents that
keep the warning and danger tones AA-safe.
