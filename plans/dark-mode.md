# Dark mode

Ship first-class dark mode as **two new shipped theme presets** —
`darkSharedUiTheme` (dark counterpart of the accounting default) and
`junoDarkSharedUiTheme` (dark Juno) — plus the two small primitives the
components need to render correctly under them: a `colors.onSolid` token
(text/icons on solid accent fills, today hardcoded as `"#fff"` /
`colors.surface` across 12 files) and a `theme.scheme: "light" | "dark"` field
for the three physical-metaphor sites that genuinely must branch (switch knob,
skeleton sheen, toast hover wash) plus the data-grid's fixed pill colors. No
provider API changes, no automatic OS detection (consumers pass a preset;
pattern documented), no global Storybook default flip (the browser suite pins
31 light-theme colors to existing story ids).

**Status:** M1–M4 delivered (`onSolid` + `scheme` groundwork, both dark
presets, the four scheme-gated component fixes, and 14 dark Storybook stories
with pinned-color + axe coverage). `npm run verify` green — 677 unit tests, 224
Playwright tests incl. the full axe sweep against a still-empty
`axe-baseline.json`, all 31 pinned light-theme colors unchanged. M5
remaining. All palette values below are pre-validated
against WCAG 2.1 — 1.4.3/1.4.11 (ratios listed per pair, independently
re-derived at implementation time — every row matches); the component audit is
complete (every hazardous site enumerated with file:line, verified in the tree
at plan time).

---

## For the implementing agent

- Setup: `npm install`, then `npx playwright install chromium` (the verify gate
  runs a browser sweep). Node ≥ 20.
- The gate is **`npm run verify`** = format:check → unit tests → typecheck →
  build → package smoke → Storybook build → Playwright (incl. an axe WCAG A/AA
  sweep over every story, diffed against an **empty** `axe-baseline.json` —
  keep it empty). `AGENTS.md` mentions `cargo xtask check`; it is the same
  thing, but call `npm run verify` directly and commit only at the commit steps
  written below — do not auto-commit.
- If port 6006 is taken (parallel workspaces), run browser tests with
  `STORYBOOK_PORT=<free port> npm run test:browser` — the config honors
  `STORYBOOK_PORT ?? CONDUCTOR_PORT ?? 6006`.
- Formatting: run `npm run format` before committing; prettier check is part of
  verify.
- House rules for this file (AGENTS.md §Plans): tick the `- [ ]` checkboxes
  here as you complete steps; keep the **Status** line at the top current;
  every milestone must end with `npm run verify` green before its commit.
- Line numbers below (`L###`) were verified at plan time; if a file has
  drifted, search for the quoted code rather than trusting the number.

---

## Background — how theming works today

- One context, `SharedUiThemeProvider` / `useSharedUiTheme`
  ([`src/theme.tsx`](../src/theme.tsx) L149–166). `createSharedUiTheme(overrides)`
  (L138–147) shallow-merges per group (`colors` / `fonts` / `radii` /
  `focusRing`) over `defaultSharedUiTheme`. Two shipped presets, both light:
  `defaultSharedUiTheme` (L96) and `junoSharedUiTheme` (L168, built via
  `createSharedUiTheme`).
- The 22 color tokens are semantic (`bg`, `bg2`, `surface`, `ink`, `ink2`,
  `muted`, `placeholder`, `faint`, `border`, `border2`, `controlBorder`,
  `soft`, `primary`/`primaryBorder`/`primaryDeep`/`primarySoft`,
  `amber`/`amberDeep`/`amberSoft`, `rose`/`roseDeep`/`roseSoft`) and almost all
  components consume only tokens. Token JSDoc documents AA obligations
  ("in both shipped themes") — those comments must be updated to cover four.
- **The dark-mode hazards** (full audit below): 10 literal `"#fff"` sites, 13
  `colors.surface`-used-as-inverse-text sites, 3 scheme-physical sites, 3
  fixed data-grid pill pairs, plus intentional keep-as-is families (scrims,
  shadows, workflow chip palette).
- No `useColorScheme` / `prefers-color-scheme` / `Appearance` usage anywhere in
  `src/` or `.storybook/`.

### The solid-inversion model (why one new token is enough)

In the light themes each `*Deep` token serves two roles: **text on its soft
tint** (e.g. `amberDeep` on `amberSoft`) and **solid fill under white text**
(badge `solid`). Both roles want a dark accent, so one token works. In a dark
theme the roles pull apart — text-on-soft must go light, while a fill under
_white_ text must stay dark. The resolution is the standard dark-UI move
(Material, iOS tinted): **solid fills invert** — the `*Deep` tokens become
light accents and the text on them becomes near-black. That is the `onSolid`
token: `#ffffff` in both light presets (rendering is pixel-identical), near-bg
dark in the dark presets. With that inversion, every existing token
relationship (deep-on-soft, deep-as-fill, ramp ordering) keeps working with no
per-component logic. Bonus: the Heatmap's default ramp
`[primarySoft, primaryBorder, primary, primaryDeep]` automatically becomes
dark→light on a dark surface — "more intense = brighter", the correct dark
reading (GitHub-contribution-graph style) — with **zero code change**.

---

## Design

### D1 — `colors.onSolid` token

[`src/theme.tsx`](../src/theme.tsx):

```ts
// In SharedUiColors, alphabetically after `muted`:
/**
 * Text and icon color on solid accent fills — the badge/button/avatar solid
 * variants, the dropdown's solid active row, the calendar "today" disc and
 * event blocks, the selected date cell, the radio check, the switch knob at
 * the on-position, the combobox count mark, the drag-select count badge and
 * the rich-text checkbox tick. White in the light themes; in the dark themes
 * solid fills invert to light accents, so this flips to the near-black page
 * ink-well. Held to WCAG 2.1 — 1.4.3 (AA): ≥4.5:1 on `primary`, `ink2` and
 * every `*Deep` fill in all four shipped themes.
 */
onSolid: string;
```

`defaultSharedUiTheme.colors` and `junoSharedUiTheme`'s override object each
gain `onSolid: "#ffffff"`. Every light-theme pairing this must uphold already
passes today (measured): `#fff` on `primaryDeep` 7.97:1, `amberDeep` 6.98:1,
`roseDeep` 7.46:1, `ink2` 9.86:1, `primary` 5.00:1 (default) / 5.14:1 (juno).

### D2 — `theme.scheme` + a `base` for `createSharedUiTheme`

[`src/theme.tsx`](../src/theme.tsx):

