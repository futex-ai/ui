/** Document-level dismissal for non-modal web dropdown portals. */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { View } from "react-native";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";

import {
  dropdownSurfacesAbove,
  pushDropdownDismissLayer,
  removeDropdownDismissLayer,
  type DropdownDismissLayer,
} from "./dropdownDismissLayers";
import { dropdownShouldClose, type DropdownNode } from "./dropdownOutsideClose";

type DropdownDismissOptions = {
  anchorRef: RefObject<View | null>;
  onClose: () => void;
  open: boolean;
  surfaceRef: RefObject<View | null>;
};

/**
 * Closes an open dropdown from document-level events instead of a scrim, so
 * the page under the menu stays hoverable and clickable while it is open.
 *
 * Outside presses are detected on `pointerdown` capture and pass through to
 * whatever was pressed. Escape is handled through the shared escape-layer stack:
 * the open menu registers as the top layer, so pressing Escape closes the menu —
 * even when it is opened inside a web modal — without also closing the modal
 * beneath it, which registers a layer of its own. See {@link pushEscapeLayer}.
 */
export function useDropdownDismiss({
  anchorRef,
  onClose,
  open,
  surfaceRef,
}: DropdownDismissOptions): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // A stable identity so this portal registers and unregisters the same layer.
  const dismissLayerRef = useRef<DropdownDismissLayer>({
    surface: () => surfaceRef.current as unknown as DropdownNode | null,
  });

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }
    const dismissLayer = dismissLayerRef.current;
    pushDropdownDismissLayer(dismissLayer);
    const handlePointerDown = (event: Event) => {
      const anchorNode = anchorRef.current as unknown as DropdownNode | null;
      const surfaceNode = surfaceRef.current as unknown as DropdownNode | null;
      // A menu opened inside this surface renders in its own sibling portal, so
      // its surface is not a DOM descendant of ours. Treat every surface stacked
      // above this one as inside, so a press on a nested option does not read as
      // an outside press and dismiss this overlay from under it.
      const descendantSurfaces = dropdownSurfacesAbove(dismissLayer);
      if (
        dropdownShouldClose(
          [anchorNode, surfaceNode, ...descendantSurfaces],
          event.target,
        )
      ) {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    const layer = { onEscape: () => onCloseRef.current() };
    pushEscapeLayer(layer);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      removeEscapeLayer(layer);
      removeDropdownDismissLayer(dismissLayer);
    };
  }, [anchorRef, open, surfaceRef]);
}
