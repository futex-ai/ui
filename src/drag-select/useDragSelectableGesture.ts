/**
 * The web drag gesture of a provider: it accepts presses through the start
 * rules and runs one session per accepted press. Only the web provider uses
 * it; every DOM access happens in an event handler or an effect.
 */
import { useCallback, useEffect, useRef, useState } from "react";

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

/** The gesture state and the handler for the provider element. */
export type DragSelectableGesture = {
  activeDrag: DragSelectableActiveDrag | null;
  onPointerDown: (event: DragSelectablePointerDown) => void;
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
    sessionRef.current?.stop();
    let session: DragSelectableSession | null = null;
    session = startDragSelectableSession(
      {
        mode: press.mode,
        pointerId: press.pointerId,
        press: press.point,
        preventTextSelection: options.preventTextSelection,
        threshold: press.threshold,
      },
      dragSelectableSessionDom({
        commit: (hitIds) => configRef.current.commit(hitIds, press.mode),
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
