/**
 * Single-line grid text that reveals itself in a popover when the column is too
 * narrow to show it.
 *
 * Used for both header labels and text cell values, so the reveal behaves the
 * same wherever the grid clips. The popover is built on `DropdownPortal` for
 * viewport-aware placement, the pointer-transparent portal layer, and Escape /
 * outside-press dismissal.
 */
import { useMemo } from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";

import { DropdownPortal } from "../dropdown";
import { useSharedUiTheme } from "../theme";

import { useOverflowTooltipSurface } from "./dataGridOverflowContext";
import {
  REVEAL_PLACEMENT,
  type DataGridOverflowTargets,
} from "./dataGridOverflowModel";
import { useOverflowTooltip } from "./useOverflowTooltip";

export function DataGridClippedText({
  children,
  style,
  surface,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
  /** Which half of the grid this text belongs to, for the mode check. */
  surface: keyof DataGridOverflowTargets;
}) {
  const theme = useSharedUiTheme();
  const { enabled, fontSize } = useOverflowTooltipSurface(surface);
  const {
    anchorRef,
    close,
    onPointerEnter,
    onPointerLeave,
    open,
    surfaceHoverProps,
  } = useOverflowTooltip(enabled);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        text: {
          color: theme.colors.ink,
          fontFamily: theme.fonts.sans,
          fontSize,
        },
      }),
    [fontSize, theme],
  );

  // RN's public `TextProps` omits the pointer-boundary handlers, so they are
  // forwarded as literal web props (same device as the header's `onPointerDown`).
  // Attached only when enabled, so a grid with the reveal off adds no listeners.
  const hoverProps = enabled
    ? ({ onPointerEnter, onPointerLeave } as Record<string, unknown>)
    : {};

  return (
    <>
      <Text numberOfLines={1} {...hoverProps} ref={anchorRef} style={style}>
        {children}
      </Text>
      {open ? (
        <DropdownPortal
          {...REVEAL_PLACEMENT}
          anchorRef={anchorRef}
          fitContentWidth
          onClose={close}
          open
          surfaceHoverProps={surfaceHoverProps}
          testID="data-grid-overflow-tooltip"
        >
          {() => (
            // Hidden from assistive tech: the clipping is purely visual, so the
            // full string is already this cell's accessible name and announcing
            // it again would simply double it.
            <Text
              accessibilityElementsHidden
              aria-hidden
              importantForAccessibility="no-hide-descendants"
              style={styles.text}
            >
              {children}
            </Text>
          )}
        </DropdownPortal>
      ) : null}
    </>
  );
}
