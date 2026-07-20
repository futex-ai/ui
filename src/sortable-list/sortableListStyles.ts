import { StyleSheet, type ViewStyle } from "react-native";

import type { ControlSize } from "../controlSize";
import type { SharedUiTheme } from "../theme";

/**
 * Per-size geometry for the sortable list: the default gap between rows and the
 * grab handle's icon size and padding. `md` is the default density and matches
 * the surrounding controls' {@link ControlSize} scale; `sm` is compact and `lg`
 * roomier and touch-first. The gap is only a default — the list's `gap` prop
 * overrides it — but a visible gap matters here because it gives the drop
 * preview a slot to open into as items shift.
 */
const SORTABLE_SIZES: Record<
  ControlSize,
  { gap: number; handleIcon: number; handlePadding: number }
> = {
  sm: { gap: 6, handleIcon: 14, handlePadding: 4 },
  md: { gap: 8, handleIcon: 16, handlePadding: 6 },
  lg: { gap: 10, handleIcon: 18, handlePadding: 8 },
};

/** The default row gap for a given size — the fallback when no `gap` prop is set. */
export function sortableGap(size: ControlSize = "md"): number {
  return SORTABLE_SIZES[size].gap;
}

/** The grab-handle icon size for a given size. */
export function sortableHandleIconSize(size: ControlSize = "md"): number {
  return SORTABLE_SIZES[size].handleIcon;
}

// RN's ViewStyle `cursor` union has no "grab"/"grabbing" (web-only values), so
// the drag-affordance cursors take the same escape cast the data grid uses for
// "col-resize". Ignored on native.
export const grabCursor = { cursor: "grab" } as unknown as ViewStyle;
export const grabbingCursor = { cursor: "grabbing" } as unknown as ViewStyle;

/**
 * Build the sortable list's themed styles for a given size. The `list` container
 * lays its rows out along the flow axis (the component sets `flexDirection` and
 * `gap` inline from the orientation). A row is a flex line holding the optional
 * grab `handle` beside the flexing `content`. The `dragging` dim marks the
 * keyboard-grabbed row (which stays in place, still focusable); the `ghost` is
 * the floating clone a pointer drag lifts out; and the `preview` is the dashed,
 * faded slot marking where the row will land.
 */
export function createSortableListStyles(
  theme: SharedUiTheme,
  size: ControlSize = "md",
) {
  const sizing = SORTABLE_SIZES[size];
  return StyleSheet.create({
    content: { flex: 1, minWidth: 0 },
    // The keyboard-grabbed row, dimmed in place (it stays focusable to receive
    // the arrow keys) while its preview marks the target slot.
    dragging: { opacity: 0.4 },
    // The floating clone that rides the cursor during a pointer drag. A stronger
    // shadow lifts it off the list; the hook mutates its transform to follow.
    ghost: {
      boxShadow: "0 12px 28px rgba(20, 28, 22, 0.28)",
      left: 0,
      opacity: 0.95,
      top: 0,
      zIndex: 1000,
    },
    handle: {
      alignItems: "center",
      borderRadius: theme.radii.sm,
      justifyContent: "center",
      padding: sizing.handlePadding,
    },
    handleDisabled: { opacity: 0.4 },
    handleHover: { backgroundColor: theme.colors.soft },
    // A whole row as the drag target (handle-less mode): a grab cursor and the
    // shared focus ring, applied to the button that wraps the row content.
    itemButton: { flexDirection: "row" },
    list: { width: "100%" },
    // The dashed, faded copy of the dragged row shown at the drop slot — marks,
    // Trello-style, exactly where the row would land.
    preview: {
      borderColor: theme.colors.primary,
      borderRadius: theme.radii.md,
      borderStyle: "dashed",
      borderWidth: 1,
      opacity: 0.5,
    },
    row: { alignItems: "center", flexDirection: "row" },
  });
}

export type SortableListStyles = ReturnType<typeof createSortableListStyles>;
