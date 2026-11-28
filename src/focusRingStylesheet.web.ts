/**
 * The library stylesheet of the focus hosts, web resolution.
 *
 * The focus glow and its `outline` and `none` variants are rules of the
 * library stylesheet, `domBackendCss`. The DOM backend's `View`, `Text`, and
 * `TextInput` inject it. On the react-native-web route those primitives come
 * from react-native-web and inject nothing. So `useFocusRing` injects the
 * stylesheet too, and a focus host paints on both web renderers with no theme
 * provider.
 */
import { useDomBackendCss } from "./primitives/webStylesheet";

/** Injects the library stylesheet on the client, once per document. */
export function useFocusRingStylesheet(): void {
  useDomBackendCss();
}
