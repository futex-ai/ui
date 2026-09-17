# Pure React DOM backend

Make `@firna/ui` consumable as a plain React library on the web, with no
`react-native-web` at runtime and no `react-native` for types, while every
component file stays shared with the React Native build.

**Status:** M0–M4 delivered. Plan complete; the storybook-native device check
is deferred (no simulator in the delivery environment).

---

## Background

PR #166 put a platform seam at [`src/primitives`](../src/primitives/README.md).
Every component reaches React Native through `reactNative.ts` (native, delegates
to `react-native`) or its `.web` sibling (delegates to `react-native-web`), SVG
through `svg.ts` / `svg.web.tsx`, and icons through `icons.ts` / `icons.web.ts`.
A unit test forbids direct platform imports and diffs the two export lists.

So the React Native version already exists, and the components no longer know
which backend renders them. What is left for a pure React version is the web
side of the seam:

- `reactNative.web.ts` still re-exports `react-native-web`, so a web consumer
  installs it (measured at 334 KB minified / 89 KB gzipped for the exports the
  library uses, React excluded).
- The web module borrows every type from `react-native`, so strict TypeScript
  web consumers still install `react-native` as a dev dependency. Nine emitted
  style declarations under `dist/node` also inline `import("react-native")`
  types (`DimensionValue`, `ColorValue`, `AnimatableNumericValue`).
- Behaviour on web is whatever `react-native-web` decides, including things
  the library works around by hand (it ignores `hitSlop`, `accessibilityState`,
  `accessibilityElementsHidden`, `importantForAccessibility`, and swallows a
  forwarded `onKeyDown` on `TextInput`).

The seam's web surface is narrow. Counting files that import each name from
`../primitives/reactNative` (213 files in total):

| Name                                                                                                                                                       | Files |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `View`                                                                                                                                                     | 135   |
| `Text`                                                                                                                                                     | 81    |
| `StyleSheet`                                                                                                                                               | 66    |
| `Pressable`                                                                                                                                                | 55    |
| `Platform`                                                                                                                                                 | 54    |
| `ScrollView`                                                                                                                                               | 14    |
| `Animated`, `Easing`                                                                                                                                       | 12, 7 |
| `TextInput`                                                                                                                                                | 10    |
| `useWindowDimensions`, `Modal`, `Image`, `AccessibilityInfo`, `PanResponder`, `Keyboard`, `KeyboardAvoidingView`, `InputAccessoryView`, `FlatList`         | ≤ 5   |
| Types only: `ViewStyle`, `TextStyle`, `StyleProp`, `LayoutChangeEvent`, `GestureResponderEvent`, `Insets`, `AccessibilityState`, `ColorValue`, and friends | —     |

Of the heavyweight names, `Modal`, `KeyboardAvoidingView`, `Keyboard`, and
`InputAccessoryView` are reached only from files that already have a `.web`
sibling or are native-only, so on web they are inert. `FlatList` has one shared
caller (`DataGridBody`), `PanResponder` one (`useChartScrub`), the raw responder
props three (`TimelineRuler`, `Scrubber`, `NumberScrubber`), and
`measureInWindow` one (`useDropdownAnchor`).

## Goal

A web consumer installs `react`, `react-dom`, and `lucide-react`, imports
`@firna/ui`, and gets the same components, semantics, and appearance the
`react-native-web` build renders today, verified by the existing browser suite
plus a new visual and ARIA snapshot baseline. Native (`react-native` condition,
Expo, storybook-native) is untouched. Component files are untouched except where
a typecheck under web resolution demands it.

**What a web consumer installs (measured in M4).** `react`, `react-dom`, and
`lucide-react` — three packages, and nothing else. `react-native-web` is gone
from `peerDependencies`, `peerDependenciesMeta`, `keywords` **and**
`devDependencies`; `package-lock.json` no longer names it and
`node_modules/react-native-web` no longer exists in this repo. The one thing that
still wanted it on disk was Storybook's prop docgen, which is now switched off
(see the M4 checklist). The package smoke proves the rest rather than asserting
it: its Vite consumer links exactly those three,
externalises exactly those three, and bundles the packed `dist/node` into its own
chunk, so any surviving import of `react-native`, `react-native-web`,
`react-native-svg` or `lucide-react-native` anywhere in the tree fails the
Rollup resolve. A strict TypeScript consumer still installs nothing extra (M1).

Non-goals: a third build variant, a public "primitives" API for consumers,
RTL runtime switching, or any `react-native-web` feature the library does not
use (`Animated.spring`/`sequence`/`parallel`, colour interpolation, `dataSet`,
`href`, `SectionList`, `RefreshControl`, `Appearance`, `Platform.select`).

## Architecture

The DOM backend is one new folder behind the existing seam. Nothing outside
`src/primitives` learns a new import path.

```
src/primitives/
  reactNative.ts            native: unchanged (values and types from react-native)
  reactNative.web.ts        web: re-exports ./dom, typed with ./types
  types/                    vendored public types, split ~300 lines each
    style.ts                ViewStyle, TextStyle, ImageStyle, StyleProp, DimensionValue,
                            ColorValue, transforms, plus the web-only keys the
                            library currently casts in (cursor, transition,
                            outlineStyle, userSelect, boxShadow)
    events.ts               LayoutChangeEvent, GestureResponderEvent, NativeSyntheticEvent,
                            NativeScrollEvent, FocusEvent, TextInput event payloads
    components.ts           ViewProps, TextProps, PressableProps (+ state), TextInputProps,
                            ScrollViewProps, FlatListProps, ModalProps, ImageProps,
                            AccessibilityRole/State/Value, Insets, PanResponder types
  dom/
    css.ts                  the handful of rules inline styles cannot express, injected
                            once on the client, exported as a string for SSR
    resolveStyle.ts         StyleProp -> CSSProperties (pure, unit-tested)
    domProps.ts             a11y / testID / tabIndex / pointerEvents / forwarded handler
                            mapping and element-per-role choice (pure, unit-tested)
    useLayout.ts            shared ResizeObserver for onLayout; measure / measureInWindow
                            on host refs
    View.tsx  Text.tsx  Pressable.tsx  usePress.ts  useResponder.ts
    ScrollView.tsx  TextInput.tsx  FlatList.tsx  Image.tsx  Modal.tsx
    platform.ts             Platform, useWindowDimensions, AccessibilityInfo, Keyboard,
                            KeyboardAvoidingView, InputAccessoryView, StyleSheet
    animated/               Value, interpolate, timing, loop, Easing, createAnimatedComponent
```

### Decisions

1. **The DOM backend replaces `react-native-web` for every web resolution**,
   including Expo web through Metro. One `.web` file per seam module, no third
   export condition. Both backends render DOM, so the library's elements nest
   inside a host app's `react-native-web` views without trouble; the one known
   seam is that a host app's `<Text>` ancestor context does not reach our
   `Text` (ours renders a `div` where `react-native-web` would render a
   `span`). Documented as a limitation; no consumer does this today.
2. **Inline styles, not atomic CSS.** The library's styles are theme-derived
   objects built with `useMemo`, so per-render translation is cheap, SSR needs
   no stylesheet extraction, and every `toHaveCSS` / `getComputedStyle`
   assertion in the browser suite keeps working. Only four things need real
   CSS rules: `pointerEvents: "box-none"` / `"box-only"` (child selectors),
   `placeholderTextColor` (`::placeholder`), hidden scroll indicators
   (`::-webkit-scrollbar`), and the UA resets for `button` / `input` /
   `textarea` hosts.
3. **Parity target is `react-native-web`'s CSS output, not Yoga.** The web build
   has always laid out with CSS flexbox, so matching its element resets
   (`View`: flex column, stretch, `flex-shrink: 0`, `min-width: 0`,
   `position: relative`, `box-sizing: border-box`; `Text`: `display: inline`,
   `white-space: pre-wrap`, `word-wrap: break-word`) and its style translation
   (`paddingHorizontal` → `padding-inline`, `flex: 1` → `flex: 1`, `flex: -1`
   → `0 1 auto`, transform arrays → `transform`, `fontVariant` arrays →
   `font-variant`, the unitless-number list, `elevation` dropped, `boxShadow`
   passed through, `hairlineWidth = 1`) reproduces today's layout exactly.
4. **Element per role mirrors `react-native-web`**: `button` renders a
   `button` element with `type="button"`, `header` / `heading` an `h1` to `h6`
   by level (default `h1`), `list` a `ul`, `listitem` an `li`, `region` a
   `section`, `label` a `label`, and `none` a `role="presentation"` div; the
   same table applies to `role` and `accessibilityRole`. `tabIndex` rules and
   `disabled` mapping (`aria-disabled` plus the `disabled` attribute on form
   elements) follow the same source so `getByRole`, `toBeDisabled`, and the axe
   sweep see no change.