```ts
export type SharedUiScheme = "light" | "dark";

export type SharedUiTheme = {
  colors: SharedUiColors;
  fonts: SharedUiFonts;
  radii: SharedUiRadii;
  focusRing: boolean;
  /**
   * Which side of the light/dark divide this theme's palette sits on. Almost
   * no component should branch on it — colors flow through tokens — but the
   * few physical-metaphor sites (the white skeleton sheen, the switch knob's
   * off-state fill, the solid toast's hover wash, the data-grid's fixed pill
   * pairs) legitimately need to know. Defaults to "light".
   */
  scheme: SharedUiScheme;
};

// SharedUiThemeOverrides gains: scheme?: SharedUiScheme;

export function createSharedUiTheme(
  overrides: SharedUiThemeOverrides = {},
  base: SharedUiTheme = defaultSharedUiTheme,
): SharedUiTheme {
  return {
    colors: { ...base.colors, ...overrides.colors },
    fonts: { ...base.fonts, ...overrides.fonts },
    radii: { ...base.radii, ...overrides.radii },
    focusRing: overrides.focusRing ?? base.focusRing,
    scheme: overrides.scheme ?? base.scheme,
  };
}
```

`defaultSharedUiTheme` gains `scheme: "light"`. The `base` parameter is
backward-compatible (defaults to the old behavior) and is what lets consumers
brand-tint a dark preset —
`createSharedUiTheme({ colors: { primary: "#…" } }, darkSharedUiTheme)` — and
lets `junoDarkSharedUiTheme` inherit Juno's larger radii. Note
`SharedUiThemeProvider` already funnels its `theme` prop through
`createSharedUiTheme(theme)` (L156), so a full `SharedUiTheme` passed as a prop
round-trips unchanged, including `scheme`.

### D3 — the dark palettes (pre-validated)

`darkSharedUiTheme` — dark counterpart of the accounting default (warm
green-tinted greys, sage accents lightened for dark):

```ts
export const darkSharedUiTheme = createSharedUiTheme({
  scheme: "dark",
  colors: {
    amber: "#cfa763",
    amberDeep: "#e3c186",
    amberSoft: "#322a19",
    bg: "#141613",
    bg2: "#1b1e1b",
    border: "#2a2e2a",
    border2: "#3a403a",
    controlBorder: "rgba(230, 233, 228, 0.27)", // ink (#e6e9e4) @ 27% — translucent control edge
    faint: "#5c635b",
    ink: "#e6e9e4",
    ink2: "#c3c9c2",
    muted: "#9aa29a",
    onSolid: "#141613",
    placeholder: "#9aa29a",
    primary: "#7aa78e",
    primaryBorder: "#33493d",
    primaryDeep: "#a3cdb4",
    primarySoft: "#223029",
    rose: "#cd8478",
    roseDeep: "#eba99d",
    roseSoft: "#382220",
    soft: "#252a25",
    surface: "#212522",
  },
});
```

`junoDarkSharedUiTheme` — dark Juno (cool violet-tinted greys), built on the
Juno base so it inherits Juno's radii:

```ts
export const junoDarkSharedUiTheme = createSharedUiTheme(
  {
    scheme: "dark",
    colors: {
      amber: "#d9a852",
      amberDeep: "#e8c37e",
      amberSoft: "#322913",
      bg: "#131218",
      bg2: "#19181f",
      border: "#282631",
      border2: "#38353f",
      controlBorder: "rgba(232, 230, 240, 0.27)", // ink (#e8e6f0) @ 27%
      faint: "#615e70",
      ink: "#e8e6f0",
      ink2: "#c7c3d6",
      muted: "#9d99ae",
      onSolid: "#131218",
      placeholder: "#9d99ae",
      primary: "#9b8ce8",
      primaryBorder: "#3b3459",
      primaryDeep: "#b6aaf5",
      primarySoft: "#272239",
      rose: "#d98282",
      roseDeep: "#f0a3a3",
      roseSoft: "#3a1f1f",
      soft: "#1f1d27",
      surface: "#1e1c25",
    },
  },
  junoSharedUiTheme,
);
```

Design notes, in the palettes' own terms:

- Elevation inverts: in light themes `surface` (white) is _lighter_ than `bg`;
  in dark themes `surface` sits _above_ `bg` by being slightly lighter
  (`#212522` over `#141613`) — cards still read as raised.
- `onSolid` = `bg` on purpose: content punched out of a solid accent reads as
  the page showing through.
- `controlBorder` stays the hand-synced 27% ink tint (the documented
  deliberate sub-3:1 edge); with a light ink it composites as a light line
  over dark fills, mirroring light-mode behavior. `scaleAlpha()` in
  [`src/switch/switchStyles.ts`](../src/switch/switchStyles.ts) L73–81 already
  parses `rgba()` and keeps working.
- `placeholder` ≥4.5:1 on `surface` (same value as `muted`, matching how the
  light themes keep them near-identical).

Measured ratios (all pass; the unit test in M2 pins every row):

| Pair (WCAG rule)                        | dark    | junoDark |
| --------------------------------------- | ------- | -------- |
| ink on surface (1.4.3, target ≥7)       | 12.67:1 | 13.63:1  |
| ink on bg                               | 14.85:1 | 15.09:1  |
| ink2 on surface (≥4.5)                  | 9.21:1  | 9.78:1   |
| muted on surface (≥4.5)                 | 5.92:1  | 6.09:1   |
| muted on bg (≥4.5)                      | 6.94:1  | 6.74:1   |
| muted on soft (≥4.5)                    | 5.57:1  | 6.02:1   |
| placeholder on surface (≥4.5)           | 5.92:1  | 6.09:1   |
| primaryDeep on primarySoft (≥4.5)       | 7.85:1  | 7.32:1   |
| amberDeep on amberSoft (≥4.5)           | 8.26:1  | 8.58:1   |
| roseDeep on roseSoft (≥4.5)             | 7.54:1  | 7.50:1   |
| onSolid on primaryDeep fill (≥4.5)      | 10.36:1 | 8.92:1   |
| onSolid on amberDeep fill (≥4.5)        | 10.61:1 | 11.12:1  |
| onSolid on roseDeep fill (≥4.5)         | 9.27:1  | 9.29:1   |
| onSolid on ink2 fill (≥4.5)             | 10.79:1 | 10.83:1  |
| onSolid on primary fill (≥4.5)          | 6.71:1  | 6.48:1   |
| primary vs surface (1.4.11, ≥3)         | 5.73:1  | 5.86:1   |
| knob(onSolid) vs on-track(primary) (≥3) | 6.71:1  | 6.48:1   |
| knob(ink) vs off-track(border2) (≥3)    | 8.68:1  | 9.72:1   |

