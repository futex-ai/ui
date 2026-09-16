/**
 * `Pressable`'s press handlers.
 *
 * Feeds `pressMachine.ts` from DOM events: the pointer down that starts a
 * gesture, the document listeners that watch the rest of it (the way the
 * previous backend's responder system did, so a release outside the element
 * still ends the press and nothing else on the page is retargeted), the DOM
 * `click` that `onPress` actually comes from, and the keyboard activation —
 * Enter anywhere, Space on a button. An inner press marks the native event so
 * an enclosing `Pressable` stands down, which is what the responder system's
 * "deepest node wins" negotiation did.
 */
import { useEffect, useMemo, useRef } from "react";

import {
  CLAIMED,
  clearTimer,
  elementRole,
  elementType,
  fromDomEvent,
  isPrimaryPointerDown,
  isValidKeyPress,
  LONG_PRESS_MOVE_TOLERANCE_PX,
  NATIVE_INTERACTIVE_ELEMENTS,
  press,
  receiveSignal,
  start,
  type Machine,
  type PressConfig,
  type PressEvent,
  type PressHandlers,
} from "./pressMachine";

export type { PressConfig, PressHandlers } from "./pressMachine";

/** Wires the machine to a host element and returns the handlers it needs. */
export function usePress(config: PressConfig): PressHandlers {
  const machineRef = useRef<Machine | null>(null);
  machineRef.current ??= {
    activatePosition: null,
    config,
    detachPointer: null,
    isPointerTouch: false,
    keyupListener: null,
    longPressDispatched: false,
    longPressTimeout: null,
    pressDelayTimeout: null,
    pressOutTimeout: null,
    responderElement: null,
    state: "NOT_RESPONDER",
  };
  const machine = machineRef.current;
  machine.config = config;

  useEffect(() => {
    return () => {
      clearTimer(machine, "longPressTimeout");
      clearTimer(machine, "pressDelayTimeout");
      clearTimer(machine, "pressOutTimeout");
      machine.detachPointer?.();
      if (machine.keyupListener != null) {
        document.removeEventListener("keyup", machine.keyupListener);
        machine.keyupListener = null;
      }
    };
  }, [machine]);

  return useMemo(() => {
    const end = (event: PressEvent) => receiveSignal(machine, "RELEASE", event);

    /**
     * Watches the rest of the gesture on the document, the way the previous
     * backend's responder system did: a release outside the element still ends
     * the press, and nothing is retargeted away from other elements the way
     * pointer capture would.
     */
    const trackPointer = (pointerId: unknown) => {
      machine.detachPointer?.();
      const matches = (event: PointerEvent) =>
        typeof pointerId !== "number" || event.pointerId === pointerId;
      const onMove = (event: PointerEvent) => {
        if (!matches(event) || machine.state === "NOT_RESPONDER") {
          return;
        }
        const pressEvent = fromDomEvent(event);
        press(machine.config.onPressMove, pressEvent);
        const origin = machine.activatePosition;
        if (
          origin != null &&
          Math.hypot(origin.pageX - event.pageX, origin.pageY - event.pageY) >
            LONG_PRESS_MOVE_TOLERANCE_PX
        ) {
          clearTimer(machine, "longPressTimeout");
        }
      };
      const onUp = (event: PointerEvent) => {
        if (!matches(event)) {
          return;
        }
        detach();
        end(fromDomEvent(event));
      };
      const onCancel = (event: PointerEvent) => {
        if (!matches(event)) {
          return;
        }
        detach();
        receiveSignal(machine, "TERMINATE", fromDomEvent(event));
      };
      function detach() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onCancel);
        machine.detachPointer = null;
      }
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onCancel);
      machine.detachPointer = detach;
    };

    const keyupListener = (event: KeyboardEvent) => {
      const pressEvent = fromDomEvent(event);
      if (machine.state === "NOT_RESPONDER" || !isValidKeyPress(pressEvent)) {
        return;
      }
      end(pressEvent);
      document.removeEventListener("keyup", keyupListener);
      machine.keyupListener = null;
      const target = event.target;
      const isNativeInteractive =
        elementRole(target) === "link" ||
        NATIVE_INTERACTIVE_ELEMENTS.has(elementType(target));
      if (
        machine.config.onPress != null &&
        !isNativeInteractive &&
        machine.responderElement === target
      ) {
        press(machine.config.onPress, pressEvent);
      }
      machine.responderElement = null;
    };

    return {
      onClick(event) {
        if (machine.config.disabled === true) {
          if (elementRole(event.currentTarget) === "button") {
            event.stopPropagation();
          }
          return;
        }
        event.stopPropagation();
        if (machine.longPressDispatched) {
          event.preventDefault();
        } else if (machine.config.onPress != null && event.altKey === false) {
          press(machine.config.onPress, event);
        }
      },
      onContextMenu(event) {
        if (machine.config.disabled === true) {
          if (elementRole(event.currentTarget) === "button") {
            event.stopPropagation();
          }
          return;
        }
        if (
          machine.config.onLongPress != null &&
          machine.isPointerTouch &&
          event.defaultPrevented !== true
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      onKeyDown(event) {
        if (machine.config.disabled === true || !isValidKeyPress(event)) {
          return;
        }
        if (machine.state === "NOT_RESPONDER") {
          start(machine, event, false);
          machine.responderElement = event.target;
          // Listened for on the document so a keydown that moves focus still
          // completes its press.
          machine.keyupListener = keyupListener;
          document.addEventListener("keyup", keyupListener);
        }
        const isSpacebar = event.key === " " || event.key === "Spacebar";
        const role = elementRole(event.target);
        if (
          isSpacebar &&
          (role === "button" || role === "menuitem") &&
          elementType(event.target) !== "button"
        ) {
          // Stop the spacebar scrolling a non-native button's page.
          event.preventDefault();
        }
        event.stopPropagation();
      },
      onPointerDown(event) {
        const native = event.nativeEvent as Record<string, unknown>;
        // An inner `Pressable` already owns this gesture.
        if (native[CLAIMED] === true) {
          return;
        }
        // A secondary button or a modifier click is not a press, and must not
        // be claimed either — the context menu still wants it.
        if (!isPrimaryPointerDown(native)) {
          return;
        }
        if (machine.config.disabled === true) {
          if (elementRole(event.currentTarget) === "button") {
            event.stopPropagation();
          }
          return;
        }
        native[CLAIMED] = true;
        machine.isPointerTouch = native.pointerType === "touch";
        trackPointer(native.pointerId);
        start(machine, event, true);
      },
    };
  }, [machine]);
}