5. **RN-only accessibility props stay dropped on web**, exactly as
   `react-native-web` drops them (`accessibilityState`, `accessibilityHint`,
   `accessibilityElementsHidden`, `importantForAccessibility`,
   `accessibilityViewIsModal`, `accessible`). The protocol already requires
   components to emit the literal `aria-*` mirror, so adding a translation now
   would only double attributes. `accessibilityLabel`, `accessibilityValue`,
   `accessibilityLiveRegion`, and `accessibilityLevel` map as today.
6. **`hitSlop` remains a no-op on web.** `react-native-web`'s `Pressable`
   ignores it and `Button` already draws its own expander; a new behaviour here
   would change hit areas the browser suite pins.
7. **Vendored types are copied from `react-native`'s public declarations**
   (MIT), trimmed to what the seam exports, so a native consumer's RN-typed
   `style` still flows into a component prop typed with ours. Declarations for
   every consumer already resolve web-first (`types` points at `dist/node`,
   whose `index.d.ts` files are rewritten to `.web` siblings), so emitting them
   from a web-resolution `tsc` pass changes nothing for native consumers except
   removing the `react-native` type dependency.
8. **A web-resolution typecheck becomes a gate.** `tsc` with
   `moduleSuffixes: [".web", ""]` typechecks all 430 source files against the
   web seam. A trial run today reports 12 errors in 10 files, all in the seam's
   own SVG shim typing and one `.web` hook importing types from its native
   sibling, so the gate is cheap to turn green and then keeps the DOM backend's
   types honest for every component.
9. **Snapshots are captured on `react-native-web` first and kept.** The library
   has no visual regression suite. A per-story screenshot plus ARIA snapshot
   sweep, recorded before any backend change, is both the parity harness for
   this plan and a permanent asset afterwards.

### What the DOM backend must honour (measured)

| Feature                                                      | Files | Notes                                                                                                                       |
| ------------------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------- |
| `StyleSheet.create`; style arrays                            | 66/98 | `absoluteFill` ×1, `hairlineWidth` ×3 sites, no `flatten` callers                                                           |
| `paddingHorizontal` / `paddingVertical` / `margin*`          | 31/27 | plus `marginStart` ×2, `gap` ×47, `flex: 1` ×27, transform arrays ×14, `fontVariant` ×7, `boxShadow` ×17, `elevation` ×4    |
| `Platform.OS`                                                | 54    | `=== "web"` ×49, `!== "web"` ×13, `ios` ×4; no `Platform.select`                                                            |
| `accessibilityRole`; `role`; `aria-*`; `accessibilityState`  | 68/51 | roles: button, header, progressbar, none, switch, radio(group), checkbox, alert, toolbar, text, adjustable                  |
| `testID`; `nativeID`; `tabIndex`                             | 128   | `testID` → `data-testid`; `tabIndex` forwarded (50 sites)                                                                   |
| Pressable state (`pressed` / `hovered` / `focused`)          | 21    | function-valued `style`; `onLongPress` ×5, `delayLongPress` ×4, `onPressIn/Out` ×4, `onHoverIn/Out` ×8                      |
| Forwarded DOM handlers on `View` / `Pressable`               | 34    | `onKeyDown` ×67 sites, `onContextMenu` ×50, `onPointerDown` ×24, `onMouseEnter` ×3, `onFocus`/`onBlur` ×49 files            |
| `numberOfLines`                                              | 34    | `1` ×34, `2` ×3, `3` ×1, dynamic ×4; `selectable` ×15; no `ellipsizeMode`                                                   |
| `pointerEvents` prop                                         | 30    | `none` ×35, `box-none` ×11, `auto` ×1; in styles ×3                                                                         |
| `onLayout`                                                   | 11    | reads `nativeEvent.layout.width` / `.layout`                                                                                |
| `nativeEvent` fields                                         | 43    | `layout`, `locationX/Y`, `pageX`, `contentOffset`, `contentSize`, `layoutMeasurement`, `selection`, `key`                   |
| `ScrollView`                                                 | 13    | `horizontal`, `contentContainerStyle`, hidden indicators, `onScroll`, `onMomentumScrollEnd`, `scrollTo`, `scrollEnabled`    |
| `TextInput`                                                  | 9     | `onChangeText`, `onChange`, `multiline`, `selection` / `onSelectionChange`, `onContentSizeChange`, `onKeyPress`,            |
|                                                              |       | `onSubmitEditing`, `readOnly` / `editable`, `placeholderTextColor`, `autoFocus`, `inputMode`, `spellCheck`, `focus()`       |
| `Animated`                                                   | 13    | `Value`, `timing`, `loop`, `interpolate` (numbers, `deg`, `%`), `setValue`, `start` / `stop`, `Animated.View`,              |
|                                                              |       | one `createAnimatedComponent` (animated `strokeDashoffset` on an SVG rect); `Easing.linear` / `ease` / `quad` / `inOut`     |
| Responder system                                             | 4     | `onStartShouldSetResponder`, `onMoveShouldSetResponder`, `onResponderGrant/Move/Release`; `PanResponder` with `dx/dy/moveX` |
| `FlatList`                                                   | 1     | `getItemLayout` fixed rows, `onEndReached(Threshold)`, `scrollToIndex`, `ListFooterComponent`, `keyExtractor`               |
| `Modal`, `Image`, `useWindowDimensions`, `AccessibilityInfo` | ≤ 4   | `Image` is `source={{ uri }}` + style; `AccessibilityInfo` is reduce-motion only on web                                     |

### Consumer-facing changes

- Web peers shrink to `react`, `react-dom`, `lucide-react`. `react-native-web`
  is no longer installed, aliased, or typed. `react-native` is no longer needed
  for declarations.
- Everything else (component API, story ids, test ids, roles, theme) is
  unchanged. Bundle size drops by roughly the measured `react-native-web` core.
- The DOM backend injects its few CSS rules once on the client; SSR consumers
  can render `domBackendCss` from the root export to avoid a first-paint gap.

### Risks

- **Style fidelity.** Mitigated by copying `react-native-web`'s translation
  table rather than designing one, a pure unit-tested `resolveStyle`, and the
  screenshot sweep captured before the switch.
- **Pressable semantics** (keyboard activation, hover on touch devices, cancel
  on drag-out, long press). Mitigated by mirroring `react-native-web`'s
  `PressResponder` rules and the 342-test browser suite, which exercises every
  interactive component through Playwright's real pointer and keyboard.
- **Accessibility drift.** The axe sweep runs against every story with an empty
  baseline; element-per-role parity keeps it empty.
- **DataGrid virtualization.** One caller; its browser tests assert row counts
  and infinite-scroll behaviour, so a regression is caught.
- **Rollback.** The change is confined to `src/primitives`; restoring the
  previous `reactNative.web.ts` from git restores `react-native-web` in one file.

## Milestones

Per `AGENTS.md`, after each milestone's checks pass: `git add -A`, commit with
a Conventional Commits message, push the branch, then run `cargo xtask review`
so an AI reviewer checks the local diff against `origin/main`. Review findings
are reported, not auto-fixed.

### M0 — Parity baseline on the current backend

At the end: a visual and ARIA snapshot suite exists, recorded against the
`react-native-web` build, and `npm run verify` is green. No backend code has
changed, so every later milestone is measured against this.

- [x] `tests/browser/snapshots.spec.ts`: discover stories from Storybook's
      `/index.json` like the axe sweep does, and for each story assert
      `toHaveScreenshot` (fixed 900×600 viewport, `deviceScaleFactor: 1`,
      `animations: "disabled"`, reduced-motion emulation, a small
      `maxDiffPixelRatio`) and `toMatchAriaSnapshot` on the story root.
      Rooted at `body` rather than `#storybook-root`: ten stories present a
      modal, menu or toast through a portal and mark the story root
      `aria-hidden`, so the root snapshots as an empty tree; the two roots are
      identical for the other 316.
- [x] Per-story opt-outs for stories that cannot be made deterministic (the
      loader and skeleton loops, live clocks), listed in one place with a reason.
      `tests/browser/snapshotOptOuts.ts` holds three, all ARIA-only: reduced
      motion plus `animations: "disabled"` already stills the animated border,
      the skeleton sheen and the status-dot pulse, and `toHaveScreenshot`
      re-shoots until the remaining `Animated` loops land on the recorded frame,
      so no story opts out of its screenshot. No story reads a live clock: a
      probe rendered every story twice with `page.clock.setFixedTime` set eight
      months apart and found no rendered text that moved.
