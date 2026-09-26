# Platform primitives

The single seam between the library and its platform packages. Components
never import `react-native`, `react-native-svg`, `lucide-react-native`,
`react-native-web`, or `lucide-react` directly; they import from here, and a
unit test (`tests/unit/primitives.test.ts`) fails the build if one does.

| Module             | Native resolves to    | Web (`.web`) resolves to  |
| ------------------ | --------------------- | ------------------------- |
| `reactNative.ts`   | `react-native`        | `dom/`                    |
| `svg.tsx`          | `react-native-svg`    | DOM `<svg>` elements      |
| `icons.ts`         | `lucide-react-native` | `lucide-react`            |
| `domBackendCss.ts` | `""`                  | `dom/css.ts`'s stylesheet |
| `types/` (web)     | —                     | the seam's own types      |

Every primitive comes from `dom/` on web — `View`, `Text`, `Pressable`,
`Image`, `Modal`, `ScrollView`, `TextInput`, `FlatList`, `Animated`, `Easing`,
`PanResponder`, `StyleSheet`, `Platform`, `useWindowDimensions`,
`AccessibilityInfo`, `Keyboard`, `KeyboardAvoidingView` and
`InputAccessoryView`.

Why this exists: the `dist/node` build (the `import` condition) selects the
`.web` files, so a web consumer installs `react`, `react-dom` and
`lucide-react` and nothing else — those three are the package's entire web peer
set. There is no `react-native` alias to configure, the `react-native` package,
`react-native-svg`, and `lucide-react-native` are never resolved at runtime on
web, and `react-native-web` is not a peer dependency at all. Metro keeps
resolving the native files on iOS and Android, and the `.web` files on Expo
web.

## `dom/`

The library's own DOM backend: plain React elements, no `react-native-web`.
Its parity target is `react-native-web` 0.21.2's own output — the same element
per role, the same `aria-*` attributes, the same translated CSS — because the
screenshot and ARIA baselines in `tests/browser/snapshots.spec.ts-snapshots`
were recorded on that backend and are what prove the swap changed nothing
(`plans/pure-react-dom-backend.md`, Decision 3).

- `resolveStyle.ts` + `styleTables.ts` translate a `StyleProp` into inline
  styles: the `styleq` merge, `preprocess`, the left-to-right resolution of the
  logical properties, and `createReactDOMStyle`'s shorthand expansion, all
  transcribed. Pure, and pinned by `tests/unit/domResolveStyle.test.ts`.
- `domProps.ts` + `domPropTables.ts` pick the element for a role and map the
  accessibility props, `testID`, `tabIndex`, `disabled` and `pointerEvents`.
  Pure, and pinned by `tests/unit/domProps.test.ts`.
- `css.ts` holds the few rules an inline style cannot express, injected once
  per document under a stable id by `useDomBackendCss` (called from `View`,
  `Text`, `TextInput`, and the web `SharedUiThemeRoot`) and published as
  `domBackendCss` for server rendering. That is the `View` and `Text` element
  resets (a class, so every inline style still outranks them), the
  `pointerEvents` child-selector rules, the `TextInput` reset, its
  `::placeholder` colour, a `ScrollView`'s hidden scroll indicators, the
  attribute-based `:focus-visible` glow (including inset and forced-colors
  variants), and `react-native-web`'s own top-level reset.
- `useLayout.ts` runs one shared `ResizeObserver` for `onLayout` and puts
  `measure`, `measureInWindow`, `measureLayout` and `setNativeProps` on the DOM
  element itself, so a `ref` is still the element the library reads
  `clientWidth` and `getBoundingClientRect()` from.
- `usePress.ts` / `useHover.ts` / `Pressable.tsx` reproduce that backend's
  press machine: the 50 ms press delay, the 450 ms long press, `onPress` from
  the DOM `click` rather than the release, Enter anywhere and Space on a
  button, and hover that ends when a nested pressable takes over.
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
  whole: the document-level listeners, the `__reactResponderId` tagging, the
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
`box-shadow` would outrank the glow.

The list of places the backend deliberately differs from `react-native-web`
lives in the plan's M2 and M3 sections. The one worth knowing here:
`ScrollView` does not set `transform: translateZ(0)`. It is a zero translation
with no visual meaning, but it promotes the scroller to its own compositing
layer, and Chromium then snaps fractionally-positioned content inside that
layer a device row away from the recorded baselines.

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
narrower.** Decision 7 of the plan is an assignability contract — a native
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
`WebOnlyStyle` (`transition`, `backgroundImage`, …) and the extra `position`
(`fixed`, `sticky`), `cursor`, `outlineStyle` (`none`) and `DimensionValue`
(`max-content`, …) values in `layout.ts`. They make our `ViewStyle` a superset
of React Native's: an RN-typed style still flows into a component prop typed
here, but not the other way round — `sheet/BottomSheetShell.tsx` re-types its
style on the way into `@gorhom/bottom-sheet`, which is declared with React
Native's own.

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
  both files in the same change, and only when a component needs it.
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
