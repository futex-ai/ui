/** Anchored content popover built on the shared dropdown portal. */
import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import {
  DropdownPortal,
  type DropdownPlacement,
  type DropdownPlacementOptions,
} from "../dropdown";

import {
  popoverTriggerProps,
  resolvePopoverOpen,
  type PopoverTriggerProps,
} from "./popoverModel";

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
  /** Notified whenever the popover wants to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Controls the open state. Omit to let the popover manage it internally. */
  open?: boolean;
  /** Style merged onto the anchor wrapper (defaults to hugging the trigger). */
  style?: StyleProp<ViewStyle>;
  /** Renders the pressable that anchors and toggles the popover. */
  trigger: (state: PopoverTriggerState) => ReactNode;
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
 */
export function Popover({
  align,
  children,
  defaultOpen = false,
  gutter,
  margin,
  maxHeight,
  minHeight,
  minWidth,
  onOpenChange,
  open: openProp,
  style,
  trigger,
}: PopoverProps) {
  const anchorRef = useRef<View>(null);
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
        triggerProps: popoverTriggerProps(open, toggle),
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
      >
        {(placement) =>
          typeof children === "function"
            ? children({ close, placement })
            : children
        }
      </DropdownPortal>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { alignSelf: "flex-start" },
});
