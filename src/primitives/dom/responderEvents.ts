/**
 * The gesture responder system, on loan from `react-native-web` for M2.
 *
 * `PanResponder` is one of the six names the seam still delegates to that
 * package until M3, and its handlers are spread onto a `View`, so the backend's
 * `View` has to speak the same responder protocol — including the
 * `touchHistory` a `PanResponder`'s gesture state is computed from. Porting the
 * responder system is M3's `dom/useResponder.ts`; until then this one module is
 * the only place the DOM backend reaches into `react-native-web`, and it goes
 * away with `PanResponder`.
 */
import type { RefObject } from "react";

// The explicit `index.js` is what Node's ESM resolver needs: a bare directory
// import only works under the CommonJS resolver, and the package smoke's Node
// consumer runs the packed build through the ESM one.
import useResponderEventsImpl from "react-native-web/dist/modules/useResponderEvents/index.js";

/** The responder negotiation and lifecycle handlers a `View` accepts. */
export const RESPONDER_PROPS = [
  "onMoveShouldSetResponder",
  "onMoveShouldSetResponderCapture",
  "onResponderEnd",
  "onResponderGrant",
  "onResponderMove",
  "onResponderReject",
  "onResponderRelease",
  "onResponderStart",
  "onResponderTerminate",
  "onResponderTerminationRequest",
  "onScrollShouldSetResponder",
  "onScrollShouldSetResponderCapture",
  "onSelectionChangeShouldSetResponder",
  "onSelectionChangeShouldSetResponderCapture",
  "onStartShouldSetResponder",
  "onStartShouldSetResponderCapture",
] as const;

/** Picks the responder handlers out of a prop bag. */
export function responderConfig(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const prop of RESPONDER_PROPS) {
    config[prop] = props[prop];
  }
  return config;
}

export function useResponderEvents(
  hostRef: RefObject<HTMLElement | null>,
  config: Record<string, unknown>,
): void {
  useResponderEventsImpl(hostRef, config);
}
