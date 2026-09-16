/**
 * SVG primitives, native resolution.
 *
 * Components draw vector geometry through this module so the SVG backend is
 * decided in one place: `react-native-svg` on iOS and Android, and a plain DOM
 * `<svg>` shim (`svg.web.tsx`) on web. The web shim exists because
 * `react-native-svg`'s own web build imports from `react-native`, which a web
 * consumer without a bundler alias cannot resolve.
 *
 * The export list is mirrored by `svg.web.tsx`; a unit test keeps them equal.
 */
export {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Polygon,
  Rect,
  Stop,
  default,
} from "react-native-svg";
