# Platform primitives

The single seam between the library and its platform packages. Components
never import `react-native`, `react-native-svg`, `lucide-react-native`,
`react-native-web`, or `lucide-react` directly; they import from here, and a
unit test (`tests/unit/primitives.test.ts`) fails the build if one does.

| Module             | Native resolves to      | Web (`.web`) resolves to    | RNW form    |
| ------------------ | ----------------------- | --------------------------- | ----------- |
| `reactNative.ts`   | `react-native`          | `dom/`                      | native file |
| `svg.tsx`          | `react-native-svg`      | DOM `<svg>` elements        | `.web` file |
| `icons.ts`         | `lucide-react-native`   | `lucide-react`              | `.web` file |
| `link.tsx`         | `Pressable` + `Linking` | an `<a>` on the seam `View` | `.web` file |
| `domBackendCss.ts` | `""`                    | CSS in `webStylesheet.ts`   | `.web` file |
| `types/` (web)     | —                       | the seam's own types        | —           |

With the DOM backend, every primitive comes from `dom/` — `View`, `Text`,
`Pressable`, `Image`, `Modal`, `ScrollView`, `TextInput`, `FlatList`,
`Animated`, `Easing`, `PanResponder`, `StyleSheet`, `Platform`,
`useWindowDimensions`, `AccessibilityInfo`, `Keyboard`, `KeyboardAvoidingView`
and `InputAccessoryView`.

