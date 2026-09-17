/**
 * The DOM event names the responder system listens to, and what each means.
 *
 * A transcription of `react-native-web` 0.21.2's
 * `modules/useResponderEvents/ResponderEventTypes.js`. The system predates
 * pointer events and is still written in terms of the mouse/touch pair, because
 * that is what decides which gesture wins: a `mousedown` that a browser
 * synthesised after a `touchstart` has to be told apart from a real one.
 */

/** Window blur, which terminates the current responder. */
export const BLUR = "blur";
/** The native context menu, which terminates the current responder. */
export const CONTEXT_MENU = "contextmenu";
export const FOCUS_OUT = "focusout";
export const MOUSE_DOWN = "mousedown";
export const MOUSE_MOVE = "mousemove";
export const MOUSE_UP = "mouseup";
/** A drag start is how a mouse gesture is cancelled. */
export const MOUSE_CANCEL = "dragstart";
export const TOUCH_START = "touchstart";
export const TOUCH_MOVE = "touchmove";
export const TOUCH_END = "touchend";
export const TOUCH_CANCEL = "touchcancel";
export const SCROLL = "scroll";
export const SELECT = "select";
export const SELECTION_CHANGE = "selectionchange";

/** A pointer went down. */
export function isStartish(eventType: unknown): boolean {
  return eventType === TOUCH_START || eventType === MOUSE_DOWN;
}

/** A pointer moved. */
export function isMoveish(eventType: unknown): boolean {
  return eventType === TOUCH_MOVE || eventType === MOUSE_MOVE;
}

/** A pointer came up, or the gesture was cancelled. */
export function isEndish(eventType: unknown): boolean {
  return (
    eventType === TOUCH_END || eventType === MOUSE_UP || isCancelish(eventType)
  );
}

/** The gesture was cancelled rather than completed. */
export function isCancelish(eventType: unknown): boolean {
  return eventType === TOUCH_CANCEL || eventType === MOUSE_CANCEL;
}

/** A native scroll happened. */
export function isScroll(eventType: unknown): boolean {
  return eventType === SCROLL;
}

/** Text selection changed. */
export function isSelectionChange(eventType: unknown): boolean {
  return eventType === SELECT || eventType === SELECTION_CHANGE;
}
