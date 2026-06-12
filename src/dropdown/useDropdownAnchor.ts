/** Anchor measurement state for portal-backed dropdown surfaces. */
import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import { useWindowDimensions, View } from "react-native";

import type { DropdownAnchorRect, DropdownViewport } from "./dropdownGeometry";

type DropdownAnchorState = {
  anchor: DropdownAnchorRect | null;
  viewport: DropdownViewport;
};

/**
 * Measures the trigger in window coordinates while the dropdown is open and
 * re-measures on open and viewport changes so placement tracks the anchor.
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

  return { anchor, viewport };
}
