/**
 * ARIA state that react-native-web does not emit on its own.
 *
 * RNW translates `accessibilityRole` into `role`, but it does **not** turn
 * `accessibilityState` into the matching `aria-*` attributes for every state.
 * A `role="switch"` with no `aria-checked` and a `role="button"` with no
 * `aria-expanded` are both broken for a screen reader: the role promises a
 * state the element never publishes. Native reads `accessibilityState`
 * directly, so both have to be emitted.
 *
 * This is the same gap `progressValue.ts` documents for `accessibilityValue`
 * and the ARIA range attributes; the literal props are forwarded through a cast
 * spread because React Native's prop types omit them.
 */

/**
 * `aria-checked` for a two-state control (the legend's series toggles).
 * `checked` is the *visible* state, so a shown series reports `true`.
 */
export function checkedAria(checked: boolean): Record<string, unknown> {
  return { "aria-checked": checked ? "true" : "false" } as Record<
    string,
    unknown
  >;
}

/** `aria-expanded` for a disclosure control (the data-table toggle). */
export function expandedAria(expanded: boolean): Record<string, unknown> {
  return { "aria-expanded": expanded ? "true" : "false" } as Record<
    string,
    unknown
  >;
}