- [x] Commit the Linux baselines under `tests/browser/snapshots.spec.ts-snapshots/`;
      document `npx playwright test snapshots --update-snapshots` and that
      baselines are Linux-only (CI and this VM), in `README.md`'s testing notes.
      326 PNGs (5.7 MB) and 323 ARIA snapshots (0.3 MB), 7.6 MB on disk.
- [x] Shard the sweep like `a11ySharding.ts` so runtime stays inside the
      existing Playwright budget. Four shards, 4.4 minutes wall clock;
      `SNAPSHOT_UPDATE=1` collapses it to one serial recording sweep.
- [x] Bundle Storybook's fonts (`.storybook/fonts.ts`) so the baselines are
      portable across Linux machines rather than tied to the recording host.
      None of the three stacks that reach the screen — `theme.fonts.sans`,
      `theme.fonts.mono`, and react-native-web's reset for text a component
      leaves unstyled — names a family that exists on Linux, so every run was
      being rasterized by whatever fontconfig offered. Inter covers the sans
      stack, JetBrains Mono is registered as `Menlo`, the same Inter files are
      registered as `Segoe UI` (the first resolvable name in the RNW reset), and
      two Noto subsets cover the arrows, maths relations and symbols none of
      those faces carry. A probe confirms all 14 (family, weight) pairs painted
      across the 326 stories resolve to a bundled face. ✨ and 🚀 had no bundled
      coverage and were replaced in the two stories that rendered them.
- [x] `npm run verify` and `cargo xtask check` green; commit, push, review.
      Unit 1149, browser 347 (two consecutive full runs), build, package smoke
      and Storybook build all green on this tree; `cargo xtask check` runs the
      same `verify` script.

### M1 — Own the types; web-resolution typecheck; RN-free declarations

At the end: the web seam no longer imports a single type from `react-native`,
`dist/node/**/*.d.ts` contain no `react-native` reference, strict web consumers
drop their `react-native` dev dependency, and a `typecheck:web` gate runs in
`verify`. Runtime still delegates to `react-native-web`.

- [x] Add `src/primitives/types/`, copied from `react-native`'s public
      declarations and trimmed to the seam's export list; include the web-only
      style keys currently cast in via `as unknown as ViewStyle` (`cursor`,
      `transition`, `outlineStyle`, `userSelect`, `boxShadow`).
      Split thirteen ways to stay inside the ~300-line file target:
      `layout.ts` + `style.ts` (colours, dimensions, `ViewStyle` / `TextStyle` /
      `ImageStyle`, `StyleProp`), `events.ts`, `accessibility.ts`,
      `hostInstance.ts`, `components.ts` (`View` / `Text` / `Pressable`),
      `lists.ts`, `textInput.ts`, `overlays.ts`, `animatedValue.ts` +
      `animated.ts`, `gestures.ts`, `platform.ts`, `index.ts`. Each carries
      Meta's MIT attribution, and every union is copied whole rather than
      trimmed: Decision 7 is an assignability contract, so ours may be wider
      than React Native's but never narrower, and
      `tests/unit/primitiveTypesCompat.test.ts` compiles a probe against the
      real `react-native` declarations to keep it that way (it catches both a
      narrowed union and an event whose `currentTarget` is missing members,
      which is why `hostElement.ts` mirrors `ReactNativeElement` in full).
      Beyond the five keys above the web additions are
      `backgroundImage` / `backgroundSize`, the `transition-*` longhands,
      `position: fixed | sticky`, the CSS cursors, `outlineStyle: "none"` and
      the intrinsic `DimensionValue` sizes — the full set the 16 casts in 12
      files need, so M4 can drop them. The casts themselves stay for now.
- [x] `reactNative.web.ts` re-exports the vendored types and annotates every
      value export with them; casts from `react-native-web` values live only in
      this file. `reactNative.ts` keeps re-exporting `react-native`'s types.
      No cast was needed in the end: `react-native-web.d.ts` now declares the
      seventeen values the seam imports, typed from `./types`, instead of
      `export * from "react-native"`.
- [x] `tsconfig.web.json` (`moduleSuffixes: [".web", ""]`) and a
      `typecheck:web` script added to `verify`; fix the existing errors
      (`Svg` `style` prop and container `children` typing in `svg.web.tsx`;
      move `useAutoGrowTextarea`'s shared types into `autoGrowTextareaTypes.ts`
      so the `.web` hook stops importing its own sibling).
      The 12 errors the trial reported were an artefact: TypeScript applies
      `moduleSuffixes` inside each extension (`svg.web.ts`, `svg.ts`, then
      `svg.web.tsx`), so `svg.web.tsx` was shadowed by `svg.ts` and the pass was
      checking `react-native-svg`. Renaming the native file to `svg.tsx` fixes
      the resolution and leaves five real errors: the `AutoGrowTextarea` import
      cycle (moved to `autoGrowTextareaTypes.ts`) and three uses of
      `react-native-svg` spellings the DOM shim did not type (`originX`,
      `originY`, `rotation`, an array `strokeDasharray`), now declared on
      `SvgChildProps` with no runtime change. A unit test pins the extension
      ordering for every `.web` pair so the trap cannot come back.
- [x] Build emits `dist/node` declarations from the web-resolution pass
      (`tsconfig.build.web.json`, `emitDeclarationOnly`) before
      `prepare-node-esm.mjs` rewrites specifiers; native JS and `dist/**` are
      unchanged. The pass emits to `.dist-web-types`, which the script overlays
      onto the `dist` copy that becomes `dist/node`. It also drops every native
      module a `.web` sibling shadows from that copy — dead weight the rewriter
      never links to, and the last place (`primitives/reactNative.d.ts`) a
      `react-native` reference survived.
- [x] A new `tests/unit/primitiveTypesCompat.test.ts` gates Decision 7: a
      probe mixing `react-native`'s types with the vendored ones has to
      compile, in both the value direction (an RN style/prop/event assigns into
      ours) and the callback direction (a handler typed with RN's event
      satisfies one of our props). It skips when `react-native` is absent.
- [x] A new `tests/unit/distDeclarations.test.ts` asserts that no file under
      `dist/node` matching `*.d.ts` references `react-native` (skipped with a
      message when `dist` is absent, so `npm test` runs on a clean tree) and
      that the shadowed native modules are gone; the package smoke's types
      consumer drops its `react-native` type stub (its `react` stub grew the
      five type names the vendored declarations use). Because `npm test` runs
      before `npm run build`, on a clean checkout that skip is the only run the
      guard gets, so a `test:dist` script re-runs the same file in `verify`
      immediately after the build — the run that actually checks something
      (added during M2).
- [x] Remove the "strict TypeScript consumers also need `react-native`" caveat
      from `README.md`; update `src/primitives/README.md`.
- [x] `npm run verify` and `cargo xtask check` green; snapshots unchanged;
      commit, push, review. Unit 1153, both typechecks, build, the
      `react-native` grep on `dist/node`, package smoke, Storybook build and
      the full browser suite (347) all green; no snapshot re-recorded.

### M2 — DOM backend: styles, View, Text, Pressable, and the small modules

At the end: `View`, `Text`, `Pressable`, `StyleSheet`, `Platform`,
`useWindowDimensions`, `AccessibilityInfo`, `Keyboard`, `KeyboardAvoidingView`,
`InputAccessoryView`, `Image`, and `Modal` come from `src/primitives/dom`; the
remaining names still delegate to `react-native-web`; the browser suite, axe
sweep, and snapshot sweep are green against the DOM backend for these
primitives.

- [x] `dom/resolveStyle.ts`: flatten `StyleProp` (arrays, falsy entries),
      translate keys and values per Decision 3, and unit-test the table
      (logical paddings, `flex`, transforms, `fontVariant`, unitless numbers,
      `%` strings, `hairlineWidth`, `elevation` dropped, `boxShadow` kept).
      The pipeline is transcribed rather than designed: per style object
      `preprocess` (shadow folding, React Native's spellings renamed, arrays
      stringified), then the merge, then `inline()`'s left-to-right resolution
      of the logical properties, then `createReactDOMStyle(_, true)`'s
      shorthand expansion. Splitting the tables into `dom/styleTables.ts` keeps
      both files inside the line target. `tests/unit/domResolveStyle.test.ts`
      pins twelve groups, including the two places the merge order matters
      (a longhand always beats its shorthand; a physical property always beats
      its logical alias) and the pass-through of the web-only keys M1 typed.
