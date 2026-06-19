/** Anchored content popover built on the shared dropdown portal. */
import { useCallback, useId, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import {
  DropdownPortal,
  type DropdownPlacement,
  type DropdownPlacementOptions,
} from "../dropdown";

import { PopoverSurface } from "./PopoverSurface";
import {
  popoverHasPopup,
  popoverTriggerProps,
  resolvePopoverOpen,
  type PopoverSurfaceRole,
  type PopoverTriggerProps,
} from "./popoverModel";

type Focusable = { focus?: () => void };

/** State handed to the `trigger` render prop. */
export type PopoverTriggerState = {
  /** Close the popover. */
  close: () => void;
  /** Current open state, e.g. for `aria-expanded` styling. */
  open: boolean;
  /** Toggle the popover open or closed. */
  toggle: () => void;
  /** Props to spread onto the pressable trigger (press + expanded state). */
  triggerProps: PopoverTriggerProps;
};

/** State handed to a `children` render function. */
export type PopoverContentState = {
  /** Close the popover, e.g. from a button inside the content. */
  close: () => void;
  /** Resolved placement (side, left, top, bottom, width, maxHeight) of the surface. */
  placement: DropdownPlacement;
};

export type PopoverProps = DropdownPlacementOptions & {
  /** Popover body: a node, or a render function given `close` and `placement`. */
  children: ReactNode | ((state: PopoverContentState) => ReactNode);
  /** Initial open state when the popover is uncontrolled. */
  defaultOpen?: boolean;
  /**
   * Element focused when the popover opens (web). Defaults to the surface
   * container, which lands focus inside the popover. Ignored on native.
   */
  initialFocusRef?: RefObject<Focusable | null>;
  /**
   * Accessible name for the surface (WCAG 4.1.2). Required to expose the
   * surface as a named `dialog`/`region`; without it the surface stays a plain
   * container. Also drives the trigger's `aria-haspopup` token.
   */
  label?: string;
  /**
   * Move focus into the surface on open and back to the trigger on close (web,
   * WCAG 2.4.3). Defaults to `true`. Set `false` (or use `role="tooltip"`) for a
   * supplemental hint that must not steal focus.
   */
  manageFocus?: boolean;
  /** Notified whenever the popover wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Controls the open state. Omit to let the popover manage it internally. */
  open?: boolean;
  /**
   * Surface role. `dialog` (default) for interactive content the keyboard
   * should enter; `region` for a labelled non-modal disclosure; `tooltip` for a
   * supplemental hint (no focus management by default).
   */
  role?: PopoverSurfaceRole;
  /** Style merged onto the anchor wrapper (defaults to hugging the trigger). */
  style?: StyleProp<ViewStyle>;
  /** Renders the pressable that anchors and toggles the popover. */
  trigger: (state: PopoverTriggerState) => ReactNode;
  /** z-index for the portal layer. Defaults to `DROPDOWN_LAYERS.portal`. */
  zIndex?: number;
};

/**
 * Renders arbitrary content in a surface anchored to a measured trigger. Unlike
 * `DropdownSelector` it does not pick a value; it reuses `DropdownPortal` for
 * viewport-aware placement, the non-modal web portal layer, and outside-click /
 * Escape dismissal, and only adds the open-state controller and trigger props.
 *
 * The trigger is wrapped in a self-hugging `View` that the portal measures, so
 * a small trigger keeps a small anchor. Pass `minWidth` to size the content
 * surface, and `style` to change how the wrapper lays out (e.g.
 * `alignSelf: "stretch"`).
 *
 * Accessibility: pass `label` to name the surface and relate it to the trigger
 * (`aria-controls`/`aria-haspopup`/`aria-expanded`). On web the surface manages
 * focus order — focus moves into it on open and back to the trigger on close —
 * unless `manageFocus={false}` or `role="tooltip"`.
 */
export function Popover({
  align,
  children,
  defaultOpen = false,
  gutter,
  initialFocusRef,
  label,
  manageFocus,
  margin,
  maxHeight,
  minHeight,
  minWidth,
  onOpenChange,
  open: openProp,
  role,
  style,
  trigger,
  zIndex,
}: PopoverProps) {
  const anchorRef = useRef<View>(null);
  const surfaceId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const { controlled, open } = resolvePopoverOpen(openProp, uncontrolledOpen);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);

  return (
    <View ref={anchorRef} style={[styles.anchor, style]}>
      {trigger({
        close,
        open,
        toggle,
        triggerProps: popoverTriggerProps(open, toggle, {
          hasPopup: popoverHasPopup(role ?? "dialog"),
          surfaceId,
        }),
      })}
      <DropdownPortal
        align={align}
        anchorRef={anchorRef}
        gutter={gutter}
        margin={margin}
        maxHeight={maxHeight}
        minHeight={minHeight}
        minWidth={minWidth}
        onClose={close}
        open={open}
        zIndex={zIndex}
      >
        {(placement) => (
          <PopoverSurface
            initialFocusRef={initialFocusRef}
            label={label}
            manageFocus={manageFocus}
            nativeID={surfaceId}
            role={role}
          >
            {typeof children === "function"
              ? children({ close, placement })
              : children}
          </PopoverSurface>
        )}
      </DropdownPortal>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
});
