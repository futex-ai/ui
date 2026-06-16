/** Document-level dismissal for non-modal web dropdown portals. */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { View } from "react-native";

import { pushEscapeLayer, removeEscapeLayer } from "../escapeLayer";

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

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }
    const handlePointerDown = (event: Event) => {
      const anchorNode = anchorRef.current as unknown as DropdownNode | null;
      const surfaceNode = surfaceRef.current as unknown as DropdownNode | null;
      if (dropdownShouldClose([anchorNode, surfaceNode], event.target)) {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    const layer = { onEscape: () => onCloseRef.current() };
    pushEscapeLayer(layer);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      removeEscapeLayer(layer);
    };
  }, [anchorRef, open, surfaceRef]);
}