- [x] `dom/domProps.ts`: element-per-role, `role` / `accessibilityRole`
      mapping, `accessibilityLabel` / `Value` / `LiveRegion` / `Level` to
      `aria-*`, `testID` → `data-testid`, `nativeID` / `id`, `tabIndex` and
      `focusable` rules, `disabled` mapping, `pointerEvents` → data attribute,
      and the forwarded-handler allowlist (keyboard, mouse, pointer, focus,
      touch, click, context menu). Unit-test the pure mapping.
      Tables in `dom/domPropTables.ts`. Two details worth naming because the
      ARIA baselines depend on them: `aria-disabled={false}` and
      `aria-hidden={false}` are dropped rather than written, and a native tab
      stop (`button`, `a`, `input`, …) is left without a `tabIndex` instead of
      being given `0`. `accessibilityValue` is dropped, which is what that
      backend did — the library already emits the literal `aria-value*` mirror
      beside it. `tests/unit/domProps.test.ts` pins nine groups.
- [x] `dom/css.ts`: the `box-none` / `box-only` child rules, `::placeholder`
      colour via a CSS variable, scrollbar hiding, and host resets; inject once
      with `useInsertionEffect` behind a `typeof document` guard; export
      `domBackendCss` from the root for SSR.
      The `View` and `Text` element resets live here too, as classes: that is
      the priority `react-native-web` gave its own classic reset class, so
      every translated inline style still outranks them, and it keeps the
      resets out of 135 files' worth of inline styles. `domBackendCss` is a
      seam pair (`domBackendCss.ts` is `""` on native) so the root export stays
      shared.
- [x] `dom/useLayout.ts`: one shared `ResizeObserver` driving `onLayout` with
      `{ x, y, width, height }`, first callback after mount; `measure` and
      `measureInWindow` attached to host refs so `useRef<View>` callers keep
      working.
      The measurement maths is that backend's `UIManager`: `x` / `y` relative
      to the parent node, `width` / `height` from the offset box, `left` /
      `top` in page coordinates, and the same deferral, which is also what
      keeps a callback that resizes its own subtree from looping the observer.
      `measureLayout` and `setNativeProps` are attached as well, so the
      vendored `HostInstance` is satisfied in full.
- [x] `dom/View.tsx` and `dom/Text.tsx` with `react-native-web`'s resets, the
      text-ancestor context (`div` root, `span` nested, inherited font and
      colour), `numberOfLines` (single-line ellipsis; multi-line clamp),
      `selectable`, `dir="auto"` on root text.
      `Text` layers its styles in that backend's order, which is why
      `selectable` and `onPress` outrank the caller's `style`.