Why this exists: the `dist/node` build (the `import` condition) selects the
`.web` files, so a web consumer installs `react`, `react-dom` and
`lucide-react` and nothing else — those three are the package's entire web peer
set. There is no `react-native` alias to configure, the `react-native` package,
`react-native-svg`, and `lucide-react-native` are never resolved at runtime
with the DOM backend, and `react-native-web` is not a peer dependency at all.
Metro keeps resolving the native files on iOS and Android, and the `.web` files
on Expo web. An app that draws with `react-native-web` can take
[the RNW route](#the-rnw-route) instead.

## The RNW route

An app that draws its own screens with `react-native-web` (RNW) can draw the
library with RNW too. The app applies `resolveFirnaRnwFile`, the rule that
`@firna/ui/rnw` publishes, in each tool that resolves the library's modules.
The RNW form of a seam is the file that this route loads for it. For a seam
request from inside the package's `dist`, the rule returns the RNW form when
that form is not the `.web` file. Otherwise it returns `null`. The RNW column
of the table above gives each form:

- `reactNative` loads its native file. The app's alias sends that file's
  `react-native` import to `react-native-web`.
- `svg`, `icons`, `link`, and `domBackendCss` use their `.web` files on both
  web routes. The SVG file draws DOM `<svg>` and the icon file uses
  `lucide-react`.

Rules for the seam:

- `rnwForms.ts` names the RNW form of each seam pair: `native` or `web`. Add
  the entry with the pair. A unit test fails when a pair has no entry, and the
  build generates the rule's table from this file.
- A seam whose RNW form is `native` imports only packages, never a relative
  module. The rule sends a request from either build tree to that one file in
  `dist/primitives/`, so a relative import would load a second copy of a
  module. A test checks the emitted JavaScript.
- Nothing that the RNW route loads imports from `dom/`. A test bundles every
  public subpath through the rule and fails on a file under
  `primitives/dom/`.

The
[package protocol](../../docs/protocol/shared-ui-package.md#react-native-web-contract)
holds the requirements of the route. The
[root README](../../README.md#react-native-web-route) shows how an app applies
the rule.

## Shared web stylesheet

`webStylesheet.ts` provides CSS for both web renderers. `useDomBackendCss`
injects it once per document under a stable id. The DOM `View`, `Text`, and
`TextInput` call the hook. Both renderers use it through the web theme root
and `useFocusRing`. The package publishes the CSS as `domBackendCss` for
server rendering.

The sheet holds the `View` and `Text` element resets in classes so that
inline styles take precedence. It also holds the `pointerEvents` child
selectors, the `TextInput` reset and `::placeholder` colour, the rules for
hidden scroll indicators, and RNW's top-level reset. It provides the
attribute-based `:focus-visible` glow, including inset and forced-colors
variants, and the `focusIndicator="none"` outline reset.

## `dom/`

The library's own DOM backend: plain React elements, no `react-native-web`.
Its parity target is `react-native-web` 0.21.2's own output — the same element
per role, the same `aria-*` attributes, the same translated CSS — because the
screenshot and ARIA baselines in `tests/browser/snapshots.spec.ts-snapshots`
were recorded on that backend and are what prove the swap changed nothing.

- `resolveStyle.ts` + `styleTables.ts` translate a `StyleProp` into inline
  styles: the `styleq` merge, `preprocess`, the left-to-right resolution of the
  logical properties, and `createReactDOMStyle`'s shorthand expansion, all
  transcribed. Pure, and pinned by `tests/unit/domResolveStyle.test.ts`.
- `domProps.ts` + `domPropTables.ts` pick the element for a role and map the
  accessibility props, `testID`, `tabIndex`, `disabled` and `pointerEvents`.
  Pure, and pinned by `tests/unit/domProps.test.ts`. As on that backend, an
  `href` makes the element an anchor unless a role names another one, and
  `hrefAttrs` adds its `rel` and `target`; `tests/unit/link.test.ts` pins them
  through the link host.
- `useLayout.ts` runs one shared `ResizeObserver` for `onLayout` and puts
  `measure`, `measureInWindow`, `measureLayout` and `setNativeProps` on the DOM
  element itself, so a `ref` is still the element the library reads
  `clientWidth` and `getBoundingClientRect()` from.
- `Pressable.tsx` is that backend's `Pressable`: a `View` that runs the press
  and hover hooks of [`webPress/`](#webpress).
- `ScrollView.tsx` is that backend's `ScrollView` plus `ScrollViewBase`: an
  overflow container around a content wrapper, with its start / tick / end
  scroll rhythm (`scrollEvents.ts` holds the pure half) and its imperative
  methods assigned onto the DOM element (`scrollViewHost.ts`, with the style
  table). `onMomentumScrollEnd` never fires, because it never did there.
- `TextInput.tsx` is an `input` or a `textarea` by `multiline`, with the
  `type` / `inputMode` table and the forwarded-prop allowlist in
  `textInputProps.ts` and the DOM-touching helpers in `textInputHost.ts`. The
  ref is the element, which is what lets `useAutoGrowTextarea.web.ts` measure
  and restyle it directly.
- `animated/` is React Native's `Animated` with the native driver removed: the
  node graph, `TimingAnimation`'s `requestAnimationFrame` loop, the
  compositions, `Easing` over a real cubic bézier, and a
  `createAnimatedComponent` that re-renders its child every frame rather than
  writing to the host node — which is how an animated value drives an SVG
  attribute as easily as a style.
- `responder/` is the gesture responder system and `PanResponder`, ported
  whole: its `__firnaResponderSystemActive` flag, `__firnaResponderId` tags, the
  capture-then-bubble negotiation (`negotiation.ts`, over the shared lock in
  `responderState.ts`) and the touch history a gesture's `dx` / `dy` is computed
  from. `View`, `Text`, `TextInput` and `ScrollView` all register with it.
- `FlatList.tsx` windows a `ScrollView` with `VirtualizedList`'s arithmetic:
  `flatListWindow.ts` is the pure maths, `useFlatListWindow.ts` the scroll
  metrics and the batcher that grows the window one batch per render, and
  `flatListParts.tsx` the spacers and the header / footer / empty slots.

`domBackendCss` is injected at the **start** of `<head>`, where that backend
put its own sheet, so a consumer's later stylesheet wins a tie rather than
losing one. A server-rendered consumer should emit it before their own styles
for the same reason. The focus rules consume `--firna-focus-ring-color` and
`--firna-focus-ring-width`; `SharedUiThemeProvider` serializes them through a
boxless web root, while SSR consumers can also emit a `:root` fallback alongside
`domBackendCss` (see the workspace README's theming section). When a marked host
already has an inline shadow (for elevation, selection, or validation), `View`
moves it into `--firna-focus-ring-base-shadow` and the stylesheet composes it
behind the halo instead of letting either treatment erase the other. A
`descendant` host's rules key on `[data-firna-focus-target]:focus-visible`, not
on any focused descendant: a clear or chip-remove button inside the frame keeps
its own browser outline and leaves the frame unlit. The `boxShadow` rewrite is
`View`'s alone: a raw DOM host marked through `focusRingDomProps` must put a
resting shadow in `--firna-focus-ring-base-shadow` itself, since an inline
`box-shadow` would outrank the glow. A `data-firna-focus-none` box paints
nothing: one zero-specificity `:where()` rule strips the browser outline from
its focus target, only outside forced-colors mode, so a caller's own focus
style always wins and forced colors keep the system outline.

`ScrollView` does not set `transform: translateZ(0)`. It is a zero translation
with no visual meaning, but it promotes the scroller to its own compositing
layer, and Chromium then snaps fractionally-positioned content inside that
layer a device row away from the recorded baselines.

## `webPress/`

The press and hover hooks of both web renderers. The DOM backend's
`Pressable` and [the link host](#the-link-host) run them, so they import
nothing from `dom/`.

- `pressMachine.ts`, `usePress.ts`, and `useHover.ts` reproduce
  `react-native-web`'s press machine: the 50 ms press delay, the 450 ms long
  press, `onPress` from the DOM `click` rather than the release, Enter
  anywhere and Space on a button, and hover that ends when a nested pressable
  takes over.
- `usePress.ts` also exports the internal `endPointerPresses(event)`: a
  gesture that takes over a pointer, such as a drag-select drag that starts
  on a button, passes the pointer event that took over. Each press of that
  pointer, or of an unknown pointer, ends with that event: the control loses
  its pressed look, and `onPressOut` gets the event through `fromDomEvent`,
  as on a release. The caller swallows the click that follows, because
  `onPress` comes from that click. One registry in `usePress.ts` holds every
  pointer press, so the takeover also ends the press of a link.

## `types/`

The library's own copy of React Native's public type surface, vendored from
React Native's `.d.ts` files (MIT, Meta — each file carries the attribution)
and trimmed to what the seam exports plus what those types transitively need.
`reactNative.web.ts` annotates every value it re-exports from `dom/` with
these instead of borrowing React Native's, which is why
`dist/node/**/*.d.ts` — the declarations every consumer resolves, including
native ones — contain no `react-native` reference and a strict web consumer
installs no extra package. `tests/unit/distDeclarations.test.ts` guards that.

The files split by topic: `layout.ts` and `style.ts` (colours, dimensions,
`ViewStyle` / `TextStyle` / `ImageStyle`, `StyleProp`), `events.ts`,
`accessibility.ts`, `hostInstance.ts` (what a `ref` yields) and
`hostElement.ts` (what an event reports as its target), `components.ts`
(`View`, `Text`, `Pressable`), `lists.ts`, `textInput.ts` +
`textInputOptions.ts`, `overlays.ts`, `animatedValue.ts` + `animated.ts`,
`gestures.ts`, `platform.ts`, and an `index.ts` that re-exports them.

The one rule when editing them: **ours may be wider than React Native's, never
narrower.** This is an assignability contract — a native
consumer's React Native `style`, prop bag, or event handler has to keep
flowing into a prop typed here — so every union is copied whole (even the
platform-only values the web backend ignores) and no member React Native
declares is dropped. Both directions matter, because handler props are
contravariant in their parameter: `HostElement` is React Native's
`ReactNativeElement` in full for exactly that reason.
`tests/unit/primitiveTypesCompat.test.ts` compiles a probe that mixes the two
type worlds against the real `react-native` declarations and fails if an
assignment stops working.

Two deliberate departures from React Native's shape, both web-only and both
already honoured by the current backend: the CSS keys in `style.ts`'s
`WebOnlyStyle` (`transition`, `backgroundImage`, `touchAction`, …) and the extra `position`
(`fixed`, `sticky`), `cursor`, `outlineStyle` (`none`) and `DimensionValue`
(`max-content`, …) values in `layout.ts`. They make our `ViewStyle` a superset
of React Native's: an RN-typed style still flows into a component prop typed
here, but not the other way round — `sheet/BottomSheetShell.tsx` re-types its
style on the way into `@gorhom/bottom-sheet`, which is declared with React
Native's own.

## The link host

`link.tsx` and `link.web.tsx` export `Link`, `LinkProps` and
`LinkInteractionState`: the host of the library's links. `linkTypes.ts` holds
their props once, over the style, focus-event and layout-event types of each
platform, so each file types them in its own world, as `reactNative.ts` and
`reactNative.web.ts` do. The click rule is `linkActivation.ts`, which both
hosts share.

One web host serves both web renderers. `link.web.tsx` draws on the seam's own
`View` from `reactNative`: the DOM backend's `View` by default, and
`react-native-web`'s `View` on [the RNW route](#the-rnw-route). It imports
nothing from `dom/`. Both renderers render a `View` with an `href` as an
anchor, add the `rel` and `target` of `hrefAttrs`, and forward `aria-current`,
`dataSet`, `onClick`, and the pointer, key, and focus handlers. So the anchor
keeps the element reset, the layout and `ref` methods, and the focus markers
of the `View`. The host tracks the pressed, hovered and focused states for a
function `style` and `children` with the hooks of [`webPress/`](#webpress), as
`Pressable` does, but takes no `onPress` and never stops its click. It is not
a `Pressable`, because `react-native-web`'s `Pressable` stops every click and
runs `onPress` on a Ctrl, Meta, or Shift click.

The web host is an anchor with its `href` in static HTML. Only a primary click
or Enter without a modifier on a same-tab link runs `onNavigate`, and it then
prevents the page load; every other click keeps the browser default. `newTab`
adds `target="_blank"` and `rel="noopener noreferrer"`. The native host is a
`Pressable` with the link role and the selected state for `current`. An
activation runs `onNavigate`, a new-tab link included, or `Linking.openURL`
without one. The
[app shell parts protocol](../../docs/protocol/app-shell-parts.md#links) holds
the requirements.

## Two type-check passes

`npm run typecheck` resolves the native files; `npm run typecheck:web`
(`tsconfig.web.json`, `moduleSuffixes: [".web", ""]`) re-checks the same
sources against the `.web` siblings, which is the resolution the `dist/node`
declarations are emitted with. Both run in `npm run verify`, and the build runs
a third, emit-only web pass (`tsconfig.build.web.json`).

`moduleSuffixes` is applied _inside_ each extension rather than around it:
resolving `./svg` TypeScript tries `svg.web.ts`, `svg.ts`, and only then
`svg.web.tsx`. A `.web.tsx` file with a plain `.ts` native sibling therefore
loses the race and the web pass silently checks the native module — which is
why `svg.ts` is `svg.tsx`. A unit test enforces the ordering for every pair.

Rules:

- Each pair exports the same names; the unit test diffs them. Add a name to
  both files in the same change, and only when a component needs it. The icon
  seam also takes a glyph that only a story needs.
- A new name also needs a type in `types/` and an implementation in `dom/`.
  The web seam imports nothing but those two; a unit test asserts it.
- Class-valued exports get a same-named type alias so `useRef<View>` keeps
  working; `Animated` merges a namespace for `Animated.Value`.
- The DOM SVG shim only supports props that are valid SVG attributes, plus the
  few `react-native-svg` spellings components pass (`originX`, `rotation`, an
  array `strokeDasharray`). It flattens React Native style arrays because
  `Animated.createAnimatedComponent` always passes one.
- `IconComponent` (in `iconTypes.ts`) is the public icon prop type. It is the
  intersection of what both Lucide packages accept, so consumers can pass an
  icon from whichever package matches their platform, or their own component.
