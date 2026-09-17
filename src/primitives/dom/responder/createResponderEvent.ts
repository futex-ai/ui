/**
 * A DOM event, dressed as the `GestureResponderEvent` a handler expects.
 *
 * A transcription of `react-native-web` 0.21.2's
 * `modules/useResponderEvents/createResponderEvent.js`. Mouse events are turned
 * into single-entry touch lists so the rest of the system only has to know
 * about touches, and `locationX` / `locationY` are getters: `currentTarget` is
 * not known until the event is dispatched, and measuring its box eagerly would
 * force layout on every move.
 */
import type { ResponderTouch, TouchHistory } from "./touchHistory";

/** The event object a responder handler is called with. */
export type ResponderEvent = {
  bubbles: boolean;
  cancelable: boolean;
  currentTarget: Element | null;
  defaultPrevented: boolean | undefined;
  dispatchConfig: { registrationName?: string };
  eventPhase: number | undefined;
  isDefaultPrevented: () => boolean;
  isPropagationStopped: () => boolean;
  isTrusted: boolean | undefined;
  nativeEvent: ResponderNativeEvent;
  persist: () => void;
  preventDefault: () => void;
  stopPropagation: () => void;
  target: EventTarget | null;
  timeStamp: number;
  touchHistory: TouchHistory;
};

/** The `nativeEvent` payload of a {@link ResponderEvent}. */
export type ResponderNativeEvent = {
  altKey: boolean;
  changedTouches: ResponderTouch[];
  ctrlKey: boolean;
  force: number;
  identifier: number;
  locationX: number | undefined;
  locationY: number | undefined;
  metaKey: boolean;
  pageX: number;
  pageY: number;
  shiftKey: boolean;
  target: EventTarget | null;
  timestamp: number;
  touches: ResponderTouch[];
  type: string;
};

const emptyFunction = () => {};
const emptyTouches: ResponderTouch[] = [];
const emptyDomTouches: DomTouch[] = [];

/**
 * Safari hands out very large touch identifiers, and the touch bank is an
 * array indexed by them, so they are folded back into `[0, 20)`.
 */
function normalizeIdentifier(identifier: number): number {
  return identifier > 20 ? identifier % 20 : identifier;
}

type DomTouch = {
  clientX: number;
  clientY: number;
  force?: number;
  identifier: number;
  pageX: number;
  pageY: number;
  target: EventTarget | null;
};

type DomGestureEvent = Partial<MouseEvent> & {
  changedTouches?: ArrayLike<DomTouch>;
  touches?: ArrayLike<DomTouch>;
};

/** Converts a DOM mouse or touch event into a responder event. */
export function createResponderEvent(
  domEvent: DomGestureEvent,
  touchHistory: TouchHistory,
): ResponderEvent {
  let rect: DOMRect | null | undefined;
  let propagationWasStopped = false;

  const domEventChangedTouches = domEvent.changedTouches;
  const firstChanged =
    domEventChangedTouches != null ? domEventChangedTouches[0] : undefined;
  const domEventType = domEvent.type ?? "";

  const metaKey = domEvent.metaKey === true;
  const shiftKey = domEvent.shiftKey === true;
  const force = firstChanged?.force ?? 0;
  const identifier = normalizeIdentifier(firstChanged?.identifier ?? 0);
  const clientX = firstChanged?.clientX ?? domEvent.clientX ?? 0;
  const clientY = firstChanged?.clientY ?? domEvent.clientY ?? 0;
  const pageX = firstChanged?.pageX ?? domEvent.pageX ?? 0;
  const pageY = firstChanged?.pageY ?? domEvent.pageY ?? 0;
  const preventDefault =
    typeof domEvent.preventDefault === "function"
      ? domEvent.preventDefault.bind(domEvent)
      : emptyFunction;
  const timestamp = domEvent.timeStamp ?? 0;

  function locationX(x: number): number | undefined {
    rect ??= responderEvent.currentTarget?.getBoundingClientRect();
    return rect ? x - rect.left : undefined;
  }
  function locationY(y: number): number | undefined {
    rect ??= responderEvent.currentTarget?.getBoundingClientRect();
    return rect ? y - rect.top : undefined;
  }

  function normalizeTouches(touches: ArrayLike<DomTouch>): ResponderTouch[] {
    return Array.prototype.slice.call(touches).map((touch: DomTouch) => ({
      force: touch.force ?? 0,
      identifier: normalizeIdentifier(touch.identifier),
      get locationX() {
        return locationX(touch.clientX);
      },
      get locationY() {
        return locationY(touch.clientY);
      },
      pageX: touch.pageX,
      pageY: touch.pageY,
      target: touch.target,
      timestamp,
    }));
  }

  let changedTouches: ResponderTouch[];
  let touches: ResponderTouch[];
  if (domEventChangedTouches != null) {
    changedTouches = normalizeTouches(domEventChangedTouches);
    touches = normalizeTouches(domEvent.touches ?? emptyDomTouches);
  } else {
    const emulatedTouches: ResponderTouch[] = [
      {
        force,
        identifier,
        get locationX() {
          return locationX(clientX);
        },
        get locationY() {
          return locationY(clientY);
        },
        pageX,
        pageY,
        target: domEvent.target ?? null,
        timestamp,
      },
    ];
    changedTouches = emulatedTouches;
    // A mouse that has come up, or started a drag, leaves no active touch.
    touches =
      domEventType === "mouseup" || domEventType === "dragstart"
        ? emptyTouches
        : emulatedTouches;
  }

  const responderEvent: ResponderEvent = {
    bubbles: true,
    cancelable: true,
    // Assigned by the system immediately before each dispatch.
    currentTarget: null,
    defaultPrevented: domEvent.defaultPrevented,
    dispatchConfig: {},
    eventPhase: domEvent.eventPhase,
    isDefaultPrevented: () => domEvent.defaultPrevented === true,
    isPropagationStopped: () => propagationWasStopped,
    isTrusted: domEvent.isTrusted,
    nativeEvent: {
      altKey: false,
      changedTouches,
      ctrlKey: false,
      force,
      identifier,
      get locationX() {
        return locationX(clientX);
      },
      get locationY() {
        return locationY(clientY);
      },
      metaKey,
      pageX,
      pageY,
      shiftKey,
      target: domEvent.target ?? null,
      timestamp,
      touches,
      type: domEventType,
    },
    persist: emptyFunction,
    preventDefault,
    stopPropagation() {
      propagationWasStopped = true;
    },
    target: domEvent.target ?? null,
    timeStamp: timestamp,
    touchHistory,
  };

  return responderEvent;
}
