/**
 * The library stylesheet of the focus hosts, native resolution.
 *
 * Native draws no focus glow and has no stylesheet, so this hook does nothing.
 * The web sibling `focusRingStylesheet.web.ts` injects the stylesheet.
 */

/** Does nothing on native. `useFocusRing` calls it on every platform. */
export function useFocusRingStylesheet(): void {}