### D4 — no automatic OS detection (deliberate)

The provider stays dumb. Adding `useColorScheme` to `src/theme.tsx` would drag
a `react-native` import into the one module that is currently pure (imported
directly by the node unit runner and the package-smoke stubs — see
`scripts/package-smoke-stubs.mjs`, which would need a new stub). Consumers own
the wiring; the README gets this pattern (M5):

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

A `useSystemSharedUiTheme(light, dark)` convenience hook is a follow-up, not
part of this plan (it forces the stub work above for one line of consumer
code).

### D5 — Storybook strategy: opt-in dark stories, no global default flip

`tests/browser/storybook.spec.ts` pins **31 exact computed colors** (e.g.
`toBe("rgb(143, 58, 48)")`) against existing story ids rendered under the
default light theme, and `tests/browser/a11y.spec.ts` auto-enumerates
`index.json` and axe-scans every story against an empty baseline. Therefore:

- Existing story ids must keep rendering light → **no preview decorator that
  changes the default, no toolbar with a non-light default**. A global toolbar
  is deferred entirely (Follow-ups) — per-story `StorySurface theme={…}` is the
  established house pattern (`focusRing.stories.tsx` does exactly this).
- New `Dark` story exports are additive: new ids, automatically axe-scanned —
  which is precisely how the dark palettes get a free WCAG AA gate in CI.
- **`StorySurface` must paint its theme's background.** Today it paints
  nothing and the canvas is `body { background: #f7f7f3 }` from
  `.storybook/storybook.css`; a dark story would composite dark text over a
  light body and axe would (rightly) fail it. Fix in
  [`src/stories/sharedExamples.tsx`](../src/stories/sharedExamples.tsx)
  L909–921 by resolving the theme and painting `colors.bg` (pixel-identical
  for the default theme: `#f7f7f3` = the body CSS):

```tsx
export function StorySurface({
  children,
  theme = defaultSharedUiTheme,
}: {
  children: ReactNode;
  theme?: SharedUiThemeOverrides | SharedUiTheme;
}) {
  const resolved = useMemo(() => createSharedUiTheme(theme), [theme]);
  return (
    <SharedUiThemeProvider theme={resolved}>
      <View style={[styles.surface, { backgroundColor: resolved.colors.bg }]}>
        {children}
      </View>
    </SharedUiThemeProvider>
  );
}
```

(Also give `styles.surface` a `borderRadius: 12` so the dark panel doesn't
sit as a hard-cornered slab on the light canvas — cosmetic, optional.)

### D6 — what intentionally does NOT change

| Site                                                                                                                                                                                                                                                                                                                                                                                                      | Why it stays                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modal/date scrims — `rgba(20, 28, 22, 0.36)` at `src/modal/webModalFrameStyles.ts:13`, `src/modal/WebModalFrame.tsx:189`, `rgba(20, 24, 20, 0.35)` at `src/date/DatePickerOverlay.tsx:88`; gorhom's implicit `#000` @ 0.36 backdrop in `src/sheet/BottomSheetShell.tsx:83`                                                                                                                                | Dark scrims over dark UIs are standard; they dim, they don't tint. Revisit only if the M4 visual pass finds separation weak.                                                                                                                                                                                                                                                       |
| Elevation shadows — the ink-tinted `rgba(20, 28, 22, …)` family (kanban `kanbanStyles.ts:147–148,158`, sortable `sortableListStyles.ts:61`, modal `webModalFrameStyles.ts:98`, popover `ComboboxPopover.tsx:39` + `dropdownPortalModel.ts:49`, toast `toastStyles.ts:94,113–114`, segmented `segmentedControlStyles.ts:161`, workflow `workflowStyles.ts:199`) and the switch knob's `rgba(0, 0, 0, 0.2)` | Shadows are always dark. Dark themes lean on the (tokenized) borders for separation, which these components already draw.                                                                                                                                                                                                                                                          |
| Workflow node chip palette + white glyphs — six fixed hexes `src/workflow/workflowTypes.ts:167–172`, `color="#fff"` at `src/workflow/WorkflowNode.tsx:182,184`                                                                                                                                                                                                                                            | A deliberate fixed _category_ palette (documented at `workflowTypes.ts:160–165`, overridable via `nodeColors`). The mid-saturation fills read on both light and dark surfaces and white passes on all six (worst: `agent` `#7561c5` at 4.92:1). Converting the glyph to `onSolid` would _break_ dark mode (near-black glyph on `#7561c5`). Add a code comment saying exactly that. |
| `toastSolidToneForeground` — `src/toast/toastColors.ts:38–46`                                                                                                                                                                                                                                                                                                                                             | It picks `surface` if ≥4.5:1 on the fill, else `ink`. Both candidates flip together in a dark theme (dark surface on light accent fills passes), so it inverts correctly _by construction_. Do not "fix" it: a max-contrast rewrite changes which color wins on borderline light-mode fills and violates M1's zero-visual-delta rule.                                              |
| Toast card focus ring — `0 0 0 2px ${colors.surface}, 0 0 0 4px ${colors.primary}` at `src/toast/Toast.tsx:104`                                                                                                                                                                                                                                                                                           | The inner band is a _gap_ matching the control's own card fill (which is `surface`), not inverse text. Correct in all four themes as-is.                                                                                                                                                                                                                                           |
| Heatmap default ramp — `Heatmap.tsx:291–303`                                                                                                                                                                                                                                                                                                                                                              | Auto-inverts via tokens (see the solid-inversion model above). Verify visually in M4, change nothing.                                                                                                                                                                                                                                                                              |
| Focus ring — `src/focusRing.ts`                                                                                                                                                                                                                                                                                                                                                                           | Glow is `theme.colors.primary` @ 0.35 alpha; dark primaries are lighter, so the glow reads on dark fills. The `#4f7864` literal at L20 is the _themeless fallback_ for calls outside a provider — leave it.                                                                                                                                                                        |
| Drag-select marquee — `` `${theme.colors.primary}1A` `` at `src/drag-select/DragSelectableOverlay.web.tsx:50`                                                                                                                                                                                                                                                                                             | Fragile (assumes 6-digit hex) but all four shipped presets keep `primary` as 6-digit hex, so it works. Hardening is a follow-up.                                                                                                                                                                                                                                                   |
| `buttonStyles.ts` / `inputStyles.ts` / `segmentedControlStyles.ts` / kanban `chipPlain` `"transparent"` fills                                                                                                                                                                                                                                                                                             | Deliberate no-chrome variants, not visible fills.                                                                                                                                                                                                                                                                                                                                  |

