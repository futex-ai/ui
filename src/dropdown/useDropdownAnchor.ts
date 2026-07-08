/** Anchor measurement state for portal-backed dropdown surfaces. */
import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import { Platform, useWindowDimensions, View } from "react-native";

import type { DropdownAnchorRect, DropdownViewport } from "./dropdownGeometry";

type DropdownAnchorState = {
  anchor: DropdownAnchorRect | null;
  viewport: DropdownViewport;
};

/**
 * Measures the trigger in window coordinates while the dropdown is open and
 * re-measures on open, viewport changes, and page scroll so placement keeps
 * tracking the anchor.
 */
export function useDropdownAnchor(
  anchorRef: RefObject<View | null>,
  open: boolean,
): DropdownAnchorState {
  const viewport = useWindowDimensions();
  const [anchor, setAnchor] = useState<DropdownAnchorRect | null>(null);

  const measure = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ height, width, x, y });
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    measure();
    const timer = setTimeout(measure, 0);
    return () => clearTimeout(timer);
  }, [measure, open, viewport.height, viewport.width]);

  // Follow the trigger while the page scrolls. The web surface lives in a
  // `position: fixed` portal layer pinned to viewport coordinates, so when the
  // page (or any ancestor scroll container) scrolls the trigger moves but the
  // surface would stay put and visibly detach. Re-measure on scroll/resize,
  // coalesced to one animation frame so a fling does not re-measure per event.
  // Scroll is listened in the capture phase because scroll events do not bubble
  // but are observable during capture, so nested scrollers are caught too.
  // Web-only: native renders the menu in a full-screen Modal with no DOM scroll.
  useEffect(() => {
    if (!open || Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }
    let frame = 0;
    const scheduleMeasure = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", scheduleMeasure);
    return () => {
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", scheduleMeasure);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [measure, open]);

  return { anchor, viewport };
}
