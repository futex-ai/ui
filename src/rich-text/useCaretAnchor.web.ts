/** Caret-anchored virtual rect measurement for the web slash menu. */
import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import { Platform, useWindowDimensions } from "react-native";

import type { DropdownAnchorRect, DropdownViewport } from "../dropdown";

import { caretRect } from "./domSelection.web";

type CaretAnchorState = {
  anchor: DropdownAnchorRect | null;
  viewport: DropdownViewport;
};

/**
 * Measures the current editor caret in viewport coordinates while the slash
 * menu is open, then follows it across scroll and resize.
 */
export function useCaretAnchor(
  rootRef: RefObject<HTMLElement | null>,
  open: boolean,
): CaretAnchorState {
  const viewport = useWindowDimensions();
  const [anchor, setAnchor] = useState<DropdownAnchorRect | null>(null);

  const measure = useCallback(() => {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (
      !root ||
      !selection ||
      selection.rangeCount === 0 ||
      !selection.anchorNode ||
      !root.contains(selection.anchorNode)
    ) {
      setAnchor(null);
      return;
    }
    const rect = caretRect(selection);
    setAnchor(
      rect
        ? {
            height: Math.max(1, rect.height),
            width: Math.max(1, rect.width),
            x: rect.left,
            y: rect.top,
          }
        : null,
    );
  }, [rootRef]);

  useEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    measure();
    const timer = setTimeout(measure, 0);
    return () => clearTimeout(timer);
  }, [measure, open, viewport.height, viewport.width]);

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
