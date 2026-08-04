# Typography

Reusable React Native and React Native Web text family: a heading scale
(`H1`–`H5`) plus the text roles `Body`, `Label`, `Caption`, and `Overline`, all
drawn from one component-owned type scale and the shared theme.

## Responsibilities

- Render text at one of nine roles — five heading steps (`h1`–`h5`), `body` (the
  default running text), `label` (control labels), `caption` (small secondary
  text), and `overline` (an uppercased eyebrow) — from a single locally-owned
  type scale (the shared theme has no type scale).
- Expose the heading roles to assistive tech as headings at the matching level
  (`accessibilityRole="header"` → `role="heading"` on web, plus `aria-level`),
  and leave the text roles as plain text.
- Read the font family and text colors from `SharedUiThemeProvider` instead of
  consumer-local theme imports.
- Let a consumer recolor text with an AA-safe semantic token (or a raw color)
  and truncate to a line count without forking a variant.

## Usage

```tsx
import {
  H1,
  H2,
  H3,
  H4,
  H5,
  Body,
  Label,
  Caption,
  Overline,
  Text,
} from "@firna/ui/typography";

<Overline>Reconciliation</Overline>
<H1>Invoice summary</H1>
<Body>Body text is the default running-text role at a comfortable size.</Body>
<Label>Reference</Label>
<Caption>Last updated 19 June 2026</Caption>
```

`Text` is the single base component; `H1`–`H5`, `Body`, `Label`, `Caption`, and
`Overline` are thin wrappers that pin its `variant`. Prefer the named wrappers —
reach for `Text` directly only when the role is dynamic:

```tsx
<Text variant={isHeading ? "h3" : "body"}>{label}</Text>
```

> **Note — the `Text` name shadows `react-native`'s `Text`.** If a file imports
> both, alias one (e.g. `import { Text as RNText } from "react-native"`) so the
> design-system `Text` and the raw primitive don't collide. Most code never
> needs the raw `Text` — the named wrappers cover the common roles.

### Type scale

The numeric scale (sizes, weights, leadings, tracking) is owned by the
component, mirroring the spinner's diameter scale and the avatar's derived font
size. `lineHeight` is absolute pixels (React Native has no multiplier).

| variant    | size | line | weight | tracking | transform | default color |
| ---------- | ---- | ---- | ------ | -------- | --------- | ------------- |
| `h1`       | 30   | 36   | 800    | -0.3     | —         | ink           |
| `h2`       | 24   | 30   | 800    | -0.2     | —         | ink           |
| `h3`       | 20   | 26   | 700    | -0.1     | —         | ink           |
| `h4`       | 17   | 23   | 700    | 0        | —         | ink           |
| `h5`       | 15   | 21   | 700    | 0        | —         | ink           |
| `body`     | 15   | 22   | 400    | 0        | —         | ink           |
| `label`    | 14   | 20   | 600    | 0        | —         | ink           |
| `caption`  | 13   | 18   | 400    | 0        | —         | muted         |
| `overline` | 11   | 16   | 700    | 1        | uppercase | muted         |

### Color

Each variant paints with an AA-safe default token (`ink` for headings, `body`,
and `label`; `muted` for `caption` and `overline`). Pass `color` to override it
per instance, with either a **semantic token** or a **raw color string**:

```tsx
<Text color="secondary">Supporting copy.</Text>
<Text color="danger">Payment failed — retry the charge.</Text>
<H4 color="#2f5945">Greenhouse Studio</H4>
```

Semantic tokens resolve through the theme and are AA-safe by construction:

| token         | theme color   | use                              |
| ------------- | ------------- | -------------------------------- |
| `default`     | `ink`         | primary text                     |
| `secondary`   | `ink2`        | supporting copy                  |
| `muted`       | `muted`       | metadata, hints                  |
| `placeholder` | `placeholder` | faint-but-meaningful text        |
| `primary`     | `primaryDeep` | branded emphasis                 |
| `danger`      | `rose`        | errors, destructive copy         |
| `inverse`     | `#fff`        | text on a dark fill (you own bg) |

The decorative `faint` color (2.26:1 on white — fails AA as text) is not a token
on purpose. A raw-string `color` bypasses tokens and is your responsibility to
keep at ≥4.5:1 (1.4.3).

### Truncation

`numberOfLines` clips long text with a trailing ellipsis; the full string stays
the accessible name:

```tsx
<Body numberOfLines={1}>{veryLongDescription}</Body>
```

## Accessibility

- The heading variants (`h1`–`h5`) carry `accessibilityRole="header"`, which RNW
  maps to `role="heading"`, plus `aria-level` (1–5) so the page exposes a
  navigable outline (1.3.1, 2.4.10). The text roles stay plain text and add no
  stray heading semantics. Native RN supports the header role but has no level
  concept, so `aria-level` is web-only there and harmlessly ignored.
- Pick the variant that matches the document outline; do not pick a heading
  variant just to get its size, as that misstates the outline (a 1.3.1
  failure). The role and the heading level are intentionally coupled.
- **Contrast contract:** every default color and every semantic token meets the
  4.5:1 AA text-contrast minimum on the surface in all four shipped themes. When you
  pass a raw-string `color`, you own keeping it at ≥4.5:1 (1.4.3).

## Theming

Typography reads the font and colors from `SharedUiThemeProvider`. The text uses
`fonts.sans`; each variant's default color and every `color` token resolve
through the theme via `resolveTypographyColor`, so a theme swap recolors the
whole family. The numeric type scale is owned by the component.
