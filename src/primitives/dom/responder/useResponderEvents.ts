/**
 * Connecting a host node to the responder system from React.
 *
 * A transcription of `react-native-web` 0.21.2's
 * `modules/useResponderEvents/index.js`: each hook instance gets a stable id,
 * attaches the document listeners once, and registers the node only while at
 * least one `on*ShouldSetResponder` prop is present — so a `View` with no
 * responder props costs nothing and never appears on an event path.
 */
import { useEffect, useRef, type RefObject } from "react";

import {
  addNode,
  attachListeners,
  removeNode,
  type ResponderConfig,
} from "./ResponderSystem";

/** The responder negotiation and lifecycle handlers a primitive accepts. */
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

/** The subset of {@link RESPONDER_PROPS} that can claim the interaction lock. */
const SHOULD_SET_PROPS = [
  "onMoveShouldSetResponder",
  "onMoveShouldSetResponderCapture",
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
): ResponderConfig {
  const config: Record<string, unknown> = {};
  for (const prop of RESPONDER_PROPS) {
    config[prop] = props[prop];
  }
  return config as ResponderConfig;
}

let idCounter = 0;

/** Registers `hostRef`'s node with the responder system while `config` needs it. */
export function useResponderEvents(
  hostRef: RefObject<HTMLElement | null>,
  config: ResponderConfig = {},
): void {
  const idRef = useRef<number | null>(null);
  idRef.current ??= idCounter++;
  const id = idRef.current;
  const isAttachedRef = useRef(false);

  // Separate from the registration effect so a changing config never
  // re-installs the document listeners or drops the node on unmount early.
  useEffect(() => {
    attachListeners();
    return () => removeNode(id);
  }, [id]);

  useEffect(() => {
    const requiresResponderSystem = SHOULD_SET_PROPS.some(
      (prop) => config[prop] != null,
    );
    if (requiresResponderSystem) {
      addNode(id, hostRef.current, config);
      isAttachedRef.current = true;
    } else if (isAttachedRef.current) {
      removeNode(id);
      isAttachedRef.current = false;
    }
  }, [config, hostRef, id]);
}
