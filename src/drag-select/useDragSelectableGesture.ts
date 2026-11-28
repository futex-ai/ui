/**
 * The web drag gesture of a provider: it accepts presses through the start
 * rules and runs one session per accepted press. Only the web provider uses
 * it; every DOM access happens in an event handler or an effect.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import type { GestureResponderEvent } from "../primitives/types";

import type { DragSelectableResolvedOptions } from "./dragSelectableOptions";
import type { DragSelectableDragMode } from "./dragSelectableOptionTypes";
import {
  dragSelectableAcceptPress,
  type DragSelectablePressEvent,
} from "./dragSelectablePress";
import {
  startDragSelectableSession,
  type DragSelectableActiveDrag,
  type DragSelectableSession,
} from "./dragSelectableSession";
import { dragSelectableSessionDom } from "./dragSelectableSessionDom";
import type { DragSelectableRegistry } from "./useDragSelectableRegistry";

/** What the gesture needs from its provider. */
export type DragSelectableGestureConfig = {
  /** Receives the hit ids of a completed drag, in document order. */
  commit: (hitIds: string[], mode: DragSelectableDragMode) => void;
  /** The `disabled` option of this render; `true` cancels a running drag. */
  disabled: boolean;
  /** The options at call time. */
  readOptions: () => DragSelectableResolvedOptions;
  registry: DragSelectableRegistry;
};

/** The provider element's `pointerdown`, as React or the DOM delivers it. */
export type DragSelectablePointerDown = {
  currentTarget?: unknown;
  nativeEvent?: unknown;
};

/** The gesture state and the handlers for the provider element. */
export type DragSelectableGesture = {
  activeDrag: DragSelectableActiveDrag | null;
  onMoveShouldSetResponderCapture: (event: GestureResponderEvent) => boolean;
  onPointerDown: (event: DragSelectablePointerDown) => void;
};

/** Runs the drag gesture for one provider. */
export function useDragSelectableGesture(
  config: DragSelectableGestureConfig,
): DragSelectableGesture {
  const configRef = useRef(config);
  configRef.current = config;
  const sessionRef = useRef<{
    session: DragSelectableSession;
    claimResponder: ReturnType<
      typeof dragSelectableSessionDom
    >["claimResponder"];
  } | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragSelectableActiveDrag | null>(
    null,
  );

  const onPointerDown = useCallback((event: DragSelectablePointerDown) => {
    if (
      typeof document === "undefined" ||
      typeof Element === "undefined" ||
      !(event.currentTarget instanceof Element)
    ) {
      return;
    }
    const current = configRef.current;
    const native = (event.nativeEvent ?? event) as DragSelectablePressEvent;
    const options = current.readOptions();
    const press = dragSelectableAcceptPress(native, {
      hasEnabledTarget: current.registry.hasEnabledTarget,
      options,
      provider: event.currentTarget,
      targets: () => current.registry.targetsRef.current.values(),
    });
    if (!press) {
      return;
    }
    sessionRef.current?.session.stop();
    let session: DragSelectableSession | null = null;
    const env = dragSelectableSessionDom({
      commit: (hitIds) => configRef.current.commit(hitIds, press.mode),
      container: press.container,
      end: () => {
        if (sessionRef.current?.session === session) {
          sessionRef.current = null;
        }
      },
      provider: event.currentTarget,
      render: setActiveDrag,
      targets: () => configRef.current.registry.targetsRef.current.values(),
    });
    session = startDragSelectableSession(
      {
        autoScroll: options.autoScroll,
        mode: press.mode,
        pointerId: press.pointerId,
        press: press.point,
        preventTextSelection: options.preventTextSelection,
        threshold: press.threshold,
      },
      env,
    );
    sessionRef.current = { session, claimResponder: env.claimResponder };
  }, []);

  const onMoveShouldSetResponderCapture = useCallback(
    (event: GestureResponderEvent) =>
      sessionRef.current?.claimResponder(event) ?? false,
    [],
  );

  useEffect(() => {
    if (config.disabled) {
      sessionRef.current?.session.cancel();
    }
  }, [config.disabled]);

  useEffect(
    () => () => {
      sessionRef.current?.session.stop();
    },
    [],
  );

  return { activeDrag, onMoveShouldSetResponderCapture, onPointerDown };
}
