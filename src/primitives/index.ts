/**
 * Platform seam for the library.
 *
 * Components never import `react-native`, `react-native-svg`, or a Lucide
 * package directly; they import from the modules in this folder, each of which
 * has a native file and a `.web` sibling that Metro, Vite, and the package
 * build all select by platform. Native delegates to `react-native`,
 * `react-native-svg`, and `lucide-react-native`; web delegates to
 * `react-native-web`, DOM SVG elements, and `lucide-react`.
 */
export type { IconComponent, IconComponentProps } from "./iconTypes";
