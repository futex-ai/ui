# Focus indicators

These sections extend the [root README](../README.md).

Every control that paints the shared focus glow takes a `focusIndicator` prop,
and the theme's `focusIndicator` sets the default for all of them. The
`DateField` / `DateRangeField` composites do not forward a prop yet and follow
the theme:

| Value            | On web                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ring` (default) | The shared glow, painted from CSS `:focus-visible`.                                                                          |
| `outline`        | No glow. The browser's default outline stays, drawn on the visible box when focus and paint live on different elements.      |
| `none`           | No focus styling at all: no glow, no browser outline, and no focus-only border or highlight (an input's active border, say). |

A control's own prop wins over the theme in both directions. Native keeps the
platform's focus behavior for every value; `none` only drops the focus-only
border there.

`none` is for a control embedded in a surface that already shows focus — a
search field inside a bar that highlights itself, a cell editor inside a grid
cell with its own selection ring. It hands the focus indicator to you: the
surface must show focus visibly, or keyboard users lose track of it (WCAG 2.1 —
2.4.7 Focus Visible, AA). Two things stay on purpose. A separately focusable
action inside the control, such as an input's clear button, keeps the browser
outline: it is its own tab stop, and the control does not report its focus to
you. And forced-colors mode keeps the system outline, because it strips the
shadows and fills a custom indicator is usually drawn with.

```tsx
import { useState } from "react";
import { View } from "react-native";
import { InputFrame } from "@firna/ui/input";
import { useSharedUiTheme } from "@firna/ui/theme";

function SearchBar() {
  const theme = useSharedUiTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        borderColor: focused ? theme.colors.primary : theme.colors.border2,
        borderWidth: focused ? 2 : 1,
      }}
    >
      <InputFrame
        accessibilityLabel="Search projects"
        focusIndicator="none"
        onBlur={() => setFocused(false)}
        onFocus={() => setFocused(true)}
        variant="plain"
      />
    </View>
  );
}
```

The `none` reset has zero specificity, so a focus rule of your own always wins
over it. A custom control built on `useFocusRing` gets the same modes through
the hook's `indicator` option; gate any focus-only decoration it draws itself
on the returned `indicator` as well as `focused`. The "Caller-owned indicator"
story under Focus ring/Examples renders the search-bar pattern.

## Web focus CSS and server rendering

On web, `SharedUiThemeProvider` adds a boxless (`display: contents`) DOM boundary
that serializes the active theme's focus variables around its children:

- `--firna-focus-ring-color` — `colors.primary` composed at the standard `0.35`
  alpha, for example `rgba(79, 120, 100, 0.35)` in the default theme.
- `--firna-focus-ring-width` — the standard `4px` halo width.

That boundary is a real `<div>`, so mount the provider around block content —
an app shell, a page, a panel. Do not mount it directly inside a table row, a
list, a paragraph, or SVG: a `div` is invalid HTML there, and server-rendered
output would fail to hydrate. The library never nests the provider inside its
own components.

Controls repeat those variables on their marked host when needed, so a
per-control `color`, `width`, or `alpha` passed to `useFocusRing` wins locally.
The DOM backend's attribute-based `:focus-visible` rules read the variables;
inset hosts carry a second attribute, and forced-colors mode replaces the shadow
with a `2px solid Highlight` outline. The rules do not animate. A `descendant`
host (an input frame, a chip multi-select, the wheel date trigger) paints only
while its marked focus target has visible focus; any other focusable element
inside it, such as a clear or chip-remove button, keeps the browser outline so
the focused action stays distinguishable from the field.

A hand-rolled control gets the same treatment from the hook. On a Firna
primitive spread `focusRingProps`; on a raw DOM element spread
`focusRingDomProps`, the same markers spelled as literal `data-*` attributes:

```tsx
import { useFocusRing } from "@firna/ui/focusRing";