### D7 — scheme-gated component fixes (the only `scheme` branches)

**Switch knob** ([`src/switch/switchStyles.ts`](../src/switch/switchStyles.ts)
L94–115). Today the knob is `"#fff"` in both positions and `knobOn` re-borders
white. On the dark themes' _light_ `primary` on-track, a white knob falls to
~1.7:1. New rule — off-knob is light-on-dark, on-knob is the punch-out color:

```ts
    knob: {
      // Off-position: light-scheme themes keep the white knob; dark themes
      // float a light-ink knob on the dark `border2` track (≥3:1, 1.4.11).
      backgroundColor:
        theme.scheme === "dark" ? theme.colors.ink : theme.colors.onSolid,
      borderColor: theme.colors.controlBorder,
      /* …rest unchanged, incl. boxShadow… */
    },
    knobOn: {
      // On the saturated `primary` track the knob flips to `onSolid` — white
      // over the deep light-theme track, near-black over the light dark-theme
      // track (solid-inversion model) — and the edge matches the fill as
      // before so no grey ring muddies the boundary.
      backgroundColor: theme.colors.onSolid,
      borderColor: theme.colors.onSolid,
      left: knobOn,
    },
```

Light themes render pixel-identically (`onSolid` = `#fff` = today's literal).
Measured dark pairs: on-knob vs track 6.71:1 / 6.48:1, off-knob vs track
8.68:1 / 9.72:1.

**Skeleton sheen** ([`src/skeleton/Skeleton.tsx`](../src/skeleton/Skeleton.tsx)
L157–168, [`src/skeleton/skeletonStyles.ts`](../src/skeleton/skeletonStyles.ts)
L13). A white sweep at 0.65 peak opacity over the dark `soft` base blows out.
Keep the stops white; drop the peak opacity on dark schemes:

```ts
// skeletonStyles.ts
/** Peak opacity of the white shimmer sheen over the light `soft` base. */
export const SKELETON_SHEEN_OPACITY = 0.65;
/**
 * Dark-scheme peak: the same white sweep reads as a glare on a dark base, so
 * it drops to a subtle 0.12 highlight (GitHub-dark-style shimmer).
 */
export const SKELETON_SHEEN_OPACITY_DARK = 0.12;
```

```tsx
// Skeleton.tsx — component body already has the theme in scope
const sheenOpacity =
  theme.scheme === "dark"
    ? SKELETON_SHEEN_OPACITY_DARK
    : SKELETON_SHEEN_OPACITY;
// …and in the gradient:
<Stop offset={0.5} stopColor="#ffffff" stopOpacity={sheenOpacity} />;
```

**Solid-toast hover wash** ([`src/toast/toastStyles.ts`](../src/toast/toastStyles.ts)
L53, L70). `rgba(255, 255, 255, 0.14)` brightens the dark solid fills of the
light themes; on the dark themes' _light_ solid fills a white wash is
invisible — flip it to a black wash:

```ts
// Once, near the top of the styles factory (theme is in scope):
const solidHoverWash =
  theme.scheme === "dark" ? "rgba(0, 0, 0, 0.10)" : "rgba(255, 255, 255, 0.14)";
// …use `backgroundColor: solidHoverWash` at both hover sites.
```

**Data-grid fixed pills** ([`src/data-grid/dataGridCellContent.tsx`](../src/data-grid/dataGridCellContent.tsx)
L61–90). `green`/`amber`/`rose`/`gray` resolve through tokens and adapt free;
`blue`/`purple`/`teal` are fixed light pairs. Give them scheme-gated dark
pairs (measured 8.44:1 / 7.68:1 / 7.83:1):

```ts
export function resolveOptionColor(
  theme: SharedUiTheme,
  color: DataGridOptionColor = "gray",
): ColorPair {
  const dark = theme.scheme === "dark";
  switch (color) {
    /* …green/amber/rose unchanged… */
    case "blue":
      return dark
        ? { backgroundColor: "#1c2a3a", color: "#a8c8ee" }
        : { backgroundColor: "#dbe7f3", color: "#2c557f" };
    case "purple":
      return dark
        ? { backgroundColor: "#2a2440", color: "#c3b2f0" }
        : { backgroundColor: "#ebe5f9", color: "#4a3795" };
    case "teal":
      return dark
        ? { backgroundColor: "#16302b", color: "#7fd0c0" }
        : { backgroundColor: "#d6ede7", color: "#1b6052" };
    /* …default unchanged… */
  }
}
```

---

## Component inventory — every site that changes

### Family A — literal `"#fff"` → `colors.onSolid` (mechanical swap, zero light-mode delta)

| #   | File                                            | Site (verified at plan time)                                           | Role                                                                                                                       |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/badge/badgeStyles.ts`                      | L98, L100, L102, L104 (`color: "#fff"` ×4 in the solid-variant switch) | solid badge label on `ink2`/`primaryDeep`/`amberDeep`/`roseDeep` fills — also feeds Kanban chips via `resolveBadgeColors`  |
| 2   | `src/button/Button.tsx`                         | L198 (`? "#fff"` — primary-tone `labelColor`)                          | solid button label + leading icon on `primary` fill                                                                        |
| 3   | `src/avatar/avatarStyles.ts`                    | L16 (`avatarTextSolid: { color: "#fff" }`)                             | solid avatar initials on `primary` disc                                                                                    |
| 4   | `src/dropdown/ComboboxMultiSelect.tsx`          | L542 (`markText: { …color: "#fff" }`)                                  | selected-count mark glyph on `primary` circle                                                                              |
| 5   | `src/drag-select/DragSelectableOverlay.web.tsx` | L100 (`color: "#fff"`)                                                 | selection-count badge text on `primary` badge                                                                              |
| 6   | `src/rich-text/domRender.web.ts`                | L376 (`element.style.color = "#fff"`)                                  | checked-checkbox tick on `colors.primary` fill (theme colors are already in scope at this site)                            |
| 7   | `src/typography/typographyStyles.ts`            | L180 (`case "inverse": return "#fff"`)                                 | the `inverse` typography tone — becomes `colors.onSolid`; update the JSDoc at L155–161 ("white" → "the theme's `onSolid`") |

Excluded on purpose: `src/workflow/WorkflowNode.tsx` L182/L184 (fixed category
palette — D6) and `src/skeleton/Skeleton.tsx` L160/163/166 (sheen stops stay
white — D7).

### Family B — `colors.surface`-as-inverse-text → `colors.onSolid` (identical rendering in light themes, where `surface` = `#ffffff` = `onSolid`)

| #   | File                                 | Sites                                                                                                           | Role                                                                                                               |
| --- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 8   | `src/dropdown/dropdownListStyles.ts` | L96 (`itemLabelOnSolid`), L102 (`itemSecondaryOnSolid`), L232 (`contentColor`), L264 (`checkColor`)             | solid-variant active row: label/secondary/slot-content/check on the saturated fill (`resolveDropdownRowHighlight`) |
| 9   | `src/calendar/calendarStyles.ts`     | L155, L170, L261 ("today" disc/chip/header on `primary`), L391, L397 (event-block title/time on the event fill) | calendar inverse text                                                                                              |
| 10  | `src/date/webCalendarStyles.ts`      | L26 (selected day), L109 (selected year)                                                                        | selected cell text on `primary`                                                                                    |
| 11  | `src/date/wheelPickerStyles.ts`      | L78 ("Done" on `primaryDeep`)                                                                                   | wheel confirm button                                                                                               |
| 12  | `src/radio/radioCardStyles.ts`       | L39 (check glyph on `primary`)                                                                                  | radio check                                                                                                        |

Excluded on purpose: `src/toast/toastColors.ts` L42–45 and `src/toast/Toast.tsx`
L104 (correct as-is — D6).

### Family C — scheme-gated (D7)

| #   | File                                              | Change                                                                                  |
| --- | ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 13  | `src/switch/switchStyles.ts` L94–115              | knob off-fill `scheme` ternary; `knobOn` gains `backgroundColor`/`borderColor: onSolid` |
| 14  | `src/skeleton/Skeleton.tsx` + `skeletonStyles.ts` | `SKELETON_SHEEN_OPACITY_DARK = 0.12`, scheme-picked                                     |
| 15  | `src/toast/toastStyles.ts` L53, L70               | `solidHoverWash` scheme ternary                                                         |
| 16  | `src/data-grid/dataGridCellContent.tsx` L81–86    | dark pairs for blue/purple/teal                                                         |

Fully token-driven directories needing **no** edits (verified): animated-border,
calendar (beyond the 5 sites above), heatmap, list, loader, popover, radio
(beyond L39), spinner, table, input, sheet, rich-text (beyond L376), segmented,
kanban (chips resolve through badge tokens), sortable-list, workflow (beyond
the D6 comment), date (beyond the sites above), plus all root utilities.

---

## Milestones

### M1 — `onSolid` + `scheme` groundwork (zero visual change)

Produces: `SharedUiColors.onSolid`, `SharedUiTheme.scheme`,
`createSharedUiTheme(overrides, base?)` — consumed by every later milestone.
The light themes must render pixel-identically; the untouched 31 pinned
computed-color assertions in `tests/browser/storybook.spec.ts` are the proof.

- [x] **M1.1 — failing tests first.** In `tests/unit/theme.test.ts` add:

```ts
test("themes carry the onSolid token and a scheme", () => {
  assert.equal(defaultSharedUiTheme.colors.onSolid, "#ffffff");
  assert.equal(junoSharedUiTheme.colors.onSolid, "#ffffff");
  assert.equal(defaultSharedUiTheme.scheme, "light");
  assert.equal(junoSharedUiTheme.scheme, "light");
  // An unrelated override must not drop them (per-key spread guard).
  const overridden = createSharedUiTheme({ colors: { primary: "#123456" } });
  assert.equal(overridden.colors.onSolid, "#ffffff");
  assert.equal(overridden.scheme, "light");
});

test("createSharedUiTheme accepts a base theme to extend", () => {
  const base = createSharedUiTheme({ colors: { primary: "#123456" } });
  const derived = createSharedUiTheme({ colors: { rose: "#654321" } }, base);
  assert.equal(derived.colors.primary, "#123456"); // inherited from base
  assert.equal(derived.colors.rose, "#654321");
  assert.equal(derived.radii.md, base.radii.md);
});
```

Run `npm test` → the two new tests FAIL (`onSolid` undefined / base ignored).

- [x] **M1.2** Implement D1 + D2 in `src/theme.tsx` exactly as specced (token +
      JSDoc, `scheme`, `base` param, both light presets gain
      `onSolid: "#ffffff"`; `defaultSharedUiTheme` gains `scheme: "light"`; the
      juno override object does NOT need `scheme` — it inherits "light" via
      `createSharedUiTheme`). Run `npm test` → green.
- [x] **M1.3** Family A swaps (7 files, table above): replace each `"#fff"`
      with the theme's `onSolid` (each site already has `theme`/`colors` in
      scope; for `badgeStyles.ts` the four arms become
      `color: colors.onSolid`). Update the typography JSDoc (L155–161) and the
      `inverse` doc comment at L29–30 to describe `onSolid`.
