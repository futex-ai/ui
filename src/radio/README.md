# Radio Cards

Reusable React Native and React Native Web radio-option cards copied from the
accounting app's shared `RadioCard` primitive.

## Responsibilities

- Render a titled option card with optional supporting body copy.
- Expose `radio` semantics with checked and disabled state.
- Treat missing `onPress` as a read-only disabled card.
- Use shared theme colors, fonts, and radii instead of consumer-local theme
  imports.
- Keep keyboard focus visible on web without relying on the browser default
  outline.

## Usage

Group related cards under a labelled `radiogroup` owned by the consuming form:

```tsx
import { View } from "react-native";

import { RadioCard } from "@futex/ui/radio";

<View accessibilityLabel="Accounting basis" accessibilityRole="radiogroup">
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
</View>;
```

Omitting `onPress` renders the card as read-only. Passing `disabled` also dims
the card and reports the disabled accessibility state.

## Theming

Radio cards read colors, fonts, and radii from `SharedUiThemeProvider`. Checked
states use the active theme primary family, matching the accounting sage default
unless a consumer supplies theme overrides.
