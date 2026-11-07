# Shared UI Theming Protocol

The theme, contrast, and focus-indicator requirements of the shared UI
library. The [shared UI component protocol](shared-ui-components.md) holds the
package boundary and links every other page.

## Theming Contract

- The library ships a default theme matching the accounting component colors.
- Consumers can override brand-sensitive tokens through a shared theme provider
  or theme creation helper.
- At minimum, the theme must expose primary color tokens:
  `primary`, `primaryDeep`, `primarySoft`, and `primaryBorder`.
- Shared semantic tokens must also cover surface, text, muted text, borders,
  danger, warning, radii, and fonts so copied components do not depend on a
  consumer theme module.
- The warning and danger accents must ship a deep variant (`amberDeep`,
  `roseDeep`, mirroring `primaryDeep`) so a tinted status fill can carry
  AA-contrast accent text; the lighter `amber` / `rose` accents fall below the
  4.5:1 text minimum on their own soft tints.
- Focus rings use the active theme primary color. On web the provider
  serializes it at alpha `0.35` plus the `4px` width through
  `--firna-focus-ring-color` and `--firna-focus-ring-width`; `domBackendCss`
  consumes those variables so static and server-rendered HTML needs no
  hydration to show keyboard focus.
- How a control shows keyboard focus is one `FocusIndicator` value: `ring`
  (the shared glow, the default), `outline` (no glow; the browser's default
  outline, moved onto the visible box when focus and paint live on different
  elements), or `none` (no focus styling at all). The theme's `focusIndicator`
  sets the default and every ring-bearing control's `focusIndicator` prop
  overrides it in both directions; `useFocusRing` takes the same value as its
  `indicator` option and returns the resolved `indicator`.
- `none` must remove every focus-only style the library draws for that control:
  the glow, the browser outline on the focus target and on its visible box, and
  any focus-only decoration such as an input's active border or a resize
  handle's highlight. Explicit state that is not focus — `active`, `invalid`,
  an open popover — still applies. On web the painted box carries
  `data-firna-focus-none="<target>"` (and a split control's target keeps
  `data-firna-focus-target`), with no `data-firna-focus-ring` or
  `data-firna-focus-host` marker. `domBackendCss` strips the outline from that
  focus target with a zero-specificity `:where()` rule, so any focus style the
  caller supplies wins, and only under `forced-colors: none`, so forced-colors
  mode keeps the system outline. A separately focusable action inside the
  control — a clear, suffix, or chip-remove button — keeps its browser outline.
  Native keeps its platform focus behavior; `none` drops only the focus-only
  decoration there.
- `none` transfers the focus indicator to the caller, which must show focus
  some other way (WCAG 2.1 — 2.4.7). Docs must present it for controls embedded
  in a surface that already shows focus, never as a way to hide focus.
- `useFocusRing` must expose its CSS markers in both spellings: `dataSet` props
  (`focusRingProps` / `focusTargetProps`) for Firna primitives and React
  Native hosts, and literal `data-*` props (`focusRingDomProps` /
  `focusTargetDomProps`) for raw DOM elements, so a web-only consumer with no
  primitive to spread onto gets the same glow. Both spellings must serialize in
  static markup, and a `self` host must never emit an `undefined` marker.
- The web theme provider must inject `domBackendCss` on the client, exactly as
  `View`, `Text`, and `TextInput` do (once per document, first in `<head>`),
  so a page that renders only the provider and raw DOM hosts still paints the
  glow. Static and server-rendered HTML keeps emitting `domBackendCss` in
  `<head>` itself; the injection is a client effect and never serializes.
- Only `View` rewrites an inline `boxShadow` into
  `--firna-focus-ring-base-shadow`. A raw DOM host must set that variable for
  a resting shadow instead of `box-shadow`; the docs must say so, because an
  inline `box-shadow` outranks the glow rule while the rule still removes the
  browser outline, leaving no focus indicator at all.
- A `descendant` host's glow and outline reset must follow only its marked
  focus target. Any other focusable element inside the host — an input's clear
  button, a chip-remove button, the wheel date trigger's clear button — keeps
  the browser's own focus outline and leaves the host unlit, so keyboard users
  can tell which action Enter will activate (WCAG 2.1 — 2.4.7).
- The web theme provider serializes those variables on a `display: contents`
  boundary so its HTML is self-contained. SSR/static consumers emit
  `domBackendCss` plus a `:root` variable fallback in `<head>` before their own
  stylesheets; later equal-specificity consumer rules remain authoritative.
- That boundary is a real `<div>`. Consumers must mount the provider around
  block content — an app shell, a page, a panel — never directly inside a
  table row, a list, a paragraph, or SVG, where a `div` is invalid HTML and
  server-rendered output would fail to hydrate. The library never nests the
  provider inside its own components, and the docs must state the constraint.
- Consumer theme overrides must be shallow and predictable; unspecified tokens
  fall back to the default shared theme.
- Dark mode ships as presets, not as a mode flag: four presets are shipped (the
  accounting default and Juno, each light and dark). A theme creation helper
  must accept a base theme to extend so a branded override of a dark preset
  stays dark.
- Inverse content — text and icons on a solid accent fill — must resolve through
  a single `onSolid` token rather than a literal white, so it inverts with the
  palette.
- Solid fills invert on the dark presets: the deep accents become light and
  `onSolid` becomes the page ink-well. This keeps every token relationship
  (deep-on-soft, deep-as-fill, ramp ordering) valid in both schemes, so
  components need no scheme-specific code.
- A `scheme` field states which side of the light/dark divide a palette sits on.
  Components must not branch on it except at genuine physical-metaphor sites
  that cannot invert through tokens — today the switch knob, the skeleton sheen,
  the solid toast's hover wash, and the data grid's fixed pill colors.
- Every documented contrast obligation applies to all four presets.
- The library does not detect the OS color scheme; consumers own that wiring so
  the theme module stays free of platform imports.
