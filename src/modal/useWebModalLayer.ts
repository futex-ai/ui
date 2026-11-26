/**
 * Joins a web modal frame to the shared web modal stack while it is open.
 *
 * Each frame instance owns one stable stack layer. The layer links to the
 * nearest enclosing frame through {@link WebModalLayerContext}, so a dialog
 * rendered inside another dialog's content stays above it, also when both open
 * in one render commit and React runs the nested dialog's effects first.
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { View } from "../primitives/reactNative";

import type { Focusable } from "./types";
import { webModalInitialFocusTarget } from "./webModalFocusTrap";
import type {
  WebModalCloseSource,
  WebModalInitialFocus,
} from "./webModalModel";
import { pushWebModalLayer, removeWebModalLayer } from "./webModalStack";
import type { WebModalLayer } from "./webModalStack";

/** The layer of the nearest enclosing frame, or `null` outside every frame. */
export const WebModalLayerContext = createContext<WebModalLayer | null>(null);

/** The frame's refs and close request that its stack layer reads. */
export type WebModalLayerOptions = {
  /** The header close button, which the default initial focus skips. */
  closeButtonRef: RefObject<View | null>;
  /** Whether opening focuses the entry control or the surface. */
  initialFocus: WebModalInitialFocus;
  /** The caller's entry control, which wins over the default control. */
  initialFocusRef?: RefObject<Focusable | null>;
  /** The frame's top-level node, a direct child of the shared root. */
  layerRef: RefObject<View | null>;
  /** Closes the frame through its close policy. */
  requestClose: (source: WebModalCloseSource) => void;
  /** The `role="dialog"` surface that holds Tab while the frame is on top. */
  surfaceRef: RefObject<View | null>;
  /** Whether the frame is open. */
  visible: boolean;
};

/**
 * Creates the frame's stack layer once and keeps it on the stack while
 * `visible` holds, and the cleanup's removal restores focus. The push runs in
 * a passive effect on purpose: React runs every passive cleanup in a commit
 * before any passive create, and overlays return focus to their trigger in a
 * passive cleanup. So when one update closes a popover or a command palette
 * and opens a dialog, the trigger has focus again when the push records the
 * dialog's opener. Returns the layer: the frame provides it to its content
 * through {@link WebModalLayerContext}, so a nested frame links to it.
 */
export function useWebModalLayer({
  closeButtonRef,
  initialFocus,
  initialFocusRef,
  layerRef,
  requestClose,
  surfaceRef,
  visible,
}: WebModalLayerOptions): WebModalLayer {
  const parent = useContext(WebModalLayerContext);
  const initialFocusModeRef = useRef(initialFocus);
  const initialFocusTargetRef = useRef(initialFocusRef);
  const requestCloseRef = useRef(requestClose);
  initialFocusModeRef.current = initialFocus;
  initialFocusTargetRef.current = initialFocusRef;
  requestCloseRef.current = requestClose;
  // The layer keeps the first render's resolver. It reads only refs, so it
  // stays current.
  const entryFocusTargets = () => {
    const defaultTarget = webModalInitialFocusTarget(
      hostElement(surfaceRef),
      hostElement(closeButtonRef),
    );
    const callerTarget = initialFocusTargetRef.current?.current;
    return [callerTarget, defaultTarget].filter(
      (target): target is Focusable => target != null,
    );
  };
  const [layer] = useState<WebModalLayer>(() => ({
    entryFocusTargets,
    openFocusTarget: () =>
      initialFocusModeRef.current === "surface"
        ? hostElement(surfaceRef)
        : (entryFocusTargets()[0] ?? null),
    parent,
    requestClose: (source) => requestCloseRef.current(source),
    root: () => hostElement(layerRef),
    surface: () => hostElement(surfaceRef),
  }));

  useEffect(() => {
    if (!visible) {
      return;
    }
    pushWebModalLayer(layer);
    return () => {
      removeWebModalLayer(layer);
    };
  }, [layer, visible]);

  return layer;
}

/** The DOM backend resolves a `View` ref to its host node; narrow it. */
function hostElement(ref: RefObject<View | null>): HTMLElement | null {
  const node = ref.current as unknown;
  return node instanceof HTMLElement ? node : null;
}
