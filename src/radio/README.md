# Radio Cards

Reusable React Native and React Native Web radio-option cards copied from the
accounting app's shared `RadioCard` primitive.

## Responsibilities

- Render a titled option card with optional supporting body copy.
- Expose `radio` semantics with checked and disabled state, plus a non-color
  (check-glyph) selection affordance.
- Treat missing `onPress` as a read-only disabled card.
- Use shared theme colors, fonts, and radii instead of consumer-local theme
  imports.
- Keep keyboard focus visible on web with a geometry-bearing ring (not just a
  border recolor) so it stays visible on already-bordered checked cards.

## Usage

Wrap related cards in `RadioCardGroup`. The group owns the `radiogroup` role and
name, behaves as a **single Tab stop**, and moves a roving focus between cards
with `ArrowUp`/`ArrowDown`/`Home`/`End` (disabled cards are skipped). Each card
still toggles with `Space`.

```tsx
import { RadioCard, RadioCardGroup } from "@firna/ui/radio";

<RadioCardGroup accessibilityLabel="Accounting basis" required>
  <RadioCard
    body="Record income and expenses when money moves."
    checked={basis === "cash"}
    onPress={() => setBasis("cash")}
    title="Cash basis"
  />
  <RadioCard
    body="Record income and expenses when invoices are issued."
    checked={basis === "accrual"}
    onPress={() => setBasis("accrual")}
    title="Accrual basis"
  />
</RadioCardGroup>;
```

`RadioCardGroup` accepts `label` (visible heading; doubles as the accessible
name), `accessibilityLabel`, `required` (→ `aria-required`), and `invalid`
(→ `aria-invalid`). A standalone `RadioCard` outside a group remains individually
focusable and `Space`-activatable, but consumers should always own a labelled
`radiogroup` (use `RadioCardGroup`) for a complete ARIA pattern.

Omitting `onPress` renders the card as read-only. Passing `disabled` also dims
the card and reports the disabled accessibility state.

## Theming

Radio cards read colors, fonts, and radii from `SharedUiThemeProvider`. Checked
states use the active theme primary family, matching the accounting sage default
unless a consumer supplies theme overrides.
