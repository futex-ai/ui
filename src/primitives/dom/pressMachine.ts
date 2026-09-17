/**
 * The press state machine behind `Pressable`.
 *
 * A port of `react-native-web`'s `PressResponder`: the same four states, the
 * same delays (press start after 50 ms unless `delayPressIn` says otherwise,
 * long press 450 ms after that), and the same rule that a release which outran
 * the start delay fires `onPressIn` and `onPressOut` back to back. `usePress.ts`
 * is what feeds it DOM events.
 */
import type { GestureResponderEvent } from "../types";

/** How a `Pressable` configures the machine. */
export type PressConfig = {
  delayLongPress?: number | null;
  delayPressIn?: number | null;
  delayPressOut?: number | null;
  disabled?: boolean | null;
  onLongPress?: PressHandler;
  onPress?: PressHandler;
  onPressChange: (pressed: boolean) => void;
  onPressStart?: PressHandler;
  onPressMove?: PressHandler;
  onPressEnd?: PressHandler;
};

type PressHandler = ((event: GestureResponderEvent) => void) | null | undefined;

export type PressEvent = {
  nativeEvent: Record<string, unknown>;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  altKey?: boolean;
  key?: string;
  defaultPrevented?: boolean;
  preventDefault: () => void;
  stopPropagation: () => void;
};

/** Handlers a `Pressable` spreads onto its `View`. */
export type PressHandlers = {
  onClick: (event: PressEvent) => void;
  onContextMenu: (event: PressEvent) => void;
  onKeyDown: (event: PressEvent) => void;
  onPointerDown: (event: PressEvent) => void;
};

type State =
  | "NOT_RESPONDER"
  | "INACTIVE_PRESS_START"
  | "ACTIVE_PRESS_START"
  | "ACTIVE_LONG_PRESS_START";

const DEFAULT_PRESS_DELAY_MS = 50;
const DEFAULT_LONG_PRESS_DELAY_MS = 450;
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

export const NATIVE_INTERACTIVE_ELEMENTS = new Set([
  "a",
  "button",
  "input",
  "select",
  "textarea",
]);

/** The press claim an inner `Pressable` leaves on a native event. */
export const CLAIMED = "__firnaPressClaimed";

function isActive(state: State): boolean {
  return state === "ACTIVE_PRESS_START" || state === "ACTIVE_LONG_PRESS_START";
}

function isPressStart(state: State): boolean {
  return state !== "NOT_RESPONDER";
}

export function elementType(target: EventTarget | null): string {
  return target instanceof Element ? target.tagName.toLowerCase() : "";
}

export function elementRole(target: EventTarget | null): string | null {
  return target instanceof Element ? target.getAttribute("role") : null;
}

/** Enter activates anything; Space only activates a button. */
export function isValidKeyPress(event: PressEvent): boolean {
  const key = event.key;
  const isSpacebar = key === " " || key === "Spacebar";
  const isButtonish =
    elementType(event.target) === "button" ||
    elementRole(event.target) === "button";
  return key === "Enter" || (isSpacebar && isButtonish);
}

/**
 * Wraps a DOM event from the document listeners so a handler always sees the
 * React-shaped `{ nativeEvent }` the seam's `GestureResponderEvent` promises.
 */
export function fromDomEvent(event: Event): PressEvent {
  return {
    altKey: (event as MouseEvent).altKey,
    currentTarget: event.currentTarget,
    get defaultPrevented() {
      return event.defaultPrevented;
    },
    key: (event as KeyboardEvent).key,
    nativeEvent: event as unknown as Record<string, unknown>,
    preventDefault: () => event.preventDefault(),
    stopPropagation: () => event.stopPropagation(),
    target: event.target,
  };
}

/**
 * Whether a pointer down should start a press at all.
 *
 * `react-native-web`'s responder system gates every gesture on
 * `utils.js`'s `isPrimaryPointerDown`: touch always counts, a mouse only when
 * the primary button is down with neither Alt nor Control held. Without it a
 * right-click, a middle-click or a Control-click would light up the pressed
 * state and fire `onPressIn` / `onPressOut`. (`metaKey` is deliberately not
 * checked — that backend does not check it either.)
 */
export function isPrimaryPointerDown(nativeEvent: {
  altKey?: boolean;
  button?: number;
  buttons?: number;
  ctrlKey?: boolean;
  pointerType?: string;
}): boolean {
  if (nativeEvent.pointerType === "touch") {
    return true;
  }
  const isPrimaryButton = nativeEvent.button === 0 || nativeEvent.buttons === 1;
  return (
    isPrimaryButton &&
    nativeEvent.altKey === false &&
    nativeEvent.ctrlKey === false
  );
}

function normalizeDelay(delay: unknown, min = 0, fallback = 0): number {
  return Math.max(min, typeof delay === "number" ? delay : fallback);
}

