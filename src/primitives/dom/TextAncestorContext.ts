/**
 * Whether the tree being rendered is already inside a `Text`.
 *
 * A root `Text` renders a `div` and provides `true`; a nested one renders a
 * `span` that inherits colour, font, alignment and wrapping from it. A `View`
 * reads the same context to switch from `display: flex` to `inline-flex` so it
 * can sit inside a line of text. `react-native-web` uses an identical context,
 * which is why the two backends cannot share one (plan Decision 1).
 */
import { createContext } from "react";

export const TextAncestorContext = createContext(false);
