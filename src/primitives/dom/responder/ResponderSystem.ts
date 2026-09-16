/**
 * The gesture responder system: one global interaction lock over the document.
 *
 * A transcription of `react-native-web` 0.21.2's
 * `modules/useResponderEvents/ResponderSystem.js`. Being "the responder" means
 * pointer interactions belong to that view exclusively; the lock is negotiated
 * on pointer down, pointer move, and a scroll or selection change while a
 * pointer is down, and can only be transferred to a node on the path between
 * the event target and the current responder.
 *
 * Every listener is on `document` (or `window` for its blur) rather than on the
 * React tree, because React has no plugin API for this. Nodes register through
 * {@link addNode}, which tags them with an id; an event's path is then filtered
 * to the tagged nodes and walked capture-then-bubble to find the first one that
 * wants the lock.
 */
import {
  createResponderEvent,
  type ResponderEvent,
} from "./createResponderEvent";
import {
  isCancelish,
  isEndish,
  isMoveish,
  isScroll,
  isSelectionChange,
  isStartish,
} from "./eventTypes";
import {
  attemptTransfer,
  findWantsResponder,
  pruneEventPaths,
} from "./negotiation";
import {
  changeCurrentResponder,
  dispatch,
  emptyResponder,
  getCurrentResponder,
  getResponderConfig,
  responderListenersMap,
  type ResponderConfig,
} from "./responderState";
import { ResponderTouchHistoryStore } from "./touchHistory";
import {
  getResponderPaths,
  hasTargetTouches,
  hasValidSelection,
  isPrimaryPointerDown,
  setResponderId,
} from "./utils";

export type { ResponderConfig };

const responderTouchHistoryStore = new ResponderTouchHistoryStore();

let isEmulatingMouseEvents = false;
let trackedTouchCount = 0;

/** Whether the browser is replaying a touch gesture as mouse events. */
function shouldIgnoreEmulatedEvent(eventType: string): boolean {
  if (eventType === "touchstart") {
    isEmulatingMouseEvents = true;
  }
  if (eventType === "touchmove" || trackedTouchCount > 1) {
    isEmulatingMouseEvents = false;
  }
  if (
    (eventType === "mousedown" && isEmulatingMouseEvents) ||
    (eventType === "mousemove" && isEmulatingMouseEvents) ||
    // A `mousemove` with no `mousedown` before it is not part of a gesture.
    (eventType === "mousemove" && trackedTouchCount < 1)
  ) {
    return true;
  }
  if (isEmulatingMouseEvents && eventType === "mouseup") {
    if (trackedTouchCount === 0) {
      isEmulatingMouseEvents = false;
    }
    return true;
  }
  return false;
}

type GestureDomEvent = Event & {
  relatedTarget?: EventTarget | null;
  touches?: ArrayLike<{ target?: Node | null }>;
};

/** Whether this event ends the gesture for reasons outside the responder. */
function isTerminatingEvent(
  domEvent: GestureDomEvent,
  node: Element,
  isScrollEvent: boolean,
  isSelectionChangeEvent: boolean,
): boolean {
  const eventType = domEvent.type;
  const eventTarget = domEvent.target as (Node & { contains?: unknown }) | null;
  const contains = (candidate: Node | null) =>
    candidate != null &&
    typeof (candidate as Node).contains === "function" &&
    (candidate as Node).contains(node);
  return (
    isCancelish(eventType) ||
    eventType === "contextmenu" ||
    (eventType === "blur" && (domEvent.target as unknown) === window) ||
    // The responder, or one of its ancestors, lost focus.
    (eventType === "blur" &&
      contains(eventTarget) &&
      domEvent.relatedTarget !== node) ||
    // A native scroll with no pointer down took the gesture over.
    (isScrollEvent && trackedTouchCount === 0) ||
    // An ancestor scrolled; a sibling scrolling is allowed to continue.
    (isScrollEvent && contains(eventTarget) && eventTarget !== node) ||
    (isSelectionChangeEvent && hasValidSelection(domEvent))
  );
}

