# Theming

These sections extend the [root README](../README.md).

Four presets ship, all built from the same semantic token set:
`defaultSharedUiTheme` and `junoSharedUiTheme` (light), `darkSharedUiTheme` and
`junoDarkSharedUiTheme` (dark). Pass one to `SharedUiThemeProvider`, or brand it
first with `createSharedUiTheme(overrides, base)` — the second argument picks
the preset to extend, so a dark brand tint stays dark:

```tsx
const brandDark = createSharedUiTheme(
  { colors: { primary: "#8fb3ff" } },
  darkSharedUiTheme,
);
```

Two token-level rules make dark mode work without per-component branching:

- **`colors.onSolid`** is the text/icon color on solid accent fills (the solid
  badge, the primary button, the dropdown's active row, the calendar "today"
  disc, the switch knob at the on-position…). It is white in the light themes
  and the near-black page ink-well in the dark ones.
- **Solid fills invert.** In the dark presets the `*Deep` tokens become _light_
  accents and `onSolid` darkens, so every existing token relationship
  (deep-on-soft, deep-as-fill, the heatmap ramp's ordering) keeps working
  unchanged. Every documented WCAG 2.1 — 1.4.3/1.4.11 pair is pinned by unit
  tests across all four presets, and every dark Storybook story is swept by axe.

`theme.scheme` (`"light" | "dark"`) is available for the rare physical-metaphor
case, but components should read colors from tokens rather than branch on it.

## Chart colors

`theme.charts` carries the data-visualization scales used by `@firna/ui/chart`,
each encoding exactly one job: `series` (identity — 8 slots, assigned in order
and never cycled), `sequential` (magnitude), `ordinal` (ordered marks),
`diverging` (polarity, with a neutral grey midpoint) and `status` (reserved
state, never handed out as a series color). The chart furniture — `grid`,
`axis`, `label`, `surface`, `deemphasis` — derives from the theme's own
neutrals, so all four presets stay in sync with nothing maintained by hand.

`createSharedUiTheme` resolves `charts` from `scheme` and `colors`, so a theme
built through it never supplies one. Values you set explicitly are carried
forward when that theme is extended.

**`scheme` and `colors` must agree.** `createSharedUiTheme({ scheme: "dark" })`
alone yields a dark-schemed theme still wearing the _light_ palette — the dark
series steps then paint on a white surface and several drop below their
contrast floor. Extend a dark preset instead:
`createSharedUiTheme(overrides, darkSharedUiTheme)`. Before charts, `scheme`
only affected a few physical-metaphor sites; it now selects whole color scales,
so the mismatch matters much more than it used to.

The slot **order** is the colorblind-safety mechanism, not a cosmetic choice —
it was picked by enumerating all 40,320 orderings and keeping only those that
clear the gates on every shipped surface. Re-order it and you must re-validate:

```sh
node scripts/validate-chart-palette.mjs           # report the shipped palette
node scripts/validate-chart-palette.mjs --derive  # re-run the enumeration
```

`tests/unit/chartPalette.test.ts` pins every measured number, so a token edit
that regresses the palette fails the suite rather than shipping quietly.

The library does **not** detect the OS setting — the provider stays free of a
`react-native` import so it can be loaded by the node test runner and the
package-smoke stubs. Consumers own that wiring:

```tsx
import { useColorScheme } from "react-native";
import {
  darkSharedUiTheme,
  defaultSharedUiTheme,
  SharedUiThemeProvider,
} from "@firna/ui/theme";

function App() {
  const scheme = useColorScheme();
  return (
    <SharedUiThemeProvider
      theme={scheme === "dark" ? darkSharedUiTheme : defaultSharedUiTheme}
    >
      {/* … */}
    </SharedUiThemeProvider>
  );
}
```
