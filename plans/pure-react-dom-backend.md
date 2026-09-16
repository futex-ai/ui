# Pure React DOM backend

Make `@firna/ui` consumable as a plain React library on the web, with no
`react-native-web` at runtime and no `react-native` for types, while every
component file stays shared with the React Native build.

**Status:** M0–M1 delivered. M2–M4 not started.

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
      five type names the vendored declarations use).
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

- [ ] `dom/resolveStyle.ts`: flatten `StyleProp` (arrays, falsy entries),
      translate keys and values per Decision 3, and unit-test the table
      (logical paddings, `flex`, transforms, `fontVariant`, unitless numbers,
      `%` strings, `hairlineWidth`, `elevation` dropped, `boxShadow` kept).
- [ ] `dom/domProps.ts`: element-per-role, `role` / `accessibilityRole`
      mapping, `accessibilityLabel` / `Value` / `LiveRegion` / `Level` to
      `aria-*`, `testID` → `data-testid`, `nativeID` / `id`, `tabIndex` and
      `focusable` rules, `disabled` mapping, `pointerEvents` → data attribute,
      and the forwarded-handler allowlist (keyboard, mouse, pointer, focus,
      touch, click, context menu). Unit-test the pure mapping.
- [ ] `dom/css.ts`: the `box-none` / `box-only` child rules, `::placeholder`
      colour via a CSS variable, scrollbar hiding, and host resets; inject once
      with `useInsertionEffect` behind a `typeof document` guard; export
      `domBackendCss` from the root for SSR.
- [ ] `dom/useLayout.ts`: one shared `ResizeObserver` driving `onLayout` with
      `{ x, y, width, height }`, first callback after mount; `measure` and
      `measureInWindow` attached to host refs so `useRef<View>` callers keep
      working.
- [ ] `dom/View.tsx` and `dom/Text.tsx` with `react-native-web`'s resets, the
      text-ancestor context (`div` root, `span` nested, inherited font and
      colour), `numberOfLines` (single-line ellipsis; multi-line clamp),
      `selectable`, `dir="auto"` on root text.
- [ ] `dom/usePress.ts` and `dom/Pressable.tsx` on pointer events: `pressed` /
      `hovered` / `focused` state to function-valued `style` and `children`,
      `onPressIn` / `onPressOut` / `onPress` / `onLongPress` with
      `delayLongPress`, cancel on pointer-cancel or drag-out, keyboard
      activation (Enter always; Space on `button` hosts or `role="button"`,
      preventing page scroll), `disabled`, cursor and `touch-action` styles;
      `hitSlop` accepted and ignored (Decision 6).
- [ ] `dom/platform.ts`: `Platform` (`OS: "web"`, `select` reading `web` then
      `default`), `useWindowDimensions` (resize-driven, SSR-safe),
      `AccessibilityInfo` (`isReduceMotionEnabled` and its change listener from
      `matchMedia`; other members inert), `Keyboard` (`dismiss` blurs the
      active element; listeners return a `remove`), `KeyboardAvoidingView` as a
      `View`, `InputAccessoryView` as a fragment, `StyleSheet` (`create`,
      `flatten`, `compose`, `absoluteFill`, `absoluteFillObject`,
      `hairlineWidth`).
- [ ] `dom/Image.tsx` (`<img>` from `source.uri`, `resizeMode` → `object-fit`,
      `accessibilityLabel` → `alt`) and `dom/Modal.tsx` (portal to `body`,
      `visible` gate, Escape → `onRequestClose`, `transparent`).
- [ ] Storybook story `Primitives/Examples` exercising the backend directly
      (press states, clamped text, `box-none` pass-through, layout callbacks,
      nested text inheritance) with Playwright coverage in
      `tests/browser/primitives.spec.ts`.
- [ ] Update `tests/unit/primitives.test.ts` for the new module shape (mirrored
      export lists still enforced; the "delegates to `react-native-web`"
      assertion narrowed to the names not yet ported).
- [ ] `npm run verify` and `cargo xtask check` green; snapshot diffs reviewed
      and only intentional ones re-recorded; commit, push, review.

### M3 — DOM backend: ScrollView, TextInput, Animated, responders, FlatList

At the end: nothing in `src/primitives` imports `react-native-web`;
`react-native-web.d.ts` is deleted; the full suite is green on the DOM backend.

- [ ] `dom/ScrollView.tsx`: overflow container plus content wrapper
      (`contentContainerStyle`), `horizontal`, `scrollEnabled`, hidden
      indicators, `onScroll` with `contentOffset` / `contentSize` /
      `layoutMeasurement`, `onContentSizeChange` via the shared observer,
      `onMomentumScrollEnd` fired from `scrollend` with a timer fallback, ref
      methods `scrollTo`, `scrollToEnd`, `getScrollableNode`; unsupported
      native props (`keyboardShouldPersistTaps`, `nestedScrollEnabled`,
      `decelerationRate`, `snapToInterval`) accepted and ignored as today.
