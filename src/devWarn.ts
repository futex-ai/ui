/**
 * Fires a development-only `console.warn`.
 *
 * `__DEV__` is a React Native / Metro global. Web bundlers (Vite, webpack) do
 * not define it, so referencing it bare throws a `ReferenceError` in the browser
 * — which would crash any component that guards a warning with `__DEV__`. Guard
 * with `typeof` so the reference is safe everywhere: on native it follows
 * `__DEV__`; on web (and any environment that doesn't define it) the warning is
 * simply suppressed. The automated a11y gate covers these cases on web.
 */
export function devWarn(message: string): void {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(message);
  }
}