function pagePoint(event: PressEvent): { pageX: number; pageY: number } {
  const native = event.nativeEvent;
  return {
    pageX: typeof native.pageX === "number" ? native.pageX : 0,
    pageY: typeof native.pageY === "number" ? native.pageY : 0,
  };
}

export type Machine = {
  config: PressConfig;
  state: State;
  isPointerTouch: boolean;
  longPressDispatched: boolean;
  responderElement: EventTarget | null;
  activatePosition: { pageX: number; pageY: number } | null;
  longPressTimeout: ReturnType<typeof setTimeout> | null;
  pressDelayTimeout: ReturnType<typeof setTimeout> | null;
  pressOutTimeout: ReturnType<typeof setTimeout> | null;
  keyupListener: ((event: KeyboardEvent) => void) | null;
  detachPointer: (() => void) | null;
};

type TimerKey = "longPressTimeout" | "pressDelayTimeout" | "pressOutTimeout";

export function clearTimer(machine: Machine, key: TimerKey) {
  const timer = machine[key];
  if (timer != null) {
    clearTimeout(timer);
    machine[key] = null;
  }
}

export function press(handler: PressHandler, event: PressEvent) {
  handler?.(event as unknown as GestureResponderEvent);
}

function activate(machine: Machine, event: PressEvent) {
  machine.activatePosition = pagePoint(event);
  press(machine.config.onPressStart, event);
  machine.config.onPressChange(true);
}

function deactivate(machine: Machine, event: PressEvent) {
  const end = () => {
    press(machine.config.onPressEnd, event);
    machine.config.onPressChange(false);
  };
  const delay = normalizeDelay(machine.config.delayPressOut);
  if (delay > 0) {
    machine.pressOutTimeout = setTimeout(end, delay);
  } else {
    end();
  }
}

export function receiveSignal(
  machine: Machine,
  signal: "GRANT" | "DELAY" | "LONG_PRESS" | "RELEASE" | "TERMINATE",
  event: PressEvent,
) {
  const previous = machine.state;
  let next: State | null = null;
  if (signal === "GRANT") {
    next = previous === "NOT_RESPONDER" ? "INACTIVE_PRESS_START" : null;
  } else if (signal === "DELAY") {
    next = previous === "INACTIVE_PRESS_START" ? "ACTIVE_PRESS_START" : null;
  } else if (signal === "LONG_PRESS") {
    next = isActive(previous) ? "ACTIVE_LONG_PRESS_START" : null;
  } else {
    next = previous === "NOT_RESPONDER" ? null : "NOT_RESPONDER";
  }
  if (next == null || next === previous) {
    return;
  }

  if (signal === "RELEASE" || signal === "TERMINATE") {
    machine.activatePosition = null;
    clearTimer(machine, "longPressTimeout");
    setTimeout(() => {
      machine.isPointerTouch = false;
    }, 0);
  }
  if (isPressStart(previous) && signal === "LONG_PRESS") {
    // Keyboards repeat `keydown`, so a long press is pointer-only.
    if (machine.config.onLongPress != null && event.key == null) {
      press(machine.config.onLongPress, event);
      machine.longPressDispatched = true;
    }
  }
  if (!isActive(previous) && isActive(next)) {
    activate(machine, event);
  } else if (isActive(previous) && !isActive(next)) {
    deactivate(machine, event);
  }
  if (isPressStart(previous) && signal === "RELEASE") {
    const cancelledByLongPress =
      machine.config.onLongPress != null &&
      previous === "ACTIVE_LONG_PRESS_START";
    if (
      machine.config.onPress != null &&
      !cancelledByLongPress &&
      !isActive(next) &&
      !isActive(previous)
    ) {
      // The press never activated (the delay outran it), so it happens now.
      activate(machine, event);
      deactivate(machine, event);
    }
  }
  clearTimer(machine, "pressDelayTimeout");
  machine.state = next;
}

export function start(
  machine: Machine,
  event: PressEvent,
  shouldDelay: boolean,
) {
  clearTimer(machine, "pressOutTimeout");
  machine.longPressDispatched = false;
  machine.state = "NOT_RESPONDER";
  receiveSignal(machine, "GRANT", event);
  const delayPressStart = normalizeDelay(
    machine.config.delayPressIn,
    0,
    DEFAULT_PRESS_DELAY_MS,
  );
  if (shouldDelay && delayPressStart > 0) {
    machine.pressDelayTimeout = setTimeout(() => {
      receiveSignal(machine, "DELAY", event);
    }, delayPressStart);
  } else {
    receiveSignal(machine, "DELAY", event);
  }
  const delayLongPress = normalizeDelay(
    machine.config.delayLongPress,
    10,
    DEFAULT_LONG_PRESS_DELAY_MS,
  );
  machine.longPressTimeout = setTimeout(() => {
    if (isActive(machine.state)) {
      receiveSignal(machine, "LONG_PRESS", event);
    }
  }, delayLongPress + delayPressStart);
}
