/** Non-modal web dropdown surface anchored to a measured trigger. */
import { useEffect, useRef } from "react";
import { View } from "react-native";

import {
  DropdownClientRect,
  DropdownPoint,
  dropdownPlacement,
  dropdownPointWithinRects,
  dropdownWidthBounds,
} from "./dropdownGeometry";
import { dropdownContentWidthStyle } from "./dropdownContentWidthStyle";
import {
  DropdownPortalProps,
  dropdownSurfaceRect,
  useDropdownSurfaceStyles,
} from "./dropdownPortalModel";
import { DropdownWebLayer } from "./DropdownWebLayer";
import { useDropdownAnchor } from "./useDropdownAnchor";
import { useDropdownContentWidth } from "./useDropdownContentWidth";
import { useDropdownDismiss } from "./useDropdownDismiss";

type DropdownRectNode = { getBoundingClientRect: () => DropdownClientRect };

/**
 * Renders the menu through a pointer-transparent DOM portal so the trigger
 * keeps real hover state while the menu is open. Outside presses and Escape
 * close the menu at the document level instead of a full-screen scrim.
 *
 * The surface reports hover through raw `onPointerEnter` / `onPointerLeave`
 * boundary events on a plain `View`, never through `Pressable` hover: React
 * Native Web Pressables hover with `contain`, so entering a nested row
 * Pressable dispatches a hover-lock event that forces an ancestor Pressable's
 * hover to end and would close a hover-backed menu while the pointer is
 * resting inside it.
 *
 * A fast pointer can leave the trigger and stop inside the menu's area before
 * the surface has measured and mounted. Browsers do not reliably dispatch
 * pointer boundary events when an element appears under a stationary cursor
 * (Chrome synthesizes only mouse boundary events; Safari neither), so the
 * trigger's hover-out close timer would win and dismiss the menu. The portal
 * therefore records the last pointer position while open and re-asserts
 * hover-in when the surface mounts around that point, and also wires the
 * synthetic mouse boundary events as an immediate rescue where they exist.
 */
export function DropdownPortal({
  align = "start",
  anchorRef,
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
  const surfaceRef = useRef<View>(null);
  const lastPointRef = useRef<DropdownPoint | null>(null);
  const hoverInRef = useRef(surfaceHoverProps?.onHoverIn);
  hoverInRef.current = surfaceHoverProps?.onHoverIn;
  const hoverBacked = Boolean(surfaceHoverProps);
  const { anchor, viewport } = useDropdownAnchor(anchorRef, open);
  const contentWidth = useDropdownContentWidth(fitContentWidth && open);
  const surfaceStyles = useDropdownSurfaceStyles();
  const surfaceMounted = open && anchor !== null;
  useDropdownDismiss({
    anchorRef,
    onClose,
    open,
    surfaceRef,
  });

  useEffect(() => {
    if (!open || !hoverBacked || typeof document === "undefined") {
      return;
    }
    const recordPoint = (event: PointerEvent) => {
      lastPointRef.current = { x: event.clientX, y: event.clientY };
    };
    document.addEventListener("pointermove", recordPoint, true);
    return () => {
      document.removeEventListener("pointermove", recordPoint, true);
      lastPointRef.current = null;
    };
  }, [hoverBacked, open]);

  useEffect(() => {
    const point = lastPointRef.current;
    if (!surfaceMounted || !hoverBacked || !point) {
      return;
    }
    const anchorNode = anchorRef.current as unknown as DropdownRectNode | null;
    const surfaceNode =
      surfaceRef.current as unknown as DropdownRectNode | null;
    const rects = [anchorNode, surfaceNode].map(
      (node) => node?.getBoundingClientRect() ?? null,
    );
    if (dropdownPointWithinRects(point, rects)) {
      hoverInRef.current?.();
    }
  }, [anchorRef, hoverBacked, surfaceMounted]);

  if (!open || !anchor) {
    return null;
  }

  const placementOptions = {
    align,
    gutter,
    margin,
    maxHeight,
    maxWidth,
    minHeight,
    minWidth,
  };
  const placement = dropdownPlacement(
    anchor,
    viewport,
    placementOptions,
    contentWidth.width ?? anchor.width,
  );
  const widthBounds = dropdownWidthBounds(anchor, viewport, placementOptions);
  const surfaceMouseProps = surfaceHoverProps
    ? ({
        onMouseEnter: surfaceHoverProps.onHoverIn,
        onMouseLeave: surfaceHoverProps.onHoverOut,
      } as unknown as object)
    : {};
  return (
    <DropdownWebLayer zIndex={zIndex}>
      <View
        {...surfaceMouseProps}
        onLayout={contentWidth.onLayout}
        onPointerEnter={surfaceHoverProps?.onHoverIn}
        onPointerLeave={surfaceHoverProps?.onHoverOut}
        ref={surfaceRef}
        style={[
          surfaceStyles.surface,
          dropdownSurfaceRect(placement, fitContentWidth),
          fitContentWidth ? dropdownContentWidthStyle(widthBounds) : null,
        ]}
        testID={testID}
      >
        {children(placement)}
      </View>
    </DropdownWebLayer>
  );
}
