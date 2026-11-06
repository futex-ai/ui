/** Themed web marquee overlay for drag selection. */
import { createPortal } from "react-dom";
import { StyleSheet, Text, View } from "../primitives/reactNative";

import type { SharedUiTheme } from "../theme";

import { DRAG_SELECTABLE_LAYERS } from "./dragSelectableLayers";
import type { DragSelectableMarquee } from "./dragSelectableOptionTypes";
import type { DragSelectableOverlayProps } from "./dragSelectableOverlayTypes";
import type { DragSelectableActiveDrag } from "./dragSelectableSession";
import type { DragSelectableSelectionLabel } from "./dragSelectableTypes";
import { useDragSelectableLiveOptions } from "./useDragSelectableOptionLayers";

/**
 * Draws the box of a started drag in a fixed, non-interactive layer in a
 * body-level portal: the default themed box with its optional label and
 * badge, or the node that `renderMarquee` returns.
 */
export function DragSelectableOverlay({
  activeDrag,
  optionSource,
  theme,
}: DragSelectableOverlayProps) {
  const {
    marqueeLabel = null,
    overlayZIndex,
    renderMarquee,
    selectionLabel,
  } = useDragSelectableLiveOptions(optionSource);
  if (
    !activeDrag?.moved ||
    !activeDrag.drawnBox ||
    typeof document === "undefined"
  ) {
    return null;
  }
  const marquee: DragSelectableMarquee = {
    box: activeDrag.drawnBox,
    matchingCount: activeDrag.matchedTargets.length,
    matchingIds: activeDrag.matchedTargets.map((target) => target.id),
    matchingTargets: activeDrag.matchedTargets,
    mode: activeDrag.mode,
  };
  const { box } = marquee;
  return createPortal(
    <View
      {...MARQUEE_PROPS}
      pointerEvents="none"
      style={[
        styles.layer,
        renderMarquee ? null : defaultBoxStyle(theme),
        {
          height: box.height,
          left: box.left,
          top: box.top,
          width: box.width,
          zIndex: overlayZIndex ?? DRAG_SELECTABLE_LAYERS.overlay,
        },
      ]}
    >
      {renderMarquee
        ? renderMarquee(marquee)
        : defaultBoxContent(
            activeDrag,
            marquee,
            marqueeLabel,
            selectionLabel,
            theme,
          )}
    </View>,
    document.body,
  );
}

function defaultBoxStyle(theme: SharedUiTheme) {
  return {
    backgroundColor: `${theme.colors.primary}1A`,
    borderColor: theme.colors.primary,
    borderRadius: theme.radii.sm,
    borderWidth: 1.5,
  };
}

function defaultBoxContent(
  activeDrag: DragSelectableActiveDrag,
  marquee: DragSelectableMarquee,
  marqueeLabel: string | null,
  selectionLabel: DragSelectableSelectionLabel | undefined,
  theme: SharedUiTheme,
) {
  const count = marquee.matchingCount;
  const badge = selectionLabel
    ? selectionLabel(count, {
        matchingCount: count,
        matchingIds: marquee.matchingIds,
        matchingTargets: activeDrag.matchedTargets,
      })
    : `${count} item${count === 1 ? "" : "s"}`;
  const font = { fontFamily: theme.fonts.sans };
  return (
    <>
      {marqueeLabel === null ? null : (
        <Text style={[styles.label, font, { color: theme.colors.primaryDeep }]}>
          {marqueeLabel}
        </Text>
      )}
      {badge === null ? null : (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radii.sm,
            },
          ]}
        >
          <Text
            style={[styles.badgeText, font, { color: theme.colors.onSolid }]}
          >
            {badge}
          </Text>
        </View>
      )}
    </>
  );
}

/** Marks the layer as `data-drag-select-marquee` for app styles and tests. */
const MARQUEE_PROPS = { dataSet: { dragSelectMarquee: "true" } };

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
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    left: 8,
    position: "absolute",
    top: 6,
  },
  layer: {
    position: "fixed" as "absolute",
  },
});