- [x] **M1.4** Family B swaps (5 files, table above): replace
      `theme.colors.surface` / `colors.surface` with `…onSolid` at exactly the 13
      listed sites — **only** those; `surface` used as an actual surface fill
      must not be touched. Update the comment at
      `dropdownListStyles.ts` L216–219 ("inverted to white" → "inverted to
      `onSolid`").
- [x] **M1.5** Add the D6 guard comment above `WorkflowNode.tsx` L182:

```tsx
// Deliberately NOT `colors.onSolid`: node chips are a fixed category palette
// (workflowTypes.ts) that does not invert with the theme, and white passes
// ≥4.5:1 on all six fills. See plans/dark-mode.md.
```

- [x] **M1.6 — literal guard test.** In `tests/unit/badge.test.ts`, update the
      AA pairs table: `type Token = keyof SharedUiColors;` and the four solid
      rows become `text: "onSolid"` (drop the `"#fff"` special case and the
      `resolve` ternary). Then create `tests/unit/darkTheme.test.ts` with the
      regression guard (the contrast tables join it in M2):

```ts
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const SRC = fileURLToPath(new URL("../../src", import.meta.url));

// Files allowed to contain literal white, with the exact count, so any new
// occurrence anywhere in src/ fails loudly instead of silently breaking the
// dark themes. Stories are exempt (demo scaffolding).
const WHITE_LITERAL_ALLOWLIST: Record<string, number> = {
  "theme.tsx": 4, // the two light presets' surface + onSolid "#ffffff" pairs
  "skeleton/Skeleton.tsx": 3, // sheen gradient stops stay white by design
  "workflow/WorkflowNode.tsx": 2, // fixed category palette glyphs (see D6)
  "toast/toastStyles.ts": 2, // hover washes rgba(255, 255, 255, 0.14) — drops to 1 in M3.3
  "switch/switchStyles.ts": 2, // knob + knobOn "#fff" — removed entirely in M3.1
};

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      return name === "stories" ? [] : walk(full);
    }
    return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [full] : [];
  });
}

test("no stray literal white in library source (dark-mode guard)", () => {
  const pattern = /"#fff(?:fff)?"|'#fff(?:fff)?'|rgba\(\s*255,\s*255,\s*255/g;
  for (const file of walk(SRC)) {
    const relative = file.slice(SRC.length + 1);
    const count = (readFileSync(file, "utf8").match(pattern) ?? []).length;
    const allowed = WHITE_LITERAL_ALLOWLIST[relative] ?? 0;
    assert.equal(
      count,
      allowed,
      `${relative}: ${count} literal white value(s), expected ${allowed}. ` +
        `Use theme.colors.onSolid (or extend the allowlist with a rationale).`,
    );
  }
});
```

The counts are the _post-M1_ state: `theme.tsx` holds 4 (two `surface`, two
`onSolid` whites); switch and toast keep theirs until their M3 steps, which
also update this allowlist. (Implementation note: the pattern needs the `i`
flag — `junoSharedUiTheme` spells its surface `"#FFFFFF"`, so a case-sensitive
regex would see only 3 in `theme.tsx` and miss uppercase strays elsewhere.) Sanity-check each occurrence against the count
the test reports. Run
`node --import tsx --test tests/unit/darkTheme.test.ts` → green, and
deliberately add a `"#fff"` somewhere to watch it fail, then revert.

- [x] **M1.7** `npm run format && npm run verify` → green. The Playwright
      suite passing untouched **is** the zero-visual-delta proof (31 pinned
      colors + full axe sweep against the empty baseline).
- [x] **M1.8** Commit:

```bash
git add src tests plans
git commit -m "feat(theme): add onSolid token, scheme field, and createSharedUiTheme base param

Replaces every hardcoded inverse-white (\"#fff\" and surface-as-inverse-text)
with the new onSolid token. Light themes render pixel-identically; this is
the groundwork for the dark presets.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### M2 — the dark presets, contrast-gated

Produces: `darkSharedUiTheme`, `junoDarkSharedUiTheme`, `SharedUiScheme` —
exported from `src/theme.tsx` (root and `./theme` subpaths re-export `*`, so
no packaging changes; `tests/unit/packageExports.test.ts` is unaffected).

- [x] **M2.1 — failing tests first.** In `tests/unit/darkTheme.test.ts` add
      (import `darkSharedUiTheme`, `junoDarkSharedUiTheme`, `junoSharedUiTheme`,
      and the `SharedUiColors` type from `"../../src/theme"`; copy the
      `relativeLuminance`/`contrastRatio` helpers from `tests/unit/badge.test.ts`
      L203–226 verbatim):

```ts
const DARK_THEMES = {
  dark: darkSharedUiTheme,
  junoDark: junoDarkSharedUiTheme,
} as const;

test("dark presets are dark-schemed and self-consistent", () => {
  for (const [name, theme] of Object.entries(DARK_THEMES)) {
    assert.equal(theme.scheme, "dark", name);
    // onSolid is the page ink-well: content punched out of a solid fill.
    assert.equal(theme.colors.onSolid, theme.colors.bg, name);
    // controlBorder stays the hand-synced translucent ink tint.
    const inkChannels = theme.colors.ink
      .replace("#", "")
      .match(/../g)!
      .map((pair) => parseInt(pair, 16))
      .join(", ");
    assert.equal(
      theme.colors.controlBorder,
      `rgba(${inkChannels}, 0.27)`,
      name,
    );
  }
  // junoDark extends the juno base: radii carry over.
  assert.deepEqual(junoDarkSharedUiTheme.radii, junoSharedUiTheme.radii);
  assert.equal(darkSharedUiTheme.focusRing, true);
});

test("dark presets hold every documented WCAG pair", () => {
  // (text, fill, floor) triples mirroring the token JSDoc contracts plus the
  // component pairings the light themes already guarantee. 1.4.3 AA = 4.5,
  // 1.4.11 non-text = 3.
  const pairs: [string, keyof SharedUiColors, keyof SharedUiColors, number][] =
    [
      ["primary text", "ink", "surface", 7],
      ["primary text on page", "ink", "bg", 7],
      ["secondary text", "ink2", "surface", 4.5],
      ["muted text", "muted", "surface", 4.5],
      ["muted on page", "muted", "bg", 4.5],
      ["muted on soft fill", "muted", "soft", 4.5],
      ["placeholder", "placeholder", "surface", 4.5],
      ["soft primary badge", "primaryDeep", "primarySoft", 4.5],
      ["soft warning badge", "amberDeep", "amberSoft", 4.5],
      ["soft danger badge", "roseDeep", "roseSoft", 4.5],
      ["solid primary", "onSolid", "primaryDeep", 4.5],
      ["solid warning", "onSolid", "amberDeep", 4.5],
      ["solid danger", "onSolid", "roseDeep", 4.5],
      ["solid neutral", "onSolid", "ink2", 4.5],
      ["solid button", "onSolid", "primary", 4.5],
      ["accent vs surface", "primary", "surface", 3],
      ["switch on-knob vs track", "onSolid", "primary", 3],
      ["switch off-knob vs track", "ink", "border2", 3],
    ];
  for (const [themeName, theme] of Object.entries(DARK_THEMES)) {
    for (const [label, text, fill, floor] of pairs) {
      const ratio = contrastRatio(theme.colors[text], theme.colors[fill]);
      assert.ok(
        ratio >= floor,
        `${themeName} ${label}: ${theme.colors[text]} on ${theme.colors[fill]} ` +
          `= ${ratio.toFixed(2)}:1 (needs >= ${floor}:1)`,
      );
    }
  }
});

test("data-grid fixed dark pill pairs meet AA", () => {
  const pairs = [
    ["blue", "#a8c8ee", "#1c2a3a"],
    ["purple", "#c3b2f0", "#2a2440"],
    ["teal", "#7fd0c0", "#16302b"],
  ] as const;
  for (const [label, text, fill] of pairs) {
    const ratio = contrastRatio(text, fill);
    assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1`);
  }
});
```

(The `contrastRatio` helper only parses hex — that is fine here; every
asserted token is hex. `controlBorder` is deliberately absent: it is the
documented sub-3:1 trade.) Run → FAIL (presets don't exist).

- [x] **M2.2** Add the two presets to `src/theme.tsx` exactly as in D3
      (bottom of the file, after `junoSharedUiTheme` — `junoDarkSharedUiTheme`
      passes `junoSharedUiTheme` as `base`). Export `SharedUiScheme` from D2 if
      not already. Run the dark tests → green.
- [x] **M2.3** In `tests/unit/badge.test.ts`, extend the themes map so the
      existing 12-pair badge matrix gates all four themes:

```ts
const themes = {
  default: defaultSharedUiTheme,
  juno: junoSharedUiTheme,
  dark: darkSharedUiTheme,
  junoDark: junoDarkSharedUiTheme,
};
```

Run `node --import tsx --test tests/unit/badge.test.ts` → green (the
outline rows resolve `ink2`/`*Deep` on the dark `surface`: all ≥4.5 by the
D3 table).

- [x] **M2.4** Update `src/theme.tsx` JSDoc: `amberDeep`, `roseDeep`,
      `controlBorder`, `placeholder` comments say "both shipped themes" → "all
      four shipped themes"; extend the `amberDeep`/`roseDeep` wording: "under
      white text" → "under `onSolid` text (white in the light themes; in the dark
      themes the fill lightens and `onSolid` darkens instead)". Update the M1
      allowlist count for `theme.tsx` in `tests/unit/darkTheme.test.ts` if the
      presets changed the literal-white count (they don't — dark presets contain
      no white).
- [x] **M2.5** `npm run format && npm run verify` → green.
- [x] **M2.6** Commit:

```bash
git add src/theme.tsx tests plans
git commit -m "feat(theme): ship darkSharedUiTheme and junoDarkSharedUiTheme presets

Every documented WCAG 1.4.3/1.4.11 pair is pinned by unit tests across all
four shipped themes.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### M3 — scheme-gated component fixes

Consumes `theme.scheme` (M1) + the dark presets (M2, for tests/stories).
Light themes must stay pixel-identical (all three changes collapse to today's
values when `scheme === "light"`).

- [x] **M3.1** Switch knob per D7: edit `src/switch/switchStyles.ts` L94–115
      (knob off-fill ternary; `knobOn` gains `backgroundColor` + `borderColor:
onSolid`; rewrite the two comments as in the D7 snippet).
      `tests/unit/switch.test.ts` L58 and L101 pin
      `knobOn: \{ borderColor: "#fff", left: knobOn \}` — update both regexes to
      the new `knobOn` shape (e.g.
      `/knobOn: \{\s*backgroundColor: theme\.colors\.onSolid/`). Remove the
      `switch/switchStyles.ts` entry from the M1.6 allowlist (count is now 0).
- [x] **M3.2** Skeleton sheen per D7 (`SKELETON_SHEEN_OPACITY_DARK = 0.12` in
      `skeletonStyles.ts`, scheme-picked in `Skeleton.tsx`).
      `tests/unit/skeleton.test.ts` L26 pins
      `stopOpacity=\{SKELETON_SHEEN_OPACITY\}` — update it to
      `stopOpacity=\{sheenOpacity\}` and add asserts that the component source
      contains the scheme pick (`/SKELETON_SHEEN_OPACITY_DARK/` and
      `/theme\.scheme === "dark"/`).
- [x] **M3.3** Toast hover wash per D7 (`solidHoverWash` const, two sites).
      Drop the `toast/toastStyles.ts` count in the M1.6 allowlist from 2 to 1.
- [x] **M3.4** Data-grid pills per D7 (`resolveOptionColor` dark arms — the
      AA numbers are already pinned by M2.1's pill test). Update the resolver's
      doc comment (L56–60) to mention the scheme-gated pairs.
- [x] **M3.5** `npm run format && npm run verify` → green (still proves
      light-mode zero-delta: pinned colors untouched).
- [x] **M3.6** Commit:

```bash
git add src tests plans
git commit -m "fix(theme): scheme-aware switch knob, skeleton sheen, toast wash, data-grid pills

The four physical-metaphor sites that cannot invert through tokens alone now
branch on theme.scheme; light themes render byte-identically.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### M4 — Storybook dark coverage + browser assertions

Consumes the presets. New stories are additive (new ids) so the 31 pinned
light-theme assertions and the empty axe baseline are untouched; every new
dark story is automatically axe-scanned (including `color-contrast` at AA) by
`tests/browser/a11y.spec.ts` — that sweep is the CI-enforced acceptance test
for the palettes in situ.

- [x] **M4.1** `StorySurface` paints `colors.bg` per D5
      (`src/stories/sharedExamples.tsx` L909–921; import `createSharedUiTheme`
      and `useMemo` there). Run `npm run storybook` and spot-check a light story:
      visually unchanged (bg `#f7f7f3` matches the body CSS).
- [x] **M4.2** Dark swatch stories in `src/stories/theme.stories.tsx`:
      alongside the two existing stories add

```tsx
export const DarkAccountingTheme = () => (
  <StorySurface theme={darkSharedUiTheme}>
    <ThemeSwatch label="darkSharedUiTheme" />
  </StorySurface>
);

export const DarkJunoTheme = () => (
  <StorySurface theme={junoDarkSharedUiTheme}>
    <ThemeSwatch label="junoDarkSharedUiTheme" />
  </StorySurface>
);
```

- [x] **M4.3** One `Dark` export in each high-risk story file, wrapping that
      file's most representative existing example component (the same component
      the file's first story renders — do not build new demo content) in
      `<StorySurface theme={darkSharedUiTheme}>`. Files (12): `badge.stories.tsx`,
      `button.stories.tsx`, `switch.stories.tsx`, `avatar.stories.tsx`,
      `dropdown.stories.tsx` (a **non**-fullscreen solid-variant example — the
      fullscreen `ViewportStage` stories hardcode a light stage),
      `toast.stories.tsx`, `skeleton.stories.tsx`, `heatmap.stories.tsx`,
      `data-grid.stories.tsx` (the select-pills example), `calendar.stories.tsx`,
      `date.stories.tsx`, `typography.stories.tsx` (must include the `inverse`
      tone on a solid fill). Name every export `Dark` (story id =
      `<family>-examples--dark`, per the id = export-name convention). Where a
      story file's example takes no theme prop, wrap it directly — `StorySurface`
      provides the provider.
- [x] **M4.4** Pin three dark computed colors in
      `tests/browser/storybook.spec.ts` (append to the relevant describe blocks,
      reusing the file's existing `backgroundColor()`/color helpers — `onSolid`
      `#141613` = `rgb(20, 22, 19)`):

```ts
test("dark badge solid label uses the onSolid ink-well", async ({ page }) => {
  await page.goto("/iframe.html?id=badge-examples--dark&viewMode=story");
  const label = page.getByText("Solid", { exact: true }).first(); // adjust to the wrapped example's actual solid badge text
  await expect(label).toHaveCSS("color", "rgb(20, 22, 19)");
});

test("dark switch on-knob flips to onSolid over the light track", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=switch-examples--dark&viewMode=story");
  // adjust selector to the wrapped example's checked switch testID
  const knob = page.getByTestId("switch-on").locator("div").last();
  await expect(knob).toHaveCSS("background-color", "rgb(20, 22, 19)");
});

test("dark dropdown solid active row inverts content to onSolid", async ({
  page,
}) => {
  await page.goto("/iframe.html?id=dropdown-examples--dark&viewMode=story");
  // open the dropdown and arrow to the first row, then assert the active label
  // color is rgb(20, 22, 19) — mirror the file's existing solid-variant test.
});
```

These are templates: match each to the actual DOM of the example wrapped in
M4.3 (the existing tests in the same file show the working selector
idioms). Three is the floor, not the ceiling.

- [x] **M4.5** `npm run verify` → green. Expect the a11y sweep to take a few
      extra minutes (14 new stories × fresh context each). If axe reports a
      `color-contrast` violation on a dark story, treat it as a real palette or
      wiring bug — fix the source, never baseline it.
- [x] **M4.6** Manual visual pass (`npm run storybook`): walk all 14 dark
      stories; specifically eyeball the heatmap ramp direction (dark→light),
      modal/popover separation against the dark surface (D6 says shadows stay —
      revisit only if illegible), skeleton shimmer subtlety, and focus rings
      (Tab through the dark button/switch stories).
- [x] **M4.7** Commit:

```bash
git add src/stories tests plans
git commit -m "feat(stories): dark-theme stories with axe + pinned-color coverage

StorySurface now paints the theme bg so dark stories composite correctly
under the axe sweep.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### M5 — docs, native host, release notes

- [ ] **M5.1** `README.md`: under Key Features extend the "Themeable visual
      tokens" bullet with the dark presets; in the `@firna/ui/theme` bullet of
      User-Facing Interface list `darkSharedUiTheme`, `junoDarkSharedUiTheme`,
      `SharedUiScheme`, and the `createSharedUiTheme(overrides, base)` form; add
      the D4 `useColorScheme` consumer snippet to the theming docs. The Storybook
      Deployments story-folder list is unchanged (no new top-level folders).
- [ ] **M5.2** `docs/protocol/shared-ui-components.md` §Theming Contract
      (L38–55): add the dark-mode clause — four shipped presets; `onSolid` is the
      only inverse-content token; solid fills invert on dark; `scheme` exists but
      components must not branch on it except the four documented sites; consumers
      own OS detection.
- [ ] **M5.3** Native Storybook host: in
      `storybook-native/.rnstorybook/preview.tsx` keep the default-theme
      decorator but route it through a module-level constant so flipping the
      on-device host to dark is a one-line edit, and document that in the file:

```tsx
// Flip to darkSharedUiTheme to smoke the native host in dark mode; the
// on-device backgrounds addon does not drive the provider.
const HOST_THEME = defaultSharedUiTheme;
// …<SharedUiThemeProvider theme={HOST_THEME}>
```

Manual on-device smoke (SheetModal + RichTextEditor stories under
`darkSharedUiTheme`) is **deferred** — native Storybook is outside the
verify gate; note it under Follow-ups when ticking this box.

- [ ] **M5.4** Update this plan's **Status** line (delivered milestones, test
      counts from the verify output) and move/annotate the entry in
      `plans/README.md` per house convention.
- [ ] **M5.5** `npm run format && npm run verify` → green. Commit:

```bash
git add README.md docs storybook-native plans
git commit -m "docs(theme): document dark presets, theming contract clause, native host toggle

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Open questions (resolved)

- **Auto OS detection?** No — D4. Presets + documented consumer pattern keeps
  `src/theme.tsx` free of `react-native` imports (node unit runner and
  package-smoke stubs import it directly). A `useSystemSharedUiTheme` hook is
  a follow-up and would need a `useColorScheme` stub in
  `scripts/package-smoke-stubs.mjs`.
- **Global Storybook dark toolbar?** Deferred — a toolbar whose value leaks
  into existing story ids would invalidate the 31 pinned light-theme color
  assertions and double the axe matrix. Per-story `StorySurface theme={…}` is
  the established pattern and gives CI-stable ids.
- **One dark theme or two?** Two — Juno consumers exist (the preset shipped in
  1.x) and the marginal cost is one literal block plus the same test tables.
- **Rewrite `toastSolidToneForeground`?** No — it inverts correctly by
  construction (D6); a "smarter" max-contrast pick would change borderline
  light-mode toasts and break M1's zero-visual-delta invariant.
- **Convert the workflow chip glyphs to `onSolid`?** No — fixed category
  palette; conversion would _cause_ a dark-mode bug (D6).
- **New tokens beyond `onSolid`?** Rejected: `scrim`/`shadow` tokens (dark
  values stay correct as-is), a `knob` token (two-line scheme branch
  suffices), per-tone `on*` tokens (every solid fill passes against the one
  `onSolid` in all four themes — see D3 table).

## Follow-ups (explicitly out of scope)

- `useSystemSharedUiTheme(light, dark)` convenience hook + package-smoke stub.
- Global Storybook theme toolbar with theme-parameterized pinned assertions.
- Harden the drag-select marquee's `${primary}1A` hex-alpha concatenation
  (`src/drag-select/DragSelectableOverlay.web.tsx:50`) against non-6-digit-hex
  theme primaries.
- Manual on-device dark smoke of the native Storybook host (M5.3).
- Dark-tuned `nodeColors` preset for `WorkflowBuilder` consumers who want
  brighter chips on dark.
- `ViewportStage` (fullscreen stories) is hardcoded light (`#eef1ea` +
  `defaultSharedUiTheme`); theme it if a fullscreen dark story is ever needed.
