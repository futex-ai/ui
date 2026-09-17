/**
 * Deciding who gets the interaction lock.
 *
 * The capture-then-bubble walk `react-native-web`'s `ResponderSystem` runs on
 * every pointer down, pointer move and pointer-driven scroll, plus the transfer
 * it performs when a node wins. Split out of `ResponderSystem.ts` to keep both
 * files near the line target; the state they share lives in
 * `responderState.ts`.
 */
import type { ResponderEvent } from "./createResponderEvent";
import {
  changeCurrentResponder,
  dispatch,
  getCurrentResponder,
  getResponderConfig,
  type ResponderConfig,
  type ResponderInstance,
  type ResponderPredicate,
  type ShouldSetRegistration,
} from "./responderState";
import { getLowestCommonAncestor, type ResponderPaths } from "./utils";

const startRegistration: ShouldSetRegistration = [
  "onStartShouldSetResponderCapture",
  "onStartShouldSetResponder",
  { bubbles: true },
];
const moveRegistration: ShouldSetRegistration = [
  "onMoveShouldSetResponderCapture",
  "onMoveShouldSetResponder",
  { bubbles: true },
];
// A scroll does not bubble: only the node that scrolled may claim the lock.
const scrollRegistration: ShouldSetRegistration = [
  "onScrollShouldSetResponderCapture",
  "onScrollShouldSetResponder",
  { bubbles: false },
];
const shouldSetResponderEvents: Record<string, ShouldSetRegistration> = {
  mousedown: startRegistration,
  mousemove: moveRegistration,
  scroll: scrollRegistration,
  touchmove: moveRegistration,
  touchstart: startRegistration,
};

/**
 * Walks the path to and from the target, asking each node whether it wants the
 * lock. Capture runs outermost-in, then bubble innermost-out; either stops
 * early if a handler called `stopPropagation`.
 */
export function findWantsResponder(
  eventPaths: ResponderPaths,
  domEvent: Event,
  responderEvent: ResponderEvent,
): ResponderInstance | undefined {
  const shouldSetCallbacks = shouldSetResponderEvents[domEvent.type];
  if (shouldSetCallbacks == null) {
    return undefined;
  }
  const { idPath, nodePath } = eventPaths;
  const [captureName, bubbleName, { bubbles }] = shouldSetCallbacks;

  const check = (
    id: number,
    node: Element,
    callbackName: keyof ResponderConfig,
  ): ResponderInstance | undefined => {
    const callback = getResponderConfig(id)[callbackName] as
      | ResponderPredicate
      | null
      | undefined;
    if (callback != null) {
      responderEvent.currentTarget = node;
      if (callback(responderEvent) === true) {
        // The claimed path starts at the node that wants the lock.
        return { id, idPath: idPath.slice(idPath.indexOf(id)), node };
      }
    }
    return undefined;
  };

  for (let index = idPath.length - 1; index >= 0; index--) {
    const result = check(
      idPath[index],
      nodePath[index] as Element,
      captureName,
    );
    if (result != null) {
      return result;
    }
    if (responderEvent.isPropagationStopped()) {
      return undefined;
    }
  }

  if (!bubbles) {
    return domEvent.target === nodePath[0]
      ? check(idPath[0], nodePath[0] as Element, bubbleName)
      : undefined;
  }
  for (let index = 0; index < idPath.length; index++) {
    const result = check(idPath[index], nodePath[index] as Element, bubbleName);
    if (result != null) {
      return result;
    }
    if (responderEvent.isPropagationStopped()) {
      return undefined;
    }
  }
  return undefined;
}

/** Grants the lock outright, or negotiates it away from the current holder. */
export function attemptTransfer(
  responderEvent: ResponderEvent,
  wantsResponder: ResponderInstance,
) {
  const { id: currentId, node: currentNode } = getCurrentResponder();
  const { id, node } = wantsResponder;
  const { onResponderGrant, onResponderReject } = getResponderConfig(
    id as number,
  );

  responderEvent.bubbles = false;
  responderEvent.cancelable = false;
  responderEvent.currentTarget = node;

  if (currentId == null) {
    dispatch(onResponderGrant, responderEvent, "onResponderGrant", node);
    changeCurrentResponder(wantsResponder);
    return;
  }

  const { onResponderTerminate, onResponderTerminationRequest } =
    getResponderConfig(currentId);
  const allowTransfer =
    dispatch(
      onResponderTerminationRequest,
      responderEvent,
      "onResponderTerminationRequest",
      currentNode,
    ) !== false;

  if (allowTransfer) {
    dispatch(
      onResponderTerminate,
      responderEvent,
      "onResponderTerminate",
      currentNode,
    );
    dispatch(onResponderGrant, responderEvent, "onResponderGrant", node);
    changeCurrentResponder(wantsResponder);
  } else {
    dispatch(onResponderReject, responderEvent, "onResponderReject", node);
  }
}

/** Trims the event path to the part between the target and the current lock. */
export function pruneEventPaths(
  eventPaths: ResponderPaths,
): ResponderPaths | null {
  const currentResponder = getCurrentResponder();
  const currentResponderIdPath = currentResponder.idPath;
  if (currentResponderIdPath == null) {
    return eventPaths;
  }
  const eventIdPath = eventPaths.idPath;
  const lowestCommonAncestor = getLowestCommonAncestor(
    currentResponderIdPath,
    eventIdPath,
  );
  if (lowestCommonAncestor == null) {
    return null;
  }
  // Skip the current responder so it never gets an unexpected "shouldSet".
  const index =
    eventIdPath.indexOf(lowestCommonAncestor) +
    (lowestCommonAncestor === currentResponder.id ? 1 : 0);
  return {
    idPath: eventIdPath.slice(index),
    nodePath: eventPaths.nodePath.slice(index),
  };
}
