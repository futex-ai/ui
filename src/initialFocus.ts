/**
 * The initial-focus marker, which keeps a control from being the element
 * that receives focus when an overlay opens.
 *
 * `WebModalFrame` lands focus on the first focusable element the caller
 * rendered. A secondary control that comes before the real first field in
 * DOM order — the ⓘ help button beside an input's label, a chip's remove
 * button — is a poor landing spot, so it carries
 * `data-firna-initial-focus="skip"` and the landing picker passes over it.
 * The marker is inherited: a container that carries it excludes every
 * focusable element inside it. It changes only where focus lands on open; a
 * marked control stays in the Tab order and inside the focus trap.
 *
 * Like the focus-ring markers, the attribute has two spellings: `dataSet`
 * for a Firna primitive or library component, and the literal `data-*`
 * attribute for a raw DOM element. On native the marker is inert, because
 * there is no tab order to land in.
 */

/** The DOM attribute the landing picker reads. */
export const INITIAL_FOCUS_ATTRIBUTE = "data-firna-initial-focus";

/** The one value the marker takes: `skip` keeps focus from landing on the element. */
export type InitialFocusMarker = "skip";

/** The marker in `dataSet` spelling, for a Firna primitive or library component. */
export type InitialFocusProps = {
  dataSet: { firnaInitialFocus: InitialFocusMarker };
};

/** The marker as a literal `data-*` attribute, for a raw DOM element. */
export type InitialFocusDomProps = {
  "data-firna-initial-focus": InitialFocusMarker;
};

/**
 * Spread onto a Firna primitive or library component so an opening overlay
 * never lands focus on it: `<Button {...skipInitialFocusProps} />`. Merge the
 * inner `dataSet` by hand when the element already carries one.
 */
export const skipInitialFocusProps: InitialFocusProps = Object.freeze({
  dataSet: Object.freeze({ firnaInitialFocus: "skip" as const }),
});

/** The same marker for a raw DOM element: `<button {...skipInitialFocusDomProps} />`. */
export const skipInitialFocusDomProps: InitialFocusDomProps = Object.freeze({
  "data-firna-initial-focus": "skip" as const,
});

/** Matches an element that carries the skip marker. */
export const INITIAL_FOCUS_SKIP_SELECTOR = `[${INITIAL_FOCUS_ATTRIBUTE}="skip"]`;

/**
 * The one DOM method the landing check reads, so the helpers accept any
 * `Element` and test without a DOM.
 */
export type InitialFocusHost = {
  closest(selector: string): unknown;
};

/** Whether `element`, or an ancestor, carries the skip marker. */
export function skipsInitialFocus(element: InitialFocusHost): boolean {
  return element.closest(INITIAL_FOCUS_SKIP_SELECTOR) != null;
}

/**
 * Where focus should land: the first of `candidates`, in order, that does not
 * skip initial focus. `null` when every candidate skips it, so the caller can
 * fall through to its own fallback rather than land on a marked control.
 */
export function initialFocusLanding<T extends InitialFocusHost>(
  candidates: readonly T[],
): T | null {
  return candidates.find((candidate) => !skipsInitialFocus(candidate)) ?? null;
}
