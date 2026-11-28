/**
 * The shared state of the buttons in a modal header row: where each button
 * sits in the row, and the frame's focus indicator. `WebModalHeaderControls`
 * provides it, and `WebModalHeaderButton` reads it.
 */
import { createContext } from "react";
import type { Insets } from "../primitives/reactNative";

import type { FocusIndicator } from "../focusRing";

/** The gap between the header actions and the close button, in px. */
export const WEB_MODAL_HEADER_GAP = 4;

/** The native hit slop of a header button with no neighbour, in px. */
const HEADER_BUTTON_SLOP = 10;

/**
 * Where a header button sits: `alone` with no neighbour, `action` among the
 * caller's actions, or `close` after the actions.
 */
export type WebModalHeaderPosition = "action" | "alone" | "close";

export type WebModalHeaderGroup = {
  /** The frame's focus indicator, the default of each header button. */
  focusIndicator?: FocusIndicator;
  position: WebModalHeaderPosition;
};

export const WebModalHeaderGroupContext = createContext<WebModalHeaderGroup>({
  position: "alone",
});

/**
 * The native hit slop of a header button outside a `TouchSurface`. An edge
 * that faces a neighbour takes half the gap, so two slops never overlap and
 * Close never takes a tap meant for the action beside it. React Native gives
 * an overlapped touch to the later sibling, which is Close. The other edges
 * keep the 10px slop that the close button had alone. The first action cannot
 * tell that it is first, so its left edge also takes half the gap.
 */
export function webModalHeaderButtonHitSlop(
  position: WebModalHeaderPosition,
): Insets {
  const shared = WEB_MODAL_HEADER_GAP / 2;
  return {
    bottom: HEADER_BUTTON_SLOP,
    left: position === "alone" ? HEADER_BUTTON_SLOP : shared,
    right: position === "action" ? shared : HEADER_BUTTON_SLOP,
    top: HEADER_BUTTON_SLOP,
  };
}
