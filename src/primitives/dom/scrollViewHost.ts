/**
 * A `ScrollView`'s styles and the imperative methods it puts on its node.
 *
 * Split out of `ScrollView.tsx` to keep both files near the line target. The
 * style table is `react-native-web` 0.21.2's, minus one declaration; the
 * methods are the ones its `_setScrollNodeRef` assigned onto the host node,
 * because `usePlatformMethods` never covered them.
 */

/** How long after the last scroll the trailing "end" event fires. */
export const SCROLL_END_DELAY_MS = 100;

/**
 * The base style, minus one line.
 *
 * `react-native-web` also set `transform: translateZ(0)` here, a compositing
 * hint with no visual meaning — a zero translation — paired with the
 * `-webkit-overflow-scrolling: touch` that modern Chromium no longer even
 * parses. It is dropped because promoting the scroller to its own layer makes
 * Chromium snap fractionally-positioned text inside it one device pixel
 * differently: with the hint the bottom-sheet modal's body renders a pixel off
 * the baseline recorded on that backend, and without it all 326 screenshots
 * match byte for byte. See the plan's M3 deviations.
 */
const COMMON_STYLE = {
  flexGrow: 1,
  flexShrink: 1,
  // iOS momentum scrolling, as that backend asked for it.
  WebkitOverflowScrolling: "touch",
} as const;

export const BASE_VERTICAL = {
  ...COMMON_STYLE,
  flexDirection: "column",
  overflowX: "hidden",
  overflowY: "auto",
} as const;

export const BASE_HORIZONTAL = {
  ...COMMON_STYLE,
  flexDirection: "row",
  overflowX: "auto",
  overflowY: "hidden",
} as const;

// Chrome ignores `preventDefault` on a scroll, so `touch-action` is what
// actually stops a disabled scroller from moving.
export const SCROLL_DISABLED = {
  overflowX: "hidden",
  overflowY: "hidden",
  touchAction: "none",
} as const;

export const CONTENT_HORIZONTAL = { flexDirection: "row" } as const;
export const CONTENT_CENTERED = {
  flexGrow: 1,
  justifyContent: "center",
} as const;
export const PAGING_HORIZONTAL = { scrollSnapType: "x mandatory" } as const;
export const PAGING_VERTICAL = { scrollSnapType: "y mandatory" } as const;
export const PAGING_CHILD = { scrollSnapAlign: "start" } as const;
export const STICKY_HEADER = {
  position: "sticky",
  top: 0,
  zIndex: 10,
} as const;

/** A scroll node, with the React Native methods assigned onto it. */
export type ScrollElement = HTMLElement & Record<string, unknown>;

/** Argument of `scrollTo`. */
export type ScrollToArgs = { x?: number; y?: number; animated?: boolean };

/** Any handler a `ScrollView` guards behind `scrollEnabled`. */
export type AnyHandler = ((event: never) => void) | undefined;

function scrollNodeTo(node: ScrollElement, options: ScrollToArgs) {
  const left = options.x ?? 0;
  const top = options.y ?? 0;
  const behavior = options.animated === true ? "smooth" : "auto";
  if (typeof node.scroll === "function") {
    node.scroll({ behavior, left, top });
  } else {
    node.scrollLeft = left;
    node.scrollTop = top;
  }
}

/** The gesture bookkeeping `ScrollResponder` keeps while it holds the lock. */
export type ScrollResponderState = {
  /** Whether a scroll was reported since the lock was granted. */
  observedScrollSinceBecomingResponder: boolean;
  /** Whether the lock was granted while momentum was still running. */
  becameResponderWhileAnimating: boolean;
};

/** What {@link shouldDismissKeyboardOnRelease} decides from. */
export type ReleaseContext = ScrollResponderState & {
  /** `keyboardShouldPersistTaps`, as the caller spelled it. */
  keyboardShouldPersistTaps: unknown;
  /** The field that currently has focus, if any. */
  focusedField: unknown;
  /** What the release landed on. */
  target: unknown;
};

/**
 * Whether releasing the lock should dismiss the keyboard.
 *
 * `scrollResponderHandleResponderRelease`'s rule, transcribed: a tap that did
 * not scroll, did not land on the focused field, and did not begin during a
 * momentum animation closes the keyboard — unless `keyboardShouldPersistTaps`
 * says otherwise. That test is a bare truthiness check there, so **any** value
 * persists the keyboard, `"never"` included; the string is never compared.
 *
 * Pure; `tests/unit/domScrollView.test.ts` pins it.
 */
export function shouldDismissKeyboardOnRelease(
  context: ReleaseContext,
): boolean {
  return (
    !context.keyboardShouldPersistTaps &&
    context.focusedField != null &&
    context.target !== context.focusedField &&
    !context.observedScrollSinceBecomingResponder &&
    !context.becameResponderWhileAnimating
  );
}

/**
 * Adds the scroll methods to the DOM element.
 *
 * `usePlatformMethods` never covered these, so that backend assigned them onto
 * the node in its own ref callback; ours does the same, which is what keeps a
 * caller's `ref` both an element and a scroll responder.
 */
export function attachScrollMethods(
  node: ScrollElement,
  getInner: () => HTMLElement | null,
  horizontal: boolean,
) {
  // Written through an untyped view of the element: `scrollTo` collides with
  // the DOM's own method, whose signature React Native's does not match.
  const host = node as unknown as Record<string, unknown>;
  host.scrollTo = (options?: ScrollToArgs) =>
    scrollNodeTo(node, {
      animated: options?.animated !== false,
      x: options?.x,
      y: options?.y,
    });
  host.scrollToEnd = (options?: { animated?: boolean }) =>
    scrollNodeTo(node, {
      animated: options?.animated !== false,
      x: horizontal ? node.scrollWidth : 0,
      y: horizontal ? 0 : node.scrollHeight,
    });
  host.getScrollableNode = () => node;
  host.getNativeScrollRef = () => node;
  host.getInnerViewNode = getInner;
  host.getInnerViewRef = getInner;
  host.getScrollResponder = () => node;
  host.flashScrollIndicators = () => {};
}
