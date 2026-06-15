/** Themed web marquee overlay for drag selection. */
import { createPortal } from "react-dom";
import { StyleSheet, Text, View } from "react-native";

import { DRAG_SELECTABLE_LAYERS } from "./dragSelectableLayers";
import type { DragSelectableBox } from "./dragSelectableModel";
import type { DragSelectableTargetSnapshot } from "./dragSelectableTypes";
import type { SharedUiTheme } from "../theme";

export type DragSelectableActiveDrag = {
  box: DragSelectableBox | null;
  matchedTargets: DragSelectableTargetSnapshot[];
  moved: boolean;
};

export function DragSelectableOverlay({
  activeDrag,
  overlayZIndex,
  selectionLabel,
  theme,
}: {
  activeDrag: DragSelectableActiveDrag | null;
  overlayZIndex?: number;
  selectionLabel?: (count: number) => string;
  theme: SharedUiTheme;
}) {
  if (
    !activeDrag?.moved ||
    !activeDrag.box ||
    typeof document === "undefined"
  ) {
    return null;
  }
  const count = activeDrag.matchedTargets.length;
  const label =
    selectionLabel?.(count) ?? `${count} item${count === 1 ? "" : "s"}`;
  return createPortal(
    <View
      pointerEvents="none"
      style={[
        styles.marquee,
        {
          backgroundColor: `${theme.colors.primary}1A`,
          borderColor: theme.colors.primary,
          borderRadius: theme.radii.sm,
          height: activeDrag.box.height,
          left: activeDrag.box.left,
          top: activeDrag.box.top,
          width: activeDrag.box.width,
          zIndex: overlayZIndex ?? DRAG_SELECTABLE_LAYERS.overlay,
        },
      ]}
    >
      <Text
        style={[
          styles.cursor,
          {
            color: theme.colors.primaryDeep,
            fontFamily: theme.fonts.sans,
          },
        ]}
      >
        Select
      </Text>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radii.sm,
          },
        ]}
      >
        <Text style={[styles.badgeText, { fontFamily: theme.fonts.sans }]}>
          {label}
        </Text>
      </View>
    </View>,
    document.body,
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    bottom: -13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: -16,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  cursor: {
    fontSize: 11,
    fontWeight: "800",
    left: 8,
    position: "absolute",
    top: 6,
  },
  marquee: {
    borderWidth: 1.5,
    position: "fixed" as "absolute",
  },
});
