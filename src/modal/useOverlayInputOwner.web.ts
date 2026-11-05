/**
 * Input ownership for overlays under the web modal stack. A document listener
 * sees every event in the document, also the events meant for a dialog above
 * its overlay, because `inert` only stops direct interaction with the overlay.
 * So each document listener of an overlay asks this check first, and ignores
 * the event while the overlay does not own input.
 */
import { useCallback, useContext } from "react";

import { WebModalLayerContext } from "./useWebModalLayer";
import { topWebModalLayer } from "./webModalStack";

/**
 * Returns a stable check for an overlay's document listeners: `true` while the
 * overlay's containing dialog, or the page outside every dialog, is the top of
 * the web modal stack, and `false` while a dialog above it owns input.
 */
export function useOverlayInputOwner(): () => boolean {
  const containingLayer = useContext(WebModalLayerContext);
  return useCallback(
    () => topWebModalLayer() === containingLayer,
    [containingLayer],
  );
}
