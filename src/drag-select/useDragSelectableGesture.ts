/**
 * The web drag gesture of a provider: it accepts presses through the start
 * rules and runs one session per accepted press. Only the web provider uses
 * it; every DOM access happens in an event handler or an effect.
 */
import { useCallback, useEffect, useRef, useState } from "react";

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
  commit: (hitIds: string[]) => void;
  disabled: boolean;
  minimumDragDistance?: number;
  registry: DragSelectableRegistry;
};

/** The gesture state and the handler for the provider element. */
export type DragSelectableGesture = {
  activeDrag: DragSelectableActiveDrag | null;
  onPointerDown: (event: { nativeEvent?: unknown }) => void;
};

/** Runs the drag gesture for one provider. */
export function useDragSelectableGesture(
  config: DragSelectableGestureConfig,
): DragSelectableGesture {
  const configRef = useRef(config);
  configRef.current = config;
  const sessionRef = useRef<DragSelectableSession | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragSelectableActiveDrag | null>(
    null,
  );

  const onPointerDown = useCallback((event: { nativeEvent?: unknown }) => {
    if (typeof document === "undefined") {
      return;
    }
    const current = configRef.current;
    const native = (event.nativeEvent ?? event) as DragSelectablePressEvent;
    const press = dragSelectableAcceptPress(native, {
      disabled: current.disabled,
      hasEnabledTarget: current.registry.hasEnabledTarget,
      minimumDragDistance: current.minimumDragDistance,
      targets: () => current.registry.targetsRef.current.values(),
    });
    if (!press) {
      return;
    }
    sessionRef.current?.stop();
    let session: DragSelectableSession | null = null;
    session = startDragSelectableSession(
      {
        pointerId: press.pointerId,
        press: press.point,
        threshold: press.threshold,
      },
      dragSelectableSessionDom({
        commit: (hitIds) => configRef.current.commit(hitIds),
        container: press.container,
        end: () => {
          if (sessionRef.current === session) {
            sessionRef.current = null;
          }
        },
        render: setActiveDrag,
        targets: () => configRef.current.registry.targetsRef.current.values(),
      }),
    );
    sessionRef.current = session;
  }, []);

  useEffect(() => {
    if (config.disabled) {
      sessionRef.current?.cancel();
    }
  }, [config.disabled]);

  useEffect(
    () => () => {
      sessionRef.current?.stop();
    },
    [],
  );

  return { activeDrag, onPointerDown };
}
