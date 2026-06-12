/** Document-level dismissal for non-modal web dropdown portals. */
import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { View } from "react-native";

import { dropdownShouldClose, type DropdownNode } from "./dropdownOutsideClose";

type DropdownDismissOptions = {
  anchorRef: RefObject<View | null>;
  closeOnEscape?: boolean;
  onClose: () => void;
  open: boolean;
  surfaceRef: RefObject<View | null>;
};

/**
 * Closes an open dropdown from document-level events instead of a scrim, so
 * the page under the menu stays hoverable and clickable while it is open.
 *
 * Outside presses are detected on `pointerdown` capture and pass through to
 * whatever was pressed. Escape closes on `keydown` capture and stops
 * propagation so a dropdown opened inside a web modal closes itself without
 * also closing the modal, which listens for Escape at the bubble phase.
 */
export function useDropdownDismiss({
  anchorRef,
  closeOnEscape = false,
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    if (closeOnEscape) {
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [anchorRef, closeOnEscape, open, surfaceRef]);
}
