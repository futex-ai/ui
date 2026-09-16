# Platform primitives

The single seam between the library and its platform packages. Components
never import `react-native`, `react-native-svg`, `lucide-react-native`,
`react-native-web`, or `lucide-react` directly; they import from here, and a
unit test (`tests/unit/primitives.test.ts`) fails the build if one does.

| Module           | Native resolves to    | Web (`.web`) resolves to |
| ---------------- | --------------------- | ------------------------ |
| `reactNative.ts` | `react-native`        | `react-native-web`       |
| `svg.tsx`        | `react-native-svg`    | DOM `<svg>` elements     |
| `icons.ts`       | `lucide-react-native` | `lucide-react`           |
| `types/` (web)   | —                     | the seam's own types     |

Why this exists: the `dist/node` build (the `import` condition) selects the
`.web` files, so a web consumer installs `react-native-web` and `lucide-react`
and nothing else. There is no `react-native` alias to configure, and the
`react-native` package, `react-native-svg`, and `lucide-react-native` are never
resolved at runtime on web. Metro keeps resolving the native files on iOS and
Android, and the `.web` files on Expo web.

## `types/`

The library's own copy of React Native's public type surface, vendored from
React Native's `.d.ts` files (MIT, Meta — each file carries the attribution)
and trimmed to what the seam exports plus what those types transitively need.
`reactNative.web.ts` annotates every value it re-exports from
`react-native-web` with these instead of borrowing React Native's, which is why
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
- A new name also needs a type in `types/` and an entry in
  `react-native-web.d.ts`, which declares the `react-native-web` values the web
  seam imports (that package ships no declarations of its own).
- Class-valued exports get a same-named type alias so `useRef<View>` keeps
  working; `Animated` merges a namespace for `Animated.Value`.
- The DOM SVG shim only supports props that are valid SVG attributes, plus the
  few `react-native-svg` spellings components pass (`originX`, `rotation`, an
  array `strokeDasharray`). It flattens React Native style arrays because
  `Animated.createAnimatedComponent` always passes one.
- `IconComponent` (in `iconTypes.ts`) is the public icon prop type. It is the
  intersection of what both Lucide packages accept, so consumers can pass an
  icon from whichever package matches their platform, or their own component.
