/** Modal-backed native dropdown surface anchored to a measured trigger. */
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { dropdownPlacement } from "./dropdownGeometry";
import {
  DropdownPortalProps,
  dropdownSurfaceRect,
  useDropdownSurfaceStyles,
} from "./dropdownPortalModel";
import { DROPDOWN_LAYERS } from "./dropdownLayers";
import { useDropdownAnchor } from "./useDropdownAnchor";

/**
 * Native menus render inside a transparent `Modal` so the scrim catches
 * outside taps and the hardware back button closes the menu. The web
 * implementation in `DropdownPortal.web.tsx` is non-modal so page hover
 * targets stay live while a menu is open.
 */
export function DropdownPortal({
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
  surfaceHoverProps,
}: DropdownPortalProps) {
  const { anchor, viewport } = useDropdownAnchor(anchorRef, open);
  const surfaceStyles = useDropdownSurfaceStyles();

  if (!open) {
    return null;
  }

  const placement = anchor
    ? dropdownPlacement(anchor, viewport, {
        align,
        gutter,
        margin,
        maxHeight,
        minHeight,
        minWidth,
      })
    : null;

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.layer}>
        <Pressable
          accessibilityLabel="Close dropdown"
          onPress={onClose}
          style={styles.scrim}
        />
        {placement ? (
          <Pressable
            accessibilityViewIsModal
            onHoverIn={surfaceHoverProps?.onHoverIn}
            onHoverOut={surfaceHoverProps?.onHoverOut}
            style={[surfaceStyles.surface, dropdownSurfaceRect(placement)]}
          >
            {children(placement)}
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: DROPDOWN_LAYERS.portal,
  },
  scrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