- [ ] `dom/TextInput.tsx`: `input` / `textarea` by `multiline`, `onChangeText`
      and `onChange` with `nativeEvent.text`, controlled `selection` and
      `onSelectionChange`, `onContentSizeChange`, `onKeyPress`
      (`nativeEvent.key`), `onSubmitEditing` with `submitBehavior`,
      `editable` / `readOnly`, `placeholderTextColor`, `numberOfLines` → rows,
      `autoFocus`, `inputMode`, `spellCheck`, `caretHidden`; ref `focus`,
      `blur`, `clear`, `isFocused`, `setNativeProps({ selection })`. A
      forwarded `onKeyDown` is delivered (an improvement over
      `react-native-web`; `useDocumentKeyCapture` keeps working unchanged).
- [ ] `dom/animated/`: `Value` (`setValue`, listeners, `interpolate` for
      numeric, `deg`, and `%` outputs with `extend` and `clamp`), `timing`
      (rAF driver, `duration`, `easing`, `useNativeDriver` ignored), `loop`
      (`iterations`, `resetBeforeIteration`), `Easing` (`linear`, `ease`,
      `quad`, `cubic`, `bezier`, `in`, `out`, `inOut`),
      `createAnimatedComponent` applying animated `style` and animated
      attribute props by direct host mutation, `Animated.View` / `Text`. Pure
      math unit-tested.
- [ ] `dom/useResponder.ts` and `PanResponder.create`: the grant / move /
      release / terminate subset over pointer events with pointer capture,
      `GestureResponderEvent` payloads (`locationX/Y`, `pageX/Y`, `timestamp`,
      `touches`), and `gestureState` (`dx`, `dy`, `moveX`, `moveY`, `x0`, `y0`,
      `vx`, `vy`, `numberActiveTouches`); wired into `View` only when a
      responder prop is present. Gesture math unit-tested.
- [ ] `dom/FlatList.tsx` on the backend `ScrollView`: fixed-height windowing
      when `getItemLayout` is given (overscan, `onEndReached` with threshold,
      `scrollToIndex` with `onScrollToIndexFailed`), plain mapping otherwise;
      `ListFooterComponent`, `contentContainerStyle`, `keyExtractor`, `role` /
      `style` pass-through. Window math unit-tested; DataGrid's browser tests
      are the integration check.
- [ ] Remove every `react-native-web` import from `reactNative.web.ts`; delete
      `src/primitives/react-native-web.d.ts`; `tests/unit/primitives.test.ts`
      asserts the web seam imports only `react`, `react-dom`, and `./dom`.
- [ ] `npm run verify` and `cargo xtask check` green; snapshot diffs reviewed;
      commit, push, review.

### M4 — Drop react-native-web; packaging, docs, cleanup

At the end: `react-native-web` is gone from `package.json` peers, the package
smoke proves a web consumer needs only `react`, `react-dom`, and
`lucide-react`, and the docs describe the pure React build.

- [ ] `package.json`: remove `react-native-web` from `peerDependencies`,
      `peerDependenciesMeta`, keywords, and `devDependencies` if no Storybook
      or test path still needs it; `npm install` to refresh the lockfile.
- [ ] `scripts/package-smoke.mjs` and `package-smoke-stubs.mjs`:
      `WEB_PEER_DEPENDENCIES` becomes `lucide-react`, `react`, `react-dom`;
      remove the `react-native-web` stub; the Vite consumer proves the bundle
      builds with those three alone.
- [ ] `.storybook/main.ts`: drop the comment about `react-native-web`; keep the
      `.web` extension preference.
- [ ] Optional cleanup enabled by M1's types: remove the
      `as unknown as ViewStyle` / `TextStyle` casts (16 sites in 12 files) now
      that the web-only keys are typed; the native typecheck must stay green
      (vendored keys are absent from `react-native`'s types, so keep the casts
      where a shared file feeds a style straight into a native prop).
- [ ] Docs: `README.md` installation and export-map sections, the Package
      Boundary bullet in `docs/protocol/shared-ui-components.md`,
      `src/primitives/README.md` (module table: web → DOM), and the component
      READMEs that mention `react-native-web` (button, loader, timeline,
      video-editor).
- [ ] `storybook-native`: no dependency change (Expo web keeps its own
      `react-native-web`; the library's `.web` files now resolve to the DOM
      backend there too). Run a native story and an Expo web story on a device
      or simulator; record the result here. Deferred if no device is available.
- [ ] `npm run verify` and `cargo xtask check` green; commit, push, review.

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
