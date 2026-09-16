/**
 * Who holds the interaction lock, and how a handler is called.
 *
 * The mutable half of the responder system, in its own module so
 * `ResponderSystem.ts` (the DOM listeners) and `negotiation.ts` (who wants the
 * lock) can both reach it without importing each other.
 */
import type { ResponderEvent } from "./createResponderEvent";

/** A responder callback that decides. */
export type ResponderPredicate = (event: ResponderEvent) => boolean;
/** A responder callback that reacts. */
type ResponderHandler = (event: ResponderEvent) => void;

/** The handlers a node registers with the system. */
export type ResponderConfig = {
  onResponderEnd?: ResponderHandler | null;
  onResponderGrant?: ((event: ResponderEvent) => void | boolean) | null;
  onResponderMove?: ResponderHandler | null;
  onResponderRelease?: ResponderHandler | null;
  onResponderReject?: ResponderHandler | null;
  onResponderStart?: ResponderHandler | null;
  onResponderTerminate?: ResponderHandler | null;
  onResponderTerminationRequest?: ResponderPredicate | null;
  onStartShouldSetResponder?: ResponderPredicate | null;
  onStartShouldSetResponderCapture?: ResponderPredicate | null;
  onMoveShouldSetResponder?: ResponderPredicate | null;
  onMoveShouldSetResponderCapture?: ResponderPredicate | null;
  onScrollShouldSetResponder?: ResponderPredicate | null;
  onScrollShouldSetResponderCapture?: ResponderPredicate | null;
  onSelectionChangeShouldSetResponder?: ResponderPredicate | null;
  onSelectionChangeShouldSetResponderCapture?: ResponderPredicate | null;
};

/** The lock holder, or the empty one. */
export type ResponderInstance = {
  id: number | null;
  idPath: number[] | null;
  node: Element | null;
};

/** The capture and bubble callback names one event type negotiates with. */
export type ShouldSetRegistration = [
  capture: keyof ResponderConfig,
  bubble: keyof ResponderConfig,
  options: { bubbles: boolean },
];

const emptyConfig: ResponderConfig = {};
export const emptyResponder: ResponderInstance = {
  id: null,
  idPath: null,
  node: null,
};

export const responderListenersMap = new Map<number, ResponderConfig>();

let currentResponder: ResponderInstance = {
  id: null,
  idPath: null,
  node: null,
};

/** The node that currently holds the lock, with the path it was claimed on. */
export function getCurrentResponder(): ResponderInstance {
  return currentResponder;
}

export function changeCurrentResponder(responder: ResponderInstance) {
  currentResponder = responder;
}

export function getResponderConfig(id: number): ResponderConfig {
  return responderListenersMap.get(id) ?? emptyConfig;
}

export function dispatch(
  handler: ((event: ResponderEvent) => unknown) | null | undefined,
  event: ResponderEvent,
  registrationName: string,
  currentTarget: Element | null,
): unknown {
  if (handler == null) {
    return undefined;
  }
  event.currentTarget = currentTarget;
  event.dispatchConfig.registrationName = registrationName;
  return handler(event);
}