- [x] `dom/usePress.ts` and `dom/Pressable.tsx` on pointer events: `pressed` /
      `hovered` / `focused` state to function-valued `style` and `children`,
      `onPressIn` / `onPressOut` / `onPress` / `onLongPress` with
      `delayLongPress`, cancel on pointer-cancel, keyboard
      activation (Enter always; Space on `button` hosts or `role="button"`,
      preventing page scroll), `disabled`, cursor and `touch-action` styles;
      `hitSlop` accepted and ignored (Decision 6).
      Two rules were measured rather than assumed, and both are reproduced:
      the press activates after 50 ms (`PressResponder`'s
      `DEFAULT_PRESS_DELAY_MS`, which `Pressable` never overrides), and a
      release that outran that delay fires `onPressIn` and `onPressOut` back to
      back. There is deliberately no drag-out deactivation — that backend has
      none, and the browser suite pins its behaviour. The rest of a gesture is
      watched on the document rather than through pointer capture, so nothing
      else on the page is retargeted mid-press, and an inner press marks the
      native event so an enclosing `Pressable` stands down (the responder
      system's "deepest node wins", without the responder system).
      `dom/useHover.ts` keeps the hover containment too: entering a nested
      pressable ends its ancestors' hover and leaving restores it.
- [x] `dom/platform.ts`: `Platform` (`OS: "web"`, `select` reading `web` then
      `default`), `useWindowDimensions` (resize-driven, SSR-safe),
      `AccessibilityInfo` (`isReduceMotionEnabled` and its change listener from
      `matchMedia`; other members inert), `Keyboard` (`dismiss` blurs the
      active element; listeners return a `remove`), `KeyboardAvoidingView` as a
      `View`, `InputAccessoryView` as a fragment, `StyleSheet` (`create`,
      `flatten`, `compose`, `absoluteFill`, `absoluteFillObject`,
      `hairlineWidth`).
      `StyleSheet` and the two keyboard views are their own files
      (`dom/StyleSheet.ts`, `dom/KeyboardViews.tsx`) to stay inside the line
      target. `useWindowDimensions` reads the visual viewport first, as that
      backend's `Dimensions` does, and publishes through
      `useSyncExternalStore` so the snapshot identity is stable.
- [x] `dom/Image.tsx` (`<img>` from `source.uri`, `resizeMode` → `object-fit`,
      `accessibilityLabel` → `alt`) and `dom/Modal.tsx` (portal to `body`,
      `visible` gate, Escape → `onRequestClose`, `transparent`).
      This is the one place the backend is visibly better than what it
      replaced: `react-native-web`'s `resolveAssetUri` re-encodes an
      `image/svg+xml;utf8` data URI that is already percent-encoded, so every
      sample thumbnail in the timeline and video-editor stories failed to load
      and the M0 baselines recorded empty frames. A real `img` renders them.
      Ten baselines move because of it; see the milestone's snapshot note.
- [x] Storybook story `Primitives/Examples` exercising the backend directly
      (press states, clamped text, `box-none` pass-through, layout callbacks,
      nested text inheritance) with Playwright coverage in
      `tests/browser/primitives.spec.ts`.
      Six stories (`Press`, `Layout`, `ClampedText`, `NestedText`,
      `PointerEvents`, `ImageAndRoles`) and eight specs, covering hover, press,
      long press, keyboard activation and focus, the one- and multi-line
      clamps, text inheritance and the `div` / `span` split, the `box-none`
      pass-through by hit test, `onLayout`'s reported box, the `img` element
      and its accessible name, and `h1` / `h2` / `h3` by heading level.
- [x] Update `tests/unit/primitives.test.ts` for the new module shape (mirrored
      export lists still enforced; the "delegates to `react-native-web`"
      assertion narrowed to the names not yet ported).
      It now diffs both import lists by name — six from `react-native-web`,
      twelve from `./dom` — checks the trimmed `react-native-web.d.ts` against
      the same two lists, and asserts `dom/responderEvents.ts` is the only file
      in the backend that reaches for that package.
- [x] `npm run verify` and `cargo xtask check` green; snapshot diffs reviewed
      and only intentional ones re-recorded; commit, push, review.
      Lead-run gates: format, 1178 unit tests, both typechecks, build,
      `test:dist`, package smoke, static Storybook, and the full browser suite
      (357 tests) all green on the mixed backend.

**Snapshot review (M2).** 316 of the 326 screenshots and all 323 ARIA
snapshots match the M0 baselines byte for byte. Ten screenshots were re-recorded
— the timeline and video-editor stories that render `Image`
(`timeline-examples--dark` / `--densities` / `--editing` / `--sequence` /
`--zooming`, `video-editor-examples--full-editor-compact` / `--full-editor-dark`
/ `--full-editor-light` / `--media` / `--preview`) — and in every one the only
changed pixels are inside an image frame that was previously blank because
`react-native-web` double-encoded the sample SVG data URI (see the deviations
below). No ARIA snapshot changed and the axe baseline stays empty.

The sweep's own wait for a story to mount went from 10s to 30s at the same
time. It swallows its own timeout, so on a cold Vite dev server the first story
a shard opened could lose the race against the on-demand transform and be
screenshotted as Storybook's "preparing story" spinner — a false diff that hit
`animatedborder-examples--dark` in three of six parallel sweeps and never in a
serial one. Nothing else in the harness changed.

**Deviations from `react-native-web` (M2).** Everything else is a
transcription; these are the places the backend deliberately differs, all of
them invisible to the snapshot and ARIA baselines except the first.

- **`Image` renders a real `<img>` and does not re-encode its source.** That
  backend's `resolveAssetUri` runs `encodeURIComponent` over the remainder of a
  `data:image/svg+xml;utf8,` URI, which is a bug for a URI that is already
  percent-encoded (the sample frames in the timeline and video-editor stories)
  and is why their M0 baselines recorded empty frames. It is _not_ a bug for a
  consumer passing raw, unencoded SVG markup containing `#` colours or quotes —
  that re-encode is what made such a URI usable, and those consumers now have to
  encode it themselves.
- **`aria-atomic` is forwarded.** `createDOMProps` reads
  `ariaAtomic != null ? ariaActiveDescendant : accessibilityAtomic`, a
  copy-paste bug that dropped the attribute; `ToastLiveRegion` sets it and never
  got it. Playwright's ARIA snapshots do not render the attribute, so no
  baseline moves.
- **`required` is set from the resolved value.** The same class of copy-paste
  bug one branch further down: `createDOMProps` wrote
  `domProps.required = accessibilityRequired`, so a field asking with the
  literal `aria-required` — which is what `InputFrame` does — got
  `aria-required` and no native `required` attribute. `applyFormSemantics` now
  reads the resolved value (the literal spelling winning over the React Native
  one, as the `readOnly` branch above it does) and writes `required` only when
  it is `true`, on `input` / `select` / `textarea`. Chromium does not style
  `:required` by default and the library renders no `<form>`, so no screenshot
  moves; the accessibility tree already reported the field as required from
  `aria-required`, so no ARIA snapshot moves either. Fixed in M4;
  `tests/unit/domProps.test.ts` pins both spellings, the `false` case and the
  non-form element.
- **`shadowColor` keeps a named colour as written.** `shadowOpacity` is applied
  to the `black` default, to `white`, to hex (3/4/6/8), `rgb()` / `rgba()` and
  `hsl()` / `hsla()` by multiplying the existing alpha, exactly as
  `normalizeColor` does; any other named colour passes through instead of being
  resolved through React Native's 150-entry colour table. No component uses the
  `shadow*` props.
- **`Modal` is minimal**: a portal with `role="dialog"`, `aria-modal`,
  `z-index: 9999` and Escape on `keydown`; no focus trap and no `animationType`.
  Every caller has a `.web` sibling, so nothing renders it on web.
- **The element resets are a class injected at the start of `<head>`**, rather
  than the atomic CSS that backend compiled per style. Same priority (below
  every inline style, above the UA sheet), same insertion point, far fewer
  declarations on the 135 files' worth of views.
- **`onLayout` is observed from the render that has a handler**, not only from
  the one that mounted the node (review follow-up 2 above). That backend's
  `useElementLayout` observed on mount alone, so a handler attached later never
  fired; nothing in the library depended on the omission.
- **No RTL.** Only the left-to-right half of `PROPERTIES_I18N` is implemented
  (a plan non-goal), along with `href` / `hrefAttrs`, `inert`, `Image`'s
  `defaultSource` / `blurRadius` / `tintColor` / loader statics, and
  `Pressable`'s `testOnly_*` props, none of which the seam's types expose.

**Interim state (M2).** `Animated` still comes from `react-native-web`, so
`Animated.View` is still that backend's `View`; the thirteen files that use it
render its reset class inside ours. They nest without trouble and M3 replaces
`Animated` outright. `dom/responderEvents.ts` borrows that package's responder
system for the same reason — `PanResponder` computes its gesture state from the
`touchHistory` that system maintains — and its deep import
(`react-native-web/dist/modules/useResponderEvents/index.js`) resolves under a
bundler but not under plain Node ESM, because that `dist` uses extensionless
relative specifiers internally; a bundler-less Node SSR consumer is therefore
unsupported until M3 removes the import. Both are resolved in M3.

**Review follow-ups (fixed in M3).** Three findings from the AI review of the
M2 commit, all addressed alongside the M3 work:

1. `Pressable` ignored `unstable_pressDelay` (`types/components.ts`). React
   Native maps that prop onto `delayPressIn`; `react-native-web` reads
   `delayPressIn` directly and never sees the `unstable_` spelling, so a caller
   using the documented React Native name got the default 50 ms delay.
   `dom/Pressable.tsx` now maps `unstable_pressDelay` onto the machine's
   `delayPressIn` and passes `delayPressIn` / `delayPressOut` through when a
   caller spells them that backend's way, the explicit one winning.
   `tests/unit/domPress.test.ts` pins all three paths: a zero delay activates
   on the down event, a custom delay defers activation, and the keyboard path
   skips the delay entirely.
2. `dom/useLayout.ts`'s observe effect depended on `[observer, ref]` only, so a
   `View` that mounted with no `onLayout` and was given one later was never
   observed — a faithful transcription of the same defect in
   `useElementLayout`. The effect now also depends on whether a handler exists
   (a boolean, not its identity), so a late handler starts observation and a
   removed one stops it; `observe` is idempotent, so nothing else changes. The
   new `Primitives/Layout` story and `tests/browser/primitives.spec.ts`'s
   "an onLayout attached after mount still measures" cover it, and it is listed
   in the M2 deviations below.
3. The M2 checklist line said press cancels "on pointer-cancel or drag-out",
   contradicting the paragraph below it. The wording is corrected; the
   implementation and its browser test were already right.

### M3 — DOM backend: ScrollView, TextInput, Animated, responders, FlatList

At the end: nothing in `src/primitives` imports `react-native-web`;
`react-native-web.d.ts` is deleted; the full suite is green on the DOM backend.

- [x] `dom/ScrollView.tsx`: overflow container plus content wrapper
      (`contentContainerStyle`), `horizontal`, `scrollEnabled`, hidden
      indicators, `onScroll` with `contentOffset` / `contentSize` /
      `layoutMeasurement`, `onContentSizeChange` via the shared observer,
      `onMomentumScrollEnd` fired from `scrollend` with a timer fallback, ref
      methods `scrollTo`, `scrollToEnd`, `getScrollableNode`; unsupported
      native props (`keyboardShouldPersistTaps`, `nestedScrollEnabled`,
      `decelerationRate`, `snapToInterval`) accepted and ignored as today.
      Transcribed from `exports/ScrollView/index.js` plus its `ScrollViewBase`,
      so the rhythm is theirs: the first scroll of a gesture always reports,
      later ones only once `scrollEventThrottle` has elapsed, and a 100 ms
      trailing timer reports the resting position. There is **no**
      `onMomentumScrollEnd`: that backend passed the prop to a plain `View`, so
      it never fired on web, and `DateWheel` already debounces `onScroll`
      instead — firing it now would double-commit its value. `pagingEnabled`
      and `stickyHeaderIndices` are implemented (both are one style each:
      `scroll-snap-type` on the scroller with `scroll-snap-align` on the
      children, `position: sticky` on the named ones);
      `keyboardShouldPersistTaps`, `nestedScrollEnabled`, `decelerationRate`,
      `snapToInterval` and `snapToOffsets` are accepted and dropped by the
      `View`'s prop allowlist, exactly as before. An `on-drag`
      `keyboardDismissMode` calls `Keyboard.dismiss` from the scroll handler,
      which is where `_handleScroll` called `dismissKeyboard`. The whole
      `ScrollResponder` handler set is installed (`scrollViewResponder.ts`), not
      just the three that decide the claim: a scroller that has observed a
      scroll refuses `onResponderTerminationRequest`, so a child cannot steal
      the gesture mid-scroll, and `onResponderRelease` blurs the focused field
      on a tap that did not scroll — the rule is
      `shouldDismissKeyboardOnRelease` in `scrollViewHost.ts`, pinned by
      `tests/unit/domScrollView.test.ts`. Only touch gestures reach any of it,
      because the lock is claimed from `onScrollShouldSetResponder`, which
      answers `isTouching`. The one thing left out is the commented-out
      keyboard-eating branch of `onStartShouldSetResponderCapture`, which that
      backend had already disabled. The scroll event's measurements are lazy
      getters (`dom/scrollEvents.ts`), so `Timeline` reading
      `layoutMeasurement.width` after the fact still sees the live viewport.
      The imperative methods are assigned onto the DOM element, as that backend
      assigned them, so `dropdownScroll.ts` can call `getScrollableNode()` and
      then `getBoundingClientRect` / `scrollBy` on the result.
- [x] `dom/TextInput.tsx`: `input` / `textarea` by `multiline`, `onChangeText`
      and `onChange` with `nativeEvent.text`, controlled `selection` and
      `onSelectionChange`, `onContentSizeChange`, `onKeyPress`
      (`nativeEvent.key`), `onSubmitEditing` with `submitBehavior`,
      `editable` / `readOnly`, `placeholderTextColor`, `numberOfLines` → rows,
      `autoFocus`, `inputMode`, `spellCheck`, `caretHidden`; ref `focus`,
      `blur`, `clear`, `isFocused`, `setNativeProps({ selection })`. A
      forwarded `onKeyDown` is delivered (an improvement over
      `react-native-web`; `useDocumentKeyCapture` keeps working unchanged).
      The pure half — the `type` / `inputMode` table, the forwarded-prop
      allowlist and the defaults — is `dom/textInputProps.ts`, pinned by
      `tests/unit/domTextInput.test.ts`. The base style is a class in `css.ts`
      like the `View` and `Text` resets, so an inline style still wins, and the
      `::placeholder` rule is attached to **every** field rather than only the
      ones naming a colour: that backend applied its placeholder class
      unconditionally, so a field with no `placeholderTextColor` resolves an
      empty `var()` and its placeholder inherits the input's own colour instead
      of the browser's grey. The ref is the element itself, which is what lets
      `useAutoGrowTextarea.web.ts` read `scrollHeight` and write `style.height`
      on the object the seam types as a `TextInput`; `setNativeProps` is
      overridden there so `{ selection }` moves the caret (the rich-text
      editor's only imperative path) instead of being written as an attribute,
      and `setSelection(start, end)` — which the vendored `TextInputInstance`
      declares and that backend never implemented — now exists.
- [x] `dom/animated/`: `Value` (`setValue`, listeners, `interpolate` for
      numeric, `deg`, and `%` outputs with `extend` and `clamp`), `timing`
      (rAF driver, `duration`, `easing`, `useNativeDriver` ignored), `loop`
      (`iterations`, `resetBeforeIteration`), `Easing` (`linear`, `ease`,
      `quad`, `cubic`, `bezier`, `in`, `out`, `inOut`),
      `createAnimatedComponent` applying animated `style` and animated
      attribute props by direct host mutation, `Animated.View` / `Text`. Pure
      math unit-tested.
      Ten files, each the vendored React Native module with the native-driver
      half removed rather than stubbed: `nodes.ts` (`AnimatedNode`,
      `AnimatedWithChildren`), `AnimatedValue.ts`, `AnimatedInterpolation.ts`
      over a pure `interpolation.ts`, `AnimatedStyle.ts` (with
      `AnimatedTransform`), `AnimatedProps.ts`, `TimingAnimation.ts`,
      `compositions.ts` (`timing`, `loop`, `sequence`, `parallel`, `delay`),
      `Easing.ts` over `bezier.ts`, and `createAnimatedComponent.tsx`.
      The one correction to the checklist as written: values are **not** pushed
      into the host node. That backend's JS driver re-renders the wrapped
      component on every frame through a `useReducer`, which is what lets an
      animated value drive an ordinary SVG attribute (`AnimatedBorder`'s
      `strokeDashoffset`) as easily as a style, and it is the model all
      thirteen consumers were written against. `collapsable: false` is still
      forwarded and `style` is still handed on as an array, so
      `AnimatedBorder`'s `DomSafeRect` and `svg.web.tsx`'s array-flattening
      both stay exactly as they are — no consumer file changed.
      `tests/unit/domInterpolation.test.ts` and `tests/unit/domEasing.test.ts`
      pin the maths, including the loader wave's 25-point ranges and its
      0.001-wide sawtooth wrap.
- [x] `dom/responder/` and `PanResponder.create`: the grant / move /
      release / terminate subset over pointer events with pointer capture,
      `GestureResponderEvent` payloads (`locationX/Y`, `pageX/Y`, `timestamp`,
      `touches`), and `gestureState` (`dx`, `dy`, `moveX`, `moveY`, `x0`, `y0`,
      `vx`, `vy`, `numberActiveTouches`); wired into `View` only when a
      responder prop is present. Gesture math unit-tested.
      Ported whole rather than reduced, because `PanResponder` reads the touch
      history the system maintains: `ResponderSystem.ts`, `utils.ts`,
      `touchHistory.ts`, `createResponderEvent.ts`, `eventTypes.ts`,
      `useResponderEvents.ts`, `touchHistoryMath.ts` and `PanResponder.ts`.
      That means the document-level listener model (bubble-phase mouse, touch,
      `contextmenu`, `select` and `selectionchange`; capture-phase `blur` and
      `scroll`; window `blur`), the `__reactResponderId` node tagging,
      `composedPath` event paths, capture-then-bubble negotiation, the
      transfer / termination-request protocol, every termination rule, the
      touch/mouse emulation guard and `trackedTouchCount` — not pointer capture,
      which that backend never used. `dom/responderEvents.ts` and its deep
      import are deleted. `useResponderEvents` is wired into `View`, `Text`,
      `TextInput` and `ScrollView` exactly where that backend wired it, and
      `ScrollView` registers its own `onStartShouldSetResponder`,
      `onStartShouldSetResponderCapture` and `onScrollShouldSetResponder` as
      `ScrollViewBase` did. `usePress` deliberately stays on its own pointer
      machine: see the deviations.
- [x] `dom/FlatList.tsx` on the backend `ScrollView`: fixed-height windowing
      when `getItemLayout` is given (overscan, `onEndReached` with threshold,
      `scrollToIndex` with `onScrollToIndexFailed`), plain mapping otherwise;
      `ListFooterComponent`, `contentContainerStyle`, `keyExtractor`, `role` /
      `style` pass-through. Window math unit-tested; DataGrid's browser tests
      are the integration check.
      Split three ways: `flatListWindow.ts` (pure —
      `computeWindowedRenderLimits`, `elementsThatOverlapOffsets`,
      `constrainToItemCount`, the defaults and the key extractor),
      `useFlatListWindow.ts` (scroll metrics, measured frames, the 50 ms
      batcher and the hi-pri path) and `FlatList.tsx` (the render and the
      imperative methods). The batching chain is the load-bearing part:
      `componentDidUpdate` scheduled another batch after every render, which is
      what grows the window past the first ten rows when nothing else is
      happening, and an effect with no dependency array reproduces it. That is
      what lands the 1000-row DataGrid story on exactly the 105 body rows its
      ARIA baseline records (`windowSize` 21 × a 380 px viewport = 4180 px of
      content, which is rows 0–104 at 40 px each) and the infinite-scroll story
      on its 30; `tests/unit/domFlatListWindow.test.ts` pins both numbers
      before the browser ever runs. `constrainToItemCount` is
      `_constrainToItemCount`'s expression verbatim, `clamp` included: the value
      being clipped is the last index a full batch can start at, and the
      window's own `first` is the upper bound, so shrinking the data pulls the
      window back by a whole batch rather than by a row.
- [x] Remove every `react-native-web` import from `reactNative.web.ts`; delete
      `src/primitives/react-native-web.d.ts`; `tests/unit/primitives.test.ts`
      asserts the web seam imports only `react`, `react-dom`, and `./dom`.
      The seam's only imports are now `./dom` and `./types`, which the test
      asserts as an exact list, and it also walks all of `src/primitives` for a
      `react-native-web` import and checks the declaration shim is gone.
      `scripts/package-smoke-stubs.mjs` no longer stubs the package at all
      (nothing under `dist/node` imports it); the React stub grew `useReducer`
      and `Children`, which the animated and scroll primitives use.
- [x] Storybook stories for the new primitives, with browser coverage:
      `Primitives/Scrolling` (a fixed scroller with an offset and content-size
      readout plus `scrollTo` / `scrollToEnd` buttons, and a 200-row windowed
      list with a rendered-count readout), `Primitives/Interaction` (a
      single-line and a multiline field with readouts for `onChangeText`,
      `onKeyPress`, `onSelectionChange`, `onSubmitEditing` and
      `onContentSizeChange`; an animated value driven by `setValue` with its
      interpolations on screen; a `PanResponder` box reporting `dx` / `dy` and
      a raw-responder box reporting `locationX` / `locationY`) and
      `Primitives/Layout` (the late-`onLayout` case from review follow-up 2).
      Every one is at rest when it mounts, so all six new baselines are
      deterministic. `tests/browser/primitivesScrolling.spec.ts` (6) and
      `primitivesInteraction.spec.ts` (8) drive them.
- [x] `npm run verify` and `cargo xtask check` green; snapshot diffs reviewed;
      commit, push, review.
      Lead-run gates: format, 1227 unit tests, both typechecks, build,
      `test:dist`, package smoke, static Storybook, and the full browser suite
      (372 tests, run twice) all green on the pure DOM backend; zero existing
      baselines changed, twelve new ones for the six new primitive stories. One
      earlier browser run saw two axe shards abort with "execution context was
      destroyed" on `chart-barchart--percent` and `chart-parttowhole--donut`
      while a Storybook build ran concurrently on the same machine; a clean
      re-run passed, so it is recorded as a load-induced crash of the sweep's
      page, not a violation.

**Snapshot review (M3).** All 326 screenshots and 323 ARIA snapshots recorded
before the port match byte for byte on the fully ported backend; a hash of the
baseline directory before and after the sweep differs only by the twelve files
the six new stories added. The axe sweep stays empty.

One story had to be earned. `modal-examples--bottom-sheet-web-modal` rendered
3768 pixels (1% of the frame) differently at first: everything below the sheet's
text field sat one device row higher. It was not a style difference — a full
`getComputedStyle` dump of every element under the dialog, the field's
`getClientRects`, its `::placeholder` pseudo-element, and the exact font string
it resolves to are byte-identical between the two backends, and the whole body's
HTML differs only in class names. It was the compositing hint: see the first
deviation below.

**Deviations from `react-native-web` (M3).**

- **`ScrollView` does not set `transform: translateZ(0)`.** The rest of that
  backend's base style is transcribed as written. The hint is a zero
  translation with no visual meaning, paired with the
  `-webkit-overflow-scrolling: touch` that modern Chromium no longer parses,
  and it promotes the scroller to its own compositing layer. Inside that layer
  Chromium snaps fractionally-positioned content one device row differently
  from the recorded baseline — deterministically, on every run, and
  deterministically not at all once the hint is removed. That is the whole of
  the bottom-sheet diff above; dropping the hint leaves every other baseline
  untouched. Why the same declaration behaves differently when that backend
  compiles it into an atomic class was not established: moving ours into a
  stylesheet class reproduced the shift exactly, so class-versus-inline is not
  the variable.
- **`onMomentumScrollEnd` is never called**, as on that backend: it is passed
  through as a plain `View` prop. `DateWheel` is written around that and would
  double-commit if it started firing.
- **`submitBehavior` is honoured.** That backend read only the deprecated
  `blurOnSubmit` and ignored the modern spelling. Ours falls back to
  `submitBehavior` when `blurOnSubmit` is absent, as React Native defines it.
  Every combination the library actually passes behaves exactly as before; the
  one case that differs (a multiline field with `submitBehavior="submit"`) is
  `NativeRichTextBlock`, which has a `.web` sibling and never renders here.
- **`TextInput` delivers a forwarded `onKeyDown`** (an improvement the plan
  already called for) and adds `setSelection(start, end)`, which the vendored
  `TextInputInstance` declares. The `stopPropagation` that backend called from
  its own key handler is kept, so `useDocumentKeyCapture`'s capture-phase
  listener still sees every key first and nothing is handled twice.
- **`Animated` is the JS driver only.** `useNativeDriver` is accepted and
  ignored, and `spring`, `decay`, `ValueXY`, `AnimatedColor`, `Animated.event`,
  `stagger`, `diffClamp` and the arithmetic nodes are not ported — the plan
  lists them as non-goals. `Animated.Text` exists because the seam's type
  declares it; no component uses it.
- **An animated `timing` target is a snapshot, not live tracking.** The seam's
  `TimingAnimationConfig` lets `toValue` be a node; React Native routes that
  through `AnimatedTracking` so the target keeps following it for the whole run.
  `AnimatedTracking` is not ported — the node is read once, when the animation
  starts, and the run then behaves exactly like a numeric target. No consumer
  passes a node today.
- **Colour interpolation covers the forms `dom/shadowColor.ts` parses.**
  `colorToRgba` normalises `black`, `white`, three-, four-, six- and
  eight-digit hex and `rgb()` / `rgba()`; any other named colour passes through,
  so two output values have to be written in the same notation. No component
  interpolates a colour.
- **`usePress` keeps its own pointer machine** rather than registering with the
  ported responder system. That backend's `PressResponder` does register, and
  doing the same would remove `usePress`'s `CLAIMED` flag, but M2's machine is
  what the 357-test browser suite and every recorded baseline already pin, and
  nothing in the library nests a `Pressable` inside a `PanResponder` except the
  dropdown placement playground — where both behaviours produce the same
  result, because that frame claims on `onStartShouldSetResponder` and the
  Pressables inside it are not responder nodes at all. The timeline's drag uses
  raw DOM pointer events on web (`useTimelineDrag.web.ts`), not the responder
  system, so the "a drag does not also fire the clip's press handler" contract
  does not run through this code path on web either. The one behavioural consequence
  worth naming: because `Pressable` is not a responder node, a `PanResponder`
  ancestor that claims the gesture mid-press (a chart scrub started over a mark)
  no longer resets the child's `pressed` state the way that backend's
  `RESPONDER_TERMINATED` signal did — the press ends on the pointer release
  instead. `onPress` is unchanged either way, because it fires from the DOM
  `click` and `PanResponder`'s `onClickCapture` never reached the DOM on either
  backend.
- **`PanResponder` has no `InteractionManager` handle.** On that backend it is
  a bookkeeping counter no consumer reads, and the seam's `PanResponderInstance`
  type exposes only `panHandlers`. The 250 ms `onClickCapture` click-cancel
  after a pan is kept, because that one is observable.
- **`FlatList` renders one contiguous window.** That backend's `CellRenderMask`
  also keeps the first `initialNumToRender` cells mounted while scrolled away
  and renders up to three regions with spacers between them. At rest the two
  agree cell for cell, which is what the DataGrid baselines pin; scrolled, ours
  simply drops the retained head. `SectionList`, `inverted`, `refreshControl`,
  `onViewableItemsChanged` and `debug` are not ported.

**Review follow-ups (fixed in M4).** One finding from the AI review of the M3
commit:

1. `dom/domProps.ts`'s `applyFormSemantics` assigned the native `required`
   attribute from `props.accessibilityRequired` rather than from the resolved
   value, so `InputFrame`'s literal `aria-required` (`src/input/InputFrame.tsx`)
   produced `aria-required` with no `required` on the `<input>`. It was a
   verbatim transcription of `react-native-web` 0.21.2's own bug
   (`createDOMProps/index.js`, `domProps.required = accessibilityRequired`),
   one branch below the `aria-atomic` copy-paste bug M2 already corrected. The
   branch now mirrors the `readOnly` branch above it — resolved value, literal
   spelling winning — and writes `required` only for a real `true` on a form
   element. `tests/unit/domProps.test.ts` grew a case group for the literal
   spelling, the `accessibility*` spelling, `aria-required={false}` (ARIA
   attribute, no native one), the two spellings disagreeing, and a non-form
   element. Listed in the M2 deviations above beside `aria-atomic`; no baseline
   moved.

### M4 — Drop react-native-web; packaging, docs, cleanup

At the end: `react-native-web` is gone from `package.json` peers, the package
smoke proves a web consumer needs only `react`, `react-dom`, and
`lucide-react`, and the docs describe the pure React build.

- [x] `package.json`: remove `react-native-web` from `peerDependencies`,
      `peerDependenciesMeta`, keywords, and `devDependencies` if no Storybook
      or test path still needs it; `npm install` to refresh the lockfile.
      Removed from all four, and the devDependency took Storybook's prop
      docgen with it. No source file imports the package: the repo-wide grep
      finds 146 mentions in 103 files and every one is prose — 67 transcription
      attributions inside `src/primitives/dom`, the rest behaviour notes in
      component files, tests and scripts, with `tests/unit/primitives.test.ts`
      _grepping_ for the string rather than importing it. Storybook's Vite config
      declares no alias for it and no `.storybook` module imports it. Removing
      the devDependency nevertheless broke `npm run storybook:build`,
      deterministically, with a Babel parse error inside
      `node_modules/react-native/index.js` — and the culprit was worth chasing:
      `@storybook/react-vite`'s react-docgen importer
      (`dist/_node-chunks/react-docgen-*.js`, `getReactDocgenImporter`) resolves
      specifiers with react-docgen's own extension list, which has **no `.web`
      preference**, so every story importing `../primitives/reactNative` is
      followed to the native file and on to `react-native`, whose Flow-typed
      `index.js` react-docgen cannot parse. It only survives by rewriting that
      path to `react-native-web/dist/index.js` when the package is on disk,
      guarded by `existsSync`. Rather than keep a package installed to feed a
      mis-resolution, docgen is switched off: `typescript: { reactDocgen: false }`
      in `.storybook/main.ts`, with the reason written beside it. Nothing here
      reads docgen output — no story declares `args` or `argTypes`, there is no
      autodocs tag, no `.mdx` file and no `addon-docs`, and both suites render
      `iframe.html`, where a props table is never built. With the option off the
      static build is green and the package is gone: `npm install` dropped 19
      packages, `node_modules/react-native-web` no longer exists, and
      `package-lock.json` does not contain the string anywhere.
      `storybook-native` is untouched, including its `package-lock.json` — which
      still records the old peer list for its `file:..` parent and will refresh
      on its next install.
- [x] `scripts/package-smoke.mjs` and `package-smoke-stubs.mjs`:
      `WEB_PEER_DEPENDENCIES` becomes `lucide-react`, `react`, `react-dom`;
      remove the `react-native-web` stub; the Vite consumer proves the bundle
      builds with those three alone.
      The stub was already gone (M3); the `react-native-web` regex left its
      `rollupOptions.external`, so an import of the package would now fail the
      Rollup resolve instead of being silently externalised. The consumer was
      already bundling the library rather than externalising it — only the three
      peers are listed — and a new `assertViteBundledLibrary` step pins that:
      it reads the emitted chunks, requires the DOM backend's own
      `firna-ui-dom-backend` style id to be inside them, and refuses a bundle
      that still imports `@firna/ui`. The stubs file's comment now says the peer
      entry is gone rather than just the stub.
- [x] `.storybook/main.ts`: drop the comment about `react-native-web`; keep the
      `.web` extension preference.
      The comment now says the `.web` files render through the library's own DOM
      backend; the extension list is unchanged. The file also gained
      `typescript: { reactDocgen: false }` — see the `package.json` item above for
      why, and the comment beside it for the short version.
- [x] Optional cleanup enabled by M1's types: remove the
      `as unknown as ViewStyle` / `TextStyle` casts (16 sites in 12 files) now
      that the web-only keys are typed; the native typecheck must stay green
      (vendored keys are absent from `react-native`'s types, so keep the casts
      where a shared file feeds a style straight into a native prop).
      **Measured: none can go.** All 19 sites were removed at once (each
      rewritten as a real `ViewStyle` / `TextStyle` annotation, never as a
      widening or a dropped annotation). `typecheck:web` passed with every cast
      gone — M1's vendored keys do cover the whole set. `typecheck` then
      reported an error for all 19, because `tsconfig.json` includes
      `src/**/*.ts(x)`, so a `.web` file is type-checked under native resolution
      too and sees `react-native`'s narrower style types there. The four `.web`
      files are therefore no better off than the shared ones. Per key:
      `position: "fixed" | "sticky"` (7 sites — `dataGridLayout.ts:22`,
      `DragSelectableOverlay.web.tsx:118`, `DropdownWebLayer.tsx:42`,
      `Kanban.tsx:39`, `webModalFrameStyles.ts:7`, `SortableList.tsx:59`,
      `ToastViewport.web.tsx:26`), `transition` (4 —
      `SegmentedControl.tsx:267` / `:273`, `WebModalFrame.web.tsx:48`,
      `Switch.tsx:102`), `outlineStyle: "none"` (3 — `focusRing.ts:6` / `:10` /
      `:133`; RN's union is `solid | dotted | dashed`), `cursor` (3 —
      `sortableListStyles.ts:36` / `:37`, `DataGridResizeHandle.tsx:21`; RN's
      `CursorValue` is `auto | pointer`), `backgroundImage` /
      `backgroundSize` (1 — `workflowColors.ts:93`) and
      `width: "max-content"` (1 — `dropdownContentWidthStyle.web.ts:6`). Two
      keys the plan expected to block are _not_ a problem on RN 0.85:
      `boxShadow` takes a string, and `userSelect` exists — `focusRing.ts:133`
      fails on `outlineStyle` alone. Every cast was restored byte for byte and
      both typechecks are green again.
- [x] Docs: `README.md` installation and export-map sections, the Package
      Boundary bullet in `docs/protocol/shared-ui-components.md`,
      `src/primitives/README.md` (module table: web → DOM), and the component
      READMEs that mention `react-native-web` (button, loader, timeline,
      video-editor).
      `README.md`'s web bullet now names the three peers as the whole set and
      drops the "still listed as an optional peer" caveat; the Expo bullet drops
      `react-native-web` from the install list and says an Expo web app keeps
      whatever copy its own code needs. The export-map bullet adds that the
      package declares no `react-native-web` peer and that `test:package` proves
      the three-peer build. `docs/protocol/shared-ui-components.md` drops it
      from the Package Boundary dependency list and says the web build depends
      on neither `react-native` nor `react-native-web`; the progress contract's
      rule is kept and reattributed to "the web backend", because dropping
      `accessibilityValue` is Decision 5 and still true. The remaining sweep was
      comment-only across 26 source files, 8 unit tests, 3 browser specs and 2
      Storybook config files: behaviour that is unchanged was reattributed to
      "the web backend", and the one behaviour that changed —
      `TextInput` now delivers a forwarded `onKeyDown` — was rewritten to the
      real reason the document-capture hooks still exist (a field's key events
      do not propagate) in `keyboardNavigation.ts`, `DropdownSelector.tsx`,
      `useComboboxNavigation.ts`, `dataGridEditorHooks.ts`, `DateWheel.tsx` and
      `CalendarMonth.tsx`. Two stale statements inside the seam itself were
      corrected: `reactNative.ts` said the `.web` sibling delegates to
      `react-native-web`, and `types/index.ts` said `reactNative.web.ts` types
      values re-exported from it. Transcription attributions ("transcribed from
      `react-native-web` 0.21.2") were left alone everywhere, as were the
      completed plans under `plans/`.
- [x] `storybook-native`: no dependency change (Expo web keeps its own
      `react-native-web`; the library's `.web` files now resolve to the DOM
      backend there too). Run a native story and an Expo web story on a device
      or simulator; record the result here. Deferred if no device is available.
      No dependency changed. **Device check deferred: this environment has no
      device or simulator** — `xcrun`, `adb` and `emulator` are all absent on
      this Linux x86_64 VM, so neither an iOS simulator nor an Android emulator
      can be started, and Expo web would only re-exercise the DOM backend the
      browser suite already covers. The native path is unchanged by this
      milestone: `svg.tsx` and `icons.ts` are byte-identical, `reactNative.ts`
      changed only in its doc comment, and the only behavioural code change in
      M4 is inside `dom/`, which Metro never resolves on iOS or Android.
- [x] `npm run verify` and `cargo xtask check` green; commit, push, review.
      Lead-run gates on the final tree: format, 1228 unit tests, both
      typechecks, build, `test:dist`, package smoke (three peers, library
      bundled), static Storybook with docgen off, and the full browser suite
      (372 tests) all green; `dist/node` has no `react-native-web` import; the
      baseline directory digest is unchanged from M3 (673 files). The lead also
      retired the last "React Native Web" wording in the package description,
      the README intro, the protocol doc's Purpose/Kanban/Button lines, and
      `DropdownWebLayer.tsx`'s modal note (now describes the DOM backend's
      fixed, inset-zero dialog container).

**Review follow-ups (open, from the AI review of the M4 commit).** Two findings,
both verbatim transcriptions of `react-native-web` 0.21.2 behaviour rather than
regressions, reported here with recommendations and deliberately not applied
(AGENTS.md: review findings are reported, not auto-fixed):

1. `PanResponder.panHandlers.onClickCapture` — the click suppressor that keeps a
   finished mouse pan from also activating whatever is under the cursor — is
   never attached, because `dom/domPropTables.ts`'s `FORWARDED_HANDLERS` (like
   `react-native-web`'s `forwardedProps.clickProps`) has no `onClickCapture`,
   and `createDomProps` drops unlisted handlers. Upstream has the same gap: its
   vendored `PanResponder` builds the handler and its `View` discards it. In
   this library only `useChartScrub` (a public hook with no internal web
   consumer) and the `Primitives/Interaction` Gestures story spread
   `panHandlers` on web; `useTimelineDrag` has a `.web` sibling that does not
   use `PanResponder`. Recommendation: add `onClickCapture` to the forwarded
   handler table, list it in the M3 deviations as a deliberate improvement,
   and pin it with a browser test that drags the Gestures story's pan box and
   asserts no press fires on release.
2. `createResponderEvent` hard-codes `nativeEvent.altKey` and
   `nativeEvent.ctrlKey` to `false` while forwarding `metaKey` and `shiftKey`,
   exactly as `react-native-web`'s `createResponderEvent.js` does, although the
   vendored `NativeMouseEvent` type declares all four. No library gesture reads
   either modifier. Recommendation: forward `domEvent.altKey === true` and
   `domEvent.ctrlKey === true`, add a unit case to `tests/unit/domResponder.test.ts`,
   and note the deviation.

## Estimate

| Milestone | Scope                                          | Estimate    |
| --------- | ---------------------------------------------- | ----------- |
| M0        | Snapshot sweep on the current backend          | 1–2 days    |
| M1        | Vendored types, web typecheck, RN-free `.d.ts` | 3–4 days    |
| M2        | Styles, View, Text, Pressable, small modules   | 2–3 weeks   |
| M3        | ScrollView, TextInput, Animated, responders    | 1–1.5 weeks |
| M4        | Packaging, docs, cleanup                       | 2–3 days    |
| Total     |                                                | 5–7 weeks   |

M2 carries the risk: style translation and press semantics are where parity is
won or lost, and the snapshot sweep from M0 is what makes that measurable.
M1 pays for itself on its own (it removes the `react-native` type dependency)
even if the later milestones are paused.

## Open questions

- Snapshot scope: resolved in M0 by recording every story. The 326 stories cost
  6.0 MB of PNGs at 1× on a 900×600 viewport plus 0.3 MB of ARIA snapshots, near
  the 8 MB estimate, and a curated subset would have left gaps in exactly the
  components most likely to drift.
- Whether `domBackendCss` should also ship as a `.css` file export for
  bundlers that prefer static CSS. Not needed by the current consumers.
