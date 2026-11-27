/**
 * The DOM backend's stylesheet, web resolution.
 *
 * The DOM backend's `View`, `useFocusRing`, and the web theme provider inject
 * it on the client through `useDomBackendCss`, so a browser consumer never has
 * to touch this. On the `react-native-web` route, the `View` of that renderer
 * injects nothing, and the other two still do. It is published for server rendering: emit
 * it in `<head>` and the first paint is already styled.
 */
export { domBackendCss } from "./webStylesheet";
