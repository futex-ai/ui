/** Fixed, pointer-transparent body portal layer for web dropdown surfaces. */
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { dropdownPortalZIndex } from "./dropdownLayers";

/**
 * Portals dropdown surfaces over the page without an intervening modal.
 *
 * The layer itself is `box-none`, so only the rendered surface is hit-testable
 * and the rest of the page keeps real hover and press targets while a menu is
 * open. React Native Web's `Modal` cannot provide this: its animation wrapper
 * and content container are full-viewport elements that always hit-test, which
 * steals hover from the trigger and flickers hover-opened menus shut.
 */
export function DropdownWebLayer({
  children,
  zIndex,
}: {
  children: ReactNode;
  zIndex?: number;
}) {
  if (typeof document === "undefined") {
    return null;
  }
  return createPortal(
    <View
      pointerEvents="box-none"
      style={[styles.layer, { zIndex: dropdownPortalZIndex(zIndex) }]}
    >
      {children}
    </View>,
    document.body,
  );
}

const fixedPosition = "fixed" as unknown as "absolute";

const styles = StyleSheet.create({
  layer: {
    bottom: 0,
    left: 0,
    pointerEvents: "box-none",
    position: fixedPosition,
    right: 0,
    top: 0,
  },
});