/** Runs the lifecycle callbacks of whatever currently holds the lock. */
function dispatchToResponder(
  domEvent: GestureDomEvent,
  responderEvent: ResponderEvent,
  wasNegotiated: boolean,
) {
  const { id, node } = getCurrentResponder();
  if (id == null || node == null) {
    return;
  }
  const config = getResponderConfig(id);
  const eventType = domEvent.type;
  responderEvent.bubbles = false;
  responderEvent.cancelable = false;
  responderEvent.currentTarget = node;

  if (isStartish(eventType) && isPrimaryPointerDown(domEvent)) {
    dispatch(config.onResponderStart, responderEvent, "onResponderStart", node);
    return;
  }
  if (isMoveish(eventType)) {
    dispatch(config.onResponderMove, responderEvent, "onResponderMove", node);
    return;
  }

  const isScrollEvent = isScroll(eventType);
  const isTerminateEvent = isTerminatingEvent(
    domEvent,
    node,
    isScrollEvent,
    isSelectionChange(eventType),
  );
  const isEndEvent = isEndish(eventType);
  const isReleaseEvent =
    isEndEvent &&
    !isTerminateEvent &&
    !hasTargetTouches(node, domEvent.touches);

  if (isEndEvent) {
    dispatch(config.onResponderEnd, responderEvent, "onResponderEnd", node);
  }
  if (isReleaseEvent) {
    dispatch(
      config.onResponderRelease,
      responderEvent,
      "onResponderRelease",
      node,
    );
    changeCurrentResponder(emptyResponder);
  }
  if (!isTerminateEvent) {
    return;
  }

  let shouldTerminate = true;
  // These three are the only events a responder may refuse to be ended by.
  if (
    eventType === "contextmenu" ||
    eventType === "scroll" ||
    eventType === "selectionchange"
  ) {
    if (wasNegotiated) {
      shouldTerminate = false;
    } else if (
      dispatch(
        config.onResponderTerminationRequest,
        responderEvent,
        "onResponderTerminationRequest",
        node,
      ) === false
    ) {
      shouldTerminate = false;
    }
  }
  if (shouldTerminate) {
    dispatch(
      config.onResponderTerminate,
      responderEvent,
      "onResponderTerminate",
      node,
    );
    changeCurrentResponder(emptyResponder);
    isEmulatingMouseEvents = false;
    trackedTouchCount = 0;
  }
}

/** The single listener every registered DOM event runs through. */
function eventListener(domEvent: GestureDomEvent) {
  const eventType = domEvent.type;
  if (shouldIgnoreEmulatedEvent(eventType)) {
    return;
  }

  const isStartEvent = isStartish(eventType) && isPrimaryPointerDown(domEvent);
  const isMoveEvent = isMoveish(eventType);
  const isEndEvent = isEndish(eventType);
  const isScrollEvent = isScroll(eventType);
  const responderEvent = createResponderEvent(
    domEvent as never,
    responderTouchHistoryStore.touchHistory,
  );

  if (isStartEvent || isMoveEvent || isEndEvent) {
    if (domEvent.touches) {
      trackedTouchCount = domEvent.touches.length;
    } else if (isStartEvent) {
      trackedTouchCount = 1;
    } else if (isEndEvent) {
      trackedTouchCount = 0;
    }
    responderTouchHistoryStore.recordTouchTrack(
      eventType,
      responderEvent.nativeEvent,
    );
  }

  let wasNegotiated = false;
  if (isStartEvent || isMoveEvent || (isScrollEvent && trackedTouchCount > 0)) {
    const eventPaths = pruneEventPaths(getResponderPaths(domEvent));
    if (eventPaths != null) {
      const wantsResponder = findWantsResponder(
        eventPaths,
        domEvent,
        responderEvent,
      );
      if (wantsResponder != null) {
        attemptTransfer(responderEvent, wantsResponder);
        wasNegotiated = true;
      }
    }
  }

  dispatchToResponder(domEvent, responderEvent, wasNegotiated);
}

const documentEventsCapturePhase = ["blur", "scroll"];
const documentEventsBubblePhase = [
  "mousedown",
  "mousemove",
  "mouseup",
  "dragstart",
  "touchstart",
  "touchmove",
  "touchend",
  "touchcancel",
  "contextmenu",
  "select",
  "selectionchange",
];

type ResponderWindow = Window & { __reactResponderSystemActive?: boolean };

/** Installs the document listeners once per page. */
export function attachListeners(): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const scope = window as ResponderWindow;
  if (scope.__reactResponderSystemActive != null) {
    return;
  }
  window.addEventListener("blur", eventListener);
  for (const eventType of documentEventsBubblePhase) {
    document.addEventListener(eventType, eventListener);
  }
  for (const eventType of documentEventsCapturePhase) {
    document.addEventListener(eventType, eventListener, true);
  }
  scope.__reactResponderSystemActive = true;
}

/** Registers a host node and the handlers it answers with. */
export function addNode(
  id: number,
  node: unknown,
  config: ResponderConfig,
): void {
  setResponderId(node, id);
  responderListenersMap.set(id, config);
}

/** Unregisters a host node, terminating it first if it holds the lock. */
export function removeNode(id: number): void {
  if (getCurrentResponder().id === id) {
    terminateResponder();
  }
  responderListenersMap.delete(id);
}

/** Ends the current gesture from outside the DOM event flow. */
export function terminateResponder(): void {
  const { id, node } = getCurrentResponder();
  if (id != null && node != null) {
    const { onResponderTerminate } = getResponderConfig(id);
    if (onResponderTerminate != null) {
      const event = createResponderEvent(
        {},
        responderTouchHistoryStore.touchHistory,
      );
      event.currentTarget = node;
      onResponderTerminate(event);
    }
    changeCurrentResponder(emptyResponder);
  }
  isEmulatingMouseEvents = false;
  trackedTouchCount = 0;
}

/** The node that currently holds the lock. For tests and debugging. */
export function getResponderNode(): Element | null {
  return getCurrentResponder().node;
}
