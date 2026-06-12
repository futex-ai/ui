/** Non-modal web portal for input-backed combobox result popovers. */
import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { View } from "react-native";

import {
  DropdownPlacement,
  DropdownPlacementOptions,
  dropdownPlacement,
} from "./dropdownGeometry";
import {
  dropdownSurfaceRect,
  useDropdownSurfaceStyles,
} from "./dropdownPortalModel";
import { DropdownWebLayer } from "./DropdownWebLayer";
import { useDropdownAnchor } from "./useDropdownAnchor";
import { useDropdownDismiss } from "./useDropdownDismiss";

type ComboboxPopoverProps = DropdownPlacementOptions & {
  anchorRef: RefObject<View | null>;
  children: (placement: DropdownPlacement) => ReactNode;
  onClose: () => void;
  open: boolean;
};

/**
 * Result surface for autocomplete inputs. The surface is a plain `View`, not a
 * focusable control, so the backing input keeps focus while results are open;
 * Escape stays owned by the input's own keyboard handling.
 */
export function ComboboxPopover({
  align = "start",
  anchorRef,
  children,
  gutter,
  margin,
  maxHeight,
  minHeight,
  minWidth,
  onClose,
  open,
}: ComboboxPopoverProps) {
  const surfaceRef = useRef<View>(null);
  const { anchor, viewport } = useDropdownAnchor(anchorRef, open);
  const surfaceStyles = useDropdownSurfaceStyles();
  useDropdownDismiss({ anchorRef, onClose, open, surfaceRef });

  if (!open || !anchor) {
    return null;
  }

  const placement = dropdownPlacement(anchor, viewport, {
    align,
    gutter,
    margin,
    maxHeight,
    minHeight,
    minWidth,
  });
  return (
    <DropdownWebLayer>
      <View
        ref={surfaceRef}
        style={[surfaceStyles.surface, dropdownSurfaceRect(placement)]}
      >
        {children(placement)}
      </View>
    </DropdownWebLayer>
  );
}
