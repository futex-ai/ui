/**
 * The DOM backend's stylesheet, web resolution.
 *
 * `View` injects it on the client through `useDomBackendCss`, so a browser
 * consumer never has to touch this. It is published for server rendering: emit
 * it in `<head>` and the first paint is already styled.
 */
export { domBackendCss } from "./dom/css";
