/**
 * The pure React DOM backend behind the platform seam's web resolution.
 *
 * Every primitive here renders DOM elements directly, with no
 * `react-native-web` at runtime; `reactNative.web.ts` re-exports them under the
 * seam's own types. The parity target is `react-native-web` 0.21.2's own
 * output, element for element and declaration for declaration, which is what
 * makes the recorded screenshot and ARIA baselines a working oracle. See
 * `plans/pure-react-dom-backend.md` and `../README.md`.
 */
export { domBackendCss, useDomBackendCss } from "./css";
export { Image } from "./Image";
export { InputAccessoryView, KeyboardAvoidingView } from "./KeyboardViews";
export { Modal } from "./Modal";
export {
  AccessibilityInfo,
  Keyboard,
  Platform,
  useWindowDimensions,
} from "./platform";
export { Pressable } from "./Pressable";
export { StyleSheet } from "./StyleSheet";
export { Text } from "./Text";
export { TextAncestorContext } from "./TextAncestorContext";
export { View } from "./View";
