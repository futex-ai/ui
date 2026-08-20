/**
 * The scrub gesture's responder negotiation, as a pure predicate.
 *
 * Kept out of the hook so it can be unit-tested without pulling React Native
 * in, and because this predicate *is* the negotiation: get it wrong and the
 * chart either swallows page scrolling or never scrubs at all.
 */

/** Movement, in px, before a drag is treated as a scrub rather than a tap. */
export const SCRUB_THRESHOLD = 8;

/**
 * Whether a movement should become a scrub.
 *
 * Three things compete for the responder on a chart inside a dashboard: the
 * per-mark `Pressable`s (which claim it on touch-start), the scrub, and an
 * enclosing vertical `ScrollView`. Requiring a **horizontal-dominant** move
 * past a threshold leaves taps to the marks and vertical drags to the scroller.
 */
export function shouldClaimScrub(dx: number, dy: number): boolean {
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  return horizontal > SCRUB_THRESHOLD && horizontal > vertical;
}
