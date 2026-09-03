/** Modal-backed native dropdown surface anchored to a measured trigger. */
import { useRef } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";

import { devWarn } from "../devWarn";

import { dropdownContentWidthStyle } from "./dropdownContentWidthStyle";
import { dropdownPlacement, dropdownWidthBounds } from "./dropdownGeometry";
import { dropdownPortalZIndex } from "./dropdownLayers";
import {
  DropdownPortalProps,
  dropdownSurfaceRect,
  useDropdownSurfaceStyles,
} from "./dropdownPortalModel";
import { useDropdownAnchor } from "./useDropdownAnchor";
import { useDropdownContentWidth } from "./useDropdownContentWidth";

/**
 * Native menus render inside a transparent `Modal` so the scrim catches
 * outside taps and the hardware back button closes the menu. The web
 * implementation in `DropdownPortal.web.tsx` is non-modal so page hover
 * targets stay live while a menu is open.
 */
export function DropdownPortal({
  align = "start",
  anchorRect,
  anchorRef,
  anchorWidthAsMinimum,
  children,
  fitContentWidth = false,
  gutter,
  margin,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  onClose,
  open,
  surfaceHoverProps,
  testID,
  zIndex,
}: DropdownPortalProps) {
  // A virtual anchor carries its own geometry, so there is no element to
  // measure; the fallback ref keeps the hook's signature satisfied.
  const fallbackAnchorRef = useRef<View>(null);
  if (!anchorRef && !anchorRect) {
    devWarn("DropdownPortal needs an anchorRef or an anchorRect.");
  }
  const { anchor, viewport } = useDropdownAnchor(
    anchorRef ?? fallbackAnchorRef,
    open,
    anchorRect,
  );
  const contentWidth = useDropdownContentWidth(fitContentWidth && open);
  const surfaceStyles = useDropdownSurfaceStyles();

  if (!open) {
    return null;
  }

  const placementOptions = {
    align,
    anchorWidthAsMinimum,
    gutter,
    margin,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
  };
  const placement = anchor
    ? dropdownPlacement(
        anchor,
        viewport,
        placementOptions,
        contentWidth.width ?? anchor.width,
      )
    : null;
  const widthBounds = anchor
    ? dropdownWidthBounds(anchor, viewport, placementOptions)
    : null;

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={[styles.layer, { zIndex: dropdownPortalZIndex(zIndex) }]}>
        <Pressable
          accessibilityLabel="Close dropdown"
          onPress={onClose}
          style={styles.scrim}
        />
        {placement ? (
          <Pressable
            accessibilityViewIsModal
            onLayout={contentWidth.onLayout}
            onHoverIn={surfaceHoverProps?.onHoverIn}
            onHoverOut={surfaceHoverProps?.onHoverOut}
            style={[
              surfaceStyles.surface,
              dropdownSurfaceRect(placement, fitContentWidth),
              fitContentWidth && widthBounds
                ? dropdownContentWidthStyle(widthBounds)
                : null,
            ]}
            testID={testID}
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
  },
  scrim: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
