# Platform primitives

The single seam between the library and its platform packages. Components
never import `react-native`, `react-native-svg`, `lucide-react-native`,
`react-native-web`, or `lucide-react` directly; they import from here, and a
unit test (`tests/unit/primitives.test.ts`) fails the build if one does.

| Module           | Native resolves to    | Web (`.web`) resolves to |
| ---------------- | --------------------- | ------------------------ |
| `reactNative.ts` | `react-native`        | `react-native-web`       |
| `svg.ts`         | `react-native-svg`    | DOM `<svg>` elements     |
| `icons.ts`       | `lucide-react-native` | `lucide-react`           |

Why this exists: the `dist/node` build (the `import` condition) selects the
`.web` files, so a web consumer installs `react-native-web` and `lucide-react`
and nothing else. There is no `react-native` alias to configure, and the
`react-native` package, `react-native-svg`, and `lucide-react-native` are never
resolved at runtime on web. Metro keeps resolving the native files on iOS and
Android, and the `.web` files on Expo web.

Rules:

- Each pair exports the same names; the unit test diffs them. Add a name to
  both files in the same change, and only when a component needs it.
- The web React Native module borrows its types from `react-native` (which is
  why `react-native` stays a types-only dev dependency for strict web
  consumers). Class-valued exports get a same-named type alias so
  `useRef<View>` keeps working; `Animated` merges a namespace for
  `Animated.Value`.
- The DOM SVG shim only supports props that are valid SVG attributes. It
  flattens React Native style arrays because `Animated.createAnimatedComponent`
  always passes one.
- `IconComponent` (in `iconTypes.ts`) is the public icon prop type. It is the
  intersection of what both Lucide packages accept, so consumers can pass an
  icon from whichever package matches their platform, or their own component.
