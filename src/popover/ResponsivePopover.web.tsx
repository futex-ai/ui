/**
 * Web build of {@link ResponsivePopover}: a controlled, externally-anchored
 * dialog. It composes the shared dropdown portal (viewport-aware placement,
 * non-modal `box-none` layer, outside-press / Escape dismissal) with the
 * popover surface (role `dialog`, accessible name, focus into the surface on
 * open and back to the anchor on close) — the same a11y the `Popover` component
 * gets, but driven by an external `anchorRef` + controlled `open`.
 */
import { useId } from "react";

import { DropdownPortal } from "../dropdown";

import { PopoverSurface } from "./PopoverSurface";
import { resolveResponsivePopoverContent } from "./responsivePopoverModel";
import type { ResponsivePopoverProps } from "./responsivePopoverModel";

export function ResponsivePopover({
  align = "end",
  anchorRef,
  children,
  initialFocusRef,
  label,
  manageFocus,
  maxHeight,
  minWidth,
  onClose,
  open,
  testID,
  zIndex,
}: ResponsivePopoverProps) {
  const surfaceId = useId();
  // The placement engine aligns to the anchor's start or end edge; center is not
  // yet supported, so it falls back to start (a follow-up if a caller needs it).
  const portalAlign = align === "center" ? "start" : align;
  return (
    <DropdownPortal
      align={portalAlign}
      anchorRef={anchorRef}
      maxHeight={maxHeight}
      minWidth={minWidth}
      onClose={onClose}
      open={open}
      zIndex={zIndex}
    >
      {(placement) => (
        <PopoverSurface
          initialFocusRef={initialFocusRef}
          label={label}
          manageFocus={manageFocus}
          nativeID={surfaceId}
          role="dialog"
          testID={testID}
        >
          {resolveResponsivePopoverContent(children, {
            close: onClose,
            layout: "popover",
            maxHeight: placement.maxHeight,
            placement,
          })}
        </PopoverSurface>
      )}
    </DropdownPortal>
  );
}