function Swatch({ color }: { color: string }) {
  const focus = useFocusRing();
  return (
    <button
      {...focus.focusRingDomProps}
      onBlur={focus.onBlur}
      onFocus={focus.onFocus}
      style={{ backgroundColor: color, ...focus.focusRingVariables }}
      type="button"
    />
  );
}
```

For a frame that paints while an inner element owns focus, pass
`target: "descendant"`, spread `focusRingDomProps` on the frame and
`focusTargetDomProps` on the inner element. The "Raw DOM control" story under
Focus ring/Examples renders both patterns.

Two rules apply to raw DOM hosts that the primitives handle for you:

- **The stylesheet.** `View`, `Text`, `TextInput`, and `SharedUiThemeProvider`
  each inject `domBackendCss` once per document on the client, so a page whose
  only Firna code is the provider plus raw DOM controls still paints the glow.
  The "Raw DOM only page" story renders exactly that. The injection is a client
  effect: static and server-rendered markup must still emit `domBackendCss` in
  `<head>` (next section).
- **A resting shadow.** The glow is a `box-shadow`, and an inline `box-shadow`
  on the host outranks the stylesheet, so the glow never paints and the host
  loses its focus indicator. `View` rewrites an inline `boxShadow` into
  `--firna-focus-ring-base-shadow` automatically; a raw host must set that
  variable itself instead of `box-shadow`. The stylesheet paints the base
  shadow at rest and composes it behind the glow on focus:

```tsx
<button
  {...focus.focusRingDomProps}
  style={
    {
      ...focus.focusRingVariables,
      "--firna-focus-ring-base-shadow": "0 1px 2px rgba(0, 0, 0, 0.2)",
    } as CSSProperties
  }
  type="button"
/>
```

Server-rendered and static pages must emit `domBackendCss` in `<head>` before
their own stylesheets. Emitting the variables there as a `:root` fallback makes
the first paint complete even outside a provider boundary; the provider also
serializes them inline, so `renderToStaticMarkup` output remains self-contained:

```tsx
import {
  defaultSharedUiTheme,
  domBackendCss,
  focusRingCssVariablesFor,
} from "@firna/ui";

const focusVariables = focusRingCssVariablesFor(
  defaultSharedUiTheme.colors.primary,
);
const focusVariableCss = `:root{${Object.entries(focusVariables)
  .map(([name, value]) => `${name}:${value}`)
  .join(";")}}`;

<head>
  <style>{`${domBackendCss}\n${focusVariableCss}`}</style>
  {/* Consumer stylesheets come after this style. */}
</head>;
```

Later consumer rules can override the focus treatment at equal specificity.
No `focusIndicator` setting is required for static rendering; `outline` and
`none` are purely opt-outs for consumers that want the browser default or supply
their own focus treatment.

## Custom controls

These notes cover `useFocusRing` and its helpers from `@firna/ui/focusRing`.

Library controls use the hook's CSS marker as the canonical web paint path;
`focused` and `focusVisible` remain available for non-painting interaction
state. Custom controls include `focusRingVariables` in the painted host's style
and spread the marker in the spelling their host understands: `focusRingProps`
on a Firna primitive (`View`, `Pressable`, `TextInput`) or React Native element,
which write `dataSet` out as `data-*` attributes, or `focusRingDomProps` on a
raw DOM element (`<button>`, `<div>`), which React DOM would otherwise leave
unmarked. Split controls mark the real focus target the same two ways
(`focusTargetProps` / `focusTargetDomProps`); a `descendant` host glows only for
that target, so a nested clear or remove button keeps its own browser outline.
Existing hydrated controls that conditionally apply `focusRingStyle` keep their
inline glow for compatibility; adopting the marker is only required for the glow
to survive server/static rendering. `focusRingStyleFor` keeps the explicit
inline glow escape hatch for caller-owned local style sheets. The hook's
`indicator` option (a control's `focusIndicator` prop, else the theme's) picks
the marker: the glow, the browser outline, or none; see
[Focus indicators](#focus-indicators).
